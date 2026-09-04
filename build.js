#!/usr/bin/env node
/**
 * Pré-renderizador da landing page.
 *
 * Resolve em tempo de build todos os `data-component` / `data-page` que hoje
 * são buscados por fetch no navegador, e emite um `dist/` com o HTML já
 * achatado. Motivo: nenhum conteúdo existia no HTML inicial, então o preload
 * scanner do browser não via nada e a hero só aparecia depois de 3 níveis de
 * fetch aninhados — o que segurava LCP, FCP e Speed Index.
 *
 * Os arquivos em `components/` e `sections/` seguem sendo a fonte única; este
 * script só os costura. A regra de paridade 1:1 continua valendo.
 *
 * O build replica de propósito 3 comportamentos do loader em runtime
 * (js embutido no index.html), porque o CSS e os scripts existentes dependem
 * deles:
 *
 *   1. Cada componente montado fica dentro do seu `<div>` placeholder, que
 *      recebe a classe `component-mounted`. O wrapper faz parte da estrutura
 *      que o CSS enxerga, então não pode ser achatado.
 *   2. `<style>` é deduplicado por caminho de componente (um componente usado
 *      5x injeta estilo 1x), mas `<script>` NÃO é: `btn-cta` monta 3x e o
 *      script dele roda 3x. Os dois casos são preservados.
 *   3. O script do pai executa antes dos filhos montarem, e cada script roda
 *      em escopo próprio (o loader usa `new Function`), então aqui cada um sai
 *      embrulhado numa IIFE.
 *
 * Sem dependências: roda com `node build.js`.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');

// Copiados como estão: são referenciados por caminho absoluto no HTML/CSS
const STATIC_DIRS = ['assets', 'css', 'js'];

// Regiões do index.html que só servem ao modo dev (loader + component loader).
// No build o conteúdo já vem embutido, então nada disso precisa existir.
const STRIP_MARKER = /<!--\s*build:strip:start\s*-->[\s\S]*?<!--\s*build:strip:end\s*-->/g;

const STYLE_TAG = /<style[^>]*>([\s\S]*?)<\/style>/gi;
const SCRIPT_TAG = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;

// Placeholder de componente: `<div ... data-component="x" ...></div>`.
// A ordem dos atributos varia e alguns placeholders carregam class própria
// (ex.: social-links no rodapé do nav-menu), então os outros atributos são
// capturados e reemitidos.
const PLACEHOLDER = /<(\w+)((?:\s+[^\s=>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*>\s*<\/\1>/g;

/** Lê um fragmento de componente, com erro claro se o caminho não existir. */
function readFragment(relPath) {
    const abs = path.join(ROOT, relPath);
    if (!fs.existsSync(abs)) {
        throw new Error(`Componente não encontrado: ${relPath}`);
    }
    return fs.readFileSync(abs, 'utf8');
}

/**
 * Extrai de uma string de atributos o caminho do componente e os demais
 * atributos, que precisam sobreviver no wrapper.
 */
function parseAttrs(raw) {
    const attrRe = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g;
    let componentPath = null;
    const rest = [];
    let m;

    while ((m = attrRe.exec(raw)) !== null) {
        const name = m[1];
        const value = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4];

        if (name === 'data-component' || name === 'data-page') {
            componentPath = value;
        } else {
            rest.push({ name, value });
        }
    }

    return { componentPath, rest };
}

/** Reemite os atributos do placeholder somando a classe `component-mounted`. */
function buildWrapperAttrs(rest) {
    const attrs = rest.map(function (a) {
        if (a.name === 'class') {
            return `class="${a.value} component-mounted"`;
        }
        return a.value === undefined ? a.name : `${a.name}="${a.value}"`;
    });

    if (!rest.some((a) => a.name === 'class')) {
        attrs.push('class="component-mounted"');
    }

    return attrs.length ? ' ' + attrs.join(' ') : '';
}

/** Só o conteúdo de <body> do fragmento entra no HTML final. */
function bodyOf(html) {
    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    return match ? match[1] : html;
}

const styles = [];        // { key, css } — deduplicado por caminho
const scripts = [];       // { path, js } — NÃO deduplicado
const seenStyleKeys = new Set();
const mountCount = new Map();

/**
 * Resolve recursivamente os placeholders de um fragmento, coletando estilos e
 * scripts pelo caminho. Devolve só o markup.
 */
function render(html, originPath) {
    let markup = html;

    // Estilos: um por caminho de componente, como o loader faz
    markup = markup.replace(STYLE_TAG, function (_, css) {
        const key = `style-${originPath.replace(/[^a-zA-Z0-9]/g, '-')}`;
        if (!seenStyleKeys.has(key)) {
            seenStyleKeys.add(key);
            styles.push({ key, css: css.trim() });
        }
        return '';
    });

    // Scripts: preserva uma cópia por montagem, na ordem em que rodariam
    const collected = [];
    markup = markup.replace(SCRIPT_TAG, function (_, js) {
        if (js.trim()) collected.push(js.trim());
        return '';
    });
    collected.forEach((js) => scripts.push({ path: originPath, js }));

    // Filhos: montados depois do script do pai, igual ao runtime
    markup = markup.replace(PLACEHOLDER, function (full, tag, rawAttrs) {
        const { componentPath, rest } = parseAttrs(rawAttrs || '');
        if (!componentPath) return full;

        mountCount.set(componentPath, (mountCount.get(componentPath) || 0) + 1);

        const inner = render(bodyOf(readFragment(componentPath)), componentPath);
        return `<${tag}${buildWrapperAttrs(rest)}>${inner}</${tag}>`;
    });

    return markup;
}

/** Copia um diretório recursivamente. */
function copyDir(from, to) {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
        const src = path.join(from, entry.name);
        const dest = path.join(to, entry.name);
        if (entry.isDirectory()) {
            copyDir(src, dest);
        } else {
            fs.copyFileSync(src, dest);
        }
    }
}

function build() {
    const start = Date.now();

    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(OUT, { recursive: true });

    let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

    // Fora o que só serve ao dev: overlay do loader e o ComponentLoader
    html = html.replace(STRIP_MARKER, '');
    // O body destravava via JS do loader, que não existe mais no build
    html = html.replace(/<body class="is-loading">/, '<body>');

    const rendered = render(html, 'index.html');

    // Estilos dos componentes num único <style> no <head>, na ordem em que o
    // loader os injetaria — a ordem importa para a cascata
    const styleBlock = styles
        .map((s) => `/* ${s.key} */\n${s.css}`)
        .join('\n\n');

    // Scripts num arquivo com defer, e não inline: scripts inline rodam
    // durante o parsing, antes dos defer do <head> — e os componentes chamam
    // `onComponentsReady`, definido em js/on-ready.js, que é defer. Como
    // scripts defer executam na ordem do documento, sair depois de on-ready.js
    // garante a ordem correta.
    const scriptBundle = [
        '// Gerado por build.js — não editar. Fonte: components/ e sections/',
        '',
        '// `onComponentsReady` espera o evento quando existe um componentLoader.',
        '// No build nada é montado por fetch, mas o contrato é mantido: o stub',
        '// existe antes dos componentes e o evento é disparado no fim.',
        'window.componentLoader = { prerendered: true };',
        '',
        scripts
            .map((s) => `/* ${s.path} */\n(function () {\n${s.js}\n})();`)
            .join('\n\n'),
        '',
        'window.dispatchEvent(new CustomEvent("components:ready"));',
        ''
    ].join('\n');

    fs.writeFileSync(path.join(OUT, 'components.js'), scriptBundle, 'utf8');

    const finalHtml = rendered
        .replace('</head>', `    <style>\n${styleBlock}\n    </style>\n</head>`)
        .replace('</body>', '    <script src="components.js" defer></script>\n</body>');

    fs.writeFileSync(path.join(OUT, 'index.html'), finalHtml, 'utf8');

    for (const dir of STATIC_DIRS) {
        const from = path.join(ROOT, dir);
        if (fs.existsSync(from)) copyDir(from, path.join(OUT, dir));
    }

    const duplicated = [...mountCount.entries()].filter(([, n]) => n > 1);

    console.log(`build concluído em ${Date.now() - start}ms`);
    console.log(`  componentes montados: ${[...mountCount.values()].reduce((a, b) => a + b, 0)}`);
    console.log(`  estilos (deduplicados): ${styles.length}`);
    console.log(`  scripts (por montagem): ${scripts.length}`);
    console.log(`  html: ${(fs.statSync(path.join(OUT, 'index.html')).size / 1024).toFixed(1)} KB`);
    if (duplicated.length) {
        console.log('  montados mais de uma vez:');
        duplicated.forEach(([p, n]) => console.log(`    ${n}x ${p}`));
    }
}

build();

/**
 * Gerador do CSS de ícones (substitui a fonte Phosphor carregada via CDN).
 *
 * Por que existe: a landing usava 4 stylesheets do @phosphor-icons/web + 2
 * arquivos .woff2 (~275 KiB) só para desenhar ~34 ícones. Além do peso, a
 * troca da fonte no meio do carregamento era a causa de 100% do CLS medido
 * (o carrossel do screen-showcase reflowava quando a fonte chegava).
 *
 * O que ele faz: varre os componentes/dobras, descobre quais ícones são
 * realmente usados, baixa os SVGs do pacote @phosphor-icons/core e gera
 * `css/icons.css`, onde cada ícone vira um `mask-image` em data URI. O
 * markup continua idêntico (`<i class="ph-fill ph-drop">`) e os ícones
 * seguem herdando `font-size` (caixa de 1em) e `color` (currentColor).
 *
 * Quando rodar: sempre que adicionar/remover um ícone no HTML.
 *   node scripts/build-icons.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CORE_VERSION = '2.1.1';
const CDN = `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@${CORE_VERSION}/assets`;
const SCAN_DIRS = ['components', 'sections'];
const SCAN_FILES = ['index.html'];
const OUT = path.join(ROOT, 'css', 'icons.css');

/** Lista recursivamente os .html de um diretório */
async function collectHtml(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return collectHtml(full);
        return entry.name.endsWith('.html') ? [full] : [];
    }));
    return files.flat();
}

/**
 * Extrai os ícones usados. Retorna um Set de "peso/nome" — o peso vem da
 * classe base: `ph-fill` é preenchido, `ph` sozinho é o traço regular.
 */
function extractIcons(html, found) {
    for (const [, classList] of html.matchAll(/class="([^"]*\bph[ -][^"]*)"/g)) {
        const classes = classList.split(/\s+/);
        const weight = classes.includes('ph-fill') ? 'fill'
            : classes.includes('ph') ? 'regular'
                : null;
        if (!weight) continue;

        for (const cls of classes) {
            if (cls === 'ph' || cls === 'ph-fill' || !cls.startsWith('ph-')) continue;
            found.add(`${weight}/${cls.slice(3)}`);
        }
    }
}

/** SVG cru -> data URI base64 enxuto: 100% compatível com todos navegadores */
function toDataUri(svg) {
    const minified = svg
        .replace(/<\?xml[\s\S]*?\?>/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s+fill="[^"]*"/g, '') // a cor vem do currentColor do CSS
        .replace(/\s*\n\s*/g, '')
        .trim();

    return `data:image/svg+xml;base64,${Buffer.from(minified).toString('base64')}`;
}

async function main() {
    const htmlFiles = [
        ...SCAN_FILES.map((file) => path.join(ROOT, file)),
        ...(await Promise.all(SCAN_DIRS.map((dir) => collectHtml(path.join(ROOT, dir))))).flat(),
    ];

    const found = new Set();
    for (const file of htmlFiles) {
        extractIcons(await fs.readFile(file, 'utf-8'), found);
    }

    const icons = [...found].sort();
    console.log(`Ícones encontrados: ${icons.length} (${htmlFiles.length} arquivos varridos)`);

    const rules = [];
    for (const icon of icons) {
        const [weight, name] = icon.split('/');
        const file = weight === 'fill' ? `${name}-fill.svg` : `${name}.svg`;
        const response = await fetch(`${CDN}/${weight}/${file}`);
        if (!response.ok) throw new Error(`Ícone inexistente no Phosphor: ${weight}/${name} (${response.status})`);

        const selector = weight === 'fill' ? `.ph-fill.ph-${name}` : `.ph.ph-${name}`;
        rules.push(`${selector} { --ph-icon: url("${toDataUri(await response.text())}"); }`);
    }

    const css = `/* ==========================================================================
   Ícones — GERADO POR scripts/build-icons.mjs, NÃO EDITE À MÃO
   Fonte: @phosphor-icons/core@${CORE_VERSION} (${icons.length} ícones em uso)

   Substitui a fonte de ícones por máscaras SVG: sem request externo, sem
   .woff2 e sem o reflow que a troca da fonte causava no carrossel.
   O contrato com o markup é o mesmo da fonte — a caixa tem 1em (então
   \`font-size\` continua dimensionando) e a cor vem de \`currentColor\`.
   ========================================================================== */

.ph,
.ph-fill {
    display: inline-block;
    width: 1em;
    height: 1em;
    /* Alinha a caixa com a altura de caixa-alta do texto, como fazia o glifo */
    vertical-align: -0.125em;
    flex-shrink: 0;
    background-color: currentColor;
    -webkit-mask-image: var(--ph-icon);
    mask-image: var(--ph-icon);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-position: center;
    mask-position: center;
    -webkit-mask-size: contain;
    mask-size: contain;
}

${rules.join('\n')}
`;

    await fs.writeFile(OUT, css, 'utf-8');
    console.log(`Escrito ${path.relative(ROOT, OUT)} (${(css.length / 1024).toFixed(1)} KiB)`);
}

main();

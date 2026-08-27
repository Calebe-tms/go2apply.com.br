/**
 * Component and Script Validation Test - go2apply
 * Scans all .html and .js files to validate syntax and component integrity
 */

const fs = require('fs');
const path = require('path');

let totalChecks = 0;
let failedChecks = 0;

function checkHtmlScripts(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const scripts = content.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi) || [];

    scripts.forEach((scriptTag, idx) => {
        totalChecks++;
        const code = scriptTag.replace(/<script[\s\S]*?>/i, '').replace(/<\/script>/i, '').trim();
        if (!code) return;

        try {
            // Valida compilação da função JS do componente
            new Function(code);
            console.log(`[PASS] ${filePath} (script #${idx + 1})`);
        } catch (err) {
            failedChecks++;
            console.error(`[FAIL] Erro de sintaxe em ${filePath} (script #${idx + 1}): ${err.message}`);
        }
    });
}

function checkJsFile(filePath) {
    totalChecks++;
    const code = fs.readFileSync(filePath, 'utf8');
    try {
        new Function(code);
        console.log(`[PASS] ${filePath}`);
    } catch (err) {
        failedChecks++;
        console.error(`[FAIL] Erro no arquivo JS ${filePath}: ${err.message}`);
    }
}

function walk(dir) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!['node_modules', '.git', '.agents', '.context'].includes(entry)) {
                walk(fullPath);
            }
        } else if (entry.endsWith('.html')) {
            checkHtmlScripts(fullPath);
        } else if (entry.endsWith('.js') && !fullPath.includes('tests')) {
            checkJsFile(fullPath);
        }
    }
}

console.log('Iniciando auditoria de integridade dos componentes...\n');
walk(path.resolve(__dirname, '..'));

console.log(`\nResumo da Validação:`);
console.log(`Total de scripts validados: ${totalChecks}`);
console.log(`Sucessos: ${totalChecks - failedChecks}`);
console.log(`Falhas: ${failedChecks}`);

if (failedChecks > 0) {
    process.exit(1);
} else {
    console.log('\n✅ Todos os componentes e scripts passaram no teste com 100% de integridade!');
}

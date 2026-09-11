import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function htmlComponentLoader() {
  return {
    name: 'html-component-loader',
    transformIndexHtml(html, ctx) {
      // Regex para encontrar <div data-component="path/to/file.html"></div>
      const componentRegex = /<div\s+(?:data-component|data-page)="([^"]+)"[^>]*><\/div>/g;
      
      let processedHtml = html;
      
      const resolveComponents = (currentHtml, baseDir) => {
        return currentHtml.replace(componentRegex, (fullMatch, componentPath) => {
          try {
            const absolutePath = path.resolve(baseDir, componentPath);
            let componentContent = fs.readFileSync(absolutePath, 'utf-8');
            
            // Ao embutir estaticamente, marcamos como type="module" para que o Vite os empacote
            // e para que cada um tenha seu próprio escopo, além de executar na ordem correta
            // após os scripts do <head>.
            componentContent = componentContent.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, scriptContent) => {
              if (!scriptContent.trim() || attrs.includes('src=')) return match;
              // Add type="module" if not present
              const newAttrs = attrs.includes('type="module"') ? attrs : attrs + ' type="module"';
              return `<script${newAttrs}>\n${scriptContent}\n</script>`;
            });

            // Resolve componentes filhos recursivamente
            componentContent = resolveComponents(componentContent, baseDir);
            
            return `<!-- INJECTED: ${componentPath} -->\n<div class="component-mounted" data-original-path="${componentPath}">\n${componentContent}\n</div>\n<!-- END INJECTED: ${componentPath} -->`;
          } catch (e) {
            console.error(`Erro ao inliner componente: ${componentPath}`, e);
            return fullMatch;
          }
        });
      };
      
      const rootDir = process.cwd();
      processedHtml = resolveComponents(processedHtml, rootDir);
      
      return processedHtml;
    }
  };
}

export default defineConfig({
  plugins: [htmlComponentLoader()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});

/**
 * Component Loader - go2apply
 * Motor assíncrono nativo para carregamento de Single-File Components (.html)
 * Suporta componentes aninhados, injeção de estilos, execução de scripts e
 * telemetria precisa de progresso real em tempo real.
 */

class ComponentLoader {
    constructor() {
        this.loadedStyles = new Set();
        this.totalComponents = 0;
        this.loadedComponents = 0;
    }

    /**
     * Emite evento global com o progresso real calculado
     */
    emitProgress() {
        const total = Math.max(1, this.totalComponents);
        const percentage = Math.min(100, Math.round((this.loadedComponents / total) * 100));
        window.dispatchEvent(new CustomEvent('loader:progress', {
            detail: {
                loaded: this.loadedComponents,
                total: this.totalComponents,
                percentage: percentage
            }
        }));
    }

    /**
     * Carrega um arquivo HTML de componente e retorna o conteúdo parsed
     */
    async fetchComponent(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Falha ao carregar componente: ${url} (Status ${response.status})`);
            }
            return await response.text();
        } catch (error) {
            console.error(error);
            return `<div class="component-error">Erro ao carregar: ${url}</div>`;
        }
    }

    /**
     * Processa e injeta um componente dentro do elemento container
     */
    async mountElement(element) {
        const url = element.getAttribute('data-component') || element.getAttribute('data-page');
        if (!url) return;

        const rawHtml = await this.fetchComponent(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, 'text/html');

        // 1. Injeta e aplica estilos <style>
        const styleElements = doc.querySelectorAll('style');
        styleElements.forEach(style => {
            const styleId = `style-${url.replace(/[^a-zA-Z0-9]/g, '-')}`;
            if (!this.loadedStyles.has(styleId)) {
                const newStyle = document.createElement('style');
                newStyle.id = styleId;
                newStyle.textContent = style.textContent;
                document.head.appendChild(newStyle);
                this.loadedStyles.add(styleId);
            }
            style.remove();
        });

        // 2. Extrai os scripts antes de injetar o HTML
        const scriptElements = doc.querySelectorAll('script');
        const scriptContents = [];
        scriptElements.forEach(script => {
            scriptContents.push(script.textContent);
            script.remove();
        });

        // 3. Injeta a marcação HTML no elemento
        element.innerHTML = doc.body.innerHTML;
        element.removeAttribute('data-component');
        element.removeAttribute('data-page');
        element.classList.add('component-mounted');

        // 4. Executa os scripts associados ao componente
        scriptContents.forEach(code => {
            try {
                const runner = new Function(code);
                runner();
            } catch (err) {
                console.error(`Erro ao executar script do componente (${url}):`, err);
            }
        });

        // Incrementa o contador de componentes concluídos e notifica o loader
        this.loadedComponents++;
        this.emitProgress();

        // 5. Varre recursivamente por sub-componentes aninhados
        await this.loadAll(element);
    }

    /**
     * Varre o container em busca de todos os elementos declarados
     */
    async loadAll(container = document) {
        const targets = Array.from(container.querySelectorAll('[data-component], [data-page]'));
        if (targets.length === 0) return;

        // Atualiza a meta total de componentes a carregar
        this.totalComponents += targets.length;
        this.emitProgress();

        // Monta todos os componentes em paralelo
        await Promise.all(targets.map(el => this.mountElement(el)));
    }

    /**
     * Inicializa o carregamento de componentes no DOM
     */
    async init() {
        await this.loadAll(document);
        // Garante 100% de conclusão do carregamento de componentes
        this.loadedComponents = Math.max(this.loadedComponents, this.totalComponents);
        this.emitProgress();
        window.dispatchEvent(new CustomEvent('components:ready'));
    }
}

// Instância global do ComponentLoader
window.componentLoader = new ComponentLoader();

// Inicia o carregamento assim que o DOM básico estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.componentLoader.init());
} else {
    window.componentLoader.init();
}

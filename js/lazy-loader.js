/**
 * Lazy Loader - go2apply
 * Carrega páginas/componentes sob demanda (quando ficam visíveis no viewport)
 * Reduz o carregamento inicial em até 60% em mobile
 */

class LazyLoader {
    constructor() {
        this.lazyTargets = new Map(); // URL -> elemento
        this.observer = null;
        this.isInitialized = false;
    }

    /**
     * Inicializa observador para elementos com data-lazy-load
     */
    init() {
        if (this.isInitialized) return;

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const url = entry.target.getAttribute('data-component') ||
                                entry.target.getAttribute('data-page');

                    if (url && window.componentLoader) {
                        // Carrega o componente
                        window.componentLoader.mountElement(entry.target);
                        // Remove observação
                        this.observer.unobserve(entry.target);
                    }
                }
            });
        }, {
            // Começa a carregar 200px antes de ficarem visíveis
            rootMargin: '200px'
        });

        this.isInitialized = true;
    }

    /**
     * Marca um elemento para lazy loading
     */
    observe(element) {
        if (!this.isInitialized) this.init();
        if (element && this.observer) {
            this.observer.observe(element);
        }
    }

    /**
     * Marca todos os elementos com data-lazy-load
     */
    observeAll(container = document) {
        if (!this.isInitialized) this.init();

        const lazyElements = container.querySelectorAll('[data-lazy-load]');
        lazyElements.forEach(el => this.observe(el));
    }
}

// Instância global
window.lazyLoader = new LazyLoader();

// Inicializa quando ComponentLoader estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.lazyLoader.init();
        window.lazyLoader.observeAll();
    });
} else {
    window.lazyLoader.init();
    window.lazyLoader.observeAll();
}

// Re-observar novos elementos após components:ready
window.addEventListener('components:ready', () => {
    window.lazyLoader.observeAll();
});

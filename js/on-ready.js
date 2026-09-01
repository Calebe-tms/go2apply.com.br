/**
 * Executa `fn` quando todos os componentes já estiverem montados
 * (evento `components:ready` do loader), ou no `load` da página caso o
 * loader não esteja presente. Usado por vários componentes/seções que
 * precisam consultar outros elementos do DOM só depois que tudo montou.
 * Carregado via <script src> em index.html antes de qualquer componente
 * montar.
 */
function onComponentsReady(fn) {
    if (window.componentLoader) {
        window.addEventListener('components:ready', fn, { once: true });
    } else {
        window.addEventListener('load', fn);
    }
}

window.onComponentsReady = onComponentsReady;

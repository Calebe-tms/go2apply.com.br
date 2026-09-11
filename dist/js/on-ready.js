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

/**
 * Fecha o nav-menu mobile (se aberto) e abre o auth-drawer. Compartilhado
 * pelos componentes que disparam login/cadastro (btn-login, trial-banner).
 */
function openAuthDrawerAndCloseNav() {
    if (window.go2applyNav && typeof window.go2applyNav.close === 'function') {
        window.go2applyNav.close();
    }
    if (window.openAuthDrawer) {
        window.openAuthDrawer();
    } else if (window.authDrawer) {
        window.authDrawer.open();
    }
}

window.openAuthDrawerAndCloseNav = openAuthDrawerAndCloseNav;

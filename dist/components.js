// Gerado por build.js — não editar. Fonte: components/ e sections/

// `onComponentsReady` espera o evento quando existe um componentLoader.
// No build nada é montado por fetch, mas o contrato é mantido: o stub
// existe antes dos componentes e o evento é disparado no fim.
window.componentLoader = { prerendered: true };

/* components/header/header.html */
(function () {
const headerElement = document.getElementById('header');
    const scrollThreshold = 30;

    const onWindowScroll = () => {
        if (!headerElement) return;
        if (window.scrollY > scrollThreshold) {
            headerElement.classList.add('scrolled');
        } else {
            headerElement.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', onWindowScroll, { passive: true });
    onWindowScroll();
})();

/* components/social-links/social-links.html */
(function () {
(function () {
        // Suporta múltiplas instâncias do componente na página (ex.: header e
        // footer): cada instância monta e executa este script separadamente,
        // então marcamos as já observadas para não duplicar o observer.
        function observeHeroVisibility() {
            const hero = document.getElementById('hero');
            if (!hero) return;

            document.querySelectorAll('.social-links:not([data-visibility-observed])').forEach((container) => {
                container.setAttribute('data-visibility-observed', 'true');
                // Só se aplica dentro do header: em outros contextos (ex.: footer)
                // os ícones ficam sempre visíveis pelo CSS padrão do componente
                if (!container.closest('#header')) return;

                new IntersectionObserver(([entry]) => {
                    container.classList.toggle('is-visible', !entry.isIntersecting);
                }, { threshold: 0 }).observe(hero);
            });
        }

        onComponentsReady(observeHeroVisibility);
    })();
})();

/* components/nav-menu/nav-menu.html */
(function () {
(function () {
        // Inicializa o controle do menu mobile imediatamente e reforça no onComponentsReady
        function setupNavMenu() {
            const mobileNav = document.getElementById('nav-menu');
            const backdrop = document.getElementById('nav-menu-backdrop');
            const toggleBtn = document.getElementById('nav-toggle');
            const navLinks = mobileNav ? mobileNav.querySelectorAll('.nav-links a') : [];

            if (!mobileNav) return;

            function openNav() {
                mobileNav.classList.add('active');
                if (toggleBtn) {
                    toggleBtn.classList.add('active');
                    toggleBtn.setAttribute('aria-expanded', 'true');
                }
                document.body.style.overflow = 'hidden';

                // Animação stagger leve dos itens internos via GSAP
                if (window.gsap && window.innerWidth <= 992) {
                    const headerEl = mobileNav.querySelector('.nav-menu-header');
                    const trialCardEl = mobileNav.querySelector('.trial-banner');
                    const dividerEl = mobileNav.querySelector('.nav-menu-divider');
                    const items = mobileNav.querySelectorAll('.nav-link-item');
                    const footerEl = mobileNav.querySelector('.nav-menu-footer');

                    gsap.killTweensOf([headerEl, trialCardEl, dividerEl, items, footerEl]);

                    if (headerEl) {
                        gsap.fromTo(headerEl, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3, delay: 0.08, ease: 'power2.out' });
                    }
                    if (trialCardEl) {
                        gsap.fromTo(trialCardEl, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.3, delay: 0.1, ease: 'power2.out' });
                    }
                    if (dividerEl) {
                        gsap.fromTo(dividerEl, { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, transformOrigin: 'left center', duration: 0.3, delay: 0.12, ease: 'power2.out' });
                    }
                    if (items.length) {
                        gsap.fromTo(items,
                            { opacity: 0, x: 22 },
                            { opacity: 1, x: 0, duration: 0.3, stagger: 0.04, delay: 0.14, ease: 'power2.out' }
                        );
                    }
                    if (footerEl) {
                        gsap.fromTo(footerEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, delay: 0.24, ease: 'power2.out' });
                    }
                }
            }

            function closeNav() {
                mobileNav.classList.remove('active');
                if (toggleBtn) {
                    toggleBtn.classList.remove('active');
                    toggleBtn.setAttribute('aria-expanded', 'false');
                }
                document.body.style.overflow = '';

                // Limpa propriedades inline do GSAP ao fechar
                if (window.gsap) {
                    const headerEl = mobileNav.querySelector('.nav-menu-header');
                    const trialCardEl = mobileNav.querySelector('.trial-banner');
                    const dividerEl = mobileNav.querySelector('.nav-menu-divider');
                    const items = mobileNav.querySelectorAll('.nav-link-item');
                    const footerEl = mobileNav.querySelector('.nav-menu-footer');
                    gsap.set([headerEl, trialCardEl, dividerEl, items, footerEl], { clearProps: 'all' });
                }
            }

            function toggleNav() {
                if (mobileNav.classList.contains('active')) {
                    closeNav();
                } else {
                    openNav();
                }
            }

            // Expõe o controller globalmente para chamada a partir do header-actions
            window.go2applyNav = {
                open: openNav,
                close: closeNav,
                toggle: toggleNav
            };

            if (backdrop) {
                backdrop.onclick = closeNav;
            }

            navLinks.forEach(link => {
                link.onclick = function () {
                    if (window.innerWidth <= 992) {
                        closeNav();
                    }
                };
            });

            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
                    closeNav();
                }
            });

            // Controla a transição dos ícones e tamanho da fonte na transição da Hero para a 2ª dobra
            // Nota: CSS vars com clamp() não animam via transition; GSAP interpola valores numéricos reais.
            const hero = document.getElementById('hero');
            if (hero && !mobileNav.hasAttribute('data-hero-observed')) {
                mobileNav.setAttribute('data-hero-observed', 'true');
                let isInitialized = false;

                // Tamanhos de fonte e padding definidos aqui para interpolação numérica pelo GSAP
                const FONT_HERO   = '1.1rem';
                const FONT_SCROLL = '0.88rem';
                const PAD_HERO    = { paddingTop: '0.55rem', paddingBottom: '0.55rem', paddingLeft: '1.1rem', paddingRight: '1.1rem' };
                const PAD_SCROLL  = { paddingTop: '0.45rem', paddingBottom: '0.45rem', paddingLeft: '0.85rem', paddingRight: '0.85rem' };

                new IntersectionObserver(([entry]) => {
                    const isScrolledPastHero = !entry.isIntersecting;
                    const wasVisible = mobileNav.classList.contains('is-visible');
                    mobileNav.classList.toggle('is-visible', isScrolledPastHero);

                    if (window.innerWidth > 992 && window.gsap) {
                        const icons = mobileNav.querySelectorAll('.nav-link-icon');
                        const items = mobileNav.querySelectorAll('.nav-link-item');
                        gsap.killTweensOf(icons);
                        gsap.killTweensOf(items);

                        if (!isInitialized) {
                            // Estado inicial instantâneo sem animação no primeiro carregamento
                            isInitialized = true;
                            if (isScrolledPastHero) {
                                gsap.set(icons, { width: 18, marginRight: '0.45rem', opacity: 1, scale: 1, rotate: 0 });
                                gsap.set(items, { fontSize: FONT_SCROLL, ...PAD_SCROLL });
                            } else {
                                gsap.set(icons, { width: 0, marginRight: 0, opacity: 0, scale: 0, rotate: -20 });
                                gsap.set(items, { fontSize: FONT_HERO, ...PAD_HERO });
                            }
                            return;
                        }

                        if (wasVisible !== isScrolledPastHero) {
                            if (isScrolledPastHero) {
                                // Surgimento dos ícones + redução da fonte ao entrar na 2ª dobra
                                gsap.to(items, {
                                    fontSize: FONT_SCROLL,
                                    ...PAD_SCROLL,
                                    duration: 0.7,
                                    ease: 'power3.out',
                                    overwrite: 'auto'
                                });
                                gsap.fromTo(icons,
                                    { width: 0, marginRight: 0, opacity: 0, scale: 0, rotate: -25 },
                                    { width: 18, marginRight: '0.45rem', opacity: 1, scale: 1, rotate: 0,
                                      duration: 0.75, stagger: 0.05, ease: 'power3.out', overwrite: 'auto' }
                                );
                            } else {
                                // Ocultação dos ícones + expansão da fonte ao retornar à Hero
                                gsap.to(items, {
                                    fontSize: FONT_HERO,
                                    ...PAD_HERO,
                                    duration: 0.7,
                                    ease: 'power3.inOut',
                                    overwrite: 'auto'
                                });
                                gsap.to(icons, {
                                    width: 0, marginRight: 0, opacity: 0, scale: 0, rotate: -20,
                                    duration: 0.7, stagger: 0.04, ease: 'power3.inOut', overwrite: 'auto'
                                });
                            }
                        }
                    }
                }, { threshold: 0 }).observe(hero);
            }
        }

        // Executa imediatamente ao carregar o componente
        setupNavMenu();

        // Garante a re-associação quando todos os componentes terminarem de carregar
        if (typeof onComponentsReady === 'function') {
            onComponentsReady(setupNavMenu);
        }
    })();
})();

/* components/btn-login/btn-login.html */
(function () {
(function () {
        if (!window.__btnLoginGlobalListener) {
            window.__btnLoginGlobalListener = true;
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-login');
                if (!btn) return;

                window.openAuthDrawerAndCloseNav();
            });
        }
    })();
})();

/* components/trial-banner/trial-banner.html */
(function () {
(function () {
        // Manipula o clique em instâncias do trial-banner fora do auth-drawer
        document.addEventListener('click', (e) => {
            const banner = e.target.closest('.trial-banner');
            if (!banner) return;

            // Se o banner estiver dentro do próprio auth-drawer, não faz nada ao clicar
            if (banner.closest('#auth-drawer') || banner.closest('.auth-drawer')) return;

            window.openAuthDrawerAndCloseNav();
        });
    })();
})();

/* components/social-links/social-links.html */
(function () {
(function () {
        // Suporta múltiplas instâncias do componente na página (ex.: header e
        // footer): cada instância monta e executa este script separadamente,
        // então marcamos as já observadas para não duplicar o observer.
        function observeHeroVisibility() {
            const hero = document.getElementById('hero');
            if (!hero) return;

            document.querySelectorAll('.social-links:not([data-visibility-observed])').forEach((container) => {
                container.setAttribute('data-visibility-observed', 'true');
                // Só se aplica dentro do header: em outros contextos (ex.: footer)
                // os ícones ficam sempre visíveis pelo CSS padrão do componente
                if (!container.closest('#header')) return;

                new IntersectionObserver(([entry]) => {
                    container.classList.toggle('is-visible', !entry.isIntersecting);
                }, { threshold: 0 }).observe(hero);
            });
        }

        onComponentsReady(observeHeroVisibility);
    })();
})();

/* components/header-actions/header-actions.html */
(function () {
const toggleBtn = document.getElementById('nav-toggle');
    const headerCta = document.getElementById('header-btn-cta');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            if (window.go2applyNav) {
                window.go2applyNav.toggle();
                return;
            }
            const targetNav = document.getElementById('nav-menu');
            if (!targetNav) return;
            const isOpen = targetNav.classList.toggle('active');
            toggleBtn.classList.toggle('active', isOpen);
            toggleBtn.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });
    }

    document.addEventListener('keydown', (e) => {
        const targetNav = document.getElementById('nav-menu');
        if (e.key === 'Escape' && targetNav && targetNav.classList.contains('active')) {
            if (window.go2applyNav) {
                window.go2applyNav.close();
                return;
            }
            targetNav.classList.remove('active');
            toggleBtn.classList.remove('active');
            toggleBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    });

    // Só aparece depois que a Hero (1ª dobra) sai de tela, ou seja, quando o
    // usuário chega na 2ª dobra
    if (headerCta) {
        function observeHeroVisibility() {
            const hero = document.getElementById('hero');
            if (!hero) return;
            new IntersectionObserver(([entry]) => {
                headerCta.classList.toggle('is-visible', !entry.isIntersecting);
            }, { threshold: 0 }).observe(hero);
        }

        onComponentsReady(observeHeroVisibility);
    }
})();

/* sections/hero/hero-bg/hero-bg.html */
(function () {
// Public IDs do Cloudinary; as transformações de formato/resolução são
    // aplicadas por window.videoSources (js/video-carousel.js)
    const HERO_VIDEO_IDS = [
        'v1788230093/Tk-3-0988.webm',
        'v1788230096/Tk-2-0615-P1.webm',
        'v1788230093/Tk-1.webm',
        'v1788230094/Tk-4-0615-P1.webm',
    ];

    function initVideoCarousel() {
        if (!window.createVideoCarousel || !window.videoSources) return;
        window.createVideoCarousel({
            videoId: 'bg-video-1',
            urls: window.videoSources(HERO_VIDEO_IDS),
            onFirstFrame: () => window.dispatchEvent(new CustomEvent('hero:first-video-ready'))
        });
    }

    initVideoCarousel();
})();

/* components/btn-cta/btn-cta.html */
(function () {
(function () {
        // Escuta cliques em todos os botões btn-cta (suporta múltiplas instâncias no DOM)
        if (!window.__btnCtaGlobalListener) {
            window.__btnCtaGlobalListener = true;
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-cta-element, .cta-btn-base');
                if (btn) {
                    if (window.openAuthDrawer) {
                        window.openAuthDrawer();
                    } else {
                        window.addEventListener('components:ready', () => window.openAuthDrawer?.(), { once: true });
                    }
                }
            });
        }

    })();
})();

/* sections/objection-breaker/objection-breaker.html */
(function () {
(function () {
        function initObjectionBreakerReveal() {
            if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

            gsap.from('.ob-headline', {
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: window.ScrollTrigger ? { trigger: '#objection-breaker', start: 'top 75%' } : undefined
            });

            gsap.from('#ob-situation .ob-situations li', {
                opacity: 0,
                x: 30,
                duration: 0.6,
                ease: 'power3.out',
                stagger: 0.1,
                scrollTrigger: window.ScrollTrigger ? { trigger: '#ob-situation', start: 'top 80%' } : undefined
            });

            gsap.from('#ob-breaker > *', {
                opacity: 0,
                y: 20,
                duration: 0.7,
                ease: 'power3.out',
                stagger: 0.12,
                scrollTrigger: window.ScrollTrigger ? { trigger: '#ob-breaker', start: 'top 80%' } : undefined
            });
        }

        onComponentsReady(initObjectionBreakerReveal);
    })();
})();

/* components/btn-cta/btn-cta.html */
(function () {
(function () {
        // Escuta cliques em todos os botões btn-cta (suporta múltiplas instâncias no DOM)
        if (!window.__btnCtaGlobalListener) {
            window.__btnCtaGlobalListener = true;
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-cta-element, .cta-btn-base');
                if (btn) {
                    if (window.openAuthDrawer) {
                        window.openAuthDrawer();
                    } else {
                        window.addEventListener('components:ready', () => window.openAuthDrawer?.(), { once: true });
                    }
                }
            });
        }

    })();
})();

/* sections/app-intro/app-intro.html */
(function () {
(function () {
        function initAppIntroReveal() {
            if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

            // O gradiente de fundo já esmaece pra transparente nas bordas,
            // então um deslocamento sutil aqui não deixa nenhuma emenda à
            // mostra: só reforça profundidade na costura diagonal da dobra
            gsap.to('.app-intro-bg', {
                y: 30,
                ease: 'none',
                scrollTrigger: window.ScrollTrigger ? {
                    trigger: '#app-intro',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                } : undefined
            });

            gsap.from('.app-intro-logo, .app-intro-title, .app-intro-subtitle', {
                opacity: 0,
                y: 24,
                duration: 0.8,
                ease: 'power3.out',
                stagger: 0.12,
                scrollTrigger: window.ScrollTrigger ? { trigger: '#app-intro', start: 'top 70%' } : undefined
            });
        }

        onComponentsReady(initAppIntroReveal);
    })();
})();

/* sections/app-journey/app-journey.html */
(function () {
(function () {
        function initAppJourney() {
            const section = document.getElementById('app-journey');
            if (!section) return;
            if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

            gsap.from('.app-journey-mockup', {
                opacity: 0,
                y: 40,
                scale: 0.94,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: window.ScrollTrigger ? { trigger: '#app-journey', start: 'top 75%' } : undefined
            });

            // Cada etapa da trilha entra em sequência ao rolar, reforçando a
            // narrativa de jornada (planejamento -> operação -> gestão)
            gsap.from(section.querySelectorAll('.app-step'), {
                opacity: 0,
                y: 24,
                duration: 0.7,
                ease: 'power3.out',
                stagger: 0.15,
                scrollTrigger: window.ScrollTrigger ? { trigger: '.app-journey-steps', start: 'top 80%' } : undefined
            });
        }

        onComponentsReady(initAppJourney);
    })();
})();

/* sections/screen-showcase/screen-showcase.html */
(function () {
(function () {
        // Anéis da órbita por distância até o centro. Valores intermediários
        // saem de interpolação, o que deixa o arraste contínuo
        const ORBIT_DESKTOP = [
            { x: 0, z: 0, ry: 0, scale: 1, opacity: 1 },
            { x: 198, z: -160, ry: -22, scale: 0.74, opacity: 0.72 },
            { x: 312, z: -320, ry: -30, scale: 0.56, opacity: 0.36 },
            { x: 380, z: -420, ry: -34, scale: 0.46, opacity: 0 }
        ];

        const ORBIT_TABLET = [
            { x: 0, z: 0, ry: 0, scale: 1, opacity: 1 },
            { x: 188, z: -160, ry: -22, scale: 0.66, opacity: 0.62 },
            { x: 304, z: -320, ry: -30, scale: 0.48, opacity: 0.28 },
            { x: 380, z: -420, ry: -34, scale: 0.4, opacity: 0 }
        ];

        const ORBIT_MOBILE = [
            { x: 0, z: 0, ry: 0, scale: 1, opacity: 1 },
            { x: 152, z: -180, ry: -24, scale: 0.6, opacity: 0.44 },
            { x: 240, z: -340, ry: -32, scale: 0.44, opacity: 0.18 },
            { x: 300, z: -440, ry: -36, scale: 0.36, opacity: 0 }
        ];

        // O tempo de permanência de cada card é o AUTOPLAY_DELAY; a duração da
        // transição fica separada pra o giro ser rápido sem ficar abrupto
        const AUTOPLAY_DELAY = 2.4;
        const SNAP_DURATION = 1.1;
        const DRAG_CLICK_SLOP = 8;
        const TILT_Y = 8;
        const TILT_X = -5;

        function initScreenShowcase() {
            const section = document.getElementById('screen-showcase');
            if (!section || !window.gsap) return;

            const stage = section.querySelector('.showcase-stage');
            const scene = section.querySelector('.showcase-scene');
            const controls = section.querySelector('.showcase-controls');
            const captionName = section.querySelector('.showcase-caption-name');
            const captionDetail = section.querySelector('.showcase-caption-detail');
            const slides = Array.from(section.querySelectorAll('.showcase-slide'));
            if (!stage || !scene || !controls || slides.length < 3) return;

            const total = slides.length;
            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            // `position` é contínua: durante o arraste assume valores
            // fracionários, e no repouso é sempre um índice inteiro
            let position = 0;
            let active = 0;
            let orbit = ORBIT_DESKTOP;
            let autoplay = null;
            let snapTween = null;
            // Fator que encolhe a órbita quando o palco é mais estreito do
            // que os deslocamentos em px pedem, senão os aparelhos das
            // pontas vazariam a viewport e criariam scroll horizontal
            let orbitFit = 1;

            section.classList.add('is-live');

            // Estado do arraste. Declarado antes dos controles porque o
            // clique num slide consulta `dragMoved` pra distinguir toque de
            // arraste terminando sobre ele
            let dragging = false;
            let dragPointer = null;
            let dragStartX = 0;
            let dragStartPosition = 0;
            let dragMoved = 0;
            let dragLastX = 0;
            let dragVelocity = 0;
            let dragTapSlide = null;

            // --- Controles ---
            slides.forEach(function (slide, index) {
                const name = slide.getAttribute('data-name');
                slide.setAttribute('aria-label', 'Ver tela: ' + name);
                // Só o clique de teclado (`detail === 0`) chega por aqui: com
                // ponteiro, o `setPointerCapture` do arraste entrega o `click`
                // à cena e não ao botão, então o toque é resolvido no `pointerup`
                slide.addEventListener('click', function (event) {
                    if (event.detail !== 0) return;
                    goTo(nearestRouteTo(index));
                    restartAutoplay();
                });

                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'showcase-dot';
                dot.setAttribute('aria-label', name);
                dot.addEventListener('click', function () {
                    goTo(nearestRouteTo(index));
                    restartAutoplay();
                });
                controls.appendChild(dot);
            });

            const dots = Array.from(controls.children);

            // Distância circular assinada entre um slide e a posição atual,
            // aceitando posição fracionária (-total/2 a total/2)
            function circularDistance(index, from) {
                let distance = (index - from) % total;
                if (distance > total / 2) distance -= total;
                if (distance < -total / 2) distance += total;
                return distance;
            }

            // Caminho mais curto até um índice, preservando o wrap circular
            function nearestRouteTo(index) {
                return position + circularDistance(index, position);
            }

            // Mede quanto a órbita cabe no palco atual. O anel de referência
            // é o mais distante que ainda aparece
            function measureFit() {
                const stageWidth = stage.getBoundingClientRect().width;
                const slideWidth = slides[0].getBoundingClientRect().width;
                const ring = orbit[2];
                if (!stageWidth || !slideWidth || !ring.x) {
                    orbitFit = 1;
                    return;
                }
                const room = stageWidth / 2 - (slideWidth * ring.scale) / 2 - 8;
                const fit = room / ring.x;
                orbitFit = fit > 0 && fit < 1 ? fit : 1;
            }

            // Interpola entre os anéis pra suportar distância fracionária
            function spotAt(distance) {
                const abs = Math.abs(distance);
                const side = distance < 0 ? -1 : 1;
                const ring = Math.min(Math.floor(abs), orbit.length - 2);
                const t = Math.min(abs - ring, 1);
                const from = orbit[ring];
                const to = orbit[ring + 1];
                const mix = function (a, b) { return a + (b - a) * t; };

                return {
                    x: mix(from.x, to.x) * side * orbitFit,
                    z: mix(from.z, to.z),
                    rotationY: mix(from.ry, to.ry) * side,
                    scale: mix(from.scale, to.scale),
                    opacity: mix(from.opacity, to.opacity)
                };
            }

            function render() {
                slides.forEach(function (slide, index) {
                    const distance = circularDistance(index, position);
                    const spot = spotAt(distance);
                    const isReachable = spot.opacity > 0.05;

                    slide.style.pointerEvents = isReachable ? 'auto' : 'none';
                    slide.setAttribute('aria-hidden', isReachable ? 'false' : 'true');
                    slide.tabIndex = isReachable ? 0 : -1;

                    gsap.set(slide, {
                        yPercent: -50,
                        x: spot.x,
                        z: spot.z,
                        rotationY: spot.rotationY,
                        scale: spot.scale,
                        opacity: spot.opacity
                    });
                });
            }

            function syncActive() {
                const next = ((Math.round(position) % total) + total) % total;
                if (next === active) return;
                active = next;
                paintCaption();
            }

            function paintCaption() {
                const slide = slides[active];
                captionName.textContent = slide.getAttribute('data-name');
                captionDetail.textContent = slide.getAttribute('data-detail');
                dots.forEach(function (dot, index) {
                    dot.setAttribute('aria-current', index === active ? 'true' : 'false');
                });
            }

            function goTo(target, animate) {
                if (snapTween) snapTween.kill();

                if (animate === false || reduceMotion) {
                    position = target;
                    render();
                    syncActive();
                    return;
                }

                // `expo.out` desacelera longo no fim: é o que dá inércia em
                // vez de transição mecânica
                snapTween = gsap.to({ value: position }, {
                    value: target,
                    duration: SNAP_DURATION,
                    ease: 'expo.out',
                    onUpdate: function () {
                        position = this.targets()[0].value;
                        render();
                        syncActive();
                    },
                    onComplete: function () {
                        // Reancora no equivalente circular pra `position` não
                        // crescer sem limite ao longo da navegação
                        position = ((position % total) + total) % total;
                        render();
                    }
                });
            }

            // --- Arraste com dedo e com mouse ---
            // Quantos pixels de arraste valem um slide. Acompanha o fator de
            // encaixe pra o gesto seguir o deslocamento visto na tela
            function dragUnit() {
                return (orbit[1].x || 200) * orbitFit;
            }

            stage.addEventListener('pointerdown', function (event) {
                if (event.button !== 0 && event.pointerType === 'mouse') return;
                dragging = true;
                dragPointer = event.pointerId;
                dragStartX = event.clientX;
                dragLastX = event.clientX;
                dragStartPosition = position;
                dragMoved = 0;
                dragVelocity = 0;
                dragTapSlide = event.target instanceof Element
                    ? event.target.closest('.showcase-slide')
                    : null;
                if (snapTween) snapTween.kill();
                stopAutoplay();
                stage.classList.add('is-dragging');
                // Sem capturar o ponteiro, soltar o mouse fora do palco não
                // dispararia `pointerup` aqui e o arraste ficaria preso
                if (stage.setPointerCapture) {
                    try { stage.setPointerCapture(event.pointerId); } catch (error) { /* ponteiro já liberado */ }
                }
            });

            stage.addEventListener('pointermove', function (event) {
                if (!dragging || event.pointerId !== dragPointer) return;
                const delta = event.clientX - dragStartX;
                dragMoved = Math.max(dragMoved, Math.abs(delta));
                dragVelocity = event.clientX - dragLastX;
                dragLastX = event.clientX;
                position = dragStartPosition - delta / dragUnit();
                render();
                syncActive();
            });

            function endDrag(event) {
                if (!dragging || (event && event.pointerId !== dragPointer)) return;
                dragging = false;
                dragPointer = null;
                stage.classList.remove('is-dragging');

                const wasMoved = dragMoved > DRAG_CLICK_SLOP;
                const tapSlide = dragTapSlide;
                dragMoved = 0;
                dragTapSlide = null;

                if (!wasMoved) {
                    // Ponteiro parado sobre um slide é toque, não arraste: gira
                    // o carrossel até ele
                    const tapIndex = tapSlide ? slides.indexOf(tapSlide) : -1;
                    if (tapIndex >= 0) {
                        goTo(nearestRouteTo(tapIndex));
                        restartAutoplay();
                        return;
                    }
                    startAutoplay();
                    return;
                }

                // A velocidade do gesto empurra o snap pro slide seguinte,
                // então um flick curto e rápido ainda troca de tela. Limitado
                // a um slide pra um gesto muito rápido não pular três telas
                const flick = gsap.utils.clamp(-1, 1, -dragVelocity / (dragUnit() * 0.22));
                goTo(Math.round(position + flick));
                restartAutoplay();
            }

            stage.addEventListener('pointerup', endDrag);
            stage.addEventListener('pointercancel', endDrag);
            stage.addEventListener('lostpointercapture', endDrag);

            // Arrastar sobre uma tela não deve iniciar o drag nativo de imagem
            scene.addEventListener('dragstart', function (event) { event.preventDefault(); });

            // --- Autoplay: pausa fora da tela, no hover, no foco e no arraste ---
            function startAutoplay() {
                if (reduceMotion || autoplay || dragging) return;
                autoplay = gsap.delayedCall(AUTOPLAY_DELAY, function () {
                    autoplay = null;
                    goTo(position + 1);
                    startAutoplay();
                });
            }

            function stopAutoplay() {
                if (!autoplay) return;
                autoplay.kill();
                autoplay = null;
            }

            function restartAutoplay() {
                stopAutoplay();
                startAutoplay();
            }

            stage.addEventListener('mouseenter', stopAutoplay);
            stage.addEventListener('mouseleave', startAutoplay);
            stage.addEventListener('focusin', stopAutoplay);
            stage.addEventListener('focusout', startAutoplay);

            if ('IntersectionObserver' in window) {
                new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) startAutoplay();
                        else stopAutoplay();
                    });
                }, { threshold: 0.25 }).observe(section);
            } else {
                startAutoplay();
            }

            // --- Teclado ---
            scene.addEventListener('keydown', function (event) {
                if (event.key === 'ArrowRight') {
                    goTo(Math.round(position) + 1);
                } else if (event.key === 'ArrowLeft') {
                    goTo(Math.round(position) - 1);
                } else {
                    return;
                }
                restartAutoplay();
                event.preventDefault();
            });

            // --- Órbita por breakpoint ---
            const wideQuery = window.matchMedia('(min-width: 993px)');
            const narrowQuery = window.matchMedia('(max-width: 600px)');

            function pickOrbit() {
                if (narrowQuery.matches) orbit = ORBIT_MOBILE;
                else if (wideQuery.matches) orbit = ORBIT_DESKTOP;
                else orbit = ORBIT_TABLET;
                measureFit();
                render();
            }

            wideQuery.addEventListener('change', pickOrbit);
            narrowQuery.addEventListener('change', pickOrbit);

            // Reencaixa a órbita quando o palco muda de largura, inclusive
            // nas larguras entre breakpoints
            if ('ResizeObserver' in window) {
                new ResizeObserver(function () {
                    measureFit();
                    render();
                }).observe(stage);
            }

            pickOrbit();
            paintCaption();

            // --- Parallax de cursor: só em ponteiro fino, e sutil ---
            if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                const tiltY = gsap.quickTo(scene, 'rotationY', { duration: 0.9, ease: 'power3.out' });
                const tiltX = gsap.quickTo(scene, 'rotationX', { duration: 0.9, ease: 'power3.out' });

                stage.addEventListener('pointermove', function (event) {
                    const box = stage.getBoundingClientRect();
                    tiltY(((event.clientX - box.left) / box.width - 0.5) * TILT_Y);
                    tiltX(((event.clientY - box.top) / box.height - 0.5) * TILT_X);
                });

                stage.addEventListener('pointerleave', function () {
                    tiltY(0);
                    tiltX(0);
                });
            }

            // --- Entrada da dobra ---
            if (!reduceMotion && window.ScrollTrigger) {
                gsap.registerPlugin(ScrollTrigger);

                gsap.from('.showcase-logo-img, .screen-showcase-subtitle, .showcase-cta, .showcase-caption, .showcase-controls', {
                    opacity: 0,
                    y: 20,
                    duration: 0.8,
                    ease: 'power3.out',
                    stagger: 0.1,
                    scrollTrigger: { trigger: '#screen-showcase', start: 'top 75%' }
                });
            }
        }

        onComponentsReady(initScreenShowcase);
    })();
})();

/* components/btn-cta/btn-cta.html */
(function () {
(function () {
        // Escuta cliques em todos os botões btn-cta (suporta múltiplas instâncias no DOM)
        if (!window.__btnCtaGlobalListener) {
            window.__btnCtaGlobalListener = true;
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-cta-element, .cta-btn-base');
                if (btn) {
                    if (window.openAuthDrawer) {
                        window.openAuthDrawer();
                    } else {
                        window.addEventListener('components:ready', () => window.openAuthDrawer?.(), { once: true });
                    }
                }
            });
        }

    })();
})();

/* sections/trust/trust.html */
(function () {
(function () {
        function initTrustReveal() {
            if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

            // Fundo se move mais devagar que o scroll, reforçando a
            // profundidade na costura diagonal da dobra
            gsap.to('.trust-bg-image', {
                y: 40,
                ease: 'none',
                scrollTrigger: window.ScrollTrigger ? {
                    trigger: '#trust',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                } : undefined
            });

            gsap.from('.trust-badge-col', {
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: window.ScrollTrigger ? { trigger: '.trust-grid', start: 'top 75%' } : undefined
            });

            gsap.from('.trust-pillar', {
                opacity: 0,
                y: 24,
                duration: 0.7,
                ease: 'power3.out',
                stagger: 0.15,
                scrollTrigger: window.ScrollTrigger ? { trigger: '.trust-pillars-col', start: 'top 80%' } : undefined
            });
        }

        onComponentsReady(() => {
            initTrustReveal();
        });
    })();
})();

/* sections/faq/faq.html */
(function () {
(function () {
        function initFaq() {
            const section = document.getElementById('faq');
            if (!section) return;

            const items = Array.from(section.querySelectorAll('.faq-item'));

            items.forEach((item) => {
                const button = item.querySelector('.faq-question');
                button.addEventListener('click', () => {
                    const wasOpen = item.classList.contains('is-open');
                    items.forEach((other) => other.classList.remove('is-open'));
                    if (!wasOpen) item.classList.add('is-open');
                });
            });
        }

        function initFaqReveal() {
            if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

            gsap.from('.faq-title, .faq-support', {
                opacity: 0,
                y: 24,
                duration: 0.7,
                ease: 'power3.out',
                stagger: 0.1,
                scrollTrigger: window.ScrollTrigger ? { trigger: '#faq', start: 'top 75%' } : undefined
            });

            gsap.from('.faq-item', {
                opacity: 0,
                y: 20,
                duration: 0.6,
                ease: 'power3.out',
                stagger: 0.08,
                scrollTrigger: window.ScrollTrigger ? { trigger: '.faq-list', start: 'top 80%' } : undefined
            });
        }

        onComponentsReady(() => {
            initFaq();
            initFaqReveal();
        });
    })();
})();

/* sections/contact/contact.html */
(function () {
(function () {
        // Public IDs do Cloudinary; as transformações de formato/resolução são
        // aplicadas por window.videoSources (js/video-carousel.js)
        const CONTACT_VIDEO_IDS = [
            'v1788230093/Tk-1.webm',
            'v1788230096/Tk-2-0615-P1.webm',
            'v1788230093/Tk-3-0988.webm',
            'v1788230094/Tk-4-0615-P1.webm'
        ];

        function initContactVideoCarousel() {
            if (!window.createVideoCarousel || !window.videoSources) return;
            window.createVideoCarousel({
                videoId: 'contact-video-1',
                urls: window.videoSources(CONTACT_VIDEO_IDS)
            });
        }

        function initScrollReveal() {
            if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

            gsap.from('.contact-card--info', {
                opacity: 0,
                x: -30,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: window.ScrollTrigger ? { trigger: '#contact', start: 'top 70%' } : undefined
            });

            gsap.from('.contact-card--map', {
                opacity: 0,
                x: 30,
                duration: 0.8,
                delay: 0.1,
                ease: 'power3.out',
                scrollTrigger: window.ScrollTrigger ? { trigger: '#contact', start: 'top 70%' } : undefined
            });
        }

        initContactVideoCarousel();

        onComponentsReady(initScrollReveal);
    })();
})();

/* components/social-links/social-links.html */
(function () {
(function () {
        // Suporta múltiplas instâncias do componente na página (ex.: header e
        // footer): cada instância monta e executa este script separadamente,
        // então marcamos as já observadas para não duplicar o observer.
        function observeHeroVisibility() {
            const hero = document.getElementById('hero');
            if (!hero) return;

            document.querySelectorAll('.social-links:not([data-visibility-observed])').forEach((container) => {
                container.setAttribute('data-visibility-observed', 'true');
                // Só se aplica dentro do header: em outros contextos (ex.: footer)
                // os ícones ficam sempre visíveis pelo CSS padrão do componente
                if (!container.closest('#header')) return;

                new IntersectionObserver(([entry]) => {
                    container.classList.toggle('is-visible', !entry.isIntersecting);
                }, { threshold: 0 }).observe(hero);
            });
        }

        onComponentsReady(observeHeroVisibility);
    })();
})();

/* sections/footer/footer.html */
(function () {
(function () {
        function initFooterReveal() {
            if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

            gsap.from('.footer__inner', {
                opacity: 0,
                y: 16,
                duration: 0.7,
                ease: 'power3.out',
                // 'top bottom': o rodapé é a última seção da página, então a
                // rolagem nunca consegue empurrar seu topo além de um ponto
                // fixo como "90%" — esse gatilho dispara assim que qualquer
                // parte dele entra na tela, garantindo que sempre rode
                scrollTrigger: window.ScrollTrigger ? { trigger: '#footer', start: 'top bottom' } : undefined
            });
        }

        onComponentsReady(initFooterReveal);
    })();
})();

/* components/social-links/social-links.html */
(function () {
(function () {
        // Suporta múltiplas instâncias do componente na página (ex.: header e
        // footer): cada instância monta e executa este script separadamente,
        // então marcamos as já observadas para não duplicar o observer.
        function observeHeroVisibility() {
            const hero = document.getElementById('hero');
            if (!hero) return;

            document.querySelectorAll('.social-links:not([data-visibility-observed])').forEach((container) => {
                container.setAttribute('data-visibility-observed', 'true');
                // Só se aplica dentro do header: em outros contextos (ex.: footer)
                // os ícones ficam sempre visíveis pelo CSS padrão do componente
                if (!container.closest('#header')) return;

                new IntersectionObserver(([entry]) => {
                    container.classList.toggle('is-visible', !entry.isIntersecting);
                }, { threshold: 0 }).observe(hero);
            });
        }

        onComponentsReady(observeHeroVisibility);
    })();
})();

/* components/whatsapp-float/whatsapp-float.html */
(function () {
(function () {
        const container = document.getElementById('whatsapp-float');
        if (!container) return;

        let floatTime = 0;
        let lastScrollY = window.scrollY || 0;
        let scrollVelocity = 0;
        let currentOffset = 0;
        let isDetached = false;
        let rafId = null;
        const DETACH_THRESHOLD = 90;
        // Mesmo breakpoint do CSS: o botão é display:none no mobile, então a
        // animação nem precisa rodar (evita gastar CPU/bateria à toa)
        const hiddenOnMobileQuery = window.matchMedia('(max-width: 600px)');

        function updateMagneticDock() {
            const scrollY = window.scrollY || 0;
            const delta = scrollY - lastScrollY;
            lastScrollY = scrollY;
            const isMobile = window.innerWidth <= 600;

            if (scrollY > DETACH_THRESHOLD && !isDetached) {
                isDetached = true;
                container.classList.add('is-detached');
                if (!isMobile) {
                    container.classList.add('just-detached');
                    setTimeout(() => container.classList.remove('just-detached'), 600);
                }
            } else if (scrollY <= DETACH_THRESHOLD && isDetached) {
                isDetached = false;
                container.classList.remove('is-detached');
            }

            const inFactor = isMobile ? 0.05 : 0.12;
            const dampFactor = isMobile ? 0.92 : 0.88;
            const maxClamp = isMobile ? 4 : 10;
            const floatAmp = isMobile ? 1.5 : (isDetached ? 3 : 1.8);

            scrollVelocity += (delta * inFactor - scrollVelocity) * 0.1;
            scrollVelocity *= dampFactor;

            floatTime += 0.025;
            const baseFloat = Math.sin(floatTime) * floatAmp;

            currentOffset += (baseFloat + Math.max(-maxClamp, Math.min(maxClamp, -scrollVelocity)) - currentOffset) * (isMobile ? 0.06 : 0.1);
            container.style.transform = `translate3d(0, ${currentOffset.toFixed(2)}px, 0)`;

            rafId = requestAnimationFrame(updateMagneticDock);
        }

        function startLoop() {
            if (rafId === null) rafId = requestAnimationFrame(updateMagneticDock);
        }

        function stopLoop() {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        hiddenOnMobileQuery.addEventListener('change', (e) => e.matches ? stopLoop() : startLoop());
        if (!hiddenOnMobileQuery.matches) startLoop();
    })();
})();

/* components/auth-drawer/auth-drawer.html */
(function () {
class AuthDrawer {
  // Pra onde o usuário vai depois que o lead é enviado ao CRM — o checkout
  // em si não é responsabilidade deste site, é um sistema à parte.
  static CHECKOUT_URL = 'https://checkout.go2apply.com/subscribe/go2apply-anual';

  constructor() {
    this.drawer = document.getElementById('auth-drawer');
    this.backdrop = document.getElementById('authBackdrop');
    this.leadForm = document.getElementById('leadForm');
    this.init();
  }

  init() {
    document.getElementById('authClose')?.addEventListener('click', () => this.close());
    this.backdrop?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });

    this.leadForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.submitForm();
    });

    this.attachValidation();
    this.attachPhoneMask();
  }

  attachValidation() {
    const inputs = this.leadForm ? this.leadForm.querySelectorAll('input[required]') : [];
    inputs.forEach(input => {
      input.addEventListener('input', () => this.validateField(input));
      input.addEventListener('blur', () => this.validateField(input));
    });
  }

  validateField(input) {
    const value = input.value.trim();
    const container = input.closest('.auth-form-input');
    if (!container) return false;
    let isValid = false;

    switch (input.name) {
      case 'fullName':
        isValid = value.length >= 3 && value.trim().includes(' ');
        if (!isValid) input.setCustomValidity('Por favor, informe seu nome e sobrenome.');
        else input.setCustomValidity('');
        break;
      case 'email':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;
      case 'phone':
        isValid = /^\(\d{2}\)\s9\d{4}-\d{4}$|^\(\d{2}\)\s\d{4}-\d{4}$/.test(value);
        break;
      default:
        isValid = value.length > 0;
    }

    if (isValid) {
      container.classList.add('auth-form-input-valid');
    } else {
      container.classList.remove('auth-form-input-valid');
    }

    return isValid;
  }

  attachPhoneMask() {
    const phoneInput = this.leadForm?.querySelector('input[name="phone"]');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 0) {
          if (value.length <= 2) {
            value = `(${value}`;
          } else if (value.length <= 7) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
          } else {
            const isMobile = value[2] === '9';
            const start = isMobile ? 3 : 2;
            const mid = value.slice(start, start + 4);
            const end = value.slice(start + 4, start + 8);
            value = `(${value.slice(0, 2)}) ${isMobile ? '9' : ''}${mid}${end ? '-' + end : ''}`;
          }
        }

        e.target.value = value;
        this.validateField(phoneInput);
      });
    }
  }

  async submitForm() {
    const termsCheckbox = this.leadForm.querySelector('input[name="terms"]');
    if (!termsCheckbox.checked) {
      alert('Você deve concordar com os Termos de Uso e Política de Privacidade');
      return;
    }

    const fullNameInput = this.leadForm.querySelector('input[name="fullName"]');
    const emailInput = this.leadForm.querySelector('input[name="email"]');
    const phoneInput = this.leadForm.querySelector('input[name="phone"]');

    const isValid = [fullNameInput, emailInput, phoneInput].every((input) => this.validateField(input));
    if (!isValid) {
      alert('Confira seus dados: nome, e-mail e WhatsApp precisam estar corretos.');
      return;
    }

    const payload = Object.fromEntries(new FormData(this.leadForm));
    payload.terms = termsCheckbox.checked;

    const submitBtn = this.leadForm.querySelector('#leadSubmit');
    if (submitBtn) submitBtn.disabled = true;

    // Envia o lead pro CRM sem esperar a resposta: o checkout não pode
    // ficar refém da gravação no Firestore — se ela demorar ou falhar, a
    // conversão do pagamento não pode ser perdida por causa disso.
    // `keepalive: true` é essencial aqui: sem isso, o navegador cancela essa
    // requisição no meio do caminho assim que a navegação pro checkout
    // (linha abaixo) começa, e o lead nunca chega no Firestore.
    fetch('/api/create-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch((error) => console.error('Falha ao enviar lead ao CRM:', error));

    const checkoutUrl = new URL(AuthDrawer.CHECKOUT_URL);
    if (payload.fullName) checkoutUrl.searchParams.set('name', payload.fullName);
    if (payload.email) checkoutUrl.searchParams.set('email', payload.email);

    if (payload.phone) {
      const phoneDigits = payload.phone.replace(/\D/g, '');
      // Nossa máscara gera sempre (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX.
      // Os 2 primeiros dígitos são sempre o DDD.
      // Kiwify aceita os parâmetros phoneddi (código do país), phoneac (DDD)
      // e phonenumber (número sem DDD).
      if (phoneDigits.length >= 10) {
        const ddd = phoneDigits.substring(0, 2);
        const number = phoneDigits.substring(2);
        checkoutUrl.searchParams.set('phoneddi', '55');
        checkoutUrl.searchParams.set('phoneac', ddd);
        checkoutUrl.searchParams.set('phonenumber', number);
        // Também passa o phone completo como fallback para outros checkouts
        checkoutUrl.searchParams.set('phone', '55' + phoneDigits);
      } else {
        checkoutUrl.searchParams.set('phone', phoneDigits);
      }
    }

    window.location.href = checkoutUrl.toString();
  }

  open() {
    if (!this.drawer) return;
    this.drawer.classList.add('active');
    if (this.backdrop) this.backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.drawer) return;
    this.drawer.classList.remove('active');
    if (this.backdrop) this.backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggle() {
    if (!this.drawer) return;
    if (this.drawer.classList.contains('active')) {
      this.close();
    } else {
      this.open();
    }
  }
}

window.authDrawer = new AuthDrawer();

window.openAuthDrawer = () => window.authDrawer.open();
window.closeAuthDrawer = () => window.authDrawer.close();
})();

/* components/trial-banner/trial-banner.html */
(function () {
(function () {
        // Manipula o clique em instâncias do trial-banner fora do auth-drawer
        document.addEventListener('click', (e) => {
            const banner = e.target.closest('.trial-banner');
            if (!banner) return;

            // Se o banner estiver dentro do próprio auth-drawer, não faz nada ao clicar
            if (banner.closest('#auth-drawer') || banner.closest('.auth-drawer')) return;

            window.openAuthDrawerAndCloseNav();
        });
    })();
})();

/* components/social-links/social-links.html */
(function () {
(function () {
        // Suporta múltiplas instâncias do componente na página (ex.: header e
        // footer): cada instância monta e executa este script separadamente,
        // então marcamos as já observadas para não duplicar o observer.
        function observeHeroVisibility() {
            const hero = document.getElementById('hero');
            if (!hero) return;

            document.querySelectorAll('.social-links:not([data-visibility-observed])').forEach((container) => {
                container.setAttribute('data-visibility-observed', 'true');
                // Só se aplica dentro do header: em outros contextos (ex.: footer)
                // os ícones ficam sempre visíveis pelo CSS padrão do componente
                if (!container.closest('#header')) return;

                new IntersectionObserver(([entry]) => {
                    container.classList.toggle('is-visible', !entry.isIntersecting);
                }, { threshold: 0 }).observe(hero);
            });
        }

        onComponentsReady(observeHeroVisibility);
    })();
})();

window.dispatchEvent(new CustomEvent("components:ready"));

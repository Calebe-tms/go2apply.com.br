/**
 * Carrossel de Vídeo Simples
 * Cada vídeo toca 1x do início ao fim, depois passa para o próximo.
 */

const CLOUDINARY_BASE = 'https://res.cloudinary.com/vdgkx5jc/video/upload';
const VIDEO_MOBILE_BREAKPOINT = 768;

function supportsWebmVp9() {
    const probe = document.createElement('video');
    if (!probe.canPlayType) return false;
    return probe.canPlayType('video/webm; codecs="vp9"') !== '';
}

/**
 * Monta as URLs de entrega a partir dos public IDs do Cloudinary.
 *
 * - Formato: VP9/webm é o padrão porque é bem mais eficiente que H.264 no
 *   material desta hero (medido no mesmo clipe a 960px: 223 KB em VP9 contra
 *   594 KB em H.264). Só cai para mp4 onde o VP9 não toca — na prática
 *   Safari/iOS, onde antes o vídeo simplesmente não rodava e o loader
 *   esperava o timeout inteiro. Atenção: NÃO usar f_auto aqui; o Cloudinary
 *   prioriza compatibilidade e devolve H.264 até no Chrome, o que medimos
 *   como +29% de bytes no total.
 * - w_*,c_limit: teto de resolução sem upscale, protege contra um upload
 *   futuro em resolução maior.
 * - Mobile recebe w_960: é um fundo atrás de overlay escuro, então a
 *   diferença visual não aparece e a economia em 4G é grande.
 */
function videoSources(publicIds) {
    const isMobile = window.matchMedia('(max-width: ' + VIDEO_MOBILE_BREAKPOINT + 'px)').matches;
    const width = isMobile ? 960 : 1920;
    const format = supportsWebmVp9() ? '' : 'f_mp4,';
    const transform = format + 'q_auto:good,w_' + width + ',c_limit';

    return publicIds.map(function (publicId) {
        return CLOUDINARY_BASE + '/' + transform + '/' + publicId;
    });
}

function createVideoCarousel(config) {
    const { videoId, videoIds, urls, onFirstFrame } = config;
    const targetId = videoId || (videoIds && videoIds[0]);
    const video = document.getElementById(targetId);

    if (!video || !urls || urls.length === 0) return;

    // Guard: evita dupla inicialização se o componente for remontado
    if (video.dataset.carouselInit) return;
    video.dataset.carouselInit = '1';

    let currentIdx = 0;

    function loadAndPlay(index) {
        currentIdx = index % urls.length;
        video.src = urls[currentIdx];
        video.load();
        // Aguarda o browser processar o src antes de iniciar a reprodução
        video.addEventListener('canplay', function () {
            video.play().catch(function (err) {
                console.warn('Erro ao reproduzir vídeo:', err);
            });
        }, { once: true });
    }

    if (onFirstFrame) {
        video.addEventListener('playing', onFirstFrame, { once: true });
    }

    video.addEventListener('ended', function () {
        loadAndPlay(currentIdx + 1);
    });

    // Pausa quando a dobra sai da viewport. O ganho real não é a pausa em si,
    // é cortar a corrente de 'ended' -> carrega o próximo clipe: sem isso o
    // carrossel seguia baixando os clipes seguintes indefinidamente com a
    // seção fora da tela (um ciclo completo passa de 2 MB).
    // A intenção é sempre tocar enquanto visível, então o estado desejado é
    // derivado só da visibilidade — não de amostrar video.paused. Amostrar
    // deixaria o vídeo preso: numa aba aberta em segundo plano o observer
    // pausa antes do primeiro play e nunca mais retomaria.
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    video.play().catch(function () { /* autoplay pode ser negado */ });
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.01 }).observe(video);
    }

    loadAndPlay(0);
}

window.videoSources = videoSources;
window.createVideoCarousel = createVideoCarousel;

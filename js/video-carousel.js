/**
 * Carrossel de Vídeo Simples
 * Cada vídeo toca 1x do início ao fim, depois passa para o próximo.
 */
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

    loadAndPlay(0);
}

window.createVideoCarousel = createVideoCarousel;

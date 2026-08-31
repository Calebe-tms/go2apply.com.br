/**
 * Carrossel de Vídeo com Crossfade
 * Motor compartilhado do carrossel contínuo de vídeos de fundo, usado pela
 * Hero e pela Contact (mesmos vídeos, pequenas variações de comportamento).
 * Carregado via <script src> em index.html antes de qualquer componente
 * montar, então window.createVideoCarousel já existe quando as dobras
 * precisam dele.
 */
function createVideoCarousel(config) {
    const { videoIds, urls, onFirstFrame, observeSectionId } = config;

    const videos = videoIds.map((id) => document.getElementById(id));
    if (videos.some((v) => !v) || urls.length === 0) return;

    function getOptimizedVideoUrl(baseUrl) {
        const isMobile = window.innerWidth <= 600;
        const dpr = window.devicePixelRatio || 1;

        if (isMobile) {
            return baseUrl.replace('/upload/', '/upload/w_720,q_75,fl_lossy,f_auto/');
        } else if (dpr > 1.5) {
            return baseUrl.replace('/upload/', '/upload/w_1280,q_60,fl_lossy,f_auto/');
        }
        return baseUrl.replace('/upload/', '/upload/w_1920,q_70,fl_lossy,f_auto/');
    }

    let currentIdx = 0;
    let firstFrameFired = false;

    function notifyFirstFrame() {
        if (firstFrameFired) return;
        firstFrameFired = true;
        // Só começa a baixar o próximo vídeo depois que o primeiro já está
        // tocando, evitando que os dois disputem banda no carregamento inicial
        if (urls.length > 1) {
            videos[1].src = getOptimizedVideoUrl(urls[1]);
            videos[1].load();
        }
        if (onFirstFrame) onFirstFrame();
    }

    function playNextVideo() {
        const prevIdx = currentIdx;
        currentIdx = (currentIdx + 1) % urls.length;
        videos[prevIdx].classList.remove('active');
        videos[currentIdx].classList.add('active');
        videos[currentIdx].play().catch((err) => console.warn('Erro ao tocar vídeo:', err));
    }

    videos.forEach((v) => {
        v.addEventListener('playing', notifyFirstFrame, { once: true });
        v.addEventListener('canplay', notifyFirstFrame, { once: true });
        v.addEventListener('ended', playNextVideo);
    });

    videos[0].classList.add('active');
    videos[0].src = getOptimizedVideoUrl(urls[0]);
    videos[0].load();
    videos[0].play().catch((err) => console.warn('Autoplay video 1:', err));

    if (observeSectionId) {
        const section = document.getElementById(observeSectionId);
        if (section) {
            const videoObserver = new IntersectionObserver((entries) => {
                const activeVideo = videos.find((v) => v.classList.contains('active'));
                if (!activeVideo) return;
                if (entries[0].isIntersecting && activeVideo.paused) {
                    activeVideo.play().catch(() => {});
                } else if (!entries[0].isIntersecting && !activeVideo.paused) {
                    activeVideo.pause();
                }
            }, { threshold: 0.1 });
            videoObserver.observe(section);
        }
    }
}

window.createVideoCarousel = createVideoCarousel;

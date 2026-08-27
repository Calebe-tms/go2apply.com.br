// Lista de vídeos para o carrossel de background
const videoSources = [
    'assets/videos/7542596-uhd_3840_2160_30fps.mp4',
    'assets/videos/10744335-hd_1920_1080_24fps.mp4',
    'assets/videos/10744336-hd_1920_1080_24fps.mp4',
    'assets/videos/12093651_3840_2160_60fps.mp4',
    'assets/videos/12576680_3840_2160_25fps.mp4',
    'assets/videos/13678744_1920_1080_60fps.mp4',
    'assets/videos/13958046-uhd_3840_2160_24fps (1).mp4',
    'assets/videos/13958046-uhd_3840_2160_24fps.mp4',
    'assets/videos/17642551-uhd_4096_2160_24fps.mp4'
];

document.addEventListener('DOMContentLoaded', () => {
    const video1 = document.getElementById('bg-video-1');
    const video2 = document.getElementById('bg-video-2');
    
    let currentIndex = 0;
    let activeVideo = video1;
    let inactiveVideo = video2;

    // Inicializa o primeiro vídeo
    activeVideo.src = videoSources[currentIndex];
    activeVideo.play().catch(e => console.warn('Autoplay prevented:', e));
    
    // Preload do segundo vídeo
    let nextIndex = (currentIndex + 1) % videoSources.length;
    inactiveVideo.src = videoSources[nextIndex];

    const handleVideoEnd = () => {
        // Inicia o vídeo inativo
        inactiveVideo.play().catch(e => console.warn('Autoplay prevented:', e));
        
        // Aplica o crossfade (classes controlam a opacidade no CSS)
        inactiveVideo.classList.add('active');
        activeVideo.classList.remove('active');

        // Atualiza os índices
        currentIndex = nextIndex;
        nextIndex = (currentIndex + 1) % videoSources.length;

        // Troca as referências
        const temp = activeVideo;
        activeVideo = inactiveVideo;
        inactiveVideo = temp;

        // Dá um tempo para a transição do CSS (1.5s) terminar antes de mudar o src
        setTimeout(() => {
            // Pausa o vídeo anterior que já sumiu da tela e prepara o próximo
            inactiveVideo.pause();
            inactiveVideo.currentTime = 0;
            inactiveVideo.src = videoSources[nextIndex];
            inactiveVideo.load();
        }, 1500); 
    };

    // Adiciona os listeners para ambos os vídeos
    video1.addEventListener('ended', handleVideoEnd);
    video2.addEventListener('ended', handleVideoEnd);
});

/**
 * Motor do Canvas de Radar com Telemetria
 * Malha de radar animada + mockup de celular (via js/radar-phone-widget.js)
 * + partículas de dados de campo, reagindo ao mouse. Compartilhado pela Hero
 * e pelo Trust — cada seção passa sua própria configuração de dimensões,
 * alpha e seletor de obstáculos, já que as duas têm estratégias de
 * dimensionamento diferentes (a Hero cobre a altura total do documento; o
 * Trust fica restrito à própria seção). Carregado via <script src> em
 * index.html antes de qualquer componente montar.
 */
function createRadarCanvasEngine(config) {
    const {
        canvasId,
        sectionId,
        obstacleSelector,
        alpha,
        getWidth,
        getCanvasHeight,
        getRefHeight,
        computePhoneY,
        initialMouseYFactor,
        resizeOnComponentsReady,
        visibilityThreshold
    } = config;

    const canvas = document.getElementById(canvasId);
    const section = document.getElementById(sectionId);
    if (!canvas || !section) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const MOBILE_BREAKPOINT = 600;
    const MAX_DPR = 2;
    const rootStyles = getComputedStyle(document.documentElement);
    const RADAR_ACCENT_RGB = rootStyles.getPropertyValue('--color-orange-rgb').trim();
    const PHONE_BG_RGB = rootStyles.getPropertyValue('--color-dark-surface-rgb').trim();
    const RADAR_WHITE_RGB = '255, 255, 255';
    const FIELD_MARKER_FONT = '600 10.5px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const RADAR_RING_FRACTIONS = [0.0012, 0.25, 0.40, 0.58, 0.76, 0.94, 1.0];
    const RADAR_PULSE_SPEED = 0.0005;
    const RADAR_ALPHA_LERP_FACTOR = 0.04;
    const POINTER_LERP_FACTOR = 9.1;
    const POINTER_IDLE_MS = 1000;
    const PHONE_GLOW_DECAY = 9.02;

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let refHeight = 0;
    let dpr = window.devicePixelRatio || 1;
    let animationFrameId = null;
    let isCanvasVisible = true;
    let isMobile = false;

    const mouse = { x: null, y: null, targetX: null, targetY: null, isNearObstacle: false, hasMoved: false };

    let phoneCenter = { x: 0, y: 0 };
    let phoneDim = { width: 78, height: 142, radius: 14 };
    let phoneSyncGlow = 0;
    let radarAlpha = alpha.base;

    let pulses = [
        { progress: 0.05 },
        { progress: 0.28 },
        { progress: 0.52 },
        { progress: 0.76 }
    ];

    const technicalMetrics = ['6.4', '2.85', '230µm', '215/cm²', '110 L/ha', 'Estável', 'Baixa', '3.0 bar'];
    let metricIndex = 0;

    let phoneTelemetryList = [
        { label: 'pH', value: '6.4' },
        { label: 'Kow', value: '2.85' },
        { label: 'VMD', value: '230µm' },
        { label: 'Vazão', value: '110 L/h' },
        { label: 'Gotas', value: '215/cm²' }
    ];

    let fieldData = [];
    let lastSpawnPos = { x: 0, y: 0 };
    let lastSpawnTime = 0;
    let lastPointerMoveTime = 0;
    let lastWakeGlobalSpawnTime = 0;

    function resizeCanvas() {
        width = getWidth(section);
        height = getCanvasHeight(section);
        refHeight = getRefHeight(section);
        isMobile = width <= MOBILE_BREAKPOINT;
        dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, MAX_DPR);

        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (isMobile) {
            phoneDim = { width: 44, height: 78, radius: 7 };
            phoneCenter.x = 18 + phoneDim.width / 2;
        } else {
            phoneDim = { width: 78, height: 142, radius: 14 };
            phoneCenter.x = 42 + phoneDim.width / 2;
        }
        phoneCenter.y = computePhoneY(refHeight, phoneDim, isMobile);

        if (mouse.x === null) {
            mouse.x = width * 0.5;
            mouse.y = refHeight * initialMouseYFactor;
            mouse.targetX = mouse.x;
            mouse.targetY = mouse.y;
        }
    }

    function spawnWaveWakeData(waveX, waveY, waveAngle) {
        const metric = technicalMetrics[metricIndex % technicalMetrics.length];
        metricIndex++;

        fieldData.push({
            x: waveX,
            y: waveY,
            originX: waveX,
            originY: waveY,
            vx: Math.cos(waveAngle) * 0.12,
            vy: -0.25,
            text: metric,
            fromWake: true,
            life: 1.0,
            decay: 0.0055
        });

        if (fieldData.length > 12) {
            fieldData.shift();
        }
        phoneSyncGlow = 1.0;
    }

    function spawnFieldData(cursorX, cursorY) {
        const metric = technicalMetrics[metricIndex % technicalMetrics.length];
        metricIndex++;

        const angle = Math.random() * Math.PI * 2;
        const dist = 6 + Math.random() * 14;
        const startX = cursorX + Math.cos(angle) * dist;
        const startY = cursorY + Math.sin(angle) * dist;

        fieldData.push({
            x: startX,
            y: startY,
            originX: startX,
            originY: startY,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -0.30 - Math.random() * 0.20,
            text: metric,
            fromWake: false,
            life: 1.0,
            decay: 0.007
        });

        if (fieldData.length > 12) {
            fieldData.shift();
        }
        phoneSyncGlow = 1.0;
    }

    function drawSmartphone(cx, cy, alphaValue) {
        if (!window.drawRadarPhoneWidget) return;
        window.drawRadarPhoneWidget(ctx, {
            cx, cy, alpha: alphaValue, phoneDim, phoneSyncGlow, phoneTelemetryList,
            colors: { accentRgb: RADAR_ACCENT_RGB, bgRgb: PHONE_BG_RGB, whiteRgb: RADAR_WHITE_RGB }
        });
    }

    function updatePointerLerp() {
        if (mouse.targetX === null || mouse.targetY === null) return;
        mouse.x += (mouse.targetX - mouse.x) * POINTER_LERP_FACTOR;
        mouse.y += (mouse.targetY - mouse.y) * POINTER_LERP_FACTOR;
    }

    function updateGlowState() {
        const now = performance.now();
        const isIdle = (now - lastPointerMoveTime > POINTER_IDLE_MS);
        let targetAlpha = isIdle ? alpha.idle : alpha.active;

        if (mouse.isNearObstacle) {
            targetAlpha = alpha.obstacle;
        }

        radarAlpha += (targetAlpha - radarAlpha) * RADAR_ALPHA_LERP_FACTOR;

        if (phoneSyncGlow > 0) {
            phoneSyncGlow = Math.max(0, phoneSyncGlow - PHONE_GLOW_DECAY);
        }
    }

    function drawRadarRings(px, py, radarRadius) {
        for (const frac of RADAR_RING_FRACTIONS) {
            const r = radarRadius * frac;
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${RADAR_ACCENT_RGB}, ${0.20 * radarAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.setLineDash(frac === 1.0 || frac === 0.58 ? [4, 8] : [2, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    function drawRadarPulses(px, py, radarRadius) {
        const now = performance.now();

        for (let i = 0; i < pulses.length; i++) {
            const p = pulses[i];
            p.progress += RADAR_PULSE_SPEED;
            if (p.progress > 1.0) {
                p.progress = 0;
            }

            const pRadius = radarRadius * p.progress;
            let waveAlpha = (1 - p.progress) * 0.70 * radarAlpha;
            if (p.progress < 0.06) {
                waveAlpha *= (p.progress / 0.06);
            }

            const bandWidth = Math.max(10, 24 * (1 - p.progress * 0.3));
            const innerRadius = Math.max(0, pRadius - bandWidth * 0.5);
            const outerRadius = pRadius + bandWidth * 0.5;

            ctx.save();
            const distGrad = ctx.createRadialGradient(px, py, innerRadius, px, py, outerRadius);
            distGrad.addColorStop(0, `rgba(${RADAR_ACCENT_RGB}, 0)`);
            distGrad.addColorStop(0.35, `rgba(${RADAR_ACCENT_RGB}, ${0.04 * waveAlpha})`);
            distGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.08 * waveAlpha})`);
            distGrad.addColorStop(0.65, `rgba(${RADAR_ACCENT_RGB}, ${0.02 * waveAlpha})`);
            distGrad.addColorStop(1, `rgba(${RADAR_ACCENT_RGB}, 0)`);

            ctx.beginPath();
            ctx.arc(px, py, outerRadius, 0, Math.PI * 2);
            ctx.fillStyle = distGrad;
            ctx.fill();
            ctx.restore();

            ctx.beginPath();
            ctx.arc(px, py, pRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${RADAR_ACCENT_RGB}, ${waveAlpha * 0.75})`;
            ctx.lineWidth = Math.max(0.7, 1.3 * (1 - p.progress * 0.5));
            ctx.stroke();
        }

        if (now - lastWakeGlobalSpawnTime > 1200) {
            const activePulses = pulses.filter(p => p.progress >= 0.15 && p.progress <= 0.75);
            if (activePulses.length > 0) {
                const chosenPulse = activePulses[Math.floor(Math.random() * activePulses.length)];
                const pRadius = radarRadius * chosenPulse.progress;

                const angles = [-1.35, -1.10, -0.85, -0.60, -0.35, -0.10, 0.08];
                const angle = angles[Math.floor(Math.random() * angles.length)] + (Math.random() - 0.5) * 0.12;
                const spawnX = px + Math.cos(angle) * pRadius;
                const spawnY = py + Math.sin(angle) * pRadius;

                if (spawnX > 40 && spawnX < width - 60 && spawnY > 60 && spawnY < refHeight - 40) {
                    spawnWaveWakeData(spawnX, spawnY, angle);
                    lastWakeGlobalSpawnTime = now;
                }
            }
        }
    }

    function drawPointerMarker() {
        const markerAlpha = Math.max(0.55, radarAlpha);

        ctx.save();
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 5.0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${RADAR_ACCENT_RGB}, ${0.75 * markerAlpha})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${RADAR_ACCENT_RGB}, ${0.90 * markerAlpha})`;
        ctx.fill();
        ctx.restore();
    }

    function drawFieldMarker(item) {
        let itemOpacity = 1.0;
        if (item.life > 0.8) {
            itemOpacity = (1.0 - item.life) / 0.2;
        } else if (item.life < 0.25) {
            itemOpacity = item.life / 0.25;
        }

        const currentAlpha = itemOpacity * (mouse.isNearObstacle ? 0.55 : 0.90) * radarAlpha;
        if (currentAlpha <= 0.01) return;

        ctx.save();

        if (item.fromWake && item.originY) {
            const wakeAge = 1.0 - item.life;
            if (wakeAge < 0.35) {
                const pingRadius = 2.5 + wakeAge * 18;
                const pingAlpha = (1.0 - wakeAge / 0.35) * 0.55 * currentAlpha;
                ctx.beginPath();
                ctx.arc(item.originX, item.originY, pingRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${RADAR_ACCENT_RGB}, ${pingAlpha})`;
                ctx.lineWidth = 0.7;
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.moveTo(item.originX, item.originY);
            ctx.lineTo(item.x, item.y);
            ctx.strokeStyle = `rgba(${RADAR_ACCENT_RGB}, ${0.22 * currentAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.setLineDash([2, 2]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.arc(item.x, item.y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${RADAR_ACCENT_RGB}, ${0.90 * currentAlpha})`;
        if (!isMobile) {
            ctx.shadowColor = `rgba(${RADAR_ACCENT_RGB}, 0.6)`;
            ctx.shadowBlur = 4;
        }
        ctx.fill();

        ctx.beginPath();
        ctx.arc(item.x, item.y, 5 + (1 - item.life) * 3.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${RADAR_ACCENT_RGB}, ${0.45 * currentAlpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(item.x + 3, item.y);
        ctx.lineTo(item.x + 11, item.y);
        ctx.strokeStyle = `rgba(${RADAR_ACCENT_RGB}, ${0.55 * currentAlpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        ctx.font = FIELD_MARKER_FONT;
        const textMetrics = ctx.measureText(item.text);
        const textWidth = textMetrics.width;
        const pillPaddingH = 5.5;
        const pillHeight = 17;
        const pillX = item.x + 13;
        const pillY = item.y - pillHeight / 2;

        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(pillX, pillY, textWidth + pillPaddingH * 2, pillHeight, 3);
        } else {
            ctx.rect(pillX, pillY, textWidth + pillPaddingH * 2, pillHeight);
        }
        ctx.fillStyle = `rgba(${PHONE_BG_RGB}, ${0.75 * currentAlpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${RADAR_ACCENT_RGB}, ${0.45 * currentAlpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        ctx.fillStyle = `rgba(${RADAR_WHITE_RGB}, ${0.95 * currentAlpha})`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.text, pillX + pillPaddingH, item.y + 0.5);
        ctx.restore();
    }

    function drawFieldMarkers() {
        for (let i = fieldData.length - 1; i >= 0; i--) {
            const item = fieldData[i];
            item.x += item.vx || 0;
            item.y += item.vy || 0;
            item.life -= item.decay;

            if (item.life <= 0) {
                fieldData.splice(i, 1);
                continue;
            }

            drawFieldMarker(item);
        }
    }

    function updateMobileRandomTelemetry() {
        if (width <= MOBILE_BREAKPOINT) {
            const now = performance.now();
            if (now - lastSpawnTime > 2800) {
                const randX = width * (0.15 + Math.random() * 0.7);
                const randY = refHeight * (0.2 + Math.random() * 0.5);
                spawnFieldData(randX, randY);
                lastSpawnPos.x = randX;
                lastSpawnPos.y = randY;
                lastSpawnTime = now;
            }
        }
    }

    function draw() {
        if (!isCanvasVisible) {
            animationFrameId = requestAnimationFrame(draw);
            return;
        }

        ctx.clearRect(0, 0, width, height);
        updatePointerLerp();
        updateGlowState();

        const px = phoneCenter.x;
        const py = phoneCenter.y;
        const radarRadius = Math.hypot(width, height) * 1.25;

        if (radarAlpha > 0.01) {
            drawRadarRings(px, py, radarRadius);
            drawRadarPulses(px, py, radarRadius);

            drawSmartphone(px, py, radarAlpha);

            if (mouse.hasMoved && mouse.x !== null && mouse.y !== null && width > MOBILE_BREAKPOINT) {
                drawPointerMarker();
            }
        }

        drawFieldMarkers();
        updateMobileRandomTelemetry();

        animationFrameId = requestAnimationFrame(draw);
    }

    function onPointerMove(e) {
        if (width <= MOBILE_BREAKPOINT || !isCanvasVisible) return;

        const rect = section.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        if (clientY <= rect.bottom && clientY >= rect.top) {
            lastPointerMoveTime = performance.now();
            mouse.targetX = clientX - rect.left;
            mouse.targetY = clientY - rect.top;
            mouse.hasMoved = true;

            const targetElement = document.elementFromPoint(clientX, clientY);
            if (targetElement) {
                const isObstacle = targetElement.closest(obstacleSelector);
                mouse.isNearObstacle = !!isObstacle || clientY < 80;
            }

            const now = performance.now();
            const distMoved = Math.hypot(mouse.targetX - lastSpawnPos.x, mouse.targetY - lastSpawnPos.y);

            if ((distMoved > 55 && now - lastSpawnTime > 400) && !mouse.isNearObstacle) {
                spawnFieldData(mouse.targetX, mouse.targetY);
                lastSpawnPos.x = mouse.targetX;
                lastSpawnPos.y = mouse.targetY;
                lastSpawnTime = now;
            }
        }
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('resize', resizeCanvas, { passive: true });

    if (resizeOnComponentsReady) {
        window.addEventListener('components:ready', resizeCanvas, { passive: true });
        window.addEventListener('load', resizeCanvas, { passive: true });
    }

    const observer = new IntersectionObserver((entries) => {
        isCanvasVisible = entries[0].isIntersecting;
        if (isCanvasVisible && !animationFrameId) {
            animationFrameId = requestAnimationFrame(draw);
        }
    }, { threshold: visibilityThreshold });
    observer.observe(section);

    resizeCanvas();
    draw();
}

window.createRadarCanvasEngine = createRadarCanvasEngine;

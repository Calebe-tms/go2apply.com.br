/**
 * ==============================================================================
 * Effect: Interactive Radar & Telemetry Smartphone Canvas Effect
 * ------------------------------------------------------------------------------
 * Zero dependências (Vanilla JS Canvas 2D puro).
 * Efeito visual de radar 360°, emissão de dados de telemetria ao mover o mouse ou
 * inclinar o celular (giroscópio), conexão de laser/HUD e sincronização com
 * mini smartphone virtual renderizado no canvas.
 * ==============================================================================
 */

class RadarPhoneEffect {
    /**
     * @param {Object} options Configurações do efeito
     * @param {string|HTMLCanvasElement} options.canvas ID do canvas ou elemento canvas
     * @param {string} [options.brandTitle="Telemetry"] Nome exibido no topo do smartphone
     * @param {string} [options.accentColor="242, 142, 18"] Cor de destaque em formato RGB (ex: '242, 142, 18' ou '#f28e13')
     * @param {string} [options.phoneBg="18, 24, 16"] Cor de fundo do smartphone em formato RGB
     * @param {string} [options.textColor="255, 255, 255"] Cor dos textos em formato RGB
     * @param {Array<string>} [options.metrics] Lista de strings com métricas no formato "Chave: Valor"
     */
    constructor(options = {}) {
        if (typeof options.canvas === 'string') {
            this.canvas = document.getElementById(options.canvas);
        } else {
            this.canvas = options.canvas || document.querySelector('canvas');
        }

        if (!this.canvas) {
            console.error('RadarPhoneEffect: Elemento canvas não encontrado.');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.brandTitle = options.brandTitle || 'go2apply';

        // Cores
        this.accentRgb = this.parseRgb(options.accentColor || '242, 142, 18');
        this.phoneBgRgb = this.parseRgb(options.phoneBg || '18, 24, 16');
        this.textRgb = this.parseRgb(options.textColor || '255, 255, 255');

        // Métricas que aparecem no rastro e na tela do smartphone
        this.metrics = options.metrics || [
            'pH: 6.4',
            'Kow: 2.85',
            'VMD: 230µm',
            'Gotas: 215/cm²',
            'Vazão: 110 L/ha',
            'Calda: Estável',
            'Deriva: Baixa',
            'Pressão: 3.0 bar'
        ];
        this.metricIndex = 0;

        this.phoneTelemetryList = [
            { label: 'pH', value: '6.4' },
            { label: 'Kow', value: '2.85' },
            { label: 'VMD', value: '230µm' },
            { label: 'Vazão', value: '110 L/h' },
            { label: 'Gotas', value: '215/cm²' }
        ];

        // Estado do mouse e física
        this.mouse = {
            x: null,
            y: null,
            targetX: null,
            targetY: null,
            isNearObstacle: false,
            hasMoved: false
        };

        this.phoneCenter = { x: 0, y: 0 };
        this.phoneDim = { width: 78, height: 142, radius: 14 };
        this.phoneSyncGlow = 0;

        this.radarAlpha = 0.4;
        this.radarAngle = -Math.PI * 0.25;

        this.pulses = [
            { progress: 0.1 },
            { progress: 0.45 },
            { progress: 0.8 }
        ];

        this.fieldData = [];
        this.lastSpawnPos = { x: 0, y: 0 };
        this.lastSpawnTime = 0;
        this.lastPointerMoveTime = 0;
        this.lastTilt = { gamma: 0, beta: 0 };

        // Constantes visuais
        this.MOBILE_BREAKPOINT = 600;
        this.MAX_DPR = 2;
        this.RADAR_RING_FRACTIONS = [0.12, 0.25, 0.40, 0.58, 0.76, 0.94, 1.0];
        this.RADAR_ROTATION_SPEED = 0.0038;
        this.RADAR_PULSE_SPEED = 0.0008;
        this.RADAR_ALPHA_LERP_FACTOR = 0.04;
        this.RADAR_ALPHA_IDLE = 0.50;
        this.RADAR_ALPHA_ACTIVE = 0.35;
        this.RADAR_ALPHA_OBSTACLE = 0.20;
        this.POINTER_LERP_FACTOR = 0.1;
        this.POINTER_IDLE_MS = 1000;
        this.POINTER_LINK_MIN_DISTANCE = 70;
        this.PHONE_GLOW_DECAY = 0.02;

        this.animationFrameId = null;
        this.init();
    }

    parseRgb(colorStr) {
        if (!colorStr) return '242, 142, 18';
        if (colorStr.startsWith('#')) {
            const hex = colorStr.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `${r}, ${g}, ${b}`;
        }
        return colorStr;
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, this.MAX_DPR);

        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);

        const isMobile = this.width <= this.MOBILE_BREAKPOINT;
        if (isMobile) {
            this.phoneDim = { width: 44, height: 78, radius: 7 };
            this.phoneCenter.x = Math.max(30, this.width * 0.12);
            this.phoneCenter.y = this.height - 85;
        } else {
            this.phoneDim = { width: 78, height: 142, radius: 14 };
            this.phoneCenter.x = Math.max(95, this.width * 0.09);
            this.phoneCenter.y = Math.min(this.height - 95, this.height * 0.85);
        }

        if (this.mouse.x === null) {
            this.mouse.x = this.width * 0.5;
            this.mouse.y = this.height * 0.38;
            this.mouse.targetX = this.mouse.x;
            this.mouse.targetY = this.mouse.y;
        }
    }

    spawnFieldData(cursorX, cursorY) {
        const metric = this.metrics[this.metricIndex % this.metrics.length];
        this.metricIndex++;

        const angle = Math.random() * Math.PI * 2;
        const dist = 6 + Math.random() * 14;
        const startX = cursorX + Math.cos(angle) * dist;
        const startY = cursorY + Math.sin(angle) * dist;

        this.fieldData.push({
            x: startX,
            y: startY,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -0.32 - Math.random() * 0.28,
            text: metric,
            life: 1.0,
            decay: 0.007
        });

        if (this.fieldData.length > 8) {
            this.fieldData.shift();
        }

        const parts = metric.split(': ');
        if (parts.length === 2) {
            this.phoneTelemetryList.unshift({ label: parts[0], value: parts[1] });
            if (this.phoneTelemetryList.length > 5) {
                this.phoneTelemetryList.pop();
            }
        }
        this.phoneSyncGlow = 1.0;
    }

    drawPhoneFrame(x, y, w, h, r, cx, alpha) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();

        const bgAlpha = (0.42 + this.phoneSyncGlow * 0.15) * alpha;
        ctx.fillStyle = `rgba(${this.phoneBgRgb}, ${bgAlpha})`;
        ctx.fill();

        const borderAlpha = (0.34 + this.phoneSyncGlow * 0.25) * alpha;
        ctx.strokeStyle = `rgba(${this.accentRgb}, ${borderAlpha})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        const notchW = w < 50 ? 11 : 18;
        const notchH = w < 50 ? 2.5 : 3.5;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(cx - notchW / 2, y + (w < 50 ? 3.5 : 5), notchW, notchH, 1.5) : ctx.rect(cx - notchW / 2, y + (w < 50 ? 3.5 : 5), notchW, notchH);
        ctx.fillStyle = `rgba(${this.accentRgb}, ${0.45 * alpha})`;
        ctx.fill();

        const barW = w < 50 ? 13 : 20;
        ctx.beginPath();
        ctx.moveTo(cx - barW / 2, y + h - (w < 50 ? 4.5 : 6));
        ctx.lineTo(cx + barW / 2, y + h - (w < 50 ? 4.5 : 6));
        ctx.strokeStyle = `rgba(${this.textRgb}, ${0.35 * alpha})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
    }

    drawPhoneHeader(x, y, w, screenAlpha) {
        const ctx = this.ctx;
        const isSmall = w < 50;
        ctx.font = isSmall ? '700 5.2px sans-serif' : '700 7.5px sans-serif';
        ctx.fillStyle = `rgba(${this.accentRgb}, ${screenAlpha})`;
        ctx.fillText(this.brandTitle, x + (isSmall ? 4.5 : 8), y + (isSmall ? 11.5 : 19));

        ctx.beginPath();
        ctx.moveTo(x + (isSmall ? 4.5 : 8), y + (isSmall ? 14 : 23));
        ctx.lineTo(x + w - (isSmall ? 4.5 : 8), y + (isSmall ? 14 : 23));
        ctx.strokeStyle = `rgba(${this.textRgb}, ${0.15 * screenAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    drawPhoneTelemetryRows(x, y, w, screenAlpha) {
        const ctx = this.ctx;
        const isSmall = w < 50;
        const startRowY = y + (isSmall ? 22 : 36);
        const rowHeight = isSmall ? 9.5 : 16;
        const maxRows = isSmall ? 4 : this.phoneTelemetryList.length;

        for (let idx = 0; idx < Math.min(maxRows, this.phoneTelemetryList.length); idx++) {
            const row = this.phoneTelemetryList[idx];
            const rowY = startRowY + idx * rowHeight;
            const rowAlpha = (idx === 0 ? 0.95 : Math.max(0.4, 0.75 - idx * 0.08)) * screenAlpha;

            ctx.beginPath();
            ctx.arc(x + (isSmall ? 5.5 : 10), rowY - 1.8, isSmall ? 0.8 : 1.2, 0, Math.PI * 2);
            ctx.fillStyle = idx === 0 ? `rgba(${this.accentRgb}, ${rowAlpha})` : `rgba(${this.textRgb}, ${rowAlpha * 0.5})`;
            ctx.fill();

            ctx.font = isSmall ? '500 4.8px sans-serif' : '500 7px sans-serif';
            ctx.fillStyle = `rgba(${this.textRgb}, ${rowAlpha * 0.7})`;
            ctx.fillText(row.label, x + (isSmall ? 9 : 16), rowY);

            ctx.font = isSmall ? '600 5.2px sans-serif' : '600 7.5px sans-serif';
            ctx.fillStyle = idx === 0 ? `rgba(${this.accentRgb}, ${rowAlpha})` : `rgba(${this.textRgb}, ${rowAlpha * 0.85})`;
            ctx.textAlign = 'right';
            ctx.fillText(row.value, x + w - (isSmall ? 4.5 : 8), rowY);
            ctx.textAlign = 'left';
        }
    }

    drawPhoneFooter(x, y, h, screenAlpha) {
        const ctx = this.ctx;
        const isSmall = this.phoneDim.width < 50;
        ctx.beginPath();
        ctx.arc(x + (isSmall ? 5.5 : 10), y + h - (isSmall ? 7.5 : 14), isSmall ? 1.0 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.accentRgb}, ${screenAlpha})`;
        ctx.fill();

        ctx.font = isSmall ? '500 4.5px sans-serif' : '500 6.5px sans-serif';
        ctx.fillStyle = `rgba(${this.accentRgb}, ${0.75 * screenAlpha})`;
        ctx.fillText('SYNC OK', x + (isSmall ? 8.5 : 15), y + h - (isSmall ? 6.2 : 12.5));
    }

    drawSmartphone(cx, cy, alpha) {
        const w = this.phoneDim.width;
        const h = this.phoneDim.height;
        const r = this.phoneDim.radius;
        const x = cx - w / 2;
        const y = cy - h / 2;
        const screenAlpha = (0.75 + this.phoneSyncGlow * 0.15) * alpha;

        this.ctx.save();
        this.drawPhoneFrame(x, y, w, h, r, cx, alpha);
        this.drawPhoneHeader(x, y, w, screenAlpha);
        this.drawPhoneTelemetryRows(x, y, w, screenAlpha);
        this.drawPhoneFooter(x, y, h, screenAlpha);
        this.ctx.restore();
    }

    drawRadarRings(px, py, radarRadius) {
        const ctx = this.ctx;
        for (const frac of this.RADAR_RING_FRACTIONS) {
            const r = radarRadius * frac;
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${this.accentRgb}, ${0.1 * this.radarAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.setLineDash(frac === 1.0 || frac === 0.58 ? [4, 8] : [2, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    drawRadarPulses(px, py, radarRadius) {
        const ctx = this.ctx;
        for (let i = 0; i < this.pulses.length; i++) {
            const p = this.pulses[i];
            p.progress += this.RADAR_PULSE_SPEED;
            if (p.progress > 1.0) p.progress = 0;

            const pRadius = radarRadius * p.progress;
            const pAlpha = (1 - p.progress) * 0.28 * this.radarAlpha;

            ctx.beginPath();
            ctx.arc(px, py, pRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${this.accentRgb}, ${pAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
        }
    }

    drawRadarSweep(px, py, radarRadius) {
        const ctx = this.ctx;
        ctx.save();
        const lineGrad = ctx.createLinearGradient(
            px, py,
            px + Math.cos(this.radarAngle) * radarRadius,
            py + Math.sin(this.radarAngle) * radarRadius
        );
        lineGrad.addColorStop(0, `rgba(${this.accentRgb}, ${0.52 * this.radarAlpha})`);
        lineGrad.addColorStop(0.35, `rgba(${this.accentRgb}, ${0.28 * this.radarAlpha})`);
        lineGrad.addColorStop(0.75, `rgba(${this.accentRgb}, ${0.1 * this.radarAlpha})`);
        lineGrad.addColorStop(1, `rgba(${this.accentRgb}, 0)`);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(this.radarAngle) * radarRadius, py + Math.sin(this.radarAngle) * radarRadius);
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 0.85;
        ctx.stroke();
        ctx.restore();
    }

    drawPointerLink(px, py) {
        const ctx = this.ctx;
        const anchorY = py - this.phoneDim.height / 2 + 5;
        const distToPhone = Math.hypot(this.mouse.x - px, this.mouse.y - anchorY);
        if (distToPhone <= this.POINTER_LINK_MIN_DISTANCE) return;

        const linkAlpha = Math.max(0.65, this.radarAlpha);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.mouse.x, this.mouse.y);
        ctx.lineTo(px, anchorY);
        ctx.strokeStyle = `rgba(${this.accentRgb}, ${0.48 * linkAlpha})`;
        ctx.lineWidth = 1.1;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(px, anchorY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.accentRgb}, ${0.9 * linkAlpha})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.mouse.x, this.mouse.y, 5.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${this.accentRgb}, ${0.85 * linkAlpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.mouse.x, this.mouse.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.accentRgb}, ${0.95 * linkAlpha})`;
        ctx.fill();
        ctx.restore();
    }

    drawFieldMarker(item) {
        const ctx = this.ctx;
        let itemOpacity = 1.0;
        if (item.life > 0.8) {
            itemOpacity = (1.0 - item.life) / 0.2;
        } else if (item.life < 0.3) {
            itemOpacity = item.life / 0.3;
        }

        const currentAlpha = itemOpacity * (this.mouse.isNearObstacle ? 0.35 : 0.95) * this.radarAlpha;

        ctx.save();
        ctx.beginPath();
        ctx.arc(item.x, item.y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.accentRgb}, ${0.95 * currentAlpha})`;
        ctx.shadowColor = `rgba(${this.accentRgb}, 0.7)`;
        ctx.shadowBlur = 6;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(item.x, item.y, 6 + (1 - item.life) * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${this.accentRgb}, ${0.45 * currentAlpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(item.x + 4, item.y);
        ctx.lineTo(item.x + 12, item.y);
        ctx.strokeStyle = `rgba(${this.accentRgb}, ${0.5 * currentAlpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        ctx.font = '600 10.5px sans-serif';
        ctx.fillStyle = `rgba(${this.textRgb}, ${0.9 * currentAlpha})`;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(item.text, item.x + 16, item.y + 3.5);
        ctx.restore();
    }

    drawFieldMarkers() {
        for (let i = this.fieldData.length - 1; i >= 0; i--) {
            const item = this.fieldData[i];
            item.x += item.vx || 0;
            item.y += item.vy || 0;
            item.life -= item.decay;

            if (item.life <= 0) {
                this.fieldData.splice(i, 1);
                continue;
            }

            this.drawFieldMarker(item);
        }
    }

    updateMobileAutoTelemetry() {
        if (this.width <= this.MOBILE_BREAKPOINT) {
            const now = performance.now();
            if (now - this.lastSpawnTime > 1800 && !this.mouse.isNearObstacle) {
                const randomX = this.width * (0.2 + Math.random() * 0.6);
                const randomY = this.height * (0.25 + Math.random() * 0.45);
                this.mouse.targetX = randomX;
                this.mouse.targetY = randomY;
                this.mouse.hasMoved = true;
                this.spawnFieldData(randomX, randomY);
                this.lastSpawnPos.x = randomX;
                this.lastSpawnPos.y = randomY;
                this.lastSpawnTime = now;
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.mouse.targetX !== null && this.mouse.targetY !== null) {
            this.mouse.x += (this.mouse.targetX - this.mouse.x) * this.POINTER_LERP_FACTOR;
            this.mouse.y += (this.mouse.targetY - this.mouse.y) * this.POINTER_LERP_FACTOR;
        }

        const now = performance.now();
        const isIdle = (now - this.lastPointerMoveTime > this.POINTER_IDLE_MS);
        let targetAlpha = isIdle ? this.RADAR_ALPHA_IDLE : this.RADAR_ALPHA_ACTIVE;

        if (this.mouse.isNearObstacle) {
            targetAlpha = this.RADAR_ALPHA_OBSTACLE;
        }

        this.radarAlpha += (targetAlpha - this.radarAlpha) * this.RADAR_ALPHA_LERP_FACTOR;

        if (this.phoneSyncGlow > 0) {
            this.phoneSyncGlow = Math.max(0, this.phoneSyncGlow - this.PHONE_GLOW_DECAY);
        }

        const px = this.phoneCenter.x;
        const py = this.phoneCenter.y;
        const radarRadius = Math.hypot(this.width, this.height) * 1.25;

        if (this.radarAlpha > 0.01) {
            this.drawRadarRings(px, py, radarRadius);
            this.drawRadarPulses(px, py, radarRadius);
            this.radarAngle += this.RADAR_ROTATION_SPEED;
            this.drawRadarSweep(px, py, radarRadius);
            this.drawSmartphone(px, py, this.radarAlpha);

            if (this.mouse.hasMoved && this.mouse.x !== null && this.mouse.y !== null) {
                this.drawPointerLink(px, py);
            }
        }

        this.drawFieldMarkers();
        this.updateMobileAutoTelemetry();

        this.animationFrameId = requestAnimationFrame(() => this.draw());
    }

    init() {
        const onPointerMove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            if (clientY <= rect.bottom && clientY >= rect.top) {
                this.lastPointerMoveTime = performance.now();
                this.mouse.targetX = clientX - rect.left;
                this.mouse.targetY = clientY - rect.top;
                this.mouse.hasMoved = true;

                const targetElement = document.elementFromPoint(clientX, clientY);
                if (targetElement) {
                    const isObstacle = targetElement.closest('a, button, input, select, textarea, h1, h2, h3, p');
                    this.mouse.isNearObstacle = !!isObstacle || clientY < 80;
                }

                const now = performance.now();
                const distMoved = Math.hypot(this.mouse.targetX - this.lastSpawnPos.x, this.mouse.mouseY - this.lastSpawnPos.y);

                if ((distMoved > 55 && now - this.lastSpawnTime > 400) && !this.mouse.isNearObstacle) {
                    this.spawnFieldData(this.mouse.targetX, this.mouse.targetY);
                    this.lastSpawnPos.x = this.mouse.targetX;
                    this.lastSpawnPos.y = this.mouse.targetY;
                    this.lastSpawnTime = now;
                }
            }
        };

        const onDeviceOrientation = (e) => {
            if (e.gamma === null && e.beta === null) return;
            const gamma = Math.max(-35, Math.min(35, e.gamma || 0));
            const beta = Math.max(15, Math.min(65, e.beta || 0));

            const targetX = this.width * (0.5 + (gamma / 70));
            const targetY = this.height * (0.28 + ((beta - 20) / 60));

            const dTilt = Math.hypot(gamma - this.lastTilt.gamma, beta - this.lastTilt.beta);
            this.lastTilt.gamma = gamma;
            this.lastTilt.beta = beta;

            this.lastPointerMoveTime = performance.now();
            this.mouse.targetX = targetX;
            this.mouse.targetY = targetY;
            this.mouse.hasMoved = true;

            const now = performance.now();
            const distMoved = Math.hypot(targetX - this.lastSpawnPos.x, targetY - this.lastSpawnPos.y);

            if ((distMoved > 40 && now - this.lastSpawnTime > 400 || dTilt > 2.5 && now - this.lastSpawnTime > 450) && !this.mouse.isNearObstacle) {
                this.spawnFieldData(targetX, targetY);
                this.lastSpawnPos.x = targetX;
                this.lastSpawnPos.y = targetY;
                this.lastSpawnTime = now;
            }
        };

        window.addEventListener('mousemove', onPointerMove, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchstart', onPointerMove, { passive: true });
        window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });

        const onResize = () => this.resize();
        window.addEventListener('resize', onResize, { passive: true });

        this.resize();
        this.draw();
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}

if (typeof window !== 'undefined') {
    window.RadarPhoneEffect = RadarPhoneEffect;
}

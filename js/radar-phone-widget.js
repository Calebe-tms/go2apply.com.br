/**
 * Widget do Mockup de Celular com Telemetria
 * Desenho compartilhado do smartphone com dados técnicos animados, usado
 * pelos canvases de radar da Hero e do Trust — mesmo desenho exato, cada
 * seção mantém seu próprio estado (posição, glow, lista de telemetria).
 * Carregado via <script src> em index.html antes de qualquer componente
 * montar, então window.drawRadarPhoneWidget já existe quando precisam dele.
 */
function drawRadarPhoneWidget(ctx, state) {
    const { cx, cy, alpha, phoneDim, phoneSyncGlow, phoneTelemetryList, colors } = state;
    const RADAR_ACCENT_RGB = colors.accentRgb;
    const PHONE_BG_RGB = colors.bgRgb;
    const RADAR_WHITE_RGB = colors.whiteRgb;

    const PHONE_FONT_TITLE = '700 7.5px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const PHONE_FONT_LABEL = '500 7px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const PHONE_FONT_VALUE = '600 7.5px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const PHONE_FONT_FOOTER = '500 6.5px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    function drawPhoneFrame(x, y, w, h, r, phoneCx, frameAlpha) {
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

        const bgAlpha = (0.40 + phoneSyncGlow * 0.15) * frameAlpha;
        ctx.fillStyle = `rgba(${PHONE_BG_RGB}, ${bgAlpha})`;
        ctx.fill();

        const borderAlpha = (0.35 + phoneSyncGlow * 0.20) * frameAlpha;
        ctx.strokeStyle = `rgba(${RADAR_ACCENT_RGB}, ${borderAlpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        const notchW = w < 50 ? 11 : 18;
        const notchH = w < 50 ? 2.5 : 3.5;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(phoneCx - notchW / 2, y + (w < 50 ? 3.5 : 5), notchW, notchH, 1.5);
        } else {
            ctx.rect(phoneCx - notchW / 2, y + (w < 50 ? 3.5 : 5), notchW, notchH);
        }
        ctx.fillStyle = `rgba(${RADAR_ACCENT_RGB}, ${0.45 * frameAlpha})`;
        ctx.fill();

        const barW = w < 50 ? 13 : 20;
        ctx.beginPath();
        ctx.moveTo(phoneCx - barW / 2, y + h - (w < 50 ? 4.5 : 6));
        ctx.lineTo(phoneCx + barW / 2, y + h - (w < 50 ? 4.5 : 6));
        ctx.strokeStyle = `rgba(${RADAR_WHITE_RGB}, ${0.40 * frameAlpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }

    function drawPhoneHeader(x, y, w, screenAlpha) {
        const isSmall = w < 50;
        ctx.font = isSmall ? '700 5.2px "Host Grotesk", sans-serif' : (w < 65 ? '700 6px "Host Grotesk", sans-serif' : PHONE_FONT_TITLE);
        ctx.fillStyle = `rgba(${RADAR_ACCENT_RGB}, ${screenAlpha})`;
        ctx.fillText('go2apply', x + (isSmall ? 4.5 : 8), y + (isSmall ? 11.5 : 19));

        ctx.beginPath();
        ctx.moveTo(x + (isSmall ? 4.5 : 8), y + (isSmall ? 14 : 23));
        ctx.lineTo(x + w - (isSmall ? 4.5 : 8), y + (isSmall ? 14 : 23));
        ctx.strokeStyle = `rgba(${RADAR_WHITE_RGB}, ${0.15 * screenAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    function drawPhoneTelemetryRows(x, y, w, screenAlpha) {
        const isSmall = w < 50;
        const startRowY = y + (isSmall ? 22 : 36);
        const rowHeight = isSmall ? 9.5 : 16;
        const maxRows = isSmall ? 4 : phoneTelemetryList.length;

        for (let idx = 0; idx < Math.min(maxRows, phoneTelemetryList.length); idx++) {
            const row = phoneTelemetryList[idx];
            const rowY = startRowY + idx * rowHeight;
            const rowAlpha = (idx === 0 ? 0.95 : Math.max(0.4, 0.75 - idx * 0.08)) * screenAlpha;

            ctx.beginPath();
            ctx.arc(x + (isSmall ? 5.5 : 10), rowY - 1.8, isSmall ? 0.8 : 1.2, 0, Math.PI * 2);
            ctx.fillStyle = idx === 0 ? `rgba(${RADAR_ACCENT_RGB}, ${rowAlpha})` : `rgba(${RADAR_WHITE_RGB}, ${rowAlpha * 0.5})`;
            ctx.fill();

            ctx.font = isSmall ? '500 4.8px "Host Grotesk", sans-serif' : (w < 65 ? '500 5.5px "Host Grotesk", sans-serif' : PHONE_FONT_LABEL);
            ctx.fillStyle = `rgba(${RADAR_WHITE_RGB}, ${rowAlpha * 0.7})`;
            ctx.fillText(row.label, x + (isSmall ? 9 : 16), rowY);

            ctx.font = isSmall ? '600 5.2px "Host Grotesk", sans-serif' : (w < 65 ? '600 6px "Host Grotesk", sans-serif' : PHONE_FONT_VALUE);
            ctx.fillStyle = idx === 0 ? `rgba(${RADAR_ACCENT_RGB}, ${rowAlpha})` : `rgba(${RADAR_WHITE_RGB}, ${rowAlpha * 0.85})`;
            ctx.textAlign = 'right';
            ctx.fillText(row.value, x + w - (isSmall ? 4.5 : 8), rowY);
            ctx.textAlign = 'left';
        }
    }

    function drawPhoneFooter(x, y, h, screenAlpha) {
        const isSmall = phoneDim.width < 50;
        ctx.beginPath();
        ctx.arc(x + (isSmall ? 5.5 : 10), y + h - (isSmall ? 7.5 : 14), isSmall ? 1.0 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${RADAR_ACCENT_RGB}, ${screenAlpha})`;
        ctx.fill();

        ctx.font = isSmall ? '500 4.5px "Host Grotesk", sans-serif' : (phoneDim.width < 65 ? '500 5px "Host Grotesk", sans-serif' : PHONE_FONT_FOOTER);
        ctx.fillStyle = `rgba(${RADAR_ACCENT_RGB}, ${0.75 * screenAlpha})`;
        ctx.fillText('SYNC OK', x + (isSmall ? 8.5 : 15), y + h - (isSmall ? 6.2 : 12.5));
    }

    const w = phoneDim.width;
    const h = phoneDim.height;
    const r = phoneDim.radius;
    const x = cx - w / 2;
    const y = cy - h / 2;
    const screenAlpha = (0.75 + phoneSyncGlow * 0.15) * alpha;

    ctx.save();
    drawPhoneFrame(x, y, w, h, r, cx, alpha);
    drawPhoneHeader(x, y, w, screenAlpha);
    drawPhoneTelemetryRows(x, y, w, screenAlpha);
    drawPhoneFooter(x, y, h, screenAlpha);
    ctx.restore();
}

window.drawRadarPhoneWidget = drawRadarPhoneWidget;

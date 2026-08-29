# 📦 Effects Export — go2apply

Biblioteca de efeitos visuais e interativos exportáveis para reutilização em outros sites e aplicações (HTML puro, React, Next.js, Vue, etc.).

---

## 📱 1. Radar & Telemetry Smartphone Effect (`effects-export/radar-telemetry-phone/`)

Um efeito em Canvas 2D nativo (Vanilla JS) que cria:
- **Radar circular de 360° com ondas de varredura e pulso**
- **Mini-smartphone HUD renderizado no canvas** com telemetria em tempo real
- **Rastro de dados técnicos dinâmicos** que nascem no movimento do mouse ou giroscópio do celular
- **Linha de conexão laser HUD** entre o cursor e o topo do mini smartphone
- **Compatibilidade total com telas de alta resolução (Retina/DPR) e mobile**

---

### 🚀 Como Usar em Outro Site:

#### 1. Estrutura HTML:
```html
<section style="position: relative; width: 100%; min-height: 100vh; overflow: hidden; background: #121810;">
    <!-- O Canvas deve ficar posicionado com absolute e pointer-events: none -->
    <canvas id="meu-radar-canvas" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5;"></canvas>

    <!-- Seu conteúdo (deve ter z-index maior para cliques funcionarem) -->
    <div style="position: relative; z-index: 10;">
        <h1>Título do Meu Site</h1>
    </div>
</section>
```

#### 2. Importar o Script e Inicializar:
```html
<script src="radar-phone-effect.js"></script>
<script>
    const radar = new RadarPhoneEffect({
        canvas: 'meu-radar-canvas', // ID do elemento <canvas>
        brandTitle: 'MeuApp',       // Nome exibido no topo do mini celular
        accentColor: '#f28e13',     // Cor de destaque (Hex ou RGB)
        phoneBg: '#121810',         // Cor de fundo do celular
        textColor: '#ffffff',       // Cor do texto
        metrics: [                  // Lista de dados técnicos que aparecem no rastro
            'CPU: 12%',
            'RAM: 4.2 GB',
            'Ping: 18ms',
            'Status: Online'
        ]
    });
</script>
```

---

### ⚙️ Opções Disponíveis na Inicialização (`RadarPhoneEffect`):

| Opção | Tipo | Padrão | Descrição |
| :--- | :--- | :--- | :--- |
| `canvas` | `string` ou `HTMLCanvasElement` | `null` | **(Obrigatório)** ID ou elemento `<canvas>` |
| `brandTitle` | `string` | `'go2apply'` | Nome no topo do mini-smartphone |
| `accentColor` | `string` | `'#f28e13'` | Cor primária dos radares, lasers e destaques |
| `phoneBg` | `string` | `'#121810'` | Cor de fundo da carcaça do mini celular |
| `textColor` | `string` | `'#ffffff'` | Cor dos textos de métricas |
| `metrics` | `Array<string>` | `[...]` | Lista de strings no formato `"Chave: Valor"` |

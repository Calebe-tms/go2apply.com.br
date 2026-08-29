# 🎨 Feature Icons — Guia de Uso

Arquivo: `assets/icos/features-icons.svg`

Contém 13 ícones escaláveis usando `currentColor` para mudar de cor facilmente.

---

## 📋 Ícones Disponíveis

| ID SVG | Nome | Descrição |
|--------|------|-----------|
| `icon-caldas` | Formação de Caldas | Beaker/frasco |
| `icon-alerta` | Alertas de Incompatibilidade | Triangle com ponto de exclamação |
| `icon-kow` | KOW & pH | Folha com veia central |
| `icon-gotas` | Dimensionamento de Gotas | Gota de água |
| `icon-delta-t` | Delta T | Termômetro |
| `icon-pressao` | Pressão e Vazão | Gauge/medidor |
| `icon-fluxometro` | Fluxômetro | Gauge com agulha |
| `icon-calibracao` | Calibração | Chave inglesa |
| `icon-uniformidade` | Uniformidade e Desgaste | Gráfico de barras |
| `icon-relatorios` | Relatórios | Documento com linhas |
| `icon-comunidade` | Comunidade | Dois usuários |
| `icon-sistema` | Sistema de Cálculos | Sliders/settings |
| `icon-telegram` | Telegram | Avião de papel |

---

## 💻 Como Usar

### Opção 1: Inline SVG (Melhor para cores dinâmicas)

```html
<svg class="feature-icon" style="color: #5b8c45;">
  <use href="/assets/icos/features-icons.svg#icon-caldas"></use>
</svg>
```

### Opção 2: CSS com Background

```css
.icon-caldas {
  background: url('assets/icos/features-icons.svg#icon-caldas') no-repeat center;
  background-size: 100%;
  width: 2.5rem;
  height: 2.5rem;
  color: #5b8c45; /* Não funciona em background-image puro, usar filter */
  filter: invert(0.5) hue-rotate(120deg); /* Alternativa: manipular com filters */
}
```

### Opção 3: SVG como Componente (RECOMENDADO ✅)

```html
<!-- HTML -->
<div class="feature-card">
  <svg class="feature-icon" viewBox="0 0 50 50">
    <use href="/assets/icos/features-icons.svg#icon-caldas"></use>
  </svg>
  <h3>Formação de Caldas</h3>
  <p>Com ordem e metodologia</p>
</div>
```

```css
/* CSS */
.feature-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-green, #5b8c45);
}

.feature-card:hover .feature-icon {
  color: var(--color-orange, #f28e13);
  transition: color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 🎨 Cores Sugeridas

### Design System go2apply

```
Verde Principal:     #5b8c45 (--color-green)
Laranja Destaque:    #f28e13 (--color-orange)
Branco:              #fefcf8 (--color-white)
Dark/Background:     #1a1e14 (--color-dark)
Cinza:               #8b8b8b (--color-gray)
```

### Exemplo com Tema

```css
/* Light Mode */
.feature-card {
  --icon-color: #5b8c45;
}

.feature-card:hover {
  --icon-color: #f28e13;
}

.feature-icon {
  color: var(--icon-color);
}

/* Dark Mode (já padrão no go2apply) */
.hero-section .feature-icon {
  color: #86efac; /* Green lighter para dark mode */
}
```

---

## 📐 Tamanhos Recomendados

```css
/* Small (labels, inline) */
.icon-sm {
  width: 1.25rem;   /* 20px */
  height: 1.25rem;
}

/* Medium (cards) */
.icon-md {
  width: 2.5rem;    /* 40px */
  height: 2.5rem;
}

/* Large (sections) */
.icon-lg {
  width: 3.5rem;    /* 56px */
  height: 3.5rem;
}

/* Extra Large (hero) */
.icon-xl {
  width: 4.5rem;    /* 72px */
  height: 4.5rem;
}
```

---

## 🚀 Uso em Grid de Features

```html
<div class="features-grid">
  <div class="feature-card">
    <svg class="feature-icon" viewBox="0 0 50 50">
      <use href="/assets/icos/features-icons.svg#icon-caldas"></use>
    </svg>
    <h3>Formação de Caldas</h3>
    <p>Com ordem e metodologia</p>
  </div>
  
  <div class="feature-card">
    <svg class="feature-icon" viewBox="0 0 50 50">
      <use href="/assets/icos/features-icons.svg#icon-alerta"></use>
    </svg>
    <h3>Alertas de Incompatibilidade</h3>
    <p>Previne desperdício</p>
  </div>
  
  <!-- Repetir para os 13 ícones -->
</div>
```

```css
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.feature-card:hover {
  background: rgba(91, 140, 69, 0.1);
  border-color: rgba(91, 140, 69, 0.4);
  transform: translateY(-4px);
}

.feature-icon {
  width: 2.5rem;
  height: 2.5rem;
  margin: 0 auto 1rem;
  color: var(--color-green, #5b8c45);
}

.feature-card:hover .feature-icon {
  color: var(--color-orange, #f28e13);
}

.feature-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--color-white);
}

.feature-card p {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}
```

---

## 🔧 Personalização

### Mudar Stroke Width (espessura)

Se precisar de ícones mais finos ou mais grossos, edite diretamente o arquivo SVG:

```xml
<!-- Original (2.5) -->
<path stroke-width="2.5" ... />

<!-- Mais fino (1.5) -->
<path stroke-width="1.5" ... />

<!-- Mais grosso (3.5) -->
<path stroke-width="3.5" ... />
```

### Usar com Backdrop Filter

```css
.feature-icon {
  color: var(--color-green);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}
```

---

## ✅ Checklist para Implementação

- [ ] Incluir `assets/icos/features-icons.svg` no projeto
- [ ] Criar componente FeatureCard com HTML padrão
- [ ] Aplicar CSS de grid e hover
- [ ] Testar responsividade (768px, 600px)
- [ ] Validar contraste de cores (WCAG AA)
- [ ] Testar em dark mode
- [ ] Adicionar animações ao scroll (opcional)

---

## 📚 Referências

- **SVG `<use>` reference**: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use
- **currentColor**: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentcolor
- **Accessible SVGs**: https://www.w3.org/WAI/tutorials/images/
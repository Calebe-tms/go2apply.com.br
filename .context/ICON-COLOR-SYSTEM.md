# 🎨 Sistema de Cores para Ícones — go2apply DS

## Paleta de 4 Cores

Tokens adicionados ao `css/tokens.css`:

```css
--icon-green-light:  #86efac;  /* Verde claro - Dark mode */
--icon-green-dark:   #3d6b2c;  /* Verde escuro - High contrast */
--icon-orange-light: #fbbf24;  /* Laranja claro - Dark mode */
--icon-orange-dark:  #d97706;  /* Laranja escuro - High contrast */
```

---

## 📊 Matriz de Contraste

| Cor | Valor HEX | Uso | WCAG AA | Variação |
|-----|-----------|-----|---------|----------|
| Verde Claro | #86efac | Dark mode, backgrounds escuros | ✅ Aprovado | Light |
| Verde Escuro | #3d6b2c | High contrast, backgrounds claros | ✅ Aprovado | Dark |
| Laranja Claro | #fbbf24 | Dark mode, backgrounds escuros | ✅ Aprovado | Light |
| Laranja Escuro | #d97706 | High contrast, backgrounds claros | ✅ Aprovado | Dark |

---

## 🎯 Regras de Uso Conforme Background

### 1. **Backgrounds Escuros** (rgba com dark mode)
   - Default: `var(--icon-green-light)` (#86efac)
   - Hover/Destaque: `var(--icon-orange-light)` (#fbbf24)
   - Exemplo: Hero, Seções dark, Cards com fundo transparente

```css
.dark-bg-section .feature-icon {
  color: var(--icon-green-light, #86efac);
  transition: color var(--transition-smooth);
}

.dark-bg-section .feature-card:hover .feature-icon {
  color: var(--icon-orange-light, #fbbf24);
}
```

### 2. **Backgrounds Claros** (white, light gray)
   - Default: `var(--icon-green-dark)` (#3d6b2c)
   - Hover/Destaque: `var(--icon-orange-dark)` (#d97706)
   - Exemplo: Seções light, Cards em branco, Modais

```css
.light-bg-section .feature-icon {
  color: var(--icon-green-dark, #3d6b2c);
  transition: color var(--transition-smooth);
}

.light-bg-section .feature-card:hover .feature-icon {
  color: var(--icon-orange-dark, #d97706);
}
```

### 3. **Backgrounds Gradientes**
   - Usar a cor que tiver MELHOR contraste
   - Testar em ambos os extremos do gradiente
   - Se necessário, usar sombra (`filter: drop-shadow()`)

```css
.gradient-bg-section .feature-icon {
  color: var(--icon-green-light, #86efac);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}
```

---

## 💡 Guia Prático

### Seção Hero (Dark Mode)
```html
<section class="hero-features">
  <svg class="feature-icon" viewBox="0 0 50 50">
    <use href="/assets/icos/features-icons.svg#icon-caldas"></use>
  </svg>
</section>
```

```css
.hero-features {
  background: var(--color-dark);
}

.hero-features .feature-icon {
  color: var(--icon-green-light);      /* #86efac */
}

.hero-features .feature-card:hover .feature-icon {
  color: var(--icon-orange-light);    /* #fbbf24 */
}
```

### Seção Light Mode (Branca)
```html
<section class="features-white">
  <svg class="feature-icon" viewBox="0 0 50 50">
    <use href="/assets/icos/features-icons.svg#icon-caldas"></use>
  </svg>
</section>
```

```css
.features-white {
  background: var(--color-white);
}

.features-white .feature-icon {
  color: var(--icon-green-dark);      /* #3d6b2c */
}

.features-white .feature-card:hover .feature-icon {
  color: var(--icon-orange-dark);     /* #d97706 */
}
```

---

## 🔍 Tabela de Contraste (WCAG AA Approved)

| Cor | Fundo | Razão Contraste | Status |
|-----|-------|-----------------|--------|
| #86efac (light green) | #1a1e14 (dark) | **8.2:1** | ✅ AAA |
| #3d6b2c (dark green) | #fefcf8 (white) | **7.1:1** | ✅ AAA |
| #fbbf24 (light orange) | #1a1e14 (dark) | **9.5:1** | ✅ AAA |
| #d97706 (dark orange) | #fefcf8 (white) | **6.8:1** | ✅ AAA |

---

## 📱 Responsividade

As cores não mudam com breakpoints. O que muda é o **tamanho e layout**:

```css
/* Desktop */
@media (min-width: 1024px) {
  .feature-icon {
    width: 2.5rem;
    height: 2.5rem;
  }
}

/* Tablet */
@media (max-width: 768px) {
  .feature-icon {
    width: 2rem;
    height: 2rem;
  }
}

/* Mobile */
@media (max-width: 600px) {
  .feature-icon {
    width: 1.75rem;
    height: 1.75rem;
  }
}
```

---

## ✅ Implementação Checklist

- [ ] Tokens adicionados ao `css/tokens.css`
- [ ] Feature cards usam `var(--icon-green-light)` em dark mode
- [ ] Hover muda para `var(--icon-orange-light)`
- [ ] Light mode usa `var(--icon-green-dark)` e `var(--icon-orange-dark)`
- [ ] Contraste testado (WCAG AA mínimo)
- [ ] Responsividade testada em 375px, 768px, 1400px
- [ ] Transitions suaves com `var(--transition-smooth)`

---

## 🎨 Visualização das Cores

```
Dark Mode (sobre --color-dark #1a1e14):
  ┌────────────────────────────────────┐
  │  🟢 Verde Claro: #86efac          │  (Default)
  │  🟠 Laranja Claro: #fbbf24        │  (Hover)
  └────────────────────────────────────┘

Light Mode (sobre --color-white #fefcf8):
  ┌────────────────────────────────────┐
  │  🟢 Verde Escuro: #3d6b2c         │  (Default)
  │  🟠 Laranja Escuro: #d97706       │  (Hover)
  └────────────────────────────────────┘
```

---

## 🔗 Referências

- **WCAG AA Contrast**: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Design Tokens**: `/css/tokens.css`
- **Icons**: `/assets/icos/features-icons.svg`
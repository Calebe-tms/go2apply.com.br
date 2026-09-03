# Arquitetura do Sistema: Tokens, Componentes Globais e Dobras (go2apply)

Este documento descreve a arquitetura do projeto **go2apply**, baseada no princípio de componentização de arquivo único (*Single-File Components - SFC*) executada nativamente pelo navegador através de um **Micro-Loader**, sem necessidade de Node.js, compiladores, Webpack ou Vite.

---

## 🏛️ A Filosofia: Três Camadas de Abstração

```
┌────────────────────────────────────────────────────────┐
│ 1. TOKENS (css/tokens.css)                             │
│    Fundações do Design System: Cores, Fontes,          │
│    Espaçamentos, Sombras, Blur e Transições.           │
└───────────────────────────┬────────────────────────────┘
                            │ alimentam
┌───────────────────────────▼────────────────────────────┐
│ 2. COMPONENTES GLOBAIS (components/*/*.html)           │
│    Blocos reutilizáveis do Design System e widgets     │
│    globais (botões, drawers, header, floaters).       │
└───────────────────────────┬────────────────────────────┘
                            │ compõem
┌───────────────────────────▼────────────────────────────┐
│ 3. DOBRAS / SEÇÕES (sections/*/*.html & index.html)    │
│    Dobra auto-contida orquestradora com seus           │
│    subcomponentes exclusivos locais.                   │
└────────────────────────────────────────────────────────┘
```

---

## 📏 Regra de Padronização 1:1

Todos os componentes e dobras seguem estritamente a convenção de correspondência 1:1:

$$\text{Pasta} \equiv \text{Arquivo} \equiv \text{Classe CSS Raiz} \equiv \text{ID Raiz}$$

- **Componente Global:** `components/<nome>/<nome>.html` com `<tag class="<nome>" id="<nome>">`
- **Dobra (Seção):** `sections/<secao>/<secao>.html` com `<section class="<secao>" id="<secao>">`
- **Subcomponente de Dobra:** `sections/<secao>/<subcomponente>/<subcomponente>.html` com `<div class="<subcomponente>" id="<subcomponente>">`
- **Casing:** Sempre `kebab-case` minúsculo.

---

## 📂 Estrutura de Pastas

```
go2apply.com.br/
│
├── .context/
│   ├── ARCHITECTURE.md                 # Este documento de referência
│   ├── DESIGN_SYSTEM.md                # Diretrizes de design tokens e UI
│   └── FORMULARIO_CADASTRO_UX.md       # Especificações do fluxo de autenticação e Drawer
│
├── css/
│   ├── tokens.css                      # Design Tokens em variáveis CSS (:root)
│   ├── reset.css                       # Resets essenciais, fontes e scroll suave
│   └── style.css                       # Ponto de entrada CSS unificado
│
├── components/                         # 1. COMPONENTES GLOBAIS REUTILIZÁVEIS
│   ├── auth-drawer/
│   │   └── auth-drawer.html            # Gaveta global de login/cadastro (.auth-drawer, #auth-drawer)
│   ├── btn-cta/
│   │   └── btn-cta.html                # Botão CTA reutilizável em múltiplas dobras (.btn-cta, #btn-cta)
│   ├── header/
│   │   └── header.html                 # Shell do Header (.header, #header)
│   ├── header-actions/
│   │   └── header-actions.html         # Ações do Header (.header-actions, #header-actions)
│   ├── nav-menu/
│   │   └── nav-menu.html               # Navegação (.nav-menu, #nav-menu)
│   ├── social-links/
│   │   └── social-links.html           # Ícones sociais (.social-links, #social-links)
│   └── whatsapp-float/
│       └── whatsapp-float.html         # Botão flutuante WhatsApp (.whatsapp-float, #whatsapp-float)
│
├── sections/                           # 2. DOBRAS DA LANDING PAGE
│   ├── hero/                           # DOBRA HERO
│   │   ├── hero-bg/                    # Subcomponente exclusivo: Carrossel de vídeo
│   │   │   └── hero-bg.html            # (.hero-bg, #hero-bg)
│   │   ├── hero-cta/                   # Subcomponente exclusivo: Logo institucional e título
│   │   │   └── hero-cta.html           # (.hero-cta, #hero-cta)
│   │   ├── hero-scroll-indicator/      # Subcomponente exclusivo: Indicador animado de scroll
│   │   │   └── hero-scroll-indicator.html # (.hero-scroll-indicator, #hero-scroll-indicator)
│   │   ├── hero-ticker/                # Subcomponente exclusivo: Barra técnica deslizante
│   │   │   └── hero-ticker.html        # (.hero-ticker, #hero-ticker)
│   │   └── hero.html                   # ORQUESTRADOR DA DOBRA HERO (.hero, #hero)
│   │
│   ├── objection-breaker/              # DOBRA CONTORNO DE OBJEÇÃO (2ª dobra, logo após o Hero)
│   │   ├── objection-breaker-opening/  # Subcomponente exclusivo: headline + situações + quebra de objeção + CTA
│   │   │   └── objection-breaker-opening.html
│   │   ├── objection-breaker-example/  # Subcomponente exclusivo: exemplo de perda de calda em modal com slides
│   │   │   └── objection-breaker-example.html  # (window.openObjectionExample), só abre em clique, sem libs externas
│   │   ├── objection-breaker-closing/  # Subcomponente exclusivo: virada para o produto + oferta de 7 dias grátis
│   │   │   └── objection-breaker-closing.html
│   │   └── objection-breaker.html      # ORQUESTRADOR DA DOBRA (.objection-breaker, #objection-breaker)
│   │
│   └── footer/                         # DOBRA FOOTER
│       └── footer.html                 # ORQUESTRADOR DA DOBRA FOOTER (.footer, #footer)
│
├── js/
│   ├── component-loader.js             # Motor nativo que busca, injeta e executa componentes
│   ├── lazy-loader.js                  # Carregador assíncrono sob demanda
│   └── main.js                         # Ponto de entrada JavaScript
│
└── index.html                          # 3. SHELL PRINCIPAL DA APLICAÇÃO
```

---

## ⚡ Como Funciona a Montagem das Dobras

No `index.html`, declaramos a ordem das dobras e os componentes estruturais globais:

```html
<!-- Header Fixo Global -->
<div data-component="components/header/header.html"></div>

<main id="app-root">
    <!-- Dobras da Landing Page -->
    <div data-page="sections/hero/hero.html"></div>
    <div data-page="sections/objection-breaker/objection-breaker.html"></div>
    <!-- <div data-page="sections/solutions/solutions.html"></div> -->
    <!-- <div data-page="sections/contact/contact.html"></div> -->
</main>

<!-- Footer e Widgets Globais -->
<div data-component="sections/footer/footer.html"></div>
<div data-component="components/whatsapp-float/whatsapp-float.html"></div>
<div data-component="components/auth-drawer/auth-drawer.html"></div>
```

---

## 🛠️ Como Criar uma Nova Dobra (Exemplo: Contato)

1. Crie a pasta `sections/contact/`
2. Crie os subcomponentes exclusivos (ex: `sections/contact/contact-form/contact-form.html`)
3. Crie o orquestrador da dobra `sections/contact/contact.html`:

```html
<style>
    .contact {
        padding: var(--space-2xl) var(--space-md);
        background: var(--color-dark-surface);
    }
</style>

<section class="contact" id="contact">
    <div class="contact-container">
        <!-- Subcomponente exclusivo da dobra -->
        <div data-component="sections/contact/contact-form/contact-form.html"></div>

        <!-- Componente Global Reutilizado -->
        <div data-component="components/btn-cta/btn-cta.html"></div>
    </div>
</section>
```

4. Declare a nova dobra no `index.html`:
```html
<div data-page="sections/contact/contact.html"></div>
```

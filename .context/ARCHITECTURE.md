# Arquitetura do Sistema: Tokens, Componentes Globais e Dobras (go2apply)

Este documento descreve a arquitetura do projeto **go2apply**, baseada no princípio de componentização de arquivo único (*Single-File Components - SFC*) executada nativamente pelo navegador através de um **Micro-Loader**, sem necessidade de Node.js, compiladores, Webpack ou Vite.

---

## 🏛️ A Filosofia: Três Camadas de Abstração

```
┌────────────────────────────────────────────────────────┐
│ 1. TOKENS (css/main.css :root)                          │
│    Fundações do Design System: Cores, Fontes,          │
│    Espaçamentos, Sombras, Blur e Transições.             │
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

> Historicamente os tokens viviam em `css/tokens.css` (separado de
> `reset.css` e `style.css`, ligados por `@import`). Isso foi consolidado
> num único `css/main.css` para eliminar requests em série no
> carregamento — a camada de tokens continua existindo conceitualmente,
> só que como o bloco `:root` no topo desse arquivo único. Ver
> `OPTIMIZACOES.md`.

---

## 📏 Regra de Padronização 1:1

Todos os componentes e dobras **de instância única** seguem estritamente a convenção de correspondência 1:1:

$$\text{Pasta} \equiv \text{Arquivo} \equiv \text{Classe CSS Raiz} \equiv \text{ID Raiz}$$

- **Componente Global:** `components/<nome>/<nome>.html` com `<tag class="<nome>" id="<nome>">`
- **Dobra (Seção):** `sections/<secao>/<secao>.html` com `<section class="<secao>" id="<secao>">`
- **Subcomponente de Dobra:** `sections/<secao>/<subcomponente>/<subcomponente>.html` com `<div class="<subcomponente>" id="<subcomponente>">`
- **Casing:** Sempre `kebab-case` minúsculo.

### ⚠️ Exceção: componentes reutilizados em múltiplas instâncias

Alguns componentes globais são montados **mais de uma vez na mesma
página** (o `component-loader` os busca uma vez só — fica em cache — mas
injeta o HTML em cada `data-component` que apontar pra eles). Nesses
casos o **ID não é aplicado**, porque um `id` duplicado no DOM final é
HTML inválido e quebraria qualquer `getElementById`/`#seletor` que espere
unicidade. A classe raiz continua batendo com o nome da pasta/arquivo; só
o `id` fica de fora.

Componentes hoje nessa situação (confirme com grep por
`data-component="components/<nome>/` antes de assumir que um novo
componente é de instância única):

- `btn-cta` (Hero, Screen Showcase, Objection Breaker)
- `social-links` (Header, Footer, Contact, Auth Drawer)
- `btn-login` (Nav Menu, Auth Drawer)
- `trial-banner` (Nav Menu, Auth Drawer)
- `phone-mockup` / `phone-mockup-alt` (Screen Showcase, 3x/2x)

Componentes de instância única (`header`, `header-actions`, `nav-menu`,
`whatsapp-float`, `auth-drawer`, e toda dobra em `sections/`) seguem a
regra 1:1 completa, com `id`.

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
│   └── main.css                        # Tokens + reset + estilos base, consolidados num único arquivo
│
├── components/                         # 1. COMPONENTES GLOBAIS REUTILIZÁVEIS
│   ├── auth-drawer/
│   │   └── auth-drawer.html            # Gaveta global de login/cadastro (.auth-drawer, #auth-drawer)
│   ├── btn-cta/
│   │   └── btn-cta.html                # Botão CTA reutilizável em múltiplas dobras (.btn-cta, sem id — instância múltipla)
│   ├── btn-login/
│   │   └── btn-login.html              # Botão de login do header/drawer (.btn-login, sem id — instância múltipla)
│   ├── header/
│   │   └── header.html                 # Shell do Header (.header, #header)
│   ├── header-actions/
│   │   └── header-actions.html         # Ações do Header (.header-actions, #header-actions)
│   ├── nav-menu/
│   │   └── nav-menu.html               # Navegação + gaveta lateral mobile (.nav-menu, #nav-menu)
│   ├── phone-mockup/
│   │   └── phone-mockup.html           # Mockup de tela pro carrossel do Screen Showcase (.phone-mockup, sem id — instância múltipla)
│   ├── phone-mockup-alt/
│   │   └── phone-mockup-alt.html       # Variante do mockup acima (.phone-mockup-alt, sem id — instância múltipla)
│   ├── social-links/
│   │   └── social-links.html           # Ícones sociais (.social-links, sem id — instância múltipla)
│   ├── trial-banner/
│   │   └── trial-banner.html           # Banner "7 dias grátis" (.trial-banner, sem id — instância múltipla)
│   └── whatsapp-float/
│       └── whatsapp-float.html         # Botão flutuante WhatsApp (.whatsapp-float, #whatsapp-float)
│
├── sections/                           # 2. DOBRAS DA LANDING PAGE (ordem real em index.html)
│   ├── hero/                           # DOBRA HERO
│   │   ├── hero-bg/                    # Subcomponente exclusivo: Carrossel de vídeo
│   │   ├── hero-cta/                   # Subcomponente exclusivo: Logo institucional e título
│   │   ├── hero-scroll-indicator/      # Subcomponente exclusivo: Indicador animado de scroll
│   │   ├── hero-ticker/                # Subcomponente exclusivo: Barra técnica deslizante
│   │   └── hero.html                   # ORQUESTRADOR DA DOBRA HERO (.hero, #hero)
│   │
│   ├── objection-breaker/              # DOBRA CONTORNO DE OBJEÇÃO
│   │   ├── ob-headline/                # Subcomponente exclusivo: headline + situações
│   │   ├── ob-situation/               # Subcomponente exclusivo: cards de situação
│   │   ├── ob-breaker/                 # Subcomponente exclusivo: virada + CTA
│   │   └── objection-breaker.html      # ORQUESTRADOR DA DOBRA (.objection-breaker, #objection-breaker)
│   │
│   ├── app-intro/app-intro.html        # DOBRA de apresentação da ferramenta
│   ├── app-journey/app-journey.html    # DOBRA de jornada do produto (GSAP/ScrollTrigger)
│   ├── screen-showcase/screen-showcase.html # DOBRA carrossel de telas (usa phone-mockup/-alt)
│   ├── trust/trust.html                # DOBRA de prova social/confiança
│   ├── faq/faq.html                    # DOBRA de perguntas frequentes
│   ├── contact/contact.html            # DOBRA de contato
│   └── footer/footer.html              # DOBRA FOOTER (.footer, #footer)
│
├── js/
│   ├── on-ready.js                     # Helper compartilhado: onComponentsReady() + openAuthDrawerAndCloseNav()
│   └── video-carousel.js               # Motor do carrossel de vídeo (Hero e Contact)
│
└── index.html                          # 3. SHELL PRINCIPAL DA APLICAÇÃO — inclui o loader visual
                                         #    e a engine ComponentLoader (fetch/injeta/executa componentes),
                                         #    inline no próprio arquivo, sem js/component-loader.js separado
```

> `ComponentLoader` (a engine que busca cada `.html`, injeta `<style>`/
> `<script>` e monta recursivamente `[data-component]`/`[data-page]`)
> vivia em `js/component-loader.js` + `js/lazy-loader.js` + `js/main.js`.
> Hoje está inline no `<script>` final de `index.html` — reduz uma
> requisição de rede a mais no caminho crítico. A lógica (fetch com
> memoização por URL, extração de `<style>`/`<script>`, disparo de
> `component:mounted`/`components:ready`) é a mesma descrita aqui, só
> mudou de arquivo.

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
    <div data-page="sections/app-intro/app-intro.html"></div>
    <div data-page="sections/app-journey/app-journey.html"></div>
    <div data-page="sections/screen-showcase/screen-showcase.html"></div>
    <div data-page="sections/trust/trust.html"></div>
    <div data-page="sections/faq/faq.html"></div>
    <div data-page="sections/contact/contact.html"></div>
</main>

<!-- Footer e Widgets Globais -->
<div data-component="sections/footer/footer.html"></div>
<div data-component="components/whatsapp-float/whatsapp-float.html"></div>
<div data-component="components/auth-drawer/auth-drawer.html"></div>
```

`data-component` e `data-page` são equivalentes pro loader (ambos viram
alvo de `mountElement`) — a convenção do projeto é usar `data-page` só
para as dobras dentro de `<main id="app-root">` e `data-component` para
tudo que é widget/estrutura global, só por legibilidade.

O loader mostra um overlay de carregamento (`#app-loader` em
`index.html`) que só é dispensado depois que `header` + `hero` terminam
de montar (`firstScreenPaths`) — as demais dobras continuam montando em
segundo plano. Ver `OPTIMIZACOES.md` para o histórico de bugs/ajustes
desse mecanismo antes de mexer nele.

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

5. Se o componente/dobra for reutilizado mais de uma vez na mesma
   página, **não** dê `id` ao elemento raiz — só `class` (ver seção de
   exceção acima).

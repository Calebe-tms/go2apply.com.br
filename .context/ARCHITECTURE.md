# Arquitetura do Sistema: Tokens, Componentes e Páginas (go2apply)

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
│ 2. COMPONENTES (components/*/*.html)                   │
│    Blocos atômicos que encapsulam HTML, <style> e      │
│    <script> no mesmo arquivo (estilo Svelte/Vue).     │
└───────────────────────────┬────────────────────────────┘
                            │ compõem
┌───────────────────────────▼────────────────────────────┐
│ 3. PÁGINAS (pages/*.html & index.html)                 │
│    Estruturas de layout e telas completas formadas     │
│    pela união dos componentes.                         │
└────────────────────────────────────────────────────────┘
```

---

## 📂 Estrutura de Pastas

```
go2apply.com.br/
│
├── .context/
│   └── ARCHITECTURE.md                 # Este documento de referência
│
├── css/
│   ├── tokens.css                      # Design Tokens em variáveis CSS (:root)
│   ├── reset.css                       # Resets essenciais, fontes e scroll suave
│   └── style.css                       # Ponto de entrada CSS unificado
│
├── components/                         # Pastas de componentes divididas por seção/página
│   │
│   ├── header/                         # [Componentes do Cabeçalho Global]
│   │   ├── header.html                 # Shell do Header (Grid 3 colunas, scroll e glassmorphism)
│   │   ├── social-links.html           # Ícones vetoriais de redes sociais (SVG com hover)
│   │   ├── nav-menu.html               # Links de navegação e gaveta para smartphone
│   │   └── btn-cta.html                # Botão de CTA ("Conheça a Ferramenta")
│   │
│   ├── hero/                           # [Componentes da Home / Hero]
│   │   ├── hero-bg.html                # Carrossel de vídeo contínuo em camadas sem telas pretas
│   │   └── hero-content.html           # Logo, títulos destacados e rodapé institucional
│   │
│   └── differentials/                  # [Componentes de Diferenciais]
│       ├── differentials-header.html   # Badge, título e subtítulo
│       └── differentials-grid.html     # Cards de diferenciais com ícones e hover
│
├── pages/                              # Páginas completas
│   ├── home.html                       # Página inicial (compondo hero-bg + hero-content)
│   └── differentials.html              # Página diferenciais (compondo header + grid)
│
├── js/
│   ├── component-loader.js             # Motor nativo que busca, injeta e executa componentes
│   └── main.js                         # Ponto de entrada JavaScript
│
└── index.html                          # Shell da aplicação (SEO, Meta Tags, Fontes e Layout)
```

---

## ⚡ Como Funciona o Micro-Loader (`js/component-loader.js`)

O carregador varre o DOM procurando atributos declarativos:
1. `data-component="caminho/do/componente.html"`: Carrega um componente atômico.
2. `data-page="caminho/da/pagina.html"`: Carrega uma página completa.

### Fluxo de Execução:
1. O navegador carrega o `index.html` com o CSS global (`tokens.css` e `reset.css`).
2. O `component-loader.js` faz `fetch()` assíncrono dos arquivos `.html`.
3. O conteúdo HTML é inserido no elemento alvo.
4. Qualquer tag `<style>` dentro do componente é injetada no documento, herdando todos os tokens do `:root`.
5. Qualquer tag `<script>` dentro do componente é executada no ciclo de vida correto.
6. O loader suporta **componentes aninhados** (um componente que carrega outros sub-componentes).
7. Quando tudo está renderizado, o evento `components:ready` é disparado.

---

## ⚖️ Vantagens e Trade-offs (Análise Técnica)

### ✅ Vantagens:
* **Zero Ferramental de Build**: Não precisa de `npm install`, `node_modules`, `webpack`, `vite` ou compilação.
* **Modularidade Extrema**: Cada componente concentra seu HTML, CSS e JS em um só lugar. Se precisar mudar o comportamento das redes sociais, você altera apenas `components/header/social-links.html`.
* **Design System Integrado**: Todos os componentes consomem as variáveis de `css/tokens.css`. Mudar uma cor atualiza todo o site instantaneamente.
* **Fácil de Manter por Agentes e Desenvolvedores**: O código é limpo, legível e desacoplado.

### ⚠️ Trade-offs & Boas Práticas:
* **SEO e Redes Sociais**: Robôs de pré-visualização (como WhatsApp, Facebook e LinkedIn) não executam JavaScript assíncrono. Por isso, **todas as meta tags principais (`<title>`, `<meta name="description">`, Open Graph `og:image`) devem sempre permanecer estáticas no `<head>` do `index.html`**.
* **FOUC (*Flash of Unstyled Content*)**: Para evitar qualquer salto visual durante o carregamento de componentes assíncronos, os tokens e estilos base são carregados síncronos no `<head>`.

---

## 🛠️ Como Criar um Novo Componente

Crie um arquivo `.html` dentro da pasta `components/sua-secao/meu-componente.html`:

```html
<!-- Estilos locais do componente (consomem os tokens globais) -->
<style>
    .meu-card {
        background-color: var(--color-dark);
        color: var(--color-white);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space-md);
        transition: var(--transition-smooth);
    }
    .meu-card:hover {
        border-color: var(--color-orange);
    }
</style>

<!-- Estrutura HTML -->
<div class="meu-card">
    <h3>Título do Card</h3>
    <button id="meu-botao">Ação</button>
</div>

<!-- Lógica JS do componente -->
<script>
    document.getElementById('meu-botao')?.addEventListener('click', () => {
        console.log('Ação disparada!');
    });
</script>
```

Para usá-lo em qualquer página ou componente:
```html
<div data-component="components/sua-secao/meu-componente.html"></div>
```

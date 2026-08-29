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
│   ├── ARCHITECTURE.md                 # Este documento de referência
│   ├── DESIGN_SYSTEM.md                # Diretrizes de design tokens e UI
│   └── FORMULARIO_CADASTRO_UX.md       # Especificações do fluxo de autenticação e Drawer
│
├── css/
│   ├── tokens.css                      # Design Tokens em variáveis CSS (:root)
│   ├── reset.css                       # Resets essenciais, fontes e scroll suave
│   └── style.css                       # Ponto de entrada CSS unificado
│
├── components/                         # Componentes modulares SFC
│   │
│   ├── auth/                           # [Drawer de Autenticação / Cadastro]
│   │   └── form-auth-drawer.html       # Painel lateral flutuante (Criar Conta / Login)
│   │
│   ├── header/                         # [Componentes do Cabeçalho Global]
│   │   ├── header.html                 # Shell do Header (Grid 3 colunas, scroll e glassmorphism)
│   │   ├── social-links.html           # Ícones de redes sociais sincronizados com o btn-cta
│   │   ├── nav-menu.html               # Links centrais de navegação e gaveta mobile limpa
│   │   └── header-actions.html         # Botão de CTA ("Conheça a Ferramenta") e toggle mobile
│   │
│   ├── hero/                           # [Componentes da Home / Hero]
│   │   ├── hero-bg.html                # Carrossel de vídeo contínuo + radar canvas interativo
│   │   ├── hero-content.html           # Shell orquestrador do conteúdo da hero
│   │   ├── hero-cta.html               # Logo e título institucional com destaque
│   │   ├── hero-btn-cta.html           # Botão principal de chamada para ação (CTA)
│   │   ├── hero-scroll-indicator.html  # Indicador animado de rolagem
│   │   └── hero-ticker.html            # Barra técnica deslizante no rodapé do Hero
│   │
│   ├── footer/                         # [Componente Global: Footer]
│   │   └── footer.html                 # Logo, navegação, redes sociais e encerramento
│   │
│   └── whatsapp-float/                 # [Componente Global: Botão Flutuante do WhatsApp]
│       └── whatsapp-float.html         # Botão fixo a 42px com borda laranja do DS e persistência global
│
├── pages/                              # Páginas do sistema
│   └── home.html                       # Hero orquestrador
│
├── js/
│   ├── component-loader.js             # Motor nativo que busca, injeta e executa componentes
│   ├── lazy-loader.js                  # Carregador assíncrono sob demanda
│   └── main.js                         # Ponto de entrada JavaScript
│
└── index.html                          # Shell da aplicação (SEO, Meta Tags, Fontes e Layout)
```

### Ordem das seções na Landing Page

Header → Hero → Soluções (morph interativo) → Problema → Diferenciais → Autoridade →
Como Funciona → Transformação (Antes x Depois) → Planos → FAQ → CTA Final → Footer.

A seção "Demonstração da plataforma" prevista no briefing original foi absorvida pelo
componente `solutions/solutions-showcase.html`, que já demonstra a ferramenta com
screenshots reais em um mockup de tablet — por isso não existe uma seção separada com esse nome.

---

## ⚡ Como Funciona o Micro-Loader (`js/component-loader.js`)

O carregador varre o DOM procurando atributos declarativos:
1. `data-component="caminho/do/componente.html"`: Carrega um componente atômico.
2. `data-page="caminho/da/pagina.html"`: Carrega uma página completa.

### O Motor do Micro-Loader (`js/component-loader.js`)

1. **Varredura Recursiva:** O script busca todos os nós com os atributos `data-component` ou `data-page`.
2. **Telemetria de Progresso Real:** Calcula em tempo real o total de componentes declarados e concluídos, emitindo o evento `loader:progress` com a porcentagem calculada (`{ loaded, total, percentage }`).
3. **Download Assíncrono:** Executa o `fetch` assíncrono do arquivo `.html`.
4. **Isolamento e Injeção de Estilos:** Extrai as tags `<style>`, gerando IDs únicos para evitar injeções duplicadas no `<head>`.
5. **Injeção de DOM & Execução de Scripts:** Insere o HTML no nó e executa o código JavaScript do componente através de um *Function Runner* encapsulado.
6. **Descoberta Aninhada:** Permite que componentes contenham outros sub-componentes internamente (composição multinível).
7. **Disparo de Prontidão Global:** Ao finalizar a montagem de todos os nós, dispara o evento `components:ready`. O `#app-loader` sincroniza a barra e a porcentagem com esses eventos e realiza o fade-out assim que as fontes e componentes estão 100% prontos.

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

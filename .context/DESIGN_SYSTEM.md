# Design System & Component Guidelines — go2apply

Este documento estabelece as regras e padrões visuais do projeto **go2apply** para desenvolvedores e agentes de IA. Todos os novos componentes ou alterações devem seguir estritamente as diretrizes aqui documentadas.

---

## 🎨 1. Fundações & Design Tokens (`css/tokens.css`)

### 1.1 Cores Principais
- **Laranja Marca:** `--color-orange: #f28e13` (Hover: `--color-orange-hover: #e07d08`, Glow: `--color-orange-glow`)
- **Verde Institucional:** `--color-green: #5b8c45` (Glow: `--color-green-glow`)
- **Dark Surface:** `--color-dark: #171e14`, `--color-dark-surface: #121810`
- **Fundo / Texto Claro:** `--color-white: #fefcf8`, `--color-white-muted: rgba(254, 252, 248, 0.75)`
- **Bordas / Linhas:** `--color-border: rgba(254, 252, 248, 0.08)`, `--color-border-subtle: rgba(254, 252, 248, 0.15)`

### 1.2 Identidades das Soluções
- **Caldas:** `--color-caldas: #0e603b`
- **Pulver:** `--color-pulver: #eeb319`
- **KOW:** `--color-kow: #028a9b`

### 1.3 Tipografia
- **Família Tipográfica:** `--font-main: 'Host Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`

---

## 🔘 2. Regras de Bordas e Arredondamento (`border-radius`)

| Token | Valor | Uso Obrigatório |
| :--- | :--- | :--- |
| **`--radius-btn`** | `var(--radius-md)` (**10px**) | **Padrão unificado para TODOS os botões, CTAs e links de navegação (`nav-links a`, `.btn-cta`, `.cta-btn-base`)** |
| `--radius-sm` | `6px` | Badges, tags pequenas e tooltips |
| `--radius-md` | `10px` | Base de cálculo dos botões |
| `--radius-lg` | `16px` | Cards, modais e containers de destaque |
| `--radius-full` | `9999px` | Apenas avatares circulares, badges em pílula pura ou indicadores de scroll |

> [!IMPORTANT]
> **Nunca use `--radius-full` em botões de ação ou links de menu.** Todos devem usar `var(--radius-btn, 10px)` para manter consistência visual com os CTAs principais.

---

## 🧩 3. Padrão de Componentização (SFC Nativo)

1. **Estrutura de Arquivo Único (`.html`):**
   - Bloco `<style>` local com escopo de classes claro.
   - Marcação HTML semântica.
   - Bloco `<script>` opcional para comportamentos interativos.
2. **Classes Compartilhadas:**
   - Botões de CTA utilizam a classe base `.cta-btn-base` ou `.btn-base`.
3. **Carregamento Assíncrono:**
   - Declarados via `<div data-component="components/pasta/nome.html"></div>`.

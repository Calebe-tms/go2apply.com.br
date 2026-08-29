# Padronização de Componentes e Dobras (Sections)

O projeto adota uma arquitetura modular em 2 camadas de UI:

## 1. Regra de Paridade 1:1 Estrita
Todo componente e dobra deve ter correspondência exata:

$$\text{Pasta} \equiv \text{Arquivo} \equiv \text{Classe CSS Raiz} \equiv \text{ID Raiz}$$

Sempre em letras minúsculas com hífen (`kebab-case`).

---

## 2. Divisão de Responsabilidades

### A. `components/` (Componentes Globais Reutilizáveis & Widgets)
Componentes de uso compartilhado em múltiplas seções, cabeçalho e utilitários globais:
- `components/btn-cta/btn-cta.html` $\rightarrow$ `.btn-cta`, `#btn-cta`
- `components/header/header.html` $\rightarrow$ `.header`, `#header`
- `components/header-actions/header-actions.html` $\rightarrow$ `.header-actions`, `#header-actions`
- `components/nav-menu/nav-menu.html` $\rightarrow$ `.nav-menu`, `#nav-menu`
- `components/social-links/social-links.html` $\rightarrow$ `.social-links`, `#social-links`
- `components/whatsapp-float/whatsapp-float.html` $\rightarrow$ `.whatsapp-float`, `#whatsapp-float`
- `components/auth-drawer/auth-drawer.html` $\rightarrow$ `.auth-drawer`, `#auth-drawer`

### B. `sections/` (Dobras da Landing Page)
Cada dobra é uma pasta auto-contida. Contém o arquivo orquestrador da dobra (`<secao>.html`) e pastas com seus subcomponentes exclusivos:
```
sections/
├── hero/
│   ├── hero-bg/
│   │   └── hero-bg.html               # .hero-bg, #hero-bg
│   ├── hero-cta/
│   │   └── hero-cta.html             # .hero-cta, #hero-cta
│   ├── hero-scroll-indicator/
│   │   └── hero-scroll-indicator.html # .hero-scroll-indicator, #hero-scroll-indicator
│   ├── hero-ticker/
│   │   └── hero-ticker.html           # .hero-ticker, #hero-ticker
│   └── hero.html                      # ORQUESTRADOR DA DOBRA (.hero, #hero)
└── footer/
    └── footer.html                    # ORQUESTRADOR DA DOBRA (.footer, #footer)
```

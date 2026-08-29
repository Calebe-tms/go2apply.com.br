# Especificação e Diretrizes de UX — Formulário de Cadastro ("Criar Conta")

Este documento mapeia todos os campos, elementos visuais e estrutura do formulário de cadastro do **go2apply / Equalizagro**, fornecendo recomendações profissionais de UX/UI, técnicas de conversão e estratégias de posicionamento na aplicação.

---

## 📋 1. Mapeamento Estrutural do Formulário Atual

Extraído das referências visuais de cadastro:

### 1.1 Cabeçalho
- **Título:** `Criar conta` (H1 / H2 de alto contraste)
- **Subtítulo / Apoio:** `Preencha seus dados para se cadastrar`

---

### 1.2 Bloco 1 — Dados Essenciais de Identificação e Acesso
| Campo | Tipo / Elemento | Ícone | Placeholder / Instrução | Requisito |
| :--- | :--- | :--- | :--- | :--- |
| **Nome completo** | `input[type="text"]` | Usuário (`user`) | `Seu nome completo` | Obrigatório |
| **Email** | `input[type="email"]` | Envelope (`mail`) | `seu@email.com` | Obrigatório |
| **Telefone / WhatsApp** | `input[type="tel"]` | Telefone (`phone`) | `(11) 99999-9999` (com máscara) | Obrigatório |
| **CPF** | `input[type="text"]` | Documento / ID (`id-card`) | `000.000.000-00` (com máscara e validação de dígito) | Obrigatório |
| **Senha** | `input[type="password"]` | Cadeado (`lock`) | `Mínimo 6 caracteres` | Obrigatório |
| **Confirmar senha** | `input[type="password"]` | Cadeado (`lock`) | `Repita a senha` | Obrigatório |

---

### 1.3 Bloco 2 — Perfil Profissional (Segmentação & Personalização)
*Separador de seção com etiqueta visual sutil:* `PERFIL PROFISSIONAL OPCIONAL`

| Campo | Tipo / Elemento | Ícone | Opções Padrão / Placeholder | Requisito |
| :--- | :--- | :--- | :--- | :--- |
| **Cargo / Função** | `select` / Custom Dropdown | Maleta / Empresa (`briefcase` / `building`) | `Selecione` (Agrônomo, Produtor, Consultor, Aplicador, Outro) | Opcional |
| **Região de atuação** | `select` / Custom Dropdown | Alvo / Localização (`map-pin` / `target`) | `Selecione` (Estados / Macrorregiões agrícolas) | Opcional |
| **Principal interesse** | `select` / Custom Dropdown | Lista / Foco (`sliders` / `star`) | `Selecione` (Cálculo de Caldas, Pulverização, KOW, Todos) | Opcional |

---

### 1.4 Consentimento, Ações e Rodapé
- **Checkbox Legal (LGPD):** `[ ] Li e concordo com os Termos de Uso e a Política de Privacidade do go2apply.`
- **Botão CTA Primário:** `Criar conta` (botão sólido em verde com raio de curvatura padronizado `--radius-btn: 10px`)
- **Divisor de Alternativa:** Linhas sutis com texto central `Já tem conta?`
- **Botão Secundário:** `Fazer login` (botão outline/secundário)
- **Navegação de Retorno:** `← Voltar ao site` (link de texto sutil no rodapé)
- **Área Visual Adjacente (Left Column / Split):** Mockup de tela/laptop com prévia dinâmica do painel do go2apply (demonstrando a entrega de valor imediata).

---

## 🧠 2. Técnicas Profissionais de UX para Redução de Fricção e Aumento de Conversão

Formulários com mais de 5 a 6 campos sofrem queda natural de conversão se não aplicarem boas práticas de arquitetura de informação e feedback visual.

### 2.1 Divulgação Progressiva (*Progressive Disclosure* / 2 Etapas)
- **Problema atual:** Apresentar 9 campos de uma vez gera sensação de esforço cognitivo elevado ("parece demorado").
- **Solução recomendada (Wizard de 2 Passos):**
  - **Passo 1 (Rápido - 4 campos):** Nome, E-mail, Senha e Confirmação.
  - **Passo 2 (Perfil & Validação):** Telefone/WhatsApp, CPF e Perfil Profissional opcional.
  - *Alternativa inteligente:* Manter o bloco "Perfil Profissional" dentro de um **Accordion opcional recolhível** (ex: *"Deseja personalizar sua experiência agora? (Opcional) ▾"*), permitindo ao usuário avançar sem abrir se quiser agilidade.

### 2.2 Validação em Tempo Real (*Inline Validation*) e Feedback Positivo
- **Micro-validação com Check:** Conforme o usuário preenche corretamente cada campo (ex: e-mail válido, CPF verificado, senhas coincidentes), o campo exibe um ícone sutil de `✓` em verde no lado direito.
- **Feedback de Senha Visual:** Em vez de apenas "Mínimo 6 caracteres", adicionar um indicador de força (Fraca / Média / Forte) e mini-tags dinâmicas que ficam verdes quando atendidas (ex: `✓ 6+ dígitos`, `✓ Letra maiúscula`, `✓ Número`).
- **Alternador de Visibilidade de Senha (Show/Hide):** Adicionar o ícone de "olho" nos campos de senha para evitar erros de digitação e frustração no mobile.

### 2.3 Máscaras Inteligentes e Otimização para Mobile
- **Máscara Automática:**
  - Telefone: Alterna automaticamente entre celular de 9 dígitos `(00) 00000-0000` e fixo `(00) 0000-0000`.
  - CPF: Formatação instantânea enquanto digita.
- **Atributos HTML Nativos para Teclado Correto no Celular:**
  - `type="email"` + `autocomplete="email"`
  - `type="tel"` + `inputmode="tel"`
  - `inputmode="numeric"` para CPF
  - `autocomplete="new-password"`

### 2.4 Explicação do CPF e Elementos de Confiança (*Trust Signals*)
- **Micro-copy de Contexto:** Muitos usuários hesitam em fornecer CPF em landing pages. Adicionar um pequeno tooltip ou texto de apoio discreto: *"Necessário para emissão e validação da sua licença de uso da plataforma."*
- **Selo de Segurança:** Inserir abaixo do botão de cadastro um selo com ícone de escudo: *"🔒 Seus dados estão 100% seguros sob a LGPD."*

---

## 📐 3. Arquitetura e Posicionamento Definidos: Drawer Lateral Flutuante (*Slide-over Pane*)

A abordagem selecionada para o projeto é o **Drawer / Painel Lateral Flutuante (Slide-over)**. Esta solução oferece a melhor combinação de imersão, velocidade de carregamento e retenção de contexto para o usuário.

---

### 3.1 Comportamento e Funcionamento Geral

1. **Gatilhos de Abertura (CTAs na Landing Page):**
   - Qualquer botão de ação na página (*Header*, *Hero*, *Bloco ROI*, *Tabela de Planos*, *Footer*) com a classe/ação de cadastro abre instantaneamente o drawer.
   - O endereço da URL pode receber um hash suave (ex: `#cadastro` ou query param `?auth=register`) para permitir compartilhamento direto de links e histórico do navegador.

2. **Efeito Visual e Backdrop (*Overlays & Glassmorphism*):**
   - **Backdrop / Fundo Escurecido:** `backdrop-filter: blur(8px); background: rgba(0, 0, 0, 0.65);` com transição suave de opacidade (`transition: opacity 300ms ease`).
   - **Superfície do Painel:** Fundo escuro premium (`--color-dark: #171e14` ou `--color-dark-surface: #121810`), borda sutil à esquerda (`border-left: 1px solid rgba(254, 252, 248, 0.08)`).
   - **Sombra de Profundidade:** Sombra difusa multidirecional (`box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5)`).

3. **Animação e Física de Entrada/Saída:**
   - **Desktop (Slide da Direita):** `transform: translateX(100%)` para `translateX(0)` usando curva de aceleração moderna: `cubic-bezier(0.16, 1, 0.3, 1)` em `400ms`.
   - **Mobile (Bottom Sheet):** Em telas `< 768px`, o drawer se transforma automaticamente em uma **Bottom Sheet** (folha inferior) com puxador de arrasto (*drag handle*), deslizando de baixo para cima (`translateY(100%)` -> `translateY(0)`).

4. **Regras de Acessibilidade & Fechamento:**
   - **Botão de Fechar:** Ícone `✕` fixo no canto superior direito do drawer.
   - **Clique Fora:** Clicar no backdrop escurecido fecha o painel suavemente.
   - **Tecla ESC:** Pressionar `Escape` fecha o drawer imediatamente.
   - **Focus Trap:** O foco do teclado fica preso dentro do formulário enquanto o drawer estiver aberto.

---

### 3.2 Alternância Dinâmica de Telas Dentro do Drawer (Tabs / Flip)

O drawer acomoda tanto a tela de **Cadastro** quanto a tela de **Login** sem recarregar a página:
- Se o usuário clicar em *"Já tem conta? Fazer login"*, o conteúdo interno do drawer transiciona suavemente (fade + slide horizontal) para o formulário de Login.
- Se na tela de login ele clicar em *"Ainda não tem conta? Criar conta"*, volta para o formulário de cadastro.

---

### 3.3 Estrutura do Layout Interno do Drawer

```
┌───────────────────────────────────────────────┐
│ [ go2apply ]                     [ ✕ Fechar ] │  <- Header fixo
├───────────────────────────────────────────────┤
│                                               │
│  Criar conta                                  │
│  Preencha seus dados para se cadastrar        │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │ 👤  Nome completo                       │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │ ✉️  Email                                │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │ 📞  Telefone / WhatsApp                  │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │ 🪪  CPF                                 │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │ 🔒  Senha                                │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │ 🔒  Confirmar senha                     │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ── Perfil Profissional (Opcional) ▾ ───────  │  <- Accordion colapsável
│                                               │
│  [✓] Li e concordo com os Termos e Privacidade│
│                                               │
│  [        CRIAR CONTA (CTA Verde)         ]  │
│                                               │
│  ────────────── Já tem conta? ──────────────  │
│  [           Fazer login                   ]  │
│                                               │
└───────────────────────────────────────────────┘
```

---

## 🎨 4. Alinhamento com o Design System do go2apply

Quando o componente de formulário for construído no código:
- **Botão Principal:** `.btn-cta` com `--color-green: #5b8c45` (ou `--color-orange: #f28e13` para teste A/B) e `--radius-btn: 10px`.
- **Campos de Entrada (Inputs):** Fundo suave, bordas `--color-border: rgba(254, 252, 248, 0.08)` com transição de foco com anel suave (`box-shadow: 0 0 0 3px rgba(91, 140, 69, 0.25)`).
- **Ícones dos Campos:** Alinhados à esquerda do input com opacidade de 60% que ganha foco quando o campo está ativo.
- **Tipografia:** Família `--font-main: 'Host Grotesk', sans-serif`.

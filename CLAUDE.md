# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Landing page estática (go2apply / equalizagro) com uma Vercel Function para conectar o
formulário de cadastro (auth-drawer) ao CRM (Firebase). Sem framework de frontend —
HTML/CSS/JS puro, componentizado por convenção de pastas, não por bundler.

## Commands

Não há `scripts` em `package.json`. Fluxos reais:

```bash
# Servir a pasta como está (modo dev) — componentes são buscados via fetch em runtime
python -m http.server 5173
```

```bash
# Gerar dist/ com os componentes já embutidos no HTML (pré-render para produção)
node build.js
```

- `.claude/launch.json` já define o servidor de dev acima na porta 5173 — use isso para preview.
- Não existe suíte de testes nem linter configurado no repo.
- A Vercel Function (`api/*.js`) só roda de fato via `vercel dev` ou já publicada na Vercel;
  servi-la com `python -m http.server` não a executa.

## Architecture

Documentação de referência completa (leia antes de mexer em componentes/dobras ou tokens):
- [.context/ARCHITECTURE.md](.context/ARCHITECTURE.md) — arquitetura de componentização e regras de montagem
- [.context/DESIGN_SYSTEM.md](.context/DESIGN_SYSTEM.md) — tokens de design
- [OPTIMIZACOES.md](OPTIMIZACOES.md) — histórico de decisões de performance (loader, LCP/FCP)

### Componentização sem bundler (SFC via Micro-Loader)

Cada componente/dobra é um `.html` de arquivo único (markup + `<style>` + `<script>` inline).
Em dev, um `ComponentLoader` inline no final de [index.html](index.html) busca cada
`data-component`/`data-page` via `fetch`, injeta o `<style>` (deduplicado por caminho),
executa o `<script>` (não deduplicado — roda uma vez por montagem) e monta recursivamente
filhos aninhados. Em produção, [build.js](build.js) faz o mesmo trabalho em build-time e
gera `dist/` com tudo já achatado no HTML (nenhum fetch de componente sobra em produção) —
os dois caminhos precisam ficar em sincronia; qualquer mudança no comportamento do loader
inline em `index.html` deve ser replicada em `build.js` (ver comentários no topo do arquivo).

**Regra de paridade 1:1 estrita:** Pasta ≡ Arquivo ≡ Classe CSS raiz ≡ ID raiz, sempre
`kebab-case`. Exceção: componentes montados mais de uma vez na mesma página (`btn-cta`,
`social-links`, `btn-login`, `trial-banner`, `phone-mockup`/`phone-mockup-alt`) não recebem
`id` — só `class` — porque IDs duplicados no DOM final quebrariam seletores. Antes de
assumir que um componente novo é de instância única, `grep` por
`data-component="components/<nome>/` no repo.

- `components/` — componentes globais reutilizáveis (header, nav-menu, auth-drawer, etc.)
- `sections/` — dobras da landing page, cada uma auto-contida com seus subcomponentes
  exclusivos; o arquivo orquestrador da dobra fica em `sections/<nome>/<nome>.html`
- `css/main.css` — tokens (`:root`), reset e estilos base consolidados num único arquivo
  (histórico: eram arquivos separados ligados por `@import`, unificados para eliminar
  requests em série no carregamento)

Ao criar uma nova dobra ou componente, siga o passo a passo em
[.context/ARCHITECTURE.md](.context/ARCHITECTURE.md) (seção "Como Criar uma Nova Dobra").

### Vercel Function (`api/`)

- `api/_firebase.js` — helper com o prefixo `_` de propósito (mesma convenção que existia
  para o Pagar.me): a Vercel só expõe como rota pública arquivos sem `_` no início; este é
  só importado pelo outro. Inicializa o Firebase Admin SDK a partir de
  `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` (env vars da Vercel,
  nunca no código).
- `api/create-lead.js` — chamado pelo `auth-drawer` (nome, e-mail, WhatsApp) ao clicar em
  "Continuar para o pagamento". Não existe login em lugar nenhum: só grava o lead na
  coleção `leads` do Firestore (projeto `crm-equalizagro`, usado como CRM). O redirecionamento
  para o checkout (sistema externo, `checkout.go2apply.com`) acontece no navegador em
  paralelo ao envio do lead — a chamada à API é *fire-and-forget*, não bloqueia o clique no
  botão nem depende da resposta da API.

## Project-specific rules (already enforced via `.claude/rules/`)

Estas regras já são carregadas automaticamente pelo Claude Code a partir de
`.claude/rules/*.md` — não precisam ser repetidas manualmente, só esteja ciente delas:
- Nunca fazer push na branch `main` sem confirmação expressa.
- Perguntas do usuário não devem disparar testes nem escrita de código — só resposta.
- Regras de paridade de componentes, design system (tokens, `--radius-btn`, grade de 4px) e
  idioma (código em inglês, comentários em pt-br, comunicação com o usuário em pt-BR).

Regras adicionais só em `.agents/rules/` (não espelhadas em `.claude/rules/`):
- Não rodar testes no browser sem pedido explícito (perguntar antes se for necessário).
- Não alterar a pasta `effects-export/` sem solicitação explícita.
- Não executar planos de implementação sem confirmação.
- Atualizar os arquivos de contexto (`.context/`) após alterações grandes.

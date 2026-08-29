Sempre consulte e siga as diretrizes visuais e tokens do Design System definidos em:
- `css/tokens.css`
- `.context/DESIGN_SYSTEM.md`

Regras obrigatórias de UI:
1. TODOS os botões, CTAs e itens interativos de navegação devem usar `border-radius: var(--radius-btn, 10px);`.
2. Nunca utilize `--radius-full` em botões regulares ou links do menu.
3. Não use cores hardcoded (ex: #f28e13); utilize sempre os tokens CSS correspondentes (ex: `var(--color-orange)`).

# 📋 Briefing Executivo — Landing Page go2apply

**Estratégia de desenvolvimento para as seções restantes**

---

## 📊 Status Geral da LP

| Seção | Status | Descrição |
|-------|--------|-----------|
| **Hero (Seção 1)** | ✅ Concluído | Vídeo carousel otimizado, radar canvas, scanlines |
| **ROI (Seção 2)** | ✅ Concluído | Comparativo visual, grid de produtos, ferramentas |
| **Restante (Seções 3-8)** | ⏳ Pendente | Problema, Diferenciais, Autoridade, Features, etc. |

---

## 🔍 Análise da Imagem Reference

A imagem fornecida mostra a **visão desejada completa da LP**, com estrutura, features e proposta de valor.

### Elementos-Chave Observados:

1. **Headline Master**: "Tudo o que você precisa para transformar pulverizações em aplicações eficientes"

2. **Descrição Longa**: "Mais de 10 anos de pesquisa em tempo integral, reunida em uma plataforma completa, prática e confiável"

3. **13 Features/Ferramentas** com ícones verdes:
   - Formação de caldas (com ordem e metodologia)
   - Alertas de incompatibilidade
   - KOW, sugestão de adjuvantes e pH de calda (para 400+ ingredientes ativos)
   - Dimensionamento de espectro de gotas e condições ambientais
   - Determinação de Delta T
   - Cálculos avançados de pressão e vazão
   - Calibração de fluxômetro
   - Calibração de aeronames em solo
   - Avaliações de uniformidade e desgaste
   - Geração de relatórios
   - Comunidade exclusiva (Telegram)
   - Sistema de cálculos completo

4. **Mockup Mobile**: App mostrando calculadoras (Bicos ISO, Sistema, Aérea, Conversões, Fluxômetro, Desgaste, Espectro, Delta T) + Histórico

5. **4 Value Props** com ícones:
   - ✅ Mais precisão nas decisões
   - ⚡ Mais eficiência nas aplicações
   - 💰 Mais economia no dia a dia
   - 📈 Mais resultado no campo

6. **CTA Forte**: "7 DIAS GRÁTIS em qualquer plano | Acesso ilimitado a todas as ferramentas!"

7. **Social Proof**: "Confiança que vem de campo! +de 10 anos de pesquisa transformando conhecimento em resultados no campo"

---

## 🗂️ Seções Faltantes (Ordem de Prioridade)

### 🔴 ALTA PRIORIDADE

#### **Seção 3: Features/Calculadoras (Crítica)**
- **O quê:** Exibir as 13 ferramentas principais da plataforma
- **Como:** Grid responsivo 3-colunas (desktop) → 2-colunas (tablet) → 1-coluna (mobile)
- **Elementos:** Ícone verde + Título + Descrição breve (1-2 linhas)
- **Design:**
  - Cards com hover suave (translateY -2px)
  - Ícones #5b8c45 com size 2.5rem
  - Fundo rgba(91, 140, 69, 0.05) com border rgba(91, 140, 69, 0.3)
  - Animação de entrada ao scroll (slideUp)
- **Bonus:** Mostrar mockup do app ao lado (como na imagem)

**Ferramentas a listar:**
1. Bicos ISO
2. Sistema de cálculo
3. Aérea
4. Conversões
5. Fluxômetro
6. Desgaste
7. Espectro
8. Delta T
9. Formação de caldas
10. Alertas de incompatibilidade
11. KOW + pH (400+ ingredientes)
12. Dimensionamento gotas
13. Comunidade + Relatórios

---

#### **Seção 4: Value Props / 4 Pilares**
- **O quê:** Destacar 4 benefícios principais
- **Layout:** Grid 2x2 (desktop) → 1-coluna (mobile) ou Bento layout
- **Elementos:** Icon grande + Número/Stat + Título + Descrição
- **Design:**
  - Icons: ✅ (verde), ⚡, 💰, 📈
  - Fundo: rgba(91, 140, 69, 0.08)
  - Border: var(--color-green, #5b8c45)
  - Hover: elevate com box-shadow

**Os 4 Pilares:**
1. **Mais Precisão** nas decisões
2. **Mais Eficiência** nas aplicações
3. **Mais Economia** no dia a dia
4. **Mais Resultado** no campo

---

#### **Seção 5: Social Proof / Credibilidade**
- **O quê:** Certificar experiência e expertise
- **Frase Principal:** "Confiança que vem de campo!"
- **Subtítulo:** "+de 10 anos de pesquisa transformando conhecimento em resultados no campo"
- **Design:**
  - Shield icon verde grande (2.5-3rem)
  - Layout: Icon + Text (center ou grid)
  - Background: Dark card com border verde suave
  - Possível: Adicionar avatar de pesquisador/agrônomo + nome

---

### 🟡 MÉDIA PRIORIDADE

#### **Seção 6: Autoridade (Números)**
- **O quê:** Mostrar expertise em números
- **Elementos:**
  - +10 anos de pesquisa técnica
  - +400 ingredientes ativos na base
  - Múltiplas ferramentas para diferentes etapas
  - Suporte técnico especializado
- **Layout:** Grid 4-colunas (desktop) → 2-2 (tablet) → 1 (mobile)
- **Design:** Cards com números destacados em laranja, descrição em branco

---

#### **Seção 7: Como Funciona**
- ✅ **Já existe** no código: 4 passos (Escolha → Informe → Analise → Decida)
- **Otimizar:** Adicionar icons nos passos, animations ao scroll

---

#### **Seção 8: Transformação (Antes/Depois)**
- ✅ **Já existe** no código: Comparação visual
- **Otimizar:** Melhorar contraste, adicionar animações

---

#### **Seção 9: Planos de Preço**
- ✅ **Já existe** no código: plans.html
- **Otimizar:** Destacar CTA "7 DIAS GRÁTIS"

---

## 🎨 Componentes & Padrões de Design

### Padrões a Manter (já definidos):

```
Cores:
  - Verde: #5b8c45
  - Laranja: #f28e13
  - Dark: #1a1e14
  - White: #fefcf8

Typography:
  - Font-family: -apple-system, 'Host Grotesk', Segoe UI, Roboto
  - Base: 1rem / 16px
  - Headings: 1.2 line-height, -0.02em letter-spacing

Spacing (Scale 0.5rem):
  - xs: 0.5rem
  - sm: 1rem
  - md: 1.5rem
  - lg: 2rem
  - xl: 3rem

Breakpoints:
  - Desktop: 1400px+
  - Tablet: 768px-1399px
  - Mobile: <768px
  - Compact: <600px (especial para mobile)

Animações:
  - Transition: cubic-bezier(0.16, 1, 0.3, 1)
  - Duration: 0.3s (rápidas), 0.4s (médias), 0.8s (longas)
  - Prefer-reduced-motion: Sempre suportar

Efeitos:
  - Scanlines: repeating-linear-gradient (pattern CRT)
  - Backdrop-filter: blur(10-14px)
  - Box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3)
  - Hover: translateY(-2px), scale(1.02-1.05)
```

### Novos Componentes Necessários:

| Componente | Props | Estados | Responsive |
|-----------|-------|---------|-----------|
| **FeatureCard** | icon, title, desc | default, hover | 3col → 2col → 1col |
| **ValuePropCard** | icon, stat, title, desc | default, hover | 2x2 → 2col → 1col |
| **StepCard** | number, title, desc | default, active | 4col → 2col → 1col |
| **StatBox** | label, number, unit | default, animated | 4col → 2col → 1col |
| **ImageMockup** | src, alt, caption | default, lazy-load | responsive |
| **ComparisonTable** | before/after | default | horizontal → vertical |

---

## 🛣️ Roteiro de Desenvolvimento

### **Semana 1 — Features + Value Props**

#### Fase 1A: Features/Calculadoras (3-4 dias)
```
1. Criar arquivo: pages/features.html
2. Implementar grid 3-colunas com cards
3. Adicionar 13 items com ícones verdes
4. Responsiveness: 3col → 2col → 1col
5. Animações: slideUp on scroll
6. Bonus: Mockup mobile do app (imagem estática)
```

#### Fase 1B: Value Props + Social Proof (2-3 dias)
```
1. Criar seção 4-pilares (ou integrar em features)
2. Grid 2x2 com hover suave
3. Adicionar "Confiança que vem de campo" com shield
4. Números: +10 anos, +400 ingredientes
5. Animations: fade-in + scale on viewport
```

### **Semana 2 — Otimizações & Integrações**

#### Fase 2A: Design Polish (2 dias)
```
1. Adicionar scanlines em seções (pattern consistency)
2. Implementar animações scroll-triggered
3. Melhorar contraste WCAG AA
4. Testes de performance em mobile
```

#### Fase 2B: CTA & Finalizações (2-3 dias)
```
1. Criar seção final "7 DIAS GRÁTIS"
2. Botões verdes (principal) + laranja (secundário)
3. Integrar plans.html
4. Testes E2E
```

---

## ✅ Próximos Passos Imediatos

### Questões para Confirmar:

1. **Qual seção você quer implementar PRIMEIRO?**
   - Recomendo: **Features + Mockup** (impacto visual máximo)

2. **Você tem copy detalhado para cada uma das 13 ferramentas?**
   - Precisamos de: Título (2-4 palavras) + Descrição (1-2 linhas)

3. **Mockup do app:**
   - Usar imagem estática (como na reference)?
   - Ou criar mockup interativo?

4. **Seções já implementadas:**
   - "Problema", "Diferenciais", "Autoridade", "Como Funciona" já existem
   - Vamos otimizá-las ou recriar do zero?

5. **Timeline:**
   - Quanto tempo você quer dedicar? (1 semana? 2 semanas?)
   - Há deadline?

---

## 📌 Notas Importantes

- **Dark Mode First:** Todos os backgrounds devem ser rgba com opacity (não HEX direto)
- **Responsiveness:** Testar sempre em 375px (mobile), 768px (tablet), 1400px (desktop)
- **Acessibilidade:** WCAG AA mínimo (contraste 4.5:1 para textos)
- **Performance:** Lazy-load de imagens, otimizar animações (use transform + opacity)
- **Taste-Skill Framework:** Manter dials em: 7/5/4 (Production-Ready Design)

---

**Briefing gerado em 29/08/2026 — Pronto para discussão e aprovação**
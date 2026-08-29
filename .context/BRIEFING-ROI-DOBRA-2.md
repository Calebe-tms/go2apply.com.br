# 📋 Briefing Executivo — 2ª Dobra: Retorno de Investimento (ROI)

## 🎯 Objetivo da Seção

**Contornar objeção de compra**: Mostrar **visualmente e numericamente** qual é o impacto financeiro de não usar go2apply vs. usar a plataforma.

**Estrutura psicológica**: 
- Problema (perda total) → Solução (ganho total)
- Mostrar o custo de oportunidade
- Quebrar em partes entendíveis (produtos, cálculos)
- Fechar com confiança

---

## 📊 Estrutura Atual (IMPLEMENTADA ✅)

### **1. Header (Headline + Subtext)**
```
Headline: "Retorno de Investimento"
Subtext: "Não deixe sua calda virar prejuízo. Com go2apply você recupera tudo."
```

### **2. Comparativo 50/50 (ANTES vs. DEPOIS)**

**Sem Orientação Correta (BAD)**
- Icon: ❌
- Label: "Perda 100%"
- Value: **-R$ 9.240**
- Context: "Calda perdida por incompatibilidade"

**Com go2apply (GOOD)**
- Icon: ✅
- Label: "Economia 100%"
- Value: **+R$ 9.240**
- Context: "Caldas preservadas e aplicadas corretamente"

### **3. Composição da Calda (Cenário Real)**
- **Label**: "Cenário Real: 308 L de calda em 30 hectares"
- **Grid**: 6 produtos com dosagem + perda individual
  - FOX XPRO: 0,5 L/ha → -R$ 130
  - AUREO: 0,3 L/ha → -R$ 6
  - BELT: 0,1 L/ha → -R$ 32
  - UNIZEB GOLD: 1,5 kg/ha → -R$ 45
  - AG RDG: 1 L/ha → -R$ 18
  - CURBIX: 1 L/ha → -R$ 77

### **4. Total do Investimento**
- Label: "Valor Total do Investimento"
- Value: **R$ 9.240** (em laranja)

### **5. 3 Ferramentas (Bento Layout)**
- 🔍 **Diagnóstico** — pH, KOW, Compatibilidade
- 📱 **Orientação 24h/7** — Consultas em qualquer lugar/hora
- ✓ **Confiança** — Resultado garantido, sem desperdício

### **6. CTA (Call-to-Action)**
- Button: **"Comece Agora"** (Verde #5b8c45)
- Link: `#solucoes` (ao formulário/próxima seção)

---

## 🎨 Design System (IMPLEMENTADO ✅)

### **Cores**
- **Fundo**: Dark (#1a1e14)
- **Verde Primário**: #5b8c45
- **Laranja Secundário**: #f28e13
- **Texto**: #fefcf8 (branco)
- **Border**: rgba(255, 255, 255, 0.1)

### **Cards de Comparativo**
- **Bad Card**: rgba(220, 38, 38, 0.08) | border: rgba(220, 38, 38, 0.3)
- **Good Card**: rgba(91, 140, 69, 0.08) | border: rgba(91, 140, 69, 0.3)
- **Hover**: Elevate (-4px), brighten border

### **Tipografia**
- **Headline**: clamp(2rem, 5vw, 3.5rem) | font-weight: 700
- **Subtext**: 1.1rem | opacity 0.7
- **Cards**: 1rem titles, 0.85rem descriptions

### **Animações**
- **Números**: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)
- **Cards**: Fade-in ao scroll (trigger: viewport 30%)
- **Hover**: Transform + color transition (0.3s)

### **Responsividade**
- **Desktop**: Grid 2x1 (comparativo side-by-side)
- **Tablet (768px)**: Grid 1x2 (comparativo empilhado)
- **Mobile (600px)**: Grid 1x1 (full width)

---

## ✅ Checklist de Implementação

### **Visual**
- [x] Headline e subtext
- [x] Cards de comparativo (50/50 desktop, 1-col mobile)
- [x] Grid de 6 produtos com dosagem/perda
- [x] Total com destaque em laranja
- [x] 3 ferramentas em bento layout
- [x] CTA button verde
- [x] Animações de entrada (slideUp nos números)

### **Funcionalidade**
- [x] IntersectionObserver para trigger animação
- [x] Responsiveness em todos breakpoints
- [x] Contraste WCAG AA (cores aprovadas)
- [x] Suporta light/dark mode via tokens

### **Performance**
- [x] Sem animações pesadas
- [x] CSS otimizado (transitions suaves)
- [x] SVG inline (sem carregamento externo)

---

## 📱 Breakpoints & Responsive

### **Desktop (1024px+)**
```css
.roi-comparison {
  grid-template-columns: 1fr 1fr;  /* 50/50 side-by-side */
  gap: 2rem;
}

.roi-products-grid {
  grid-template-columns: repeat(3, 1fr);  /* 3 colunas */
}

.roi-tools {
  grid-template-columns: repeat(3, 1fr);  /* 3 colunas */
}
```

### **Tablet (768px - 1023px)**
```css
.roi-comparison {
  grid-template-columns: 1fr;  /* Empilhado */
  gap: 1.5rem;
}

.roi-products-grid {
  grid-template-columns: repeat(2, 1fr);  /* 2 colunas */
}

.roi-tools {
  grid-template-columns: repeat(2, 1fr);  /* 2 colunas */
}
```

### **Mobile (< 768px)**
```css
.roi-comparison {
  grid-template-columns: 1fr;  /* Full width */
}

.roi-products-grid {
  grid-template-columns: repeat(2, 1fr);  /* 2 colunas */
}

.roi-tools {
  grid-template-columns: 1fr;  /* 1 coluna (stacked) */
}

.roi-section {
  padding: 3rem 0.75rem;  /* Padding mobile */
}
```

---

## 🔢 Números & Dados (Cenário Base)

### **Composição da Calda: 308L em 30 hectares**

| Produto | Dosagem | Perda | Total |
|---------|---------|-------|-------|
| FOX XPRO | 0,5 L/ha | -R$ 130 | (30 ha × R$ 130/ha) |
| AUREO | 0,3 L/ha | -R$ 6 | (30 ha × R$ 6/ha) |
| BELT | 0,1 L/ha | -R$ 32 | (30 ha × R$ 32/ha) |
| UNIZEB GOLD | 1,5 kg/ha | -R$ 45 | (30 ha × R$ 45/ha) |
| AG RDG | 1 L/ha | -R$ 18 | (30 ha × R$ 18/ha) |
| CURBIX | 1 L/ha | -R$ 77 | (30 ha × R$ 77/ha) |

**TOTAL**: **R$ 9.240** (100% recuperado com go2apply)

---

## 🎯 Messaging (Copywriting)

### **Comparativo**
- **Sem go2apply**: "Calda perdida por incompatibilidade"
  - Ênfase: Desperdício total, sem volta
  
- **Com go2apply**: "Caldas preservadas e aplicadas corretamente"
  - Ênfase: Solução, confiança, resultado

### **Ferramentas**
- **Diagnóstico**: "pH, KOW, Compatibilidade. Identifica problemas antes da perda."
- **Orientação 24h/7**: "Consultas + Metodologia em qualquer lugar, a qualquer hora."
- **Confiança**: "Resultado garantido. Sem desperdício, sem incertezas."

### **CTA**
- **Button Text**: "Comece Agora"
- **Context**: Fecha a venda, leva a próxima etapa (formulário)

---

## 🚀 Testes Essenciais

- [ ] **Desktop (1400px)**: Comparativo 50/50, 3 colunas
- [ ] **Tablet (768px)**: Comparativo empilhado, 2 colunas
- [ ] **Mobile (375px)**: Tudo em 1 coluna, legível
- [ ] **Animações**: Números entram de baixo para cima ao scroll
- [ ] **Hover**: Cards elevam, ícones mudam cor
- [ ] **Acessibilidade**: Contraste OK, ARIA labels se necessário
- [ ] **Performance**: Sem lag ao scroll, animações smooth

---

## 📝 Arquivo de Implementação

**Localização**: `pages/roi.html` ✅
**Integração**: Referenciado em `index.html` como 2ª dobra ✅
**CSS**: Inline (self-contained) ✅
**Responsividade**: Completa ✅

---

## 🎨 Versão & Manutenção

**Status**: PRODUÇÃO (v1.0)
**Última Atualização**: 29/08/2026
**Próximas Melhorias**: 
- Possível adicionar gráfico de comparação visual
- Adicionar depoimento/social proof nesta seção
- Integrar com analytics (rastrear cliques no CTA)

---

**Esta é a ÚNICA seção além da Hero. Foco total em conversão & ROI.** 🎯
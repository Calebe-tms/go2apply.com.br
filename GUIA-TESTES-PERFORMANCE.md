# 🧪 Guia de Testes - Verificar Otimizações de Performance

## 🎯 Teste Rápido (5 minutos)

### Teste 1: Validar Vídeos Otimizados
```
1. Abra a página em smartphone ou tablet
2. Abra Chrome DevTools (F12)
3. Vá em Network tab
4. Filtre por "video"
5. Recarregue a página

RESULTADO ESPERADO:
✅ Vídeos com tamanho 2-5MB (era 12-15MB)
✅ URL contém: w_720,q_60 ou w_1920,q_75
✅ Carregamento < 5s em 3G
```

---

### Teste 2: Verificar Canvas Performance
```
1. Abra DevTools → Performance tab
2. Clique em "Record"
3. Scroll a página para cima e para baixo
4. Pare a gravação
5. Analise FPS na seção "Rendering"

RESULTADO ESPERADO:
✅ FPS = 55-60 (antes era 15-20)
✅ Nenhum "jank" (travamento)
✅ Frame time < 16ms
✅ Canvas rendering visible
```

---

### Teste 3: Lazy Loading Funcionando
```
1. Abra DevTools → Network tab
2. Marque "Disable cache"
3. Recarregue a página
4. Observe quais arquivos carregam inicialmente

RESULTADO ESPERADO:
✅ Apenas HOME + HEADER + FOOTER carregam no scroll inicial
✅ Problem.html só carrega quando você faz scroll
✅ Transformation.html só carrega quando fica visível
✅ Carregamento inicial reduzido para ~8 componentes
```

---

## 📊 Teste Profundo (15 minutos)

### Teste 4: Lighthouse Score
```
1. DevTools → Lighthouse
2. Clique "Analyze page load"
3. Escolha "Mobile"
4. Aguarde análise

RESULTADO ESPERADO:
✅ Performance: 75+ (antes era 45-50)
✅ LCP (Largest Contentful Paint): 1.8s (antes 3.5s)
✅ FID (First Input Delay): < 100ms
✅ CLS (Cumulative Layout Shift): < 0.1
```

---

### Teste 5: WebPageTest.org
```
1. Vá para https://www.webpagetest.org
2. Insira URL do site
3. Escolha "Mobile (Moto G4)"
4. Escolha "Slow 3G"
5. Clique "Start Test"

RESULTADO ESPERADO:
✅ First Contentful Paint (FCP): 1.2s (antes 2.8s)
✅ Largest Contentful Paint (LCP): 1.8s (antes 3.5s)
✅ Speed Index: 2.5s (antes 4.2s)
✅ Waterfall chart mostra vídeos 2-3MB
```

---

### Teste 6: Throttling de Rede (3G)
```
1. DevTools → Network tab
2. Throttling dropdown → Selecione "Slow 3G"
3. Marque "Disable cache"
4. Recarregue página
5. Observe Timeline

RESULTADO ESPERADO:
✅ Página interativa em 2-3s (antes 5-7s)
✅ Video começa a renderizar < 2s
✅ Scroll funciona suave (55+ FPS)
✅ Nenhum travamento durante carregamento
```

---

## 🔬 Teste Técnico (30 minutos)

### Teste 7: Verificar URLs Otimizadas
```javascript
// Abra Console (F12 → Console) e execute:
console.log(document.querySelector('video').src);

RESULTADO ESPERADO:
// Em mobile (< 600px):
https://res.cloudinary.com/vdgkx5jc/video/upload/w_720,q_60,f_auto/...

// Em desktop:
https://res.cloudinary.com/vdgkx5jc/video/upload/w_1920,q_80,f_auto/...
```

---

### Teste 8: Canvas DPR Verification
```javascript
// No Console, execute:
const canvas = document.getElementById('hero-mesh-canvas');
const dpr = canvas.width / canvas.offsetWidth;
console.log('Canvas DPR:', dpr);

RESULTADO ESPERADO:
// Em mobile: dpr = 1 (era 2)
// Em desktop: dpr = 1 a 2 (dependendo do device)
```

---

### Teste 9: IntersectionObserver Funcionando
```javascript
// No Console, execute:
document.addEventListener('scroll', () => {
    const canvas = document.getElementById('hero-mesh-canvas');
    const rect = canvas.getBoundingClientRect();
    console.log('Canvas visible?', rect.top < window.innerHeight);
});

RESULTADO ESPERADO:
✅ Quando canvas sai da tela: "false"
✅ Quando canvas volta: "true"
✅ Isso controla a renderização
```

---

### Teste 10: ComponentLoader Serial Mode
```javascript
// No Console, execute no mobile (< 600px):
console.log('Mobile mode:', window.innerWidth <= 600);

// Observe no Network tab a sequência de carregamento:
// 1. header.html carrega (espera terminar)
// 2. home.html carrega (espera terminar)
// 3. problem.html espera ser scrollado (lazy load)

RESULTADO ESPERADO:
✅ Componentes carregam 1 por vez (não paralelo)
✅ Main thread tem tempo para respirar
```

---

## 📱 Teste em Dispositivos Reais

### iPhone
```
1. Abra Safari
2. URL: [seu-site]
3. Observe: Scroll suave? Vídeo carrega rápido?
4. Toque em diferentes seções

RESULTADO ESPERADO:
✅ Sem travamentos
✅ Scroll 60fps
✅ Carregamento < 3s em 4G
```

### Android
```
1. Abra Chrome
2. Vá em Settings → Performance
3. Ative "Lite mode" para simular conexão lenta
4. Carregue página

RESULTADO ESPERADO:
✅ Página interativa em 2-3s
✅ Vídeos aparecem sem buffer
✅ Scroll suave
```

---

## 🔍 Debugar Problemas

### Se vídeos ainda forem grandes:
```javascript
// Verifique se getOptimizedVideoUrl está sendo chamada:
// No console:
const video = document.querySelector('video');
console.log('Video URL:', video.src);

// Se não contém w_720 ou w_1920, o optimize não está ativo
```

### Se canvas ainda tiver lag:
```javascript
// Verifique se DPR está certo:
const canvas = document.getElementById('hero-mesh-canvas');
console.log('DPR:', canvas.width / canvas.offsetWidth);

// Se for 2 em mobile, o problema persiste
```

### Se lazy loading não funciona:
```javascript
// Verifique se elementos têm data-lazy-load:
document.querySelectorAll('[data-lazy-load]').length;

// Deve retornar 8 (as 8 páginas abaixo do fold)
```

---

## 📊 Métricas a Monitorar

### Lighthouse (Ideal)
- **Performance:** 80+
- **LCP:** < 1.8s
- **FID:** < 100ms
- **CLS:** < 0.05

### WebPageTest (Ideal)
- **First Byte:** < 600ms
- **First Contentful Paint:** < 1.2s
- **Speed Index:** < 2.5s
- **Fully Loaded:** < 4s

### Real User Experience
- **TTI (Time to Interactive):** < 2.5s
- **Scroll FPS:** 50-60fps
- **No Layout Shifts**
- **Smooth Animations**

---

## ✅ Checklist Final

- [ ] Vídeos carregam em 2-5MB
- [ ] Canvas renderiza em 55-60 FPS
- [ ] Scroll não trava
- [ ] Lazy loading funciona
- [ ] ComponentLoader não bloqueia
- [ ] Lighthouse score > 75
- [ ] WebPageTest FCP < 1.2s
- [ ] Testado em iPhone 8+
- [ ] Testado em Pixel 4a+
- [ ] Testado em 3G Throttling

---

## 🚀 Próximas Etapas

1. **Implementar monitoramento:**
   ```javascript
   // Adicione ao index.html:
   <script async src="https://web-vitals.jsdelivr.net/v1/web-vitals.iife.js"></script>
   <script>
     webVitals.getCLS(console.log);
     webVitals.getFID(console.log);
     webVitals.getFCP(console.log);
     webVitals.getLCP(console.log);
   </script>
   ```

2. **Configurar Google Analytics:**
   - Enviar Web Vitals para GA
   - Monitorar performance real de usuários
   - Alertas quando performance cai

3. **Revisar após 1 semana:**
   - Analisar dados reais de usuários
   - Identificar gargalos restantes
   - Planejar próximas otimizações

---

## 📞 Support

Se encontrar problemas:
1. Verifique console para erros
2. Compare com testes acima
3. Limpe cache do navegador
4. Teste em navegador privado/incógnito
5. Teste em outro dispositivo

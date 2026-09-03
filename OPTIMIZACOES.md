# Performance — go2apply

Documento de referência com o que foi medido, o que foi feito e o que ficou
pendente. Todos os números aqui são **medidos** no deploy da Vercel, não
estimados.

---

## Baseline medido (desktop, 02/09/2026)

| Métrica | Valor | Leitura |
|---|---|---|
| TTFB | 157 ms | ótimo |
| DOMContentLoaded | 457 ms | ótimo |
| **TBT (bloqueio de main-thread)** | **~1 ms** | ótimo |
| CLS | 0 | ótimo |
| Compressão | Brotli ativo | a Vercel já faz sozinha |
| Total transferido | 2,65 MB no 1º ciclo | ruim |
| Vídeo | **85% de todos os bytes** | ruim |

**Conclusão que orienta tudo abaixo:** o gargalo deste site é **mídia e
estratégia de carregamento**, não peso de código. CSS + JS somados dão ~40 KB
e o TBT é de 1 ms. Minificar CSS/JS aqui é irrelevante — foi por isso que
essa ideia saiu do plano.

---

## Rodada 1 — o que realmente valeu

- **Radar canvas removido** — `js/radar-canvas-engine.js` (17,1 KB) e
  `js/radar-phone-widget.js` (6,1 KB) apagados, canvas removido de `hero-bg`
  e `trust`. −23,3 KB e −2 requests.
- **CSS consolidado** — `tokens.css` + `reset.css` + `style.css` viraram
  `css/main.css`. Os `@import` criavam requests em série. −2 requests.
- **Fonte .ttf removida** — só `.woff2` (30,4 KB) permanece, com
  `font-display: swap`. −49 KB.
- **Lazy loading** — `loading="lazy"` + `decoding="async"` nas imagens abaixo
  da dobra (app-intro, contact, auth-drawer, app-journey).
- **Preload da fonte** no `index.html`.

### Correção: o que da rodada 1 não funcionou

O `.htaccess` e o `nginx.conf.example` criados na rodada 1 **não têm efeito
na Vercel** — ela não é Apache nem Nginx e ignora os dois. Pior: o
`.htaccess` estava sendo **servido publicamente** (`GET /.htaccess` → 200).
Ambos foram removidos e substituídos por `vercel.json`.

A promessa de "2ª visita −90%" **não estava acontecendo**. Medido antes da
correção, todos os assets voltavam com:

```
cache-control: public, max-age=0, must-revalidate
```

Zero cache de browser, inclusive na fonte e no CSS. A compressão Brotli, por
outro lado, já estava ativa por padrão na Vercel — não precisava de
configuração nenhuma.

---

## Rodada 2 — o que foi feito

### 1. Bug do loader (era um bug, não uma otimização)

O `dismiss()` removia a trava do body **somente** dentro do `transitionend`.
Se a transição CSS não roda — aba carregada em segundo plano, ou ambiente sem
paint como o próprio Lighthouse — o evento nunca dispara e o body ficava
preso em `overflow:hidden; height:100vh`.

Reproduzido: **112 segundos** após o load, `body.is-loading` ainda presente e
`scrollTo(0, 2000)` sem sair de 0 — a página inteira inacessível, com
10.541 px de conteúdo atrás do overlay. Essa é a condição que o PSI encontra.

Correção: função `release()` idempotente chamada pelo `transitionend` **ou**
por um `setTimeout(800)` de fallback. Fallbacks do loader também encurtados
de 1600 ms → 1200 ms e de 3500 ms → 2500 ms.

### 2. Vídeos

O carrossel baixava ~5,8 MB por ciclo completo, em loop infinito, e seguia
baixando com a hero fora da tela.

**Formato — cuidado aqui.** A tentativa de usar `f_auto` foi **medida e
revertida**: o Cloudinary prioriza compatibilidade e devolve H.264 até no
Chrome, o que piorou o total em **+29%** (5.773 KB → 7.444 KB). O `.webm`
explícito já entregava VP9, que é bem mais eficiente neste material.

A solução final detecta suporte a VP9 (`canPlayType`) e só cai para `f_mp4`
onde o VP9 não toca — essencialmente Safari/iOS, onde antes o vídeo não
rodava **e** o `hero:first-video-ready` nunca disparava, fazendo o loader
comer o timeout inteiro em toda visita de iPhone.

Medições no mesmo clipe (Tk-3):

| Variante | Tamanho |
|---|---|
| Original (`q_auto`, sem cap) | 800 KB |
| `q_auto:good,w_1920,c_limit` (VP9, desktop) | 800 KB — **sem mudança** |
| `q_auto:good,w_960,c_limit` (VP9, mobile) | **223 KB** (−72%) |
| `f_mp4,q_auto:good,w_960,c_limit` (fallback Safari) | 594 KB |
| `f_auto,w_1920` (rejeitado) | 1.606 KB |

**Onde o ganho de bytes realmente acontece:** só no mobile. A fonte dos
clipes já tem largura ≤ 1920 px, então `w_1920,c_limit` é um no-op e
`q_auto:good` equivale ao `q_auto` que já estava lá — desktop segue em
800 KB por clipe. No desktop os ganhos desta rodada vêm de outras frentes: a
pausa fora da viewport (que corta o consumo infinito), o conserto do loader e
os 8 requests eliminados. Reduzir bytes no desktop depende de reencodar os
clipes de origem, começando pelo Tk-4.

Também: **pausa via `IntersectionObserver`** quando a seção sai da viewport.
O ganho não é a pausa em si, é cortar a corrente `ended` → carrega o próximo
clipe, que era a origem do consumo infinito.

### 3. Memoização do component loader

`social-links.html` era buscado **5x**, `btn-cta.html` 3x, `btn-login` e
`trial-banner` 2x cada — 12 requests onde 4 bastavam. O `fetchComponent`
agora guarda a **promise** por URL num `Map`, o que também deduplica pedidos
concorrentes. Resultado de falha é removido do cache para não envenenar
tentativas futuras.

Testado contra os arquivos reais: **10 pedidos → 3 requests de rede**.

### 4. `vercel.json`

Cache por tipo de asset. Escolhas deliberadas:

- **Fontes** → 1 ano `immutable`. O nome do arquivo identifica família e peso,
  o conteúdo não muda.
- **Imagens/ícones** → 30 dias, **sem** `immutable`, porque podem ser
  substituídos mantendo o nome.
- **CSS/JS** → 1 dia + `stale-while-revalidate`. **Não** use `immutable`
  aqui: esses arquivos mudam durante o desenvolvimento e um `immutable` de
  1 ano deixaria visitantes recorrentes presos numa versão antiga. Para
  invalidar na hora, suba o `?v=` na tag correspondente do `index.html`.
- **Fragmentos HTML** (`/components`, `/sections`) → 1 hora, porque são
  editados com frequência e o `index.html` não tem como versioná-los.

> Nota: a Vercel valida o `vercel.json` de forma estrita e rejeita chaves
> desconhecidas. Não adicione comentários (`"//"`) dentro dos objetos de
> `headers` — o deploy falha.

---

## Rodada 3 — limpeza + otimizações de baixo risco (03/09/2026)

Refatoração pedida explicitamente com a restrição de não alterar layout,
design ou comportamento. Duas frentes:

### 1. Arquivos e código mortos removidos

A Rodada 1 registrava a consolidação/remoção de alguns arquivos, mas eles
nunca tinham sido de fato apagados do disco — continuavam sendo
deployados como peso morto:

- `css/tokens.css` (4,6 KB), `css/reset.css` (1,2 KB), `css/style.css`
  (1,2 KB) — conteúdo já 100% absorvido por `css/main.css`, nada mais
  referenciava os três.
- `js/radar-canvas-engine.js` (16,6 KB) e `js/radar-phone-widget.js`
  (6 KB) — feature do radar já removida do HTML, scripts continuavam no
  bundle.
- `sections/objection-breaker/ob-example/ob-example.html` (19,5 KB) — só
  ponto de montagem era um comentário morto em `objection-breaker.html`.
- `assets/imagens/mockup-note.webp` (85,3 KB) — zero referências em
  qualquer HTML/CSS/JS do repo.

Total: **~134 KB removidos do deploy**, fora handlers/CSS mortos pontuais
(ids inexistentes em listeners, seletores CSS nunca aplicados, custom
properties nunca lidas) e a consolidação de lógica duplicada
"fecha o menu, abre o auth-drawer" (btn-login + trial-banner) num helper
único em `js/on-ready.js`.

### 2. Itens 2 e 3 da lista "Pendente" (abaixo) resolvidos

- **Logo**: em vez de redimensionar (testado e descartado — o
  reamostro turva bordas de texto e *aumenta* o peso do PNG, porque
  regiões antes de cor sólida viram gradientes de anti-aliasing que
  comprimem pior), a logo foi requantizada para paleta de 256 cores na
  **mesma resolução** 1904×478 (Pillow, `FASTOCTREE`, sem dithering).
  Original tinha 512 cores, quase todas variações de anti-aliasing nas
  bordas — visualmente idêntica em zoom 4x-6x. **55.029 B → 19.953 B
  (−64%, −34,3 KB)**, sem nenhum risco de blur em telas retina.
- **SVGs**: `pulverrizacao-bg.svg` e `ico-situation-calculadora.svg`
  passados pelo `svgo` (preset padrão, via `npx`). Renderização
  bit-a-bit idêntica (comparado servindo os dois lado a lado no
  navegador). `pulverrizacao-bg.svg`: 61.248 B → 34.164 B (−44%).
  `ico-situation-calculadora.svg`: 35.349 B → 17.398 B (−51%).

Números reais medidos agora (a lista "Pendente" abaixo tinha ficado
desatualizada — os 7 SVGs somavam **~113,6 KB**, não 35 KB como estava
registrado, e o Phosphor tem **38 ícones distintos em uso** — via
`ph-fill ph-*` em `components/**` e `sections/**` —, não ~12).

**Total da Rodada 3: ~212 KB a menos no primeiro carregamento**, sem
tocar em layout, comportamento ou nos vídeos.

---

## Pendente — não foi feito, aguarda decisão

Itens levantados e ainda não aplicados, em ordem de impacto:

1. **`Tk-4-0615-P1.webm` continua sendo o ponto fora da curva.** Mesmo já
   otimizado a `w_960` ele pesa **1.889 KB**, contra 223 KB do Tk-3 nas
   mesmas configurações — **8x**. Nenhuma transformação de entrega resolve
   isso; o clipe de origem precisa ser reencodado (provavelmente duração,
   frame rate ou movimento muito acima dos irmãos). Fora do alcance de uma
   sessão de código — precisa de reencode externo do material de origem.
2. ~~`go2apply-logo-colorido.png`~~ — feito na Rodada 3 (ver acima).
3. ~~7 SVGs via mask-image~~ — os 2 maiores (`pulverrizacao-bg.svg`,
   `ico-situation-calculadora.svg`, juntos ~95,8 KB dos ~113,6 KB totais)
   feitos na Rodada 3. Os 4 restantes (`ico-situation-clima.svg` 6,7 KB,
   `ico-situation-frasco.svg` 5,4 KB, `ico-situation-engrenagens.svg`
   5,3 KB, `ico-situation-bico-pulverizacao.svg` 1,6 KB) já são pequenos —
   ganho marginal, não priorizado.
4. **Phosphor Icons** — o CSS inteiro do peso `fill` vem do CDN
   (`cdn.jsdelivr.net`) para **38 ícones distintos** (não ~12 como estava
   registrado; ~118 usos ao todo, concentrados em `auth-drawer.html`). Um
   sprite SVG local eliminaria a dependência externa, mas é uma migração
   grande e transversal (dezenas de arquivos, ~118 pontos de troca de
   `<i class="ph-fill ph-x">` por `<svg><use></use></svg>`) com risco real
   de diferença sutil de alinhamento/tamanho entre webfont e SVG inline —
   violaria a exigência de "sem alterar layout". Fica pra uma rodada
   dedicada, com verificação visual ponto a ponto.
5. **Waterfall de componentes.** Ainda são ~3 níveis de aninhamento
   (`index.html` → `header`/`hero`/... → subcomponentes → sub-subcomponentes)
   e o preload scanner do browser não vê nada, porque nenhum componente
   existe no HTML inicial. Inline do `header`+`hero` no `index.html`
   eliminaria a 1ª onda, mas o dismiss do loader (`#app-loader` em
   `index.html`) depende do evento `component:mounted` disparado só para
   conteúdo montado dinamicamente via `data-component`/`data-page` — se
   inlinar sem reescrever essa lógica, o loader passa a sempre esperar o
   fallback de 2,5s em vez de dispensar assim que a hero estiver pronta.
   Escolhemos parar na memoização por ora.
6. **Testar a hero num iPhone real.** O fallback mp4 foi validado por
   requisição (retorna `video/mp4;codecs=avc1`, container `ftyp` correto),
   mas não em aparelho.

---

## Como verificar

```bash
curl -sI https://go2apply.com.br/css/main.css | grep -i cache-control
```

```bash
curl -sI -H "Accept-Encoding: br" https://go2apply.com.br | grep -i content-encoding
```

Para as métricas de campo, o PSI é o caminho:
<https://pagespeed.web.dev/>

Atenção ao medir vídeo: a **primeira** requisição de uma transformação nova
do Cloudinary leva 2–5 s porque o derivado é gerado na hora. As seguintes vêm
do edge. Não confunda isso com lentidão do site.

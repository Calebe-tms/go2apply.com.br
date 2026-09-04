# Investigação: assinatura recorrente em 12x com trial de 7 dias

Registro da investigação sobre se dá para combinar, no Pagar.me, as três
propriedades que o negócio precisa na mesma cobrança:

1. **Recorrência anual** (renova sozinha, sem cron nem código próprio)
2. **Parcelamento em 12x no cartão** (cliente paga dividido)
3. **Recebimento integral** para o lojista (via antecipação de recebíveis)
4. **7 dias de trial** antes da primeira cobrança

Complementa o `tutorial-pagarme-api.md`, que documenta a integração já
implementada e testada (pagamento único parcelado + assinatura anual à
vista com trial). Este arquivo cobre só a pergunta em aberto: **dá para
unir os dois em uma coisa só?**

---

## TL;DR — estado atual

**Ainda não confirmado empiricamente**, mas a leitura da documentação
mudou de "não dá" para "provavelmente dá, falta testar contra a API de
verdade". Ver [Conclusão atual](#conclusão-atual-e-próximo-passo) no fim.

---

## 1. Por que a dúvida existe

O código já implementado usa dois caminhos claramente separados:

| | Pedido único (`/orders`) | Assinatura (`/subscriptions` + `/plans`) |
|---|---|---|
| Parcelamento no cartão | Sim (`installments`) | Documentação ambígua — ver histórico abaixo |
| Renova sozinho | Não | Sim |
| PIX | Sim | Não existe |
| Trial nativo | Não | Sim, `trial_period_days` no plano |

O requisito de negócio é: cliente escolhe uma assinatura anual, paga em
12x, tem 7 dias grátis antes de a primeira cobrança sair, e o lojista
recebe o valor cheio adiantado (via antecipação). Isso exige que a MESMA
transação seja, ao mesmo tempo, recorrente e parcelada — daí a dúvida.

---

## 2. Histórico da investigação (ordem cronológica)

### 2.1. Primeira leitura da doc: "não dá"

As primeiras consultas ao campo `installments` em `/plans`,
`/subscriptions` (de plano) e `/subscriptions` (avulsa) devolveram, nos
três lugares, a mesma frase:

> *"Quantidade de parcelas. O número de parcelas deverá ser 1 em
> recorrências."*

Interpretação inicial: regra dura da plataforma, reforçada por um
argumento de mecanismo de mercado — que cobrança recorrente (MIT,
iniciada pelo lojista) e parcelamento seriam classificações mutuamente
exclusivas do lado do adquirente/bandeira, então nenhuma API poderia
combinar as duas.

Com base nessa leitura, foram desenhadas alternativas que **contornam**
a limitação em vez de resolvê-la:

- **Plano mensal** (~R$157/mês) em vez de anual parcelado — native,
  mas muda a oferta percebida pelo cliente.
- **"Desenho A"**: salvar o cartão (`card_id`) no dia 0 sem cobrar nada,
  e um Vercel Cron cria um pedido único em 12x no dia 7 (e de novo a
  cada 12 meses). Entrega as 3 propriedades, mas exige reconstruir à
  mão o que `/subscriptions` daria de graça: retry de cobrança falha,
  aviso ao cliente, corte de acesso (dunning).

Nesse caminho também foi investigado (e descartado) usar
`operation_type: auth_only` para "segurar" uma autorização até o dia 7:
inviável porque o prazo de captura da Visa é de 4 dias úteis — não
alcança 7 dias corridos.

### 2.2. Segunda leitura: a frase é boilerplate repetida, não regra

Ao reexaminar a origem da frase, percebeu-se um furo no argumento
"quatro fontes confirmam": não eram quatro fontes independentes, era o
**mesmo texto colado quatro vezes** nos quatro endpoints — inclusive no
campo `installments` do objeto `credit_card` de `/orders`, onde
recorrência nem existe e onde parcelamento em 12x **já está provado
funcionando** (ver `tutorial-pagarme-api.md`, §7, resultado real:
`"installments": 12`). Uma frase que é falsa no contexto onde está colada
é indício de texto genérico/boilerplate, não de regra válida ali.

### 2.3. Terceira leitura: o campo tem tipos diferentes em plano vs. assinatura — decisivo

Consultando o schema OpenAPI de `criar-plano-1` diretamente (não só a
descrição em prosa), o campo `installments` do **plano** é:

```json
"installments": [3]
```

— **array de inteiros**, com a descrição completa (não só o trecho
repetido):

> *"Opções de parcelamento disponíveis para assinaturas criadas a partir
> do plano. Caso não seja informado, o plano irá disponibilizar apenas
> assinaturas com pagamentos à vista. O número de parcelas deverá ser 1
> em recorrências."*

Isso muda tudo: se parcelamento fosse impossível em recorrência, a
frase "opções de parcelamento disponíveis" e o exemplo `[3]` não
fariam sentido. A leitura que encaixa com os dois tipos de campo:

| Onde | Tipo | Significado |
|---|---|---|
| **Plano** → `installments` | `array` (ex.: `[12]` ou `[1,6,12]`) | quais opções de parcelamento o plano **oferece** |
| **Assinatura** → `installments` | `integer` (default `1`) | qual opção **aquele assinante escolheu**, dentre as do plano |

A frase "deverá ser 1 em recorrências" parece ser um texto genérico mal
reaproveitado nos dois campos (plano e assinatura), não uma restrição
real de dado — como o próprio exemplo oficial do plano (`[3]`)
contradiz.

### 2.4. O que o suporte da Pagar.me respondeu (e o que não respondeu)

Foi aberto chamado perguntando especificamente sobre parcelamento em
recorrência. A resposta do atendente cobriu **só a parte do trial**
(como configurar `trial_period_days` no plano e criar a assinatura a
partir dele) — que já estava implementada e testada. **Não respondeu
nada sobre parcelamento.** Os dois links que ele enviou são os mesmos
endpoints cuja documentação já havia sido lida, incluindo o texto
"deverá ser 1 em recorrências" que motivou a pergunta.

Réplica enviada ao chamado, isolando a pergunta específica:

```
Pergunta objetiva, de sim ou não: numa assinatura criada a partir
de um plano, a cobrança de cada ciclo pode ser parcelada em 12x
no cartão de crédito?

Se SIM: onde configuro (plano ou assinatura)? Precisa de alguma
habilitação na conta?

Se NÃO: preciso saber com clareza para desenhar outra solução.
```

Resposta ainda pendente no momento deste registro.

---

## 3. Erros de raciocínio identificados no processo

Vale registrar para não repetir:

1. **Contar repetições de texto como "fontes independentes" confirmando
   uma regra.** A mesma string colada em vários lugares da doc não é
   evidência mais forte que a string aparecer uma vez — pode só
   significar que é um trecho reutilizado (boilerplate) em vários
   templates de campo.
2. **Confiar na descrição em prosa sem checar o schema/tipo do campo.**
   A prosa ("deverá ser 1") escondia que o campo do plano é um *array*
   — um detalhe que só apareceu ao pedir explicitamente o tipo do
   schema OpenAPI, não a descrição em texto.
3. **Um comando de teste (`curl`) foi escrito com o tipo errado**
   (`"installments": 12` como inteiro no plano, quando o schema pede
   array `[12]`). Se tivesse sido executado, teria retornado erro de
   validação — e esse erro teria sido lido (incorretamente) como
   confirmação da tese "não dá", quando na verdade seria só um erro de
   formato do payload de teste.

---

## 4. Como testar de forma decisiva (ainda não executado)

Comandos corrigidos, para rodar contra o ambiente sandbox
(`sk_test_...`). Não expor a chave secreta em nenhum lugar fora da
variável de ambiente do terminal.

### Passo 1 — criar plano de teste com 12x, SEM trial

(sem trial para a cobrança sair na hora e dar para inspecionar a
transação real; não usar o `PAGARME_PLAN_ID` de produção)

```bash
export PAGARME_SECRET_KEY="sk_test_..."

curl -s https://api.pagar.me/core/v5/plans -X POST \
  -u "$PAGARME_SECRET_KEY:" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TESTE 12x",
    "interval": "year",
    "interval_count": 1,
    "payment_methods": ["credit_card"],
    "billing_type": "prepaid",
    "installments": [12],
    "pricing_scheme": { "scheme_type": "unit", "price": 188400 },
    "quantity": 1
  }'
```

Conferir na resposta: `installments` deve voltar como `[12]` (ou
similar), sem erro de validação.

### Passo 2 — criar assinatura a partir do plano, escolhendo 12x

Precisa de um `card_token` gerado no navegador com a chave pública
(ver `tutorial-pagarme-api.md`, §10) e cartão de teste
`4000000000000010` (aprova tudo).

```bash
curl -s https://api.pagar.me/core/v5/subscriptions -X POST \
  -u "$PAGARME_SECRET_KEY:" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "plan_DO_PASSO_1",
    "payment_method": "credit_card",
    "installments": 12,
    "card_token": "token_AQUI",
    "customer": {
      "name": "Teste 12x",
      "email": "teste12x@exemplo.com",
      "type": "individual",
      "document": "12345678909",
      "document_type": "CPF"
    }
  }'
```

### O que decide o teste

Olhar `charges[].last_transaction.installments` na resposta:

- **`12`** → a API aceitou e processou como parcelado de verdade.
  Confirma que a combinação funciona no sandbox.
- **`1`** (mesmo tendo enviado 12) → a API está coagindo silenciosamente
  para à vista. Confirma a limitação, e de forma mais grave — falharia
  calado em produção se não testado antes.
- **Erro de validação** → confirma a limitação de forma explícita.

### Ressalva importante mesmo se o sandbox aprovar

O `acquirer_name` no sandbox vem como `"simulator"` — o simulador pode
aceitar uma combinação que um adquirente real recusaria, porque quem
de fato impõe (ou não) a exclusividade entre recorrência e parcelamento
é a bandeira/adquirente, não a Pagar.me. Um resultado positivo no
sandbox deve ser tratado como "vale testar com uma venda real de baixo
valor em produção", não como confirmação final.

---

## 5. A pergunta que continua em aberto mesmo se 12x funcionar

Mesmo que a API aceite `installments: 12` numa assinatura, falta
confirmar o **recebimento integral**:

- Por padrão, uma venda parcelada é recebida pelo lojista em parcelas
  (D+31, D+61, D+91...), não de uma vez.
- Receber tudo adiantado exige **antecipação de recebíveis**, que:
  - **não é automática** — precisa ser contratada/configurada
  - **tem taxa**, proporcional aos dias antecipados
- Em uma cobrança **recorrente**, no momento do ciclo 1 os outros 11
  ciclos futuros ainda não existem como transação/recebível — então a
  pergunta de fundo é se a antecipação nesse cenário incide sobre as
  **12 parcelas da cobrança atual** (que already é uma coisa só, do
  ciclo 1) ou se há alguma diferença de tratamento por a cobrança-mãe
  ser uma assinatura.

Essa é a segunda pergunta pendente no chamado de suporte:

```
Um pedido/cobrança de assinatura com "installments": 12 é elegível
para antecipação automática do valor integral? Qual a taxa nesse
cenário?
```

---

## 6. Conclusão atual e próximo passo

| Propriedade | Situação |
|---|---|
| Trial de 7 dias | ✅ nativo, já implementado e testado (`tutorial-pagarme-api.md`) |
| Recorrência anual | ✅ nativo, já implementado e testado |
| **12x na assinatura** | ⚠️ **documentação sugere que sim** (campo `installments` do plano é array de opções, com exemplo oficial `[3]`), mas **não testado contra a API real** — teste do §4 ainda não executado |
| **Recebimento integral (antecipação)** | ❓ não verificado nesse cenário específico — pergunta em aberto no suporte |

**Se o teste do §4 confirmar** que `installments: 12` funciona de
verdade (não só sem erro, mas processado como parcelado no
`last_transaction`), o requisito de negócio original é atendido de
forma **inteiramente nativa** — sem cron, sem `card_id` salvo, sem
dunning próprio, sem o "Desenho A". Só ajustar `create-subscription.js`
para aceitar e repassar o parâmetro `installments`, e criar o plano de
produção já com `installments: [12]`.

**Se o teste falhar** (erro de validação, ou `installments` voltando
como `1` no `last_transaction`), volta a valer o "Desenho A" descrito
em §2.1 (card salvo + cron), como único caminho que entrega as 4
propriedades juntas — assumindo o custo de dunning próprio.

**Próximo passo:** rodar os dois comandos do §4 contra o sandbox e
aguardar a resposta do suporte sobre antecipação (§5).

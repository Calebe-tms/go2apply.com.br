# Tutorial: integração com o Pagar.me — pagamento único e assinatura anual

Este documento registra, passo a passo, tudo que foi feito para conectar a
landing page do go2apply ao Pagar.me, com duas formas de cobrança:

- **Pagamento único** — cartão parcelado em 12x, boleto ou PIX à vista, sem
  renovação automática.
- **Assinatura anual** — cartão ou boleto, cobrança cheia (sem parcelar),
  renovada sozinha todo ano pelo Pagar.me, com 7 dias de trial.

Cobre desde a criação da conta de teste no Pagar.me até os dois endpoints
funcionando de ponta a ponta, com banco de dados gravando o resultado.

---

## Índice

1. [Por que dois modelos de cobrança diferentes](#1-por-que-dois-modelos-de-cobrança-diferentes)
2. [Conta e chaves do Pagar.me](#2-conta-e-chaves-do-pagarme)
3. [Banco de dados: Vercel + Neon Postgres](#3-banco-de-dados-vercel--neon-postgres)
4. [Variáveis de ambiente na Vercel](#4-variáveis-de-ambiente-na-vercel)
5. [Criando o plano da assinatura](#5-criando-o-plano-da-assinatura)
6. [Estrutura de arquivos da integração](#6-estrutura-de-arquivos-da-integração)
7. [Pagamento único — `api/create-order.js`](#7-pagamento-único--apicreate-orderjs)
8. [Assinatura anual — `api/create-subscription.js`](#8-assinatura-anual--apicreate-subscriptionjs)
9. [Webhook — `api/webhook.js`](#9-webhook--apiwebhookjs)
10. [Tokenização de cartão no navegador](#10-tokenização-de-cartão-no-navegador)
11. [Como testar](#11-como-testar)
12. [Armadilhas encontradas (leia antes de mexer)](#12-armadilhas-encontradas-leia-antes-de-mexer)
13. [O que ainda falta](#13-o-que-ainda-falta)

---

## 1. Por que dois modelos de cobrança diferentes

O requisito de negócio: o cliente escolhe entre pagar uma vez (parcelado no
cartão ou à vista) ou assinar com renovação automática anual. No Pagar.me
isso **não é a mesma engine**:

| | Pedido único (`/orders`) | Assinatura (`/subscriptions` + `/plans`) |
|---|---|---|
| Parcelamento no cartão | Sim (`installments`) | **Não** — a doc do Pagar.me é explícita: em recorrência o número de parcelas é sempre 1, cobrança cheia por ciclo |
| Renova sozinho | Não | Sim, automaticamente |
| PIX | Sim | **Não existe** — Pagar.me não suporta PIX em recorrência |
| Trial nativo | Não existe (pedido sempre cobra na hora) | Sim, `trial_period_days` no plano |

Essa diferença técnica é a razão de existirem dois endpoints (`create-order.js`
e `create-subscription.js`) em vez de um só com um parâmetro a mais.

### Sobre o trial de 7 dias

O `trial_period_days` do Pagar.me **exige cartão no cadastro** — ele só
atrasa a cobrança, não dispensa o cartão. Por isso o desenho final ficou:

- **Assinatura anual**: cartão (ou boleto) coletado no cadastro, o Pagar.me
  cobra sozinho 7 dias depois e renova todo ano.
- **Pagamento único**: sem trial nenhum — paga na hora.

---

## 2. Conta e chaves do Pagar.me

### 2.1. Criar uma conta de teste

Contas de teste funcionam igual a uma de produção, mas geram simulações em
vez de cobranças reais, sem custo.

Dois caminhos:
- No dashboard, nível **Merchant** → **Contas** → **Teste** → **Criar conta**
  (perfis Proprietário, Administrador ou Gerente podem fazer isso)
- Ou, na tela de login do Pagar.me, a opção **"Acesse nosso ambiente de
  testes"**, que cria uma conta de teste avulsa e independente

### 2.2. Pegar as chaves

`Configurações → Chaves` (ou `Dados da API` / `API Keys`, dependendo da
versão da dashboard). A tela mostra:

- **Chave pública** (`pk_test_...`) — sempre visível, pode circular no
  navegador
- **Chave secreta** (`sk_test_...`) — precisa ser **criada** clicando em
  "Criar Chave" (não vem pronta). É mostrada **uma única vez** — copie na
  hora, se perder tem que criar outra (até 10 chaves por conta)

Ao criar a chave, escolha o escopo **Transacional** (não "Total") — é o
suficiente para criar cliente, pedido, plano e assinatura, sem dar acesso a
saque ou configuração de recebedores.

> **Aviso de segurança**: nunca cole a chave secreta em chat, código-fonte ou
> qualquer lugar que não seja a variável de ambiente do servidor. Se isso
> acontecer sem querer, revogue e crie outra.

### 2.3. Confirmar o prefixo

| Ambiente | Secreta | Pública |
|---|---|---|
| Teste (sandbox) | `sk_test_...` | `pk_test_...` |
| Produção | `sk_...` | `pk_...` |

O endpoint da API é **o mesmo** nos dois ambientes
(`https://api.pagar.me/core/v5`) — é a chave enviada que determina se a
transação usa o simulador ou o fluxo real.

---

## 3. Banco de dados: Vercel + Neon Postgres

### 3.1. Por que existe um banco

A LP guarda uma tabela mínima ("tabela ponte") com uma linha por cliente,
registrando até quando aquele e-mail tem acesso liberado. Não é um backend
de usuários — é só o suficiente para funcionar enquanto não existe conexão
com o backend real do app (que teria login de verdade).

### 3.2. Criar o banco

No projeto na Vercel: **Storage → Create Database → Postgres** (hoje isso é
uma integração de marketplace com a Neon, não mais o antigo "Vercel
Postgres" nativo).

Ao conectar, três campos importam:

| Campo | O que escolher | Por quê |
|---|---|---|
| **Environments** | Production + Preview (Development se adiciona depois, ver §3.4) | onde a connection string fica disponível |
| **Create Database Branch For Deployment** | **Desmarcado** nos dois (Preview e Production) | marcado, cria bancos Neon *isolados* por ambiente — e o plano Free não permite branches extras. Um banco só, compartilhado, é o que o projeto precisa |
| **Custom Environment Variable Prefix** | **Deixe vazio** | se preencher (ex.: `STORAGE`), os nomes das variáveis viram `STORAGE_DATABASE_URL` em vez de `DATABASE_URL` — e o código não acha a variável |
| **Sensitive** | Ativar | é uma credencial de banco, mesma categoria de uma API key |

### 3.3. Custo

Plano Free da Neon: 0,5 GB de armazenamento, 5 GB de transferência/mês,
compute com scale-to-zero (desliga sozinho quando ocioso, sem custo).
Cobrança é unificada na fatura da Vercel — **a garantia mais forte contra
custo inesperado é não ter nenhum método de pagamento cadastrado** em
Vercel → Billing → Payment Methods; sem cartão, não tem como cobrar.

Migrations de verdade (histórico versionado de mudanças de schema, tipo
Prisma Migrate) não são um recurso da Neon — para uma tabela só, mudando
pouco, manter `db/schema.sql` manualmente (ver §3.5) é suficiente.

### 3.4. Adicionar o ambiente Development

Isso é necessário para `vercel dev` rodar localmente. Vá em **Storage → seu
banco**, clique na etiqueta de ambientes (ex.: "Production, Preview") e
tente adicionar Development.

**Armadilha conhecida**: se o projeto já está conectado a Production e
Preview, o mesmo formulário não deixa simplesmente "adicionar" Development
à conexão existente — dá o erro *"This project is already connected to the
target store in one of the chosen environments"*. A solução é reabrir o
formulário de conexão e selecionar **só Development** no dropdown de
Environments (desmarcando Production e Preview ali dentro) — isso cria uma
segunda conexão, só para Development, sem conflitar com a que já existe.

### 3.5. Criar a tabela

No **console da Neon** (não é a mesma tela da Vercel — acesse via
`neon.tech` ou pelo link "Open in Neon" a partir da integração), aba **SQL
Editor**, cole e execute:

```sql
-- Tabela ponte entre o Pagar.me e o app go2apply/equalizagro.
--
-- Não é um backend de clientes: é só o mínimo para saber, por e-mail, até
-- quando alguém tem acesso liberado, enquanto não existe acesso ao backend
-- real do app para sincronizar isso lá. Quando esse acesso existir, este
-- arquivo e a tabela deixam de ser necessários — o app real passa a ser a
-- fonte da verdade sobre "quem pode entrar".
--
-- Existem dois caminhos de cobrança bem diferentes no Pagar.me, e a tabela
-- precisa registrar os dois na mesma linha por cliente:
--   - "one_time": pedido único (/orders) — cartão parcelado, boleto ou PIX
--     à vista. Não renova sozinho; o acesso vale por 1 ano da compra.
--   - "subscription": assinatura recorrente (/subscriptions) — cartão ou
--     boleto, cobrança cheia (sem parcelar) repetida automaticamente a
--     cada ano pelo próprio Pagar.me.
-- `purchase_type` diz qual dos dois se aplica àquela linha, e por isso as
-- colunas específicas de cada caminho (pagarme_order_id de um lado,
-- pagarme_subscription_id/plan_id do outro) ficam nulas quando não usadas.
--
-- Este script roda UMA VEZ, manualmente, no console SQL do Postgres da
-- Vercel (aba Storage → seu banco → Query). O código da aplicação nunca
-- cria ou altera esta tabela sozinho, só lê e escreve linhas nela.

CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,

    -- E-mail é o elo que, no futuro, vai casar com o login do app real.
    -- Único porque, nesta primeira versão, cada pessoa tem no máximo uma
    -- compra/assinatura ativa por vez.
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    document TEXT, -- CPF, como veio do cadastro

    purchase_type TEXT NOT NULL CHECK (purchase_type IN ('one_time', 'subscription')),

    -- Referências cruzadas para conferir o registro correspondente no
    -- dashboard do Pagar.me sem precisar adivinhar.
    pagarme_customer_id TEXT,
    pagarme_order_id TEXT,        -- só preenchido quando purchase_type = one_time
    pagarme_subscription_id TEXT, -- só preenchido quando purchase_type = subscription
    plan_id TEXT,                 -- idem

    payment_method TEXT NOT NULL CHECK (payment_method IN ('credit_card', 'boleto', 'pix')),

    -- Vocabulário difere por purchase_type — purchase_type desambigua qual
    -- se aplica a cada linha:
    --   one_time:     paid | pending | failed
    --   subscription: future | active | past_due | canceled
    -- "future" (confirmado testando direto contra a API — não é "trialing"
    -- como o nome sugeriria) é o status enquanto a assinatura está no
    -- trial_period_days do plano: já criada no dia 1 (cartão já
    -- cadastrado), só a cobrança que fica pra depois. Pagamento único não
    -- tem trial: paga na hora.
    status TEXT NOT NULL,

    -- Campo unificado que o app real vai checar, independente de qual
    -- caminho a pessoa escolheu: "até quando esse e-mail tem acesso".
    -- Para one_time é a data da compra + 1 ano; para subscription é o fim
    -- do ciclo atual, que se renova sozinho enquanto a assinatura seguir
    -- ativa (o webhook atualiza este campo a cada renovação).
    access_until TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A busca mais comum vai ser "por pedido ou assinatura do Pagar.me",
-- quando o webhook chega avisando uma mudança de status.
CREATE INDEX IF NOT EXISTS idx_customers_pagarme_order_id
    ON customers (pagarme_order_id);
CREATE INDEX IF NOT EXISTS idx_customers_pagarme_subscription_id
    ON customers (pagarme_subscription_id);
```

Repare a tabela de exemplo que a própria Neon cria sozinha
(`playing_with_neon`) em todo projeto novo — pode ignorar, não é nossa.

### 3.6. Cliente de banco no código: `@neondatabase/serverless`

**Não use `@vercel/postgres`** — está descontinuado desde que a Vercel
migrou para integrações de marketplace (junho de 2025). O pacote certo é o
driver oficial da Neon:

```bash
npm install @neondatabase/serverless
```

Diferente do `@vercel/postgres`, ele **não exporta um `sql` pronto** — cria-se
a função passando a connection string:

```js
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const rows = await sql`SELECT * FROM customers WHERE email = ${email}`;
```

---

## 4. Variáveis de ambiente na Vercel

| Variável | Valor | Ambientes |
|---|---|---|
| `PAGARME_SECRET_KEY` | `sk_test_...` | Development + Preview (nunca Production até ter a chave real) |
| `PAGARME_PLAN_ID` | `plan_...` (ver §5) | Development + Preview |
| `DATABASE_URL` / `POSTGRES_URL` / etc. | injetadas sozinhas pela integração Neon | Production + Preview + Development |

### Armadilhas do formulário de env vars da Vercel

- **Sensitive e Development são mutuamente exclusivos.** Marcar Development
  desliga o Sensitive automaticamente. Para uma chave de sandbox, isso é um
  trade-off aceitável; nunca faça isso com a chave de produção.
- **Não dá para combinar "Preview de uma branch específica" com
  "Development" numa única linha.** A solução é criar **duas linhas**
  separadas com o mesmo nome e mesmo valor — a Vercel aceita isso desde que
  os ambientes não se sobreponham.
- **Editar uma variável existente para adicionar um ambiente pode falhar**
  com "already connected" se o ambiente que falta exigir reabrir o
  formulário do zero selecionando só o que falta (mesma lógica do banco,
  §3.4).
- Depois de qualquer mudança de env var, **reinicie o `vercel dev`** — ele
  só carrega as variáveis no início do processo, não em quente.

### Como conferir que uma variável realmente está disponível

Sem depender de "acho que salvei certo", puxe o ambiente de verdade:

```bash
npx vercel env pull .env.development.local --environment=development --yes
grep -o '^[A-Z_]*=' .env.development.local | sort
```

Isso mostra exatamente quais nomes de variável estão acessíveis, sem
expor os valores.

---

## 5. Criando o plano da assinatura

Só a assinatura anual precisa de um plano — pedido único não usa `/plans`.
Isso é feito **uma vez**, fora do código, via `curl`:

```bash
curl https://api.pagar.me/core/v5/plans -X POST \
  -u "sk_test_SUA_CHAVE:" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "go2apply Assinatura Anual",
    "interval": "year",
    "interval_count": 1,
    "trial_period_days": 7,
    "payment_methods": ["credit_card", "boleto"],
    "billing_type": "prepaid",
    "pricing_scheme": { "scheme_type": "unit", "price": 179000 },
    "quantity": 1
  }'
```

Campos que importam:
- `interval: "year"` + `interval_count: 1` — cobra uma vez por ano
- `trial_period_days: 7` — atrasa a primeira cobrança em 7 dias (mas exige
  cartão/boleto já no cadastro, ver §1)
- `payment_methods` — sem `"pix"`, porque não existe em recorrência
- `pricing_scheme.price: 179000` — R$ 1.790,00, em centavos

A resposta traz `"id": "plan_..."` — esse valor vai na variável de ambiente
`PAGARME_PLAN_ID` (§4). **Sandbox e produção são bancos de dados
completamente separados no Pagar.me** — quando a chave de produção existir,
é preciso criar um plano novo com ela; não dá para reaproveitar o
`plan_id` do sandbox.

---

## 6. Estrutura de arquivos da integração

```
api/
├── _pagarme.js           # helper: autenticação Basic Auth com a chave secreta
├── create-order.js       # pagamento único -> POST /orders
├── create-subscription.js # assinatura anual -> POST /subscriptions
└── webhook.js             # recebe eventos do Pagar.me, atualiza o banco

db/
└── schema.sql             # schema da tabela `customers` (rodar manualmente)
```

O prefixo `_` em `_pagarme.js` é proposital: dentro de `/api`, a Vercel
transforma cada arquivo em rota pública automaticamente — um arquivo
começando com `_` fica de fora desse mapeamento, existe só para ser
importado pelos outros.

### `api/_pagarme.js` — o helper compartilhado

```js
const PAGARME_BASE_URL = 'https://api.pagar.me/core/v5';

async function pagarme(path, options = {}) {
    const secretKey = process.env.PAGARME_SECRET_KEY;
    if (!secretKey) {
        throw new Error('PAGARME_SECRET_KEY não configurada nas variáveis de ambiente da Vercel.');
    }

    // Basic Auth manual: "usuário:senha" em base64, com senha vazia.
    const authHeader = 'Basic ' + Buffer.from(`${secretKey}:`).toString('base64');

    const response = await fetch(`${PAGARME_BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
            ...options.headers
        }
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const error = new Error(`Pagar.me respondeu ${response.status} em ${path}`);
        error.status = response.status;
        error.body = data;
        throw error;
    }

    return data;
}

module.exports = { pagarme, PAGARME_BASE_URL };
```

A autenticação do Pagar.me é **HTTP Basic**, não Bearer token: a secret key
vai como usuário, senha vazia.

---

## 7. Pagamento único — `api/create-order.js`

Cria um **pedido avulso** (`POST /orders`). Preço e parcelas são decididos
no servidor — nunca vêm do navegador, para ninguém conseguir adulterar a
requisição.

```js
const PRICING = {
    credit_card: 188400, // R$ 1.884,00 em 12x de R$ 157,00
    boleto: 179000,      // R$ 1.790,00 à vista
    pix: 179000          // R$ 1.790,00 à vista (mesmo preço do boleto)
};
```

Cada meio de pagamento tem um formato diferente dentro de `payments[]`:

```js
const PAYMENT_BUILDERS = {
    credit_card(card_token) {
        // card_token no MESMO NÍVEL de `card`, não aninhado dentro dele.
        return { payment_method: 'credit_card', credit_card: { installments: 12, card_token } };
    },
    boleto() {
        const identificador = Date.now().toString().slice(-10);
        return {
            payment_method: 'boleto',
            boleto: {
                due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                instructions: 'go2apply - Plano Anual. Pagamento único, sem renovação automática.',
                nosso_numero: identificador,
                type: 'DM',
                document_number: identificador
            }
        };
    },
    pix() {
        return { payment_method: 'pix', pix: { expires_in: 1800 } };
    }
};
```

### Requisitos por meio de pagamento (descobertos testando, não só lendo doc)

| Meio | Exige | Confirmado como |
|---|---|---|
| Cartão | `card_token` | funciona sem endereço/telefone |
| Boleto | `customer.address` completo (`line_1`, `zip_code`, `city`, `state`) | testado — sem isso, erro `"Customer address required."` |
| PIX | `customer.phones.mobile_phone` (`country_code`, `area_code`, `number`) | doc explícita, endereço não é necessário |

`nosso_numero` e `document_number` do boleto identificam o documento de
forma única — como não existe um sistema de numeração sequencial próprio
ainda, são gerados a partir do timestamp.

### Gravação no banco

Depois que o Pagar.me responde com sucesso, grava (ou atualiza) a linha em
`customers`, em bloco separado e com `try/catch` próprio — se a gravação
falhar, isso **não** deve virar erro para o cliente, já que o pagamento em
si já foi processado:

```js
const accessUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

await sql`
    INSERT INTO customers (
        email, full_name, document, purchase_type,
        pagarme_customer_id, pagarme_order_id,
        payment_method, status, access_until, updated_at
    ) VALUES (
        ${email}, ${name}, ${document}, 'one_time',
        ${order.customer?.id || null}, ${order.id},
        ${payment_method}, ${order.status || 'pending'}, ${accessUntil}, now()
    )
    ON CONFLICT (email) DO UPDATE SET ...;
`;
```

`access_until` assume otimisticamente 1 ano a partir de agora, mesmo se o
status inicial for `pending` (boleto/PIX aguardando pagamento) — se o
cliente nunca pagar, o webhook (§9) corrige isso depois.

### Resultado real de um teste (cartão, aprovado)

```json
{
  "id": "or_3mN74gYsJPiYoOev",
  "amount": 188400,
  "status": "paid",
  "charges": [{
    "payment_method": "credit_card",
    "status": "paid",
    "last_transaction": { "installments": 12, "acquirer_name": "simulator", "success": true }
  }]
}
```

---

## 8. Assinatura anual — `api/create-subscription.js`

Cria uma **assinatura de verdade** (`POST /subscriptions`), vinculada ao
`plan_id` fixo criado no §5.

```js
const ALLOWED_PAYMENT_METHODS = ['credit_card', 'boleto']; // sem PIX

const paymentFields = payment_method === 'credit_card'
    ? { card_token }   // NÍVEL RAIZ — ver armadilha #1 no §12
    : {};

subscription = await pagarme('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
        plan_id: planId,
        payment_method,
        ...paymentFields,
        customer: { name, email, type: 'individual', document, document_type: 'CPF' }
    })
});
```

### Gravação no banco

```js
const accessUntil = subscription.start_at
    || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

await sql`
    INSERT INTO customers (
        email, full_name, document, purchase_type,
        pagarme_customer_id, pagarme_subscription_id, plan_id,
        payment_method, status, access_until, updated_at
    ) VALUES (
        ${email}, ${name}, ${document}, 'subscription',
        ${subscription.customer?.id || null}, ${subscription.id}, ${planId},
        ${payment_method}, ${subscription.status || 'future'}, ${accessUntil}, now()
    )
    ON CONFLICT (email) DO UPDATE SET ...;
`;
```

`start_at` é o campo certo para `access_until` durante o trial — é
literalmente a data em que a primeira cobrança vai acontecer. `current_cycle`
vem `null` na criação (só existe depois que o primeiro ciclo real começa).

### Resultado real de um teste (cartão, plano com trial de 7 dias)

```json
{
  "id": "sub_D5VoWGniJRiAoWMz",
  "start_at": "2026-09-11T00:00:00Z",
  "interval": "year",
  "status": "future",
  "plan": { "trial_period_days": 7, "price": 179000 }
}
```

`status: "future"` é o valor real durante o trial — **não** é `"trialing"`
como o nome do evento de webhook (`subscription.created`) sugeriria.

---

## 9. Webhook — `api/webhook.js`

Recebe os eventos que o Pagar.me envia quando o status de um pedido ou
assinatura muda, e atualiza a tabela sem a LP precisar ficar consultando o
Pagar.me.

### Eventos tratados

```js
const EVENT_HANDLERS = {
    // --- Pagamento único ---
    'order.paid': { purchaseType: 'one_time', status: 'paid' },
    'order.payment_failed': { purchaseType: 'one_time', status: 'failed', revokeAccess: true },
    'order.canceled': { purchaseType: 'one_time', status: 'failed', revokeAccess: true },

    // --- Assinatura anual ---
    'invoice.paid': { purchaseType: 'subscription', status: 'active', extendAccess: true },
    'invoice.payment_failed': { purchaseType: 'subscription', status: 'past_due' },
    'subscription.canceled': { purchaseType: 'subscription', status: 'canceled' }
};
```

`subscription.created` **não está na lista de propósito** —
`create-subscription.js` já grava a linha na criação, de forma síncrona;
tratar de novo aqui seria redundante.

### Como `access_until` se comporta por evento

| Evento | `access_until` |
|---|---|
| `order.paid` | não muda (já estava certo desde a criação) |
| `order.payment_failed` / `order.canceled` | **revoga**: vira "agora" |
| `invoice.paid` | **estende**: novo fim de ciclo |
| `invoice.payment_failed` / `subscription.canceled` | não muda — funciona como um período de carência natural até a data que já estava lá |

A query usa `COALESCE` para isso sem precisar de uma variação de SQL por
combinação:

```sql
UPDATE customers
SET status = ${config.status}, access_until = COALESCE(${accessUntil}, access_until), updated_at = now()
WHERE email = ${email};
```

Quando `accessUntil` é `null` (JS), o Postgres recebe `NULL` e o `COALESCE`
mantém o valor que já estava na coluna.

### Identificação da linha certa

`customer.email` é consistente nos três tipos de objeto (pedido, assinatura,
fatura), então é a primeira tentativa. Como reforço, cada família de evento
também aninha um id de forma diferente:

```js
function extractPagarmeId(type, data) {
    if (type.startsWith('order.')) return data?.id || null;
    if (type === 'subscription.canceled') return data?.id || null;
    if (type.startsWith('invoice.')) return data?.subscription?.id || null;
    return null;
}
```

### Sempre responde 200

Mesmo quando não reconhece o evento, ou quando a gravação no banco falha, o
endpoint responde `200`. Um `500` faria o Pagar.me reenviar o mesmo evento
repetidamente — o log (`console.log` do payload completo) já registra o
suficiente para investigar depois.

---

## 10. Tokenização de cartão no navegador

O número do cartão **nunca** deve chegar ao nosso servidor — só o token
resultante. Isso é feito direto do navegador para o Pagar.me, usando a
chave **pública**:

```js
const PAGARME_PUBLIC_KEY = 'pk_test_...'; // pode ficar no código do front, é pública por definição

const tokenResponse = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${PAGARME_PUBLIC_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        type: 'card',
        card: { number, holder_name, exp_month, exp_year, cvv }
    })
});
const { id: cardToken } = await tokenResponse.json();
```

Só depois desse passo o `cardToken` é enviado para `/api/create-order` ou
`/api/create-subscription` (nunca o número do cartão em si).

---

## 11. Como testar

### 11.1. Cartões de teste do simulador

| Número | Resultado |
|---|---|
| `4000000000000010` | aprova tudo |
| `4000000000000028` | recusa ("unauthorized") |
| `4000000000000069` | paga e depois estorna (chargeback) |
| qualquer outro | recusado por padrão |

### 11.2. Rodando localmente

Servidor estático (`python -m http.server`, Live Server do VS Code etc.)
**não roda `/api`** — funções serverless precisam do `vercel dev`:

```bash
npx vercel dev
```

Na primeira vez, ele pede pra linkar ao projeto da Vercel.

### 11.3. Testando o endpoint sem esperar deploy

Dá pra chamar o handler direto via um script Node, sem precisar do
`vercel dev` rodando — carrega o `.env.development.local` manualmente e
invoca a função como a Vercel invocaria:

```js
const fs = require('fs');
fs.readFileSync('.env.development.local', 'utf8').split('\n').forEach((line) => {
    const match = line.match(/^([A-Z_]+)="?(.*?)"?$/);
    if (match) process.env[match[1]] = match[2];
});

const handler = require('./api/create-order.js');

function mockResponse() {
    return {
        statusCode: null, body: null,
        status(code) { this.statusCode = code; return this; },
        json(obj) { this.body = obj; return this; }
    };
}

const req = { method: 'POST', body: { payment_method: 'credit_card', card_token: '...', customer: {...} } };
const res = mockResponse();
await handler(req, res);
console.log(res.statusCode, res.body);
```

Esse é o método usado para validar `create-order.js`, `create-subscription.js`
e `webhook.js` de ponta a ponta neste projeto, incluindo a gravação real no
banco — sem precisar publicar nada.

---

## 12. Armadilhas encontradas (leia antes de mexer)

Coisas que a documentação do Pagar.me não deixa claras, ou descreve de um
jeito que não bate com o comportamento real da API — todas confirmadas
testando direto, não só lendo doc.

1. **`card_token` muda de lugar entre pedido e assinatura.** Em `/orders`,
   fica dentro de `credit_card: { card_token }`. Em `/subscriptions`, fica
   no **nível raiz**, ao lado de `plan_id` e `payment_method` — a doc sugere
   errado (`card: { card_token }`), e isso é rejeitado com
   `"the card number is required"`.

2. **Boleto em pedido único exige campos que a doc lista como obrigatórios
   mas fáceis de esquecer**: `instructions`, `nosso_numero`, `type`,
   `document_number`. Sem eles, erro de validação. Boleto em **assinatura**
   é mais simples — não precisa desses campos.

3. **Boleto em pedido único também exige `customer.address` completo** —
   sem isso, erro `"Customer address required."`. Cartão e PIX não
   precisam. Boleto em assinatura, segundo a doc, tem o endereço como
   opcional (não testado empiricamente).

4. **PIX exige `customer.phones.mobile_phone`** para ter sucesso. Cartão e
   boleto não precisam de telefone nenhum.

5. **Status real da assinatura em trial é `"future"`, não `"trialing"`** —
   apesar do evento de webhook se chamar `subscription.created` e a
   intuição sugerir "trialing".

6. **`current_cycle` vem `null` na criação da assinatura.** O campo certo
   para saber quando a próxima cobrança acontece é `start_at`.

7. **PIX não funciona em assinatura recorrente**, só em pedido único —
   mesmo com PIX habilitado e configurado na conta.

8. **Vercel: Sensitive e Development são mutuamente exclusivos** numa
   variável de ambiente. Marcar Development desliga o Sensitive.

9. **Vercel: não dá pra combinar branch específica de Preview com
   Development** numa única linha de variável — precisa de duas linhas.

10. **Vercel: editar uma integração de Storage para adicionar um ambiente
    que falta pode dar erro "already connected"** — a solução é reabrir o
    formulário e selecionar só o ambiente que falta, criando uma segunda
    conexão em vez de editar a existente.

11. **"Create Database Branch For Deployment" cria bancos Neon isolados por
    ambiente** — no plano Free, isso pode falhar ou não fazer o esperado,
    porque branches extras não são permitidas. Deixe desmarcado para todos
    compartilharem o mesmo banco.

12. **`@vercel/postgres` está descontinuado.** Use `@neondatabase/serverless`
    — e lembre que ele não exporta `sql` pronto, precisa chamar `neon(url)`
    primeiro.

---

## 13. O que ainda falta

- **Cartão de débito**: exige fluxo de autenticação 3DS (`authentication`
  com `mpi`/`eci`/`cavv`), disponível só para contas "Gateway" — precisa de
  investigação própria antes de implementar.
- **Verificação de autenticidade do webhook**: a doc pública do Pagar.me não
  descreve o mecanismo (assinatura HMAC, header específico). Existe um
  checkbox "usar esta chave para assinar postbacks" na criação da API key,
  mas o mecanismo de verificação do lado do servidor não está documentado —
  confirmar com o suporte do Pagar.me antes de produção.
- **PIX retornando "Internal Server Error"**: confirmado que não é erro de
  payload (a cobrança chega a ser criada, com QR Code gerado, e falha
  depois, processando) — é um problema do lado da plataforma do Pagar.me.
  Precisa de chamado com o suporte deles.
- **Renovação automática de assinatura**: fora de escopo por decisão
  explícita — o Pagar.me cuida disso sozinho (é justamente a vantagem de
  usar `/subscriptions`), mas o campo `access_until` do webhook para
  `invoice.paid` usa um nome de campo (`period.end_at`) ainda não confirmado
  contra um payload real do Pagar.me — só testável quando um webhook de
  verdade chegar.
- **Chave de produção**: pendente de permissão de Administrador/Proprietário
  na conta real da Equalizagro. Quando existir, um plano novo precisa ser
  criado com ela (sandbox e produção não compartilham dados).
- **Cadastro do webhook no dashboard do Pagar.me**: a URL do endpoint ainda
  não foi registrada em Configurações → Webhooks.

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

-- VaultFlow Transactions Service – initial schema

CREATE TABLE IF NOT EXISTS transactions (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    source_account_id UUID         NOT NULL,
    target_account_id UUID,
    type              VARCHAR(50)  NOT NULL,   -- DEPOSIT | WITHDRAWAL | TRANSFER
    amount            NUMERIC(19, 4) NOT NULL,
    currency          CHAR(3)      NOT NULL DEFAULT 'USD',
    status            VARCHAR(50)  NOT NULL,   -- PENDING | COMPLETED | FAILED
    description       VARCHAR(500),
    category          VARCHAR(100),            -- AI-assigned category
    created_at        TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_source    ON transactions(source_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_target    ON transactions(target_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created   ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status    ON transactions(status);

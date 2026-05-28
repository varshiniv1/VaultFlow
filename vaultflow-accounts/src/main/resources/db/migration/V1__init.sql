-- VaultFlow Accounts Service – initial schema
-- Flyway runs this once; baseline-on-migrate keeps existing DBs safe.

CREATE TABLE IF NOT EXISTS accounts (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number  VARCHAR(255) UNIQUE NOT NULL,
    owner_name      VARCHAR(255) NOT NULL,
    account_type    VARCHAR(50)  NOT NULL,   -- SAVINGS | CHECKING
    balance         NUMERIC(19, 4) NOT NULL DEFAULT 0,
    currency        CHAR(3)      NOT NULL DEFAULT 'USD',
    status          VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | FROZEN | CLOSED
    created_at      TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_accounts_status         ON accounts(status);

-- VaultFlow Fraud Service – initial schema

CREATE TABLE IF NOT EXISTS fraud_alerts (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID          NOT NULL,
    account_id     UUID          NOT NULL,
    amount         NUMERIC(19, 4) NOT NULL,
    reason         VARCHAR(1000) NOT NULL,
    status         VARCHAR(50)   NOT NULL DEFAULT 'OPEN', -- OPEN | REVIEWED | DISMISSED
    created_at     TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_account     ON fraud_alerts(account_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_transaction ON fraud_alerts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status      ON fraud_alerts(status);

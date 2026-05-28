-- VaultFlow Notifications Service – initial schema

CREATE TABLE IF NOT EXISTS notifications (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id     UUID         NOT NULL,
    transaction_id UUID         NOT NULL,
    type           VARCHAR(100) NOT NULL,   -- TRANSACTION_COMPLETED | HIGH_VALUE_TRANSACTION | TRANSFER_SENT | TRANSFER_RECEIVED
    message        TEXT         NOT NULL,
    status         VARCHAR(50)  NOT NULL DEFAULT 'PENDING', -- PENDING | SENT | FAILED
    created_at     TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_account    ON notifications(account_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created    ON notifications(created_at DESC);

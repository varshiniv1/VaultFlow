-- Idempotency records for transfer requests.
-- If a client retries POST /accounts/{id}/transfer with the same
-- Idempotency-Key header, we return the cached result instead of
-- processing the transfer again (prevents double-spend).

CREATE TABLE IF NOT EXISTS idempotency_records (
    idempotency_key VARCHAR(255) PRIMARY KEY,
    account_id      UUID         NOT NULL,
    status          SMALLINT     NOT NULL,   -- HTTP status code of the original response
    response_body   TEXT         NOT NULL,   -- JSON body of the original response
    created_at      TIMESTAMP    NOT NULL DEFAULT now()
);

-- Auto-expire records older than 24 hours (cleaned up by application, not DB)
CREATE INDEX IF NOT EXISTS idx_idempotency_created ON idempotency_records(created_at);

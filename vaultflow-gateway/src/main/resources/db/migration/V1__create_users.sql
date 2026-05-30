-- Users table for the API Gateway auth service.
-- Each row is one registered VaultFlow user.
-- Built-in seed accounts (admin / user) are inserted by UserStore @PostConstruct
-- using BCryptPasswordEncoder so the hash is always correct.

CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT uq_users_email UNIQUE (email)
);

-- Fast lookups by email (the hot path for every login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

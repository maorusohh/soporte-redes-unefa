
-- =========================================================
-- AUTH-P0
-- Migracion inicial de la base de datos PostgreSQL
-- =========================================================

-- 1. Tabla principal de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'USER')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    password_hash TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de sesiones de autenticacion
CREATE TABLE auth_sessions (
    token_digest CHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (token_digest ~ '^[0-9a-f]{64}$')
);

-- 3. Tabla de codigos de recuperacion
CREATE TABLE password_reset_tokens (
    token_digest CHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_by_admin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (token_digest ~ '^[0-9a-f]{64}$')
);

-- 4. Tabla de solicitudes de recuperacion
CREATE TABLE recovery_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Indices para agilizar las consultas por usuario
CREATE INDEX idx_auth_sessions_user_id
    ON auth_sessions(user_id);

CREATE INDEX idx_password_reset_tokens_user_id
    ON password_reset_tokens(user_id);

CREATE INDEX idx_password_reset_tokens_admin_id
    ON password_reset_tokens(created_by_admin_id);

CREATE INDEX idx_recovery_requests_user_id
    ON recovery_requests(user_id);

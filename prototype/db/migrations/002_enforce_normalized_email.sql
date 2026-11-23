-- AUTH-P0 / DB-P0
-- Conservar UNIQUE(email) existente y exigir email canónico minúscula/trim.
-- Debe ejecutarse DESPUÉS de 001_create_auth_tables.sql.
-- Precondición: no debe haber usuarios con email no normalizado.
ALTER TABLE users
    ADD CONSTRAINT users_email_normalized
    CHECK (email = lower(btrim(email)));

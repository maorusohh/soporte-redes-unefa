"""Implementación PostgreSQL del repositorio de autenticación AUTH-P0."""

from __future__ import annotations

import os
from datetime import datetime
from uuid import UUID

import psycopg
from psycopg.rows import dict_row

from app.auth.repository import (
    AuthAccount,
    AuthRepository,
    AuthSession,
    DuplicateEmailError,
)
from app.auth.schemas import UserRole


class PostgresAuthRepository:
    """Repositorio de autenticación respaldado por PostgreSQL."""

    def __init__(self, conninfo: str | None = None) -> None:
        self._conninfo = conninfo or os.getenv("DATABASE_URL")

    def _connect(self):
        if self._conninfo:
            return psycopg.connect(
                self._conninfo,
                row_factory=dict_row,
            )

        return psycopg.connect(
            host=os.getenv("PGHOST", "localhost"),
            port=int(os.getenv("PGPORT", "5432")),
            dbname=os.getenv("PGDATABASE", "soporte_redes_auth"),
            user=os.getenv("PGUSER", "postgres"),
            password=os.getenv("PGPASSWORD"),
            row_factory=dict_row,
        )

    @staticmethod
    def _normalize_email(email: str) -> str:
        return email.strip().casefold()

    @staticmethod
    def _account(row: dict) -> AuthAccount:
        return AuthAccount(
            id=row["id"],
            email=row["email"],
            role=UserRole(row["role"]),
            active=row["active"],
            password_hash=row["password_hash"],
        )

    def find_user_by_email(self, email: str) -> AuthAccount | None:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT id, email, role, active, password_hash
                FROM users
                WHERE email = %s
                """,
                (self._normalize_email(email),),
            ).fetchone()

        return self._account(row) if row else None

    def find_user_by_id(self, user_id: UUID) -> AuthAccount | None:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT id, email, role, active, password_hash
                FROM users
                WHERE id = %s
                """,
                (user_id,),
            ).fetchone()

        return self._account(row) if row else None

    def list_users(self) -> list[AuthAccount]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT id, email, role, active, password_hash
                FROM users
                ORDER BY created_at, id
                """
            ).fetchall()

        return [self._account(row) for row in rows]

    def create_user(self, email: str, role: UserRole) -> AuthAccount:
        normalized_email = self._normalize_email(email)

        try:
            with self._connect() as conn:
                row = conn.execute(
                    """
                    INSERT INTO users (email, role, active, password_hash)
                    VALUES (%s, %s, TRUE, NULL)
                    RETURNING id, email, role, active, password_hash
                    """,
                    (normalized_email, role.value),
                ).fetchone()

            return self._account(row)

        except psycopg.errors.UniqueViolation as exc:
            if exc.diag.constraint_name == "users_email_key":
                raise DuplicateEmailError(normalized_email) from exc
            raise

    def save_session(
        self,
        token_digest: str,
        user_id: UUID,
        expires_at: datetime,
    ) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO auth_sessions (
                    token_digest, user_id, expires_at
                )
                VALUES (%s, %s, %s)
                """,
                (token_digest, user_id, expires_at),
            )

    def find_session(self, token_digest: str) -> AuthSession | None:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT user_id, expires_at, revoked_at
                FROM auth_sessions
                WHERE token_digest = %s
                """,
                (token_digest,),
            ).fetchone()

        if row is None:
            return None

        return AuthSession(
            user_id=row["user_id"],
            expires_at=row["expires_at"],
            revoked_at=row["revoked_at"],
        )

    def revoke_session(self, token_digest: str, now: datetime) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE auth_sessions
                SET revoked_at = %s
                WHERE token_digest = %s
                  AND revoked_at IS NULL
                """,
                (now, token_digest),
            )

    def replace_password_and_revoke_sessions(
        self,
        user_id: UUID,
        password_hash: str,
        now: datetime,
    ) -> None:
        with self._connect() as conn:
            with conn.transaction():
                conn.execute(
                    """
                    UPDATE users
                    SET password_hash = %s
                    WHERE id = %s
                    """,
                    (password_hash, user_id),
                )

                conn.execute(
                    """
                    UPDATE auth_sessions
                    SET revoked_at = %s
                    WHERE user_id = %s
                      AND revoked_at IS NULL
                    """,
                    (now, user_id),
                )

    def record_recovery_request(
        self,
        user_id: UUID,
        now: datetime,
    ) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO recovery_requests (user_id, requested_at)
                VALUES (%s, %s)
                """,
                (user_id, now),
            )

    def issue_reset_token(
        self,
        user_id: UUID,
        token_digest: str,
        expires_at: datetime,
        admin_id: UUID,
        now: datetime,
    ) -> None:
        with self._connect() as conn:
            with conn.transaction():
                conn.execute(
                    """
                    SELECT id
                    FROM users
                    WHERE id = %s
                    FOR UPDATE
                    """,
                    (user_id,),
                ).fetchone()

                conn.execute(
                    """
                    UPDATE password_reset_tokens
                    SET consumed_at = %s
                    WHERE user_id = %s
                      AND consumed_at IS NULL
                    """,
                    (now, user_id),
                )

                conn.execute(
                    """
                    INSERT INTO password_reset_tokens (
                        token_digest,
                        user_id,
                        created_by_admin_id,
                        expires_at
                    )
                    VALUES (%s, %s, %s, %s)
                    """,
                    (token_digest, user_id, admin_id, expires_at),
                )

    def consume_reset_and_change_password(
        self,
        email: str,
        token_digest: str,
        new_password_hash: str,
        now: datetime,
    ) -> bool:
        normalized_email = self._normalize_email(email)

        with self._connect() as conn:
            with conn.transaction():
                user = conn.execute(
                    """
                    SELECT id
                    FROM users
                    WHERE email = %s
                    FOR UPDATE
                    """,
                    (normalized_email,),
                ).fetchone()

                if user is None:
                    return False

                token = conn.execute(
                    """
                    SELECT token_digest
                    FROM password_reset_tokens
                    WHERE token_digest = %s
                      AND user_id = %s
                      AND consumed_at IS NULL
                      AND expires_at > %s
                    FOR UPDATE
                    """,
                    (token_digest, user["id"], now),
                ).fetchone()

                if token is None:
                    return False

                updated = conn.execute(
                    """
                    UPDATE password_reset_tokens
                    SET consumed_at = %s
                    WHERE token_digest = %s
                      AND consumed_at IS NULL
                    """,
                    (now, token_digest),
                )

                if updated.rowcount != 1:
                    return False

                conn.execute(
                    """
                    UPDATE users
                    SET password_hash = %s
                    WHERE id = %s
                    """,
                    (new_password_hash, user["id"]),
                )

                conn.execute(
                    """
                    UPDATE auth_sessions
                    SET revoked_at = %s
                    WHERE user_id = %s
                      AND revoked_at IS NULL
                    """,
                    (now, user["id"]),
                )

                return True
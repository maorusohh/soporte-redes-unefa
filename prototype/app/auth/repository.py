"""Contrato de persistencia AUTH-P0; pendiente de implementación PostgreSQL.

La API nunca accede directamente a SQL. La implementación de este protocolo
deberá usar transacciones para cambios de contraseña y consumo de reset.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol
from uuid import UUID

from app.auth.schemas import UserRole


@dataclass(frozen=True)
class AuthAccount:
    id: UUID
    email: str
    role: UserRole
    active: bool
    password_hash: str | None


@dataclass(frozen=True)
class AuthSession:
    user_id: UUID
    expires_at: datetime
    revoked_at: datetime | None = None


class DuplicateEmailError(Exception):
    """Se intentó crear una cuenta con email normalizado existente."""


class AuthRepository(Protocol):
    """Backend persistente único; en producción debe ser PostgreSQL."""

    def find_user_by_email(self, email: str) -> AuthAccount | None: ...
    def find_user_by_id(self, user_id: UUID) -> AuthAccount | None: ...
    def list_users(self) -> list[AuthAccount]: ...
    def create_user(self, email: str, role: UserRole) -> AuthAccount: ...

    def save_session(
        self, token_digest: str, user_id: UUID, expires_at: datetime
    ) -> None: ...

    def find_session(self, token_digest: str) -> AuthSession | None: ...
    def revoke_session(self, token_digest: str, now: datetime) -> None: ...
    def replace_password_and_revoke_sessions(
        self, user_id: UUID, password_hash: str, now: datetime
    ) -> None: ...

    def record_recovery_request(self, user_id: UUID, now: datetime) -> None: ...

    def issue_reset_token(
        self, user_id: UUID, token_digest: str, expires_at: datetime,
        admin_id: UUID, now: datetime
    ) -> None: ...

    def consume_reset_and_change_password(
        self, email: str, token_digest: str, new_password_hash: str, now: datetime
    ) -> bool:
        """Una sola transacción: consumir token, cambiar clave, revocar sesiones."""
        ...

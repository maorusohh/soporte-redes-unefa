"""Repositorio VOLÁTIL para una demostración local, no para producción.

Solo debe instanciarse desde app.local_demo:main; la aplicación normal
app.main:app sigue sin almacenamiento y devuelve 503 para AUTH.
"""
from __future__ import annotations

from dataclasses import replace
from datetime import datetime
from threading import RLock
from uuid import UUID, uuid4

from app.auth.repository import AuthAccount, AuthSession, DuplicateEmailError
from app.auth.schemas import UserRole
from app.auth.security import hash_password


class VolatileDemoRepository:
    """Almacenamiento temporal de laboratorio; no es PostgreSQL."""

    def __init__(self) -> None:
        self._lock = RLock()
        self._users: dict[UUID, AuthAccount] = {}
        self._sessions: dict[str, AuthSession] = {}
        self._resets: dict[str, tuple[UUID, datetime, bool]] = {}
        self._requests: list[tuple[UUID, datetime]] = []

    def seed_user(self, email: str, password: str, role: UserRole) -> AuthAccount:
        """Alta solo para el arranque explícito de la demostración."""
        with self._lock:
            if self.find_user_by_email(email):
                raise DuplicateEmailError()
            account = AuthAccount(
                id=uuid4(),
                email=email.casefold(),
                role=role,
                active=True,
                password_hash=hash_password(password),
            )
            self._users[account.id] = account
            return account

    def find_user_by_email(self, email: str) -> AuthAccount | None:
        with self._lock:
            return next(
                (user for user in self._users.values() if user.email == email.casefold()),
                None,
            )

    def find_user_by_id(self, user_id: UUID) -> AuthAccount | None:
        with self._lock:
            return self._users.get(user_id)

    def list_users(self) -> list[AuthAccount]:
        with self._lock:
            return list(self._users.values())

    def create_user(self, email: str, role: UserRole) -> AuthAccount:
        with self._lock:
            if self.find_user_by_email(email):
                raise DuplicateEmailError()
            account = AuthAccount(
                id=uuid4(),
                email=email.casefold(),
                role=role,
                active=True,
                password_hash=None,
            )
            self._users[account.id] = account
            return account

    def save_session(
        self, token_digest: str, user_id: UUID, expires_at: datetime
    ) -> None:
        with self._lock:
            self._sessions[token_digest] = AuthSession(user_id, expires_at)

    def find_session(self, token_digest: str) -> AuthSession | None:
        with self._lock:
            return self._sessions.get(token_digest)

    def revoke_session(self, token_digest: str, now: datetime) -> None:
        with self._lock:
            session = self._sessions.get(token_digest)
            if session:
                self._sessions[token_digest] = replace(session, revoked_at=now)

    def _revoke_user_sessions(self, user_id: UUID, now: datetime) -> None:
        for digest, session in tuple(self._sessions.items()):
            if session.user_id == user_id:
                self._sessions[digest] = replace(session, revoked_at=now)

    def replace_password_and_revoke_sessions(
        self, user_id: UUID, password_hash: str, now: datetime
    ) -> None:
        with self._lock:
            self._users[user_id] = replace(
                self._users[user_id], password_hash=password_hash
            )
            self._revoke_user_sessions(user_id, now)

    def record_recovery_request(self, user_id: UUID, now: datetime) -> None:
        with self._lock:
            self._requests.append((user_id, now))

    def issue_reset_token(
        self,
        user_id: UUID,
        token_digest: str,
        expires_at: datetime,
        admin_id: UUID,
        now: datetime,
    ) -> None:
        with self._lock:
            if admin_id not in self._users:
                raise ValueError("ADMIN no registrado en la simulación")
            for digest, (owner, expiry, used) in tuple(self._resets.items()):
                if owner == user_id:
                    self._resets[digest] = (owner, expiry, True)
            self._resets[token_digest] = (user_id, expires_at, False)

    def consume_reset_and_change_password(
        self, email: str, token_digest: str, new_password_hash: str, now: datetime
    ) -> bool:
        with self._lock:
            account = self.find_user_by_email(email)
            reset = self._resets.get(token_digest)
            if account is None or not account.active or reset is None:
                return False
            owner, expiry, used = reset
            if used or owner != account.id or expiry <= now:
                return False
            self._resets[token_digest] = (owner, expiry, True)
            self._users[account.id] = replace(
                account, password_hash=new_password_hash
            )
            self._revoke_user_sessions(account.id, now)
            return True

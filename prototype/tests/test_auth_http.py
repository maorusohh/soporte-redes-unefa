"""Pruebas HTTP del contrato AUTH-P0 con almacén FALSO y aislado.

No afirman persistencia en PostgreSQL ni autenticación instalada en producción.
"""
from __future__ import annotations

from dataclasses import replace
from datetime import datetime
from threading import RLock
from uuid import UUID, uuid4

from fastapi.testclient import TestClient

from app.auth.repository import (
    AuthAccount, AuthSession, DuplicateEmailError,
)
from app.auth.schemas import UserRole
from app.auth.security import hash_password
from app.main import create_app


ORIGIN = {"Origin": "http://testserver"}
ADMIN_PASSWORD = "Administracion2026!"
USER_PASSWORD = "UsuarioDePrueba2026!"


class FakeAuthRepository:
    """Implementación exclusivamente de pruebas; nunca conectar a runtime real."""

    def __init__(self):
        self.lock = RLock()
        self.users: dict[UUID, AuthAccount] = {}
        self.sessions: dict[str, AuthSession] = {}
        self.resets: dict[str, tuple[UUID, datetime, bool]] = {}
        self.recovery_requests: list[UUID] = []

    def add_seed_user(self, email, role, password, active=True):
        user = AuthAccount(
            id=uuid4(), email=email, role=role, active=active,
            password_hash=hash_password(password)
        )
        self.users[user.id] = user
        return user

    def find_user_by_email(self, email):
        with self.lock:
            return next((u for u in self.users.values() if u.email == email), None)

    def find_user_by_id(self, user_id):
        with self.lock:
            return self.users.get(user_id)

    def list_users(self):
        with self.lock:
            return list(self.users.values())

    def create_user(self, email, role):
        with self.lock:
            if self.find_user_by_email(email):
                raise DuplicateEmailError()
            user = AuthAccount(uuid4(), email, role, True, None)
            self.users[user.id] = user
            return user

    def save_session(self, token_digest, user_id, expires_at):
        with self.lock:
            self.sessions[token_digest] = AuthSession(user_id, expires_at)

    def find_session(self, token_digest):
        with self.lock:
            return self.sessions.get(token_digest)

    def revoke_session(self, token_digest, now):
        with self.lock:
            if token_digest in self.sessions:
                self.sessions[token_digest] = replace(
                    self.sessions[token_digest], revoked_at=now
                )

    def _revoke_all(self, user_id, now):
        for digest, session in tuple(self.sessions.items()):
            if session.user_id == user_id:
                self.sessions[digest] = replace(session, revoked_at=now)

    def replace_password_and_revoke_sessions(self, user_id, password_hash, now):
        with self.lock:
            self.users[user_id] = replace(
                self.users[user_id], password_hash=password_hash
            )
            self._revoke_all(user_id, now)

    def record_recovery_request(self, user_id, now):
        with self.lock:
            self.recovery_requests.append(user_id)

    def issue_reset_token(self, user_id, token_digest, expires_at, admin_id, now):
        with self.lock:
            # El token más reciente invalida los anteriores para ese usuario.
            for digest, (uid, expiry, used) in tuple(self.resets.items()):
                if uid == user_id:
                    self.resets[digest] = (uid, expiry, True)
            self.resets[token_digest] = (user_id, expires_at, False)

    def consume_reset_and_change_password(
        self, email, token_digest, new_password_hash, now
    ):
        with self.lock:
            user = self.find_user_by_email(email)
            entry = self.resets.get(token_digest)
            if user is None or not user.active or entry is None:
                return False
            user_id, expires_at, used = entry
            if used or user_id != user.id or expires_at <= now:
                return False
            self.resets[token_digest] = (user_id, expires_at, True)
            self.users[user_id] = replace(user, password_hash=new_password_hash)
            self._revoke_all(user_id, now)
            return True


def make_app():
    fake = FakeAuthRepository()
    admin = fake.add_seed_user("admin@example.com", UserRole.ADMIN, ADMIN_PASSWORD)
    user = fake.add_seed_user("user@example.com", UserRole.USER, USER_PASSWORD)
    return create_app(auth_repository=fake), fake, admin, user


def login(client, email, password):
    return client.post("/api/v1/auth/login",
                       json={"email": email, "password": password},
                       headers=ORIGIN)


def test_auth_without_database_does_not_offer_fake_login():
    with TestClient(create_app()) as client:
        result = login(client, "admin@example.com", ADMIN_PASSWORD)
        assert result.status_code == 503
        assert client.get("/api/v1/health").status_code == 200
        assert client.get("/").status_code == 200


def test_admin_login_me_and_logout_with_http_cookie():
    app, _, _, _ = make_app()
    with TestClient(app) as client:
        assert client.get("/api/v1/auth/me").status_code == 401
        result = login(client, "admin@example.com", ADMIN_PASSWORD)
        assert result.status_code == 200
        assert result.json()["user"]["role"] == "ADMIN"
        assert "httponly" in result.headers["set-cookie"].lower()
        assert "samesite=strict" in result.headers["set-cookie"].lower()
        assert client.get("/api/v1/auth/me").json()["user"]["email"] == "admin@example.com"
        assert client.get("/api/v1/admin/users").status_code == 200
        assert client.post("/api/v1/auth/logout", headers=ORIGIN).status_code == 204
        assert client.get("/api/v1/auth/me").status_code == 401


def test_user_cannot_access_admin_even_with_direct_request():
    app, _, _, _ = make_app()
    with TestClient(app) as client:
        assert login(client, "user@example.com", USER_PASSWORD).status_code == 200
        assert client.get("/api/v1/admin/users").status_code == 403
        assert client.post(
            "/api/v1/admin/users",
            json={"email":"another@example.com", "role":"ADMIN"},
            headers=ORIGIN
        ).status_code == 403


def test_unknown_and_bad_password_return_same_response():
    app, _, _, _ = make_app()
    with TestClient(app) as client:
        bad = login(client, "admin@example.com", "incorrecta")
        missing = login(client, "missing@example.com", "incorrecta")
        assert bad.status_code == missing.status_code == 401
        assert bad.json() == missing.json()


def test_mutations_reject_foreign_and_missing_origin():
    app, _, _, _ = make_app()
    with TestClient(app) as client:
        params = {"email": "admin@example.com", "password": ADMIN_PASSWORD}
        assert client.post("/api/v1/auth/login", json=params).status_code == 403
        assert client.post(
            "/api/v1/auth/login", json=params,
            headers={"Origin": "https://example.com"}
        ).status_code == 403
        assert client.post("/api/v1/auth/login", json=params, headers=ORIGIN).status_code == 200


def test_password_change_revokes_all_sessions():
    app, _, _, _ = make_app()
    with TestClient(app) as first, TestClient(app) as second:
        assert login(first, "user@example.com", USER_PASSWORD).status_code == 200
        assert login(second, "user@example.com", USER_PASSWORD).status_code == 200
        changed = first.post(
            "/api/v1/auth/change-password",
            json={"current_password": USER_PASSWORD, "new_password": "NuevaContrasena2026!"},
            headers=ORIGIN
        )
        assert changed.status_code == 204
        assert first.get("/api/v1/auth/me").status_code == 401
        assert second.get("/api/v1/auth/me").status_code == 401
        assert login(first, "user@example.com", USER_PASSWORD).status_code == 401
        assert login(first, "user@example.com", "NuevaContrasena2026!").status_code == 200


def test_admin_creates_account_and_issues_one_time_reset():
    app, store, _, _ = make_app()
    with TestClient(app) as client:
        assert login(client, "admin@example.com", ADMIN_PASSWORD).status_code == 200
        created = client.post(
            "/api/v1/admin/users",
            json={"email": "new@example.com", "role": "USER"},
            headers=ORIGIN
        )
        assert created.status_code == 201
        user_id = created.json()["user"]["id"]
        assert login(client, "new@example.com", "NuevaContrasena2026!").status_code == 401
        reset = client.post(
            "/api/v1/admin/password-resets",
            json={"user_id": user_id}, headers=ORIGIN
        )
        assert reset.status_code == 201
        code = reset.json()["code"]
        assert len(code) >= 32
        assert client.post(
            "/api/v1/auth/reset-password",
            json={
                "email": "new@example.com",
                "code": code,
                "new_password": "NuevaContrasena2026!"
            }, headers=ORIGIN
        ).status_code == 204
        assert client.post(
            "/api/v1/auth/reset-password",
            json={"email": "new@example.com", "code": code, "new_password": "OtraContrasena2026!"},
            headers=ORIGIN
        ).status_code == 400
        assert login(client, "new@example.com", "NuevaContrasena2026!").status_code == 200
        assert store.find_user_by_email("new@example.com").password_hash is not None


def test_forgot_password_response_does_not_reveal_account():
    app, store, _, _ = make_app()
    with TestClient(app) as client:
        known = client.post(
            "/api/v1/auth/forgot-password",
            json={"email":"user@example.com"}, headers=ORIGIN
        )
        unknown = client.post(
            "/api/v1/auth/forgot-password",
            json={"email":"missing@example.com"}, headers=ORIGIN
        )
        assert known.status_code == unknown.status_code == 202
        assert known.json() == unknown.json()
        assert len(store.recovery_requests) == 1


def test_existing_heartbeat_remains_usable_with_auth_router():
    app, _, _, _ = make_app()
    with TestClient(app) as client:
        assert client.post(
            "/api/v1/heartbeats", json={"device_id":"PC-LAB-01"}
        ).status_code == 202
        assert client.get("/api/v1/devices").json()["total"] == 1

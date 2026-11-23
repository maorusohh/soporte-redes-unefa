"""Integración real AUTH-P0 con PostgreSQL de pruebas aislado por schema.

La suite local omite estas pruebas si AUTH_TEST_DATABASE_URL no está definida.
Nunca destruye tablas de bases externas: utiliza un schema único y efímero.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import os
from pathlib import Path
from uuid import uuid4

import psycopg
from psycopg import sql
from psycopg.conninfo import make_conninfo
from fastapi.testclient import TestClient
import pytest

from app.auth.postgres_repository import PostgresAuthRepository
from app.auth.schemas import UserRole
from app.auth.security import hash_password, new_reset_code, token_hash
from app.main import create_app


@pytest.fixture(scope="module")
def auth_postgres():
    url = os.getenv("AUTH_TEST_DATABASE_URL")
    if not url:
        pytest.skip("PostgreSQL real no configurado: AUTH_TEST_DATABASE_URL ausente.")
    schema = "test_auth_" + uuid4().hex
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute(sql.SQL("CREATE SCHEMA {}").format(sql.Identifier(schema)))
    test_url = make_conninfo(url, options=f"-c search_path={schema}")
    try:
        migrations = (
            Path(__file__).resolve().parents[1] / "db" / "migrations"
        )
        with psycopg.connect(test_url) as conn:
            for path in sorted(migrations.glob("[0-9][0-9][0-9]_*.sql")):
                conn.execute(path.read_text(encoding="utf-8-sig"))
        yield PostgresAuthRepository(conninfo=test_url), test_url
    finally:
        # Solamente elimina el schema creado explícitamente por esta prueba.
        with psycopg.connect(url, autocommit=True) as conn:
            conn.execute(
                sql.SQL("DROP SCHEMA {} CASCADE").format(sql.Identifier(schema))
            )


def test_postgres_migration_constraints(auth_postgres):
    _, url = auth_postgres
    with psycopg.connect(url) as conn:
        rows = conn.execute(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = current_schema()"
        ).fetchall()
        found = {r[0] for r in rows}
        assert {
            "users", "auth_sessions", "password_reset_tokens", "recovery_requests"
        }.issubset(found)
    with pytest.raises(psycopg.errors.CheckViolation):
        with psycopg.connect(url) as conn:
            conn.execute(
                "INSERT INTO users(email, role) VALUES ('MAYUS@example.com', 'USER')"
            )
    with pytest.raises(psycopg.errors.CheckViolation):
        with psycopg.connect(url) as conn:
            conn.execute(
                "INSERT INTO users(email, role) VALUES ('unico@example.com', 'ROOT')"
            )


def test_postgres_login_sessions_roles_and_restart(auth_postgres):
    repository, url = auth_postgres
    admin = repository.create_user("admin@example.com", UserRole.ADMIN)
    user = repository.create_user("user@example.com", UserRole.USER)
    repository.replace_password_and_revoke_sessions(
        admin.id, hash_password("AdministracionDeLab2026!"), datetime.now(timezone.utc)
    )
    repository.replace_password_and_revoke_sessions(
        user.id, hash_password("UsuarioDeLaboratorio2026!"), datetime.now(timezone.utc)
    )
    origin = {"Origin": "http://testserver"}
    with TestClient(create_app(auth_repository=repository)) as administrator, TestClient(
        create_app(auth_repository=PostgresAuthRepository(conninfo=url))
    ) as usuario:
        a = administrator.post(
            "/api/v1/auth/login",
            json={"email":"admin@example.com","password":"AdministracionDeLab2026!"},
            headers=origin
        )
        b = usuario.post(
            "/api/v1/auth/login",
            json={"email":"user@example.com","password":"UsuarioDeLaboratorio2026!"},
            headers=origin
        )
        assert a.status_code == b.status_code == 200
        assert administrator.get("/api/v1/admin/users").status_code == 200
        assert usuario.get("/api/v1/admin/users").status_code == 403
        assert administrador.get("/api/v1/auth/me").json()["user"]["role"] == "ADMIN"
        assert usuario.get("/api/v1/auth/me").json()["user"]["role"] == "USER"
        # Rehacer el objeto del servidor no borra usuarios/sesiones PostgreSQL.
        with TestClient(create_app(auth_repository=PostgresAuthRepository(conninfo=url))) as restarted:
            restarted.cookies.update(administrator.cookies)
            assert restarted.get("/api/v1/auth/me").status_code == 200
        assert usuario.post(
            "/api/v1/auth/logout",
            headers={**origin, "X-CSRF-Token":usuario.cookies.get("csrf_token")},
        ).status_code == 204
        assert usuario.get("/api/v1/auth/me").status_code == 401


def test_postgres_atomic_one_time_reset_under_concurrency(auth_postgres):
    repository, _ = auth_postgres
    target = repository.find_user_by_email("user@example.com")
    admin = repository.find_user_by_email("admin@example.com")
    assert target and admin
    code = new_reset_code()
    digest = token_hash(code)
    now = datetime.now(timezone.utc)
    repository.issue_reset_token(
        target.id, digest, now + timedelta(minutes=15), admin.id, now
    )

    def attempt():
        return repository.consume_reset_and_change_password(
            target.email, digest, hash_password("NuevaPassword2026Prueba!"),
            datetime.now(timezone.utc)
        )

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: attempt(), range(2)))
    assert sorted(results) == [False, True]


def test_postgres_rejects_duplicate_and_normalizes_email(auth_postgres):
    repository, _ = auth_postgres
    from app.auth.repository import DuplicateEmailError
    with pytest.raises(DuplicateEmailError):
        repository.create_user("USER@example.com", UserRole.USER)
    assert repository.find_user_by_email("USER@example.com").email == "user@example.com"

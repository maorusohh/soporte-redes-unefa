"""Crear primer ADMIN explícitamente; nunca contraseñas por defecto."""
from __future__ import annotations

import getpass
import hmac

from pydantic import EmailStr, TypeAdapter

from app.auth.pg_config import interactive_postgres_repository
from app.auth.security import hash_password


def bootstrap_admin() -> None:
    repo = interactive_postgres_repository()
    typed_email = input("Correo ficticio del primer ADMIN [admin@example.com]: ").strip()
    email = str(TypeAdapter(EmailStr).validate_python(
        typed_email or "admin@example.com"
    )).casefold()

    with repo._connect() as conn:
        row = conn.execute(
            "SELECT id FROM users WHERE role = 'ADMIN' AND active = TRUE LIMIT 1"
        ).fetchone()
    if row:
        print("Ya existe un ADMIN activo. No se modifica su contraseña.")
        return

    password = getpass.getpass("Contraseña inicial ADMIN (no se muestra): ")
    repeat = getpass.getpass("Repite la contraseña (no se muestra): ")
    if not hmac.compare_digest(password, repeat):
        raise ValueError("Las contraseñas no coinciden.")
    digest = hash_password(password)

    with repo._connect() as conn:
        with conn.transaction():
            # Garantía bajo dos ejecuciones concurrentes del comando.
            conn.execute("SELECT pg_advisory_xact_lock(11092327)")
            existing_admin = conn.execute(
                "SELECT id FROM users WHERE role = 'ADMIN' AND active = TRUE LIMIT 1"
            ).fetchone()
            if existing_admin:
                print("Otro proceso ya creó un ADMIN. No se sobrescribió.")
                return
            conn.execute(
                """
                INSERT INTO users (email, role, active, password_hash)
                VALUES (%s, 'ADMIN', TRUE, %s)
                """,
                (email, digest),
            )
    print(f"Cuenta inicial ADMIN creada: {email} (contraseña no mostrada).")


if __name__ == "__main__":
    bootstrap_admin()

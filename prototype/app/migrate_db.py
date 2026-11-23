"""Migrador SQL explícito para PostgreSQL de laboratorio.

Se ejecuta una sola vez por versión, con transacción y registro de auditoría.
No crea roles ni bases de datos; nunca borra datos existentes.
"""
from __future__ import annotations

from pathlib import Path

from app.auth.pg_config import interactive_postgres_repository

MIGRATIONS_DIR = Path(__file__).resolve().parents[1] / "db" / "migrations"


def migrate() -> None:
    repo = interactive_postgres_repository()
    versions = sorted(MIGRATIONS_DIR.glob("[0-9][0-9][0-9]_*.sql"))
    if not versions:
        raise RuntimeError("No hay migraciones SQL disponibles.")

    with repo._connect() as conn:
        with conn.transaction():
            # Evita que dos operadores apliquen migraciones simultáneamente.
            conn.execute("SELECT pg_advisory_xact_lock(11092326)")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS auth_schema_migrations (
                    version TEXT PRIMARY KEY,
                    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            applied = {
                row[0]
                for row in conn.execute(
                    "SELECT version FROM auth_schema_migrations"
                ).fetchall()
            }
            unexpected = applied.difference({p.name for p in versions})
            if unexpected:
                raise RuntimeError(
                    "La base de datos contiene versiones de migración desconocidas: "
                    + ", ".join(sorted(unexpected))
                )

            for path in versions:
                if path.name in applied:
                    print(f"YA APLICADA: {path.name}")
                    continue
                sql = path.read_text(encoding="utf-8-sig")
                if not sql.strip():
                    raise RuntimeError(f"Migración vacía: {path.name}")
                print(f"APLICANDO: {path.name}")
                conn.execute(sql)
                conn.execute(
                    "INSERT INTO auth_schema_migrations (version) VALUES (%s)",
                    (path.name,),
                )
    print("Migraciones completadas sin errores.")


if __name__ == "__main__":
    migrate()

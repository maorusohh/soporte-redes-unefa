"""Obtiene conexión PostgreSQL desde configuración local sin imprimir secretos."""
from __future__ import annotations

import getpass
import os

from psycopg.conninfo import make_conninfo

from app.auth.postgres_repository import PostgresAuthRepository


def interactive_postgres_repository() -> PostgresAuthRepository:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return PostgresAuthRepository(conninfo=database_url)

    dbname = os.getenv("PGDATABASE")
    user = os.getenv("PGUSER")
    if not dbname or not user:
        raise RuntimeError(
            "Configura PGDATABASE y PGUSER en PowerShell antes de ejecutar."
        )
    password = os.getenv("PGPASSWORD")
    if password is None:
        password = getpass.getpass("Contraseña local de PostgreSQL (no se muestra): ")
    conninfo = make_conninfo(
        "",
        host=os.getenv("PGHOST", "127.0.0.1"),
        port=os.getenv("PGPORT", "5432"),
        dbname=dbname,
        user=user,
        password=password,
        connect_timeout=5,
    )
    return PostgresAuthRepository(conninfo=conninfo)

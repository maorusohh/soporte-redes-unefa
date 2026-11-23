"""Servidor AUTH-P0 con PostgreSQL en localhost o LAN de laboratorio privada.

No abrir a Internet ni usar claves personales en HTTP sin TLS.
Ejemplos:
  python -m app.postgres_server
  python -m app.postgres_server --lan-lab-only
"""
from __future__ import annotations

import argparse
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles

from app.auth.pg_config import interactive_postgres_repository
from app.main import create_app


DIST = Path(__file__).resolve().parents[1] / "web" / "dist"


def create_postgres_web_app(repository, dist: Path = DIST) -> FastAPI:
    app = create_app(auth_repository=repository)
    assets = dist / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets)), name="web-assets")

    def react_page() -> Response:
        index = dist / "index.html"
        if not index.is_file():
            return HTMLResponse(
                "<!doctype html><html lang='es'><meta charset='utf-8'>"
                "<h1>Frontend pendiente de build</h1>"
                "<p>Ejecuta npm ci y npm run build en prototype/web.</p></html>",
                status_code=503,
            )
        html = index.read_text(encoding="utf-8")
        return HTMLResponse(
            html,
            headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
        )

    # No capturar /, /api/v1, /docs ni otras rutas de FastAPI/heartbeat.
    for page in ("/login", "/session", "/recover", "/change-password"):
        app.add_api_route(page, react_page, include_in_schema=False, methods=["GET"])
    return app


def main() -> None:
    parser = argparse.ArgumentParser(description="Servidor PostgreSQL UNEFA AUTH-P0")
    parser.add_argument(
        "--lan-lab-only",
        action="store_true",
        help="Escuchar en la LAN privada, solo con equipos autorizados y datos sintéticos",
    )
    args = parser.parse_args()
    repo = interactive_postgres_repository()
    # Fallar antes de escuchar, si credenciales/tablas faltan.
    with repo._connect() as conn:
        conn.execute("SELECT id FROM users LIMIT 1").fetchall()
        conn.execute("SELECT token_digest FROM auth_sessions LIMIT 1").fetchall()
        conn.execute("SELECT token_digest FROM password_reset_tokens LIMIT 1").fetchall()
    app = create_postgres_web_app(repo)

    host = "0.0.0.0" if args.lan_lab_only else "127.0.0.1"
    if args.lan_lab_only:
        print(
            "MODO LAN SOLO LABORATORIO: requiere Wi-Fi/LAN privada, firewall "
            "restringido a LocalSubnet y cuentas exclusivamente ficticias. "
            "Nunca abrir el puerto en el router ni exponer el servicio a Internet."
        )
    print("Backend PostgreSQL activo: HTTP sin TLS solo para datos sintéticos.")
    print("Rutas: /login, /session, /recover, /change-password, /, /docs")
    uvicorn.run(app, host=host, port=8000, log_level="info")


if __name__ == "__main__":
    main()

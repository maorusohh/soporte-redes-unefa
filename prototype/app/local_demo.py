"""Servidor de DEMOSTRACIÓN LOCAL; nunca es el servidor normal del proyecto.

Ejecutar exclusivamente mediante:
    python -m app.local_demo

- Escucha solo en 127.0.0.1 (no LAN, no Internet).
- Datos sintéticos VOLÁTILES; no hay PostgreSQL.
- Credenciales aleatorias se imprimen solo en esta consola local.
- El funcionamiento sin BD demuestra UI/API, NO persistencia ni producto final.
"""
from __future__ import annotations

import secrets
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Response
from fastapi.staticfiles import StaticFiles

from app.auth.schemas import UserRole
from app.auth.volatile_demo_repository import VolatileDemoRepository
from app.main import create_app


WEB_DIST = Path(__file__).resolve().parents[1] / "web" / "dist"
DEMO_NOTICE = (
    '<div role="status" style="background:#fff3cd;color:#4c3900;'
    'padding:12px;text-align:center;font:600 14px system-ui;'
    'border-bottom:2px solid #ac8425">'
    'SIMULACIÓN LOCAL · datos temporales en memoria · '
    'SIN PostgreSQL · NO ES UN LOGIN PRODUCTIVO</div>'
)


def create_local_demo_app(
    frontend_dir: Path | None = None,
) -> tuple[FastAPI, dict[str, str]]:
    """Crear demo aislada + credenciales efímeras, sólo para localhost."""
    storage = VolatileDemoRepository()
    passwords = {
        "admin@example.com": secrets.token_urlsafe(18),
        "user@example.com": secrets.token_urlsafe(18),
    }
    storage.seed_user("admin@example.com", passwords["admin@example.com"], UserRole.ADMIN)
    storage.seed_user("user@example.com", passwords["user@example.com"], UserRole.USER)

    app = create_app(auth_repository=storage)
    # Nunca alterar el servidor normal app.main:app.
    dist = WEB_DIST if frontend_dir is None else Path(frontend_dir)
    assets = dist / "assets"
    if assets.is_dir():
        app.mount(
            "/assets", StaticFiles(directory=str(assets)), name="demo-web-assets"
        )

    @app.get("/demo-info", include_in_schema=False)
    def demo_info() -> dict:
        return {
            "mode": "local-simulation",
            "database": "volatile-memory",
            "postgresql": False,
            "persistent": False,
            "real_lan_validation": False,
        }

    def react_page() -> Response:
        index_file = dist / "index.html"
        if not index_file.is_file():
            return Response(
                content=(
                    "<!doctype html><html lang='es'><meta charset='utf-8'>"
                    "<title>Frontend pendiente</title>"
                    "<h1>El frontend React aún no está compilado.</h1>"
                    "<p>Desde prototype/web ejecuta npm ci y npm run build.</p>"
                    "<p>El backend de demostración continúa funcionando.</p>"
                    "</html>"
                ),
                status_code=503,
                media_type="text/html",
            )
        html = index_file.read_text(encoding="utf-8")
        # El banner se inserta FUERA del elemento #root usado por React.
        html = html.replace("<body>", "<body>" + DEMO_NOTICE, 1)
        return Response(
            content=html,
            media_type="text/html",
            headers={"Cache-Control": "no-store"},
        )

    for page in (
        "/login",
        "/session",
        "/recover",
        "/change-password",
    ):
        app.add_api_route(
            page,
            react_page,
            methods=["GET"],
            include_in_schema=False,
        )

    return app, passwords


def main() -> None:
    app, passwords = create_local_demo_app()
    print("\n" + "=" * 72)
    print("SIMULACION LOCAL - PROYECTO UNEFA - NO POSTGRESQL")
    print("Acceso SOLO desde esta computadora: http://127.0.0.1:8000/login")
    print("Estas cuentas y contraseñas son ALEATORIAS y SOLO existen en memoria.")
    print("Al detener el servidor, se pierde toda la información de la demo.")
    print("NO publicar estas contraseñas ni presentar la demo como BD persistente.")
    print("-" * 72)
    for email, password in passwords.items():
        print(f"CUENTA: {email}")
        print(f"CLAVE TEMPORAL PARA ESTA EJECUCION: {password}")
        print()
    if not (WEB_DIST / "index.html").is_file():
        print("ATENCION: falta el build del Frontend de Joiber.")
        print("En otra terminal: cd prototype\\web ; npm ci ; npm run build")
        print("Luego reinicia esta demo con Ctrl+C y el mismo comando.")
    print("=" * 72 + "\n", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")


if __name__ == "__main__":
    main()

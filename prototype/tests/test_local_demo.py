"""Pruebas del servidor de demostración local, sin PostgreSQL."""
from fastapi.testclient import TestClient
from app.local_demo import create_local_demo_app


def test_demo_disclosure_and_heartbeat(tmp_path):
    (tmp_path / "index.html").write_text(
        '<html><body><div id="root"></div></body></html>', encoding="utf-8"
    )
    app, credentials = create_local_demo_app(frontend_dir=tmp_path)
    with TestClient(app) as client:
        html = client.get("/login")
        assert html.status_code == 200
        assert "SIMULACIÓN LOCAL" in html.text
        assert "SIN PostgreSQL" in html.text
        assert all(password not in html.text for password in credentials.values())
        assert client.get("/api/v1/health").status_code == 200
        assert client.get("/demo-info").json()["persistent"] is False


def test_demo_without_build_reports_missing_frontend(tmp_path):
    app, _ = create_local_demo_app(frontend_dir=tmp_path)
    with TestClient(app) as client:
        assert client.get("/login").status_code == 503
        assert client.get("/").status_code == 200


def test_demo_roles_and_logout(tmp_path):
    app, credentials = create_local_demo_app(frontend_dir=tmp_path)
    with TestClient(app) as admin, TestClient(app) as user:
        for client, email in ((admin, "admin@example.com"), (user, "user@example.com")):
            result = client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": credentials[email]},
                headers={"Origin": "http://testserver"},
            )
            assert result.status_code == 200
        assert admin.get("/api/v1/admin/users").status_code == 200
        assert user.get("/api/v1/admin/users").status_code == 403
        assert user.post(
            "/api/v1/auth/logout", headers={"Origin": "http://testserver"}
        ).status_code == 204
        assert user.get("/api/v1/auth/me").status_code == 401

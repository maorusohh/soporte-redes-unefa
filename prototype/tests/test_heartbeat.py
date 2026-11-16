"""Pruebas locales reproducibles de la prueba de concepto."""
from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient

from app.main import create_app
from app.registry import DeviceRegistry


def test_health_and_dashboard():
    with TestClient(create_app(DeviceRegistry())) as client:
        assert client.get("/api/v1/health").json()["status"] == "ok"
        assert "Monitoreo de equipos" in client.get("/").text


def test_heartbeat_visible_in_devices():
    with TestClient(create_app(DeviceRegistry())) as client:
        accepted = client.post("/api/v1/heartbeats", json={"device_id": "PC-LAB-01"})
        assert accepted.status_code == 202
        assert accepted.json()["accepted"] is True
        summary = client.get("/api/v1/devices").json()
        assert summary["total"] == 1
        assert summary["online"] == 1
        assert summary["devices"][0]["heartbeats"] == 1


def test_invalid_device_id_rejected():
    with TestClient(create_app(DeviceRegistry())) as client:
        assert client.post("/api/v1/heartbeats", json={"device_id": "../no"}).status_code == 422
        assert client.get("/api/v1/devices").json()["total"] == 0


def test_timeout_marks_device_offline():
    current = [0.0]
    registry = DeviceRegistry(ttl_seconds=5.0, clock=lambda: current[0])
    registry.receive("PC-LAB-01")
    current[0] = 6.0
    assert registry.snapshot()["offline"] == 1
    assert registry.snapshot()["online"] == 0


def test_concurrent_heartbeats_counted():
    registry = DeviceRegistry()
    with ThreadPoolExecutor(max_workers=8) as executor:
        list(executor.map(registry.receive, ["PC-LAB-01"] * 30))
    assert registry.snapshot()["devices"][0]["heartbeats"] == 30

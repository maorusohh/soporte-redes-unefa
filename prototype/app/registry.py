"""Registro temporal de heartbeat: solo para prueba de concepto."""
from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from time import monotonic
from typing import Callable


class DeviceRegistry:
    def __init__(self, ttl_seconds: float = 12.0, clock: Callable[[], float] = monotonic):
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds debe ser positivo")
        self.ttl_seconds = ttl_seconds
        self._clock = clock
        self._records: dict[str, dict] = {}
        self._lock = Lock()

    def receive(self, device_id: str) -> dict:
        now = self._clock()
        timestamp = datetime.now(timezone.utc).isoformat()
        with self._lock:
            old = self._records.get(device_id)
            count = (old["heartbeats"] if old else 0) + 1
            self._records[device_id] = {
                "device_id": device_id,
                "last_seen_utc": timestamp,
                "last_seen_monotonic": now,
                "heartbeats": count,
            }
        return {"device_id": device_id, "accepted": True, "received_at_utc": timestamp}

    def snapshot(self) -> dict:
        now = self._clock()
        with self._lock:
            devices = [
                {
                    "device_id": item["device_id"],
                    "last_seen_utc": item["last_seen_utc"],
                    "heartbeats": item["heartbeats"],
                    "status": "online" if max(0.0, now - item["last_seen_monotonic"]) <= self.ttl_seconds else "offline",
                }
                for item in self._records.values()
            ]
        devices.sort(key=lambda device: device["device_id"])
        return {
            "total": len(devices),
            "online": sum(device["status"] == "online" for device in devices),
            "offline": sum(device["status"] == "offline" for device in devices),
            "devices": devices,
        }

"""Agente explícito de laboratorio. No escanea redes ni recopila datos reales."""
from __future__ import annotations

import argparse
import json
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def send_heartbeat(server: str, device: str) -> dict:
    url = server.rstrip("/") + "/api/v1/heartbeats"
    request = Request(
        url,
        data=json.dumps({"device_id": device}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Enviar heartbeat de laboratorio a un servidor autorizado")
    parser.add_argument("--device", required=True, help="Identificador ficticio, ejemplo: PC-LAB-01")
    parser.add_argument("--server", default="http://127.0.0.1:8000", help="Servidor de laboratorio")
    parser.add_argument("--interval", type=float, default=3.0, help="Segundos entre mensajes")
    parser.add_argument("--once", action="store_true", help="Enviar solo un mensaje")
    args = parser.parse_args()
    if args.interval <= 0:
        parser.error("--interval debe ser positivo")
    try:
        while True:
            try:
                ack = send_heartbeat(args.server, args.device)
                print(f"Heartbeat recibido por servidor: {ack['device_id']} ({ack['received_at_utc']})", flush=True)
            except (HTTPError, URLError, TimeoutError, ValueError, KeyError) as exc:
                print(f"Error de comunicación: {exc}", flush=True)
            if args.once:
                return
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("Agente detenido")


if __name__ == "__main__":
    main()

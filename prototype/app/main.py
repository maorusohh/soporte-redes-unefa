"""API de prueba de concepto. Sin autenticación ni persistencia permanente."""
from __future__ import annotations

from fastapi import FastAPI, status
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from app.registry import DeviceRegistry


class Heartbeat(BaseModel):
    device_id: str = Field(min_length=1, max_length=40, pattern=r"^[a-zA-Z0-9_-]+$")


DASHBOARD = """<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Teleprocesos | POC monitoreo</title>
<style>
body{font:16px system-ui,sans-serif;max-width:860px;margin:3rem auto;padding:0 1rem;background:#f7f9fc;color:#192638}
header{margin-bottom:2rem}h1{font-size:1.7rem}.stats{display:flex;gap:1rem;flex-wrap:wrap}
.stat{background:white;border:1px solid #dce3ed;border-radius:8px;padding:1rem;min-width:100px}
table{border-collapse:collapse;width:100%;background:white}th,td{text-align:left;border-bottom:1px solid #e2e8f0;padding:.8rem}
.online{color:#106b42;font-weight:700}.offline{color:#a43a30;font-weight:700}small{color:#586576}
</style></head><body>
<header><h1>Monitoreo de equipos — prueba de concepto</h1>
<p>Heartbeat HTTP/TCP de agentes autorizados. Datos temporales: no es el sistema final.</p></header>
<div class="stats"><div class="stat">Equipos: <strong id="total">0</strong></div>
<div class="stat">Online: <strong id="online">0</strong></div>
<div class="stat">Offline: <strong id="offline">0</strong></div></div>
<h2>Dispositivos de laboratorio</h2><table><thead><tr><th>Identificador</th><th>Estado</th><th>Mensajes</th><th>Último mensaje (UTC)</th></tr></thead>
<tbody id="rows"><tr><td colspan="4">Sin datos todavía</td></tr></tbody></table>
<p id="error" role="status"></p><small>Actualización de consulta cada 2 segundos. No hay escaneo de red.</small>
<script>
async function refresh(){try{
const response=await fetch('/api/v1/devices',{cache:'no-store'});if(!response.ok)throw new Error('API '+response.status);
const data=await response.json();for(const k of ['total','online','offline'])document.getElementById(k).textContent=data[k];
const rows=document.getElementById('rows');rows.replaceChildren();
if(!data.devices.length){const tr=rows.insertRow();const td=tr.insertCell();td.colSpan=4;td.textContent='Sin agentes conectados';}
for(const d of data.devices){const tr=rows.insertRow();for(const key of ['device_id','status','heartbeats','last_seen_utc']){
const td=tr.insertCell();td.textContent=d[key];if(key==='status')td.className=d.status;}}
document.getElementById('error').textContent='';}catch(err){document.getElementById('error').textContent='No se pudo consultar el servidor: '+err.message;}}
refresh();setInterval(refresh,2000);
</script></body></html>"""


def create_app(registry: DeviceRegistry | None = None) -> FastAPI:
    state = registry if registry is not None else DeviceRegistry()
    app = FastAPI(title="UNEFANB — POC Teleprocesos", version="0.1.0")

    @app.get("/", response_class=HTMLResponse, include_in_schema=False)
    def dashboard() -> str:
        return DASHBOARD

    @app.get("/api/v1/health")
    def health() -> dict:
        return {"service": "teleprocesos-poc", "status": "ok"}

    @app.post("/api/v1/heartbeats", status_code=status.HTTP_202_ACCEPTED)
    def heartbeat(payload: Heartbeat) -> dict:
        return state.receive(payload.device_id)

    @app.get("/api/v1/devices")
    def devices() -> dict:
        return state.snapshot()

    return app


app = create_app()

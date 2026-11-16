# POC-001 — Monitoreo por heartbeat HTTP sobre TCP/IP

**Tipo:** prueba de concepto autónoma de Backend/Teleprocesos. **No es el sistema completo.** No hay login, permisos, PostgreSQL ni gestión de incidencias implementados aquí. Los equipos que aparecen son **identificadores ficticios enviados por agentes**, no resultados de un escaneo de red. Al reiniciar el servidor se pierde el estado.

## Ejecutar en Windows (PowerShell)

Desde la carpeta `prototype/`:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Abre **http://127.0.0.1:8000/** en el navegador. En una *segunda terminal*, desde la misma carpeta:

```powershell
.\.venv\Scripts\python.exe agent.py --device PC-LAB-01
```

En una tercera terminal se puede ejecutar `agent.py --device PC-LAB-02`. Después de detener un agente, su dispositivo aparecerá **offline** al superar 12 segundos sin mensajes.

API: `GET /api/v1/health`, `POST /api/v1/heartbeats`, `GET /api/v1/devices`. Documentación automática disponible en `/docs` (algunos recursos de Swagger UI pueden necesitar Internet).

## Pruebas locales

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Los tests comprueban respuesta del servicio, registro, validación, timeout y conteo concurrente. No sustituyen las futuras pruebas entre máquinas.

## En LAN propia (solo equipos autorizados)

1. Conecta las laptops del grupo a un router Wi-Fi o switch **propio/autorizado**; confirma que puedan comunicarse entre sí.
2. En la laptop servidor, inicia el servicio explícitamente en la LAN mediante `--host 0.0.0.0` y el puerto `8000`. Esto escucha todas sus interfaces; **no usar en Internet, redes públicas ni institucionales**.
3. Identifica la IPv4 privada del servidor con `ipconfig` (Windows) o `ip addr` (Linux); no publiques la dirección real.
4. En otra laptop, abre `http://IP_PRIVADA_DEL_SERVIDOR:8000/` y ejecuta el agente con `--server http://IP_PRIVADA_DEL_SERVIDOR:8000`.
5. Si el firewall bloquea, autoriza **solo esa aplicación/puerto** en la red privada y para los equipos de prueba; nunca desactives el firewall completo.
6. Repite con el resto de laptops. Desconecta un agente para observar timeout. Detén servicios y retira reglas temporales al terminar.

**Seguridad:** Esta POC **no autentica** clientes y solo admite datos sintéticos. Mantener en `127.0.0.1` por defecto; no utilizar con equipos o datos reales ni exponer a redes no confiables. El protocolo definitivo debe incorporar autenticación, autorización y protección del canal.

**Nota técnica:** un heartbeat demuestra recepción periódica de mensajes de un proceso cliente, no prueba por sí solo que todo el hardware, servicios o red de una computadora estén saludables.

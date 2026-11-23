# 14. Procedimiento de laboratorio: PostgreSQL, Backend, React y LAN

**Fecha:** 23/11/2026. **Estado:** CI con PostgreSQL 16 verificado, instalación y LAN de Windows pendientes de ensayo. **Seguridad:** datos y credenciales ficticios; equipos y red propia autorizada. Prohibido exponer HTTP con claves reales a Internet, abrir PostgreSQL a clientes o desactivar el firewall.

## Evidencia verificable

- [PR #17 — DB integrada temporalmente](https://github.com/maorusohh/soporte-redes-unefa/pull/17) (Draft, sin merge a main)
- [Actions PostgreSQL #45139866078](https://github.com/maorusohh/soporte-redes-unefa/actions/runs/45139866078): **30 passed, 1 warning** con PostgreSQL 16 de CI, transacciones, migración, bootstrap y sesiones persistentes entre instancias.
- [Actions Python #45139866142](https://github.com/maorusohh/soporte-redes-unefa/actions/runs/45139866142): **25 passed, 5 skipped, 1 warning** sin PostgreSQL.
- [PR #15 Frontend](https://github.com/maorusohh/soporte-redes-unefa/pull/15): 40 tests JS y build aprobados previamente.
- [Issue #11 de Yosward](https://github.com/maorusohh/soporte-redes-unefa/issues/11): auditoría y hallazgos que motivaron integración selectiva.

## 1. Preparación en laptop de Mauricio (Windows)

Se asume una copia local **ya existente**, probada anteriormente, en `%USERPROFILE%\soporte-redes-unefa-demo` con la rama `preview/auth-local`. Se conserva el Frontend de Joiber.

```powershell
cd $env:USERPROFILE\soporte-redes-unefa-demo
git status -sb
git fetch origin
git switch preview/auth-local
git merge --no-edit origin/integration/auth-postgres-verification
git status -sb

cd .\prototype
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest -q
```

**Si hay conflictos Git o cambios locales no guardados, detenerse**: no borrar archivos ni usar force push. El test local sin base configurada omite los cinco tests PostgreSQL reales. El Frontend ya fue compilado; si fuera necesario actualizarlo: `cd web; npm ci; npm test; npm run build; cd ..`.

## 2. PostgreSQL local y creación de una base vacía

```powershell
Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
psql --version
```

`psql` puede estar en `C:\Program Files\PostgreSQL\<VERSIÓN>\bin\psql.exe` si no está en PATH. No basta tener DBeaver: PostgreSQL Server debe estar instalado y ejecutándose.

Con una cuenta administrativa local de PostgreSQL, abrir `psql -h 127.0.0.1 -p 5432 -U postgres -d postgres` e introducir su contraseña **solo allí**:

```sql
CREATE ROLE unefa_app LOGIN;
```

En la consola `psql` ejecutar además `\password unefa_app` (pide una clave sin mostrarla), seguido por `CREATE DATABASE soporte_redes_auth OWNER unefa_app;` y `\q`. Si ya existen rol/base, revisar antes de repetir. No publicar contraseñas, URL con secretos ni volcados de datos reales.

## 3. Migraciones y primer ADMIN

Desde `prototype` en **PowerShell normal**:

```powershell
$env:PGHOST = '127.0.0.1'
$env:PGPORT = '5432'
$env:PGDATABASE = 'soporte_redes_auth'
$env:PGUSER = 'unefa_app'
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

.\.venv\Scripts\python.exe -m app.migrate_db
.\.venv\Scripts\python.exe -m app.bootstrap_admin
```

Ambos comandos piden contraseña PostgreSQL local en consola, sin imprimirla. El `bootstrap_admin` pide correo ficticio de ADMIN y su nueva contraseña (mínimo 12 caracteres), sin generar contraseña por defecto.

El migrador aplica:
- `001_create_auth_tables.sql`: `users`, `auth_sessions`, `password_reset_tokens`, `recovery_requests`;
- `002_enforce_normalized_email.sql`: garantiza correo normalizado;
- `auth_schema_migrations`: registra versiones aplicadas; repetir es idempotente.

## 4. Servidor con PostgreSQL y pruebas de persistencia

```powershell
.\.venv\Scripts\python.exe -m app.postgres_server
```

En el **mismo PC** visitar:
- `http://127.0.0.1:8000/login` — acceso React;
- `http://127.0.0.1:8000/session` — ADMIN/USER;
- `http://127.0.0.1:8000/recover` — recuperación;
- `http://127.0.0.1:8000/change-password` — cambio de clave;
- `http://127.0.0.1:8000/` — dashboard heartbeat;
- `http://127.0.0.1:8000/docs` — OpenAPI.

Probar ADMIN ficticio → alta USER → emisión de código por ADMIN → activación en /recover → login USER desde incógnito → rechazo 403 para ADMIN en USER → logout/cambio de contraseña → **reiniciar FastAPI y comprobar que usuarios persisten**.

**No confundir** esta prueba con la demo anterior `app.local_demo`: esa tenía memoria volátil y usuarios que desaparecían al cerrar.

## 5. LAN de laboratorio con 2 PC o PC + teléfono propio

Topología: **una laptop** ejecuta FastAPI y PostgreSQL (BD solo localhost, puerto 5432 no expuesto); clientes en router Wi-Fi/switch privado propio acceden por navegador únicamente al **puerto 8000**.

1. En el servidor: comprobar `Get-NetConnectionProfile` y `ipconfig`. Anotar la IPv4 LAN del adaptador correcto (NO publicarla). Usar perfil **Private** solamente en red confiable propia.
2. Detener Uvicorn localhost con `Ctrl+C`; iniciar:
   ```powershell
   .\.venv\Scripts\python.exe -m app.postgres_server --lan-lab-only
   ```
3. Si el firewall bloquea, en **PowerShell Administrador del servidor**, crear una regla **temporal restringida**:
   ```powershell
   New-NetFirewallRule -DisplayName 'UNEFANB AUTH-P0 LAB TEMP' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000 -Profile Private -RemoteAddress LocalSubnet
   ```
4. En cliente conectado a la **misma red propia**: `Test-NetConnection IP_SERVIDOR -Port 8000`; abrir `http://IP_SERVIDOR:8000/login`, sustituyendo el texto por la IPv4 real. **127.0.0.1 solo identifica la máquina que lo ejecuta**.
5. Probar dos navegadores/equipos físicos y permisos ADMIN/USER. Usar solo credenciales ficticias; **HTTP no ofrece confidencialidad**, por lo que para datos reales sería imprescindible HTTPS/TLS.
6. Al finalizar, detener Uvicorn y **retirar la regla** en PowerShell Administrador:
   ```powershell
   Get-NetFirewallRule -DisplayName 'UNEFANB AUTH-P0 LAB TEMP' | Remove-NetFirewallRule
   ```
7. No usar router port forwarding, Wi-Fi de invitados, redes institucionales no autorizadas ni firewall global OFF.

### Demostración opcional del heartbeat (Teleprocesos)

En el servidor con una segunda terminal `prototype`:

```powershell
.\.venv\Scripts\python.exe agent.py --device PC-LAB-01 --server http://127.0.0.1:8000 --once
```

En un **cliente autorizado** con Python y `agent.py` disponible:

```powershell
py agent.py --device PC-LAB-02 --server http://IP_SERVIDOR:8000 --interval 3
```

Observar `http://IP_SERVIDOR:8000/`. Este agente envía heartbeats explícitos HTTP/TCP; **no escanea redes ni mide CPU/RAM/disco todavía**.

## 6. Alcance académico y registro

**Teleprocesos:** arquitectura cliente-servidor y TCP/IP/HTTP, servicio único y varios clientes en LAN privada, heartbeats voluntarios con estados. No inferir prueba LAN a partir de localhost.

**SABD:** PostgreSQL relacional con cuatro tablas, FK, CHECK, índices, transacciones, `psycopg 3`, cuentas ADMIN/USER y persistencia tras reinicio. Evitar presentar los tests CI como pruebas ejecutadas en Windows.

Registrar en Issue #8 la fecha, versión/commit, tipo de LAN propia, equipos con IDs ficticios, comandos, resultado observado y evidencias sin datos sensibles. No se han implementado todavía los módulos completos de incidencias, reportes ni métricas CPU/RAM/disco.

**Estado de esta guía:** procedimiento aprobado para **ejecución controlada**, no comprobación de que ya se ejecutó correctamente en la laptop de Mauricio o en una red LAN física.

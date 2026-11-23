# Prototipo web — FRONT-002 (Vite + React)

Pantallas de acceso, sesión, recuperación y cambio de contraseña para la revisión de autenticación P0. Este trabajo corresponde a la [Issue #10](https://github.com/maorusohh/soporte-redes-unefa/issues/10) y sigue el contrato de [docs/10-CONTRATO-INTEGRACION-AUTH.md](../../docs/10-CONTRATO-INTEGRACION-AUTH.md).

## Estado real de la entrega

- **Stack implementado:** Vite 8 + React 19 + React Router 7, con JavaScript/JSX y Node/npm como herramienta de desarrollo.
- **Implementado:** SPA con rutas `/login`, `/session`, `/recover` y `/change-password`; estados de carga, errores, navegación, cierre de sesión, cambio y recuperación de contraseña.
- **Implementado en esta revisión:** sección ADMIN para listar y crear cuentas y para emitir códigos temporales de recuperación; envío provisional de token CSRF en operaciones mutantes; invalidación de respuestas obsoletas de sesión; validación de la forma de `user`; pruebas automatizadas con Vitest/Testing Library y un mock versionado del contrato.
- **No implementado:** autenticación real, endpoints de FastAPI, esquema PostgreSQL y confirmación definitiva del mecanismo CSRF por Backend.
- **No verificado:** login exitoso contra Backend. El PR de Backend (#14) contiene modelos y utilidades de seguridad, pero todavía no expone `/auth/login`.
- **Publicación:** la rama `feat/auth-frontend-p0` se publica en `origin` por SSH desde la cuenta `jbrkll007`; el PR Draft [#15](https://github.com/maorusohh/soporte-redes-unefa/pull/15) se abre hacia `integration/auth-p0` y se enlaza desde la Issue #10.
- **Regla respetada:** no hay usuarios, contraseñas ni sesiones simuladas en el código de la aplicación. El mock de desarrollo es explícito, usa datos sintéticos y no se presenta como integración. Si la API no está disponible, la interfaz muestra un error honesto.

La Issue #10 está asignada a Joiber (`jbrkll007`), responsable de Frontend. La rama se publica desde esa cuenta y requiere revisión de otro integrante antes de fusionarse.

## Decisión de stack: Vite + React

La Issue #10 permite proponer una librería o framework, pero exige explicar cuatro puntos antes de añadirlo y que la coordinación fije la decisión con el equipo. Esta implementación se preparó con **Vite + React** por solicitud directa para esta rama. **No se afirma que la coordinación ya haya aprobado formalmente el cambio**; la propuesta se documenta aquí y debe registrarse en la Issue #10 y en el PR #15 antes de fusionar.

| Punto exigido | Respuesta para este prototipo |
| --- | --- |
| 1. Necesidad que resuelve | Componentes reutilizables, rutas explícitas, estado de formularios y mantenimiento más simple para cuatro pantallas relacionadas. La lógica de negocio y los permisos siguen en Backend. |
| 2. Instalación y ejecución en Windows sin hosting | Requiere Node.js `>=22.12.0` y npm. En PowerShell: `cd prototype/web`, `npm ci`, `npm run dev`. No requiere hosting, VPS, dominio ni Internet durante la operación normal; solo la instalación inicial de dependencias. |
| 3. Servicio desde FastAPI en la LAN | `npm run build` genera `dist/`. FastAPI puede montar `dist/assets` como archivos estáticos y devolver `dist/index.html` para las rutas de la SPA. La API y la interfaz quedan en el mismo origen `/api/v1`. Los clientes de la LAN solo necesitan navegador; no instalan Node ni PostgreSQL. |
| 4. Costos, dependencias y compatibilidad | React, React DOM, React Router, Vite y `@vitejs/plugin-react` son open source y sin costo. El build de referencia generó ~283 KB de JavaScript (88 KB gzip) y ~5,5 KB de CSS (1,9 KB gzip). Node solo se usa para desarrollo/build; el runtime sigue siendo FastAPI. El contrato HTTP/JSON no cambia. |

## Requisitos

- Node.js `>=22.12.0`. Verificado con `v22.23.1`.
- npm `10.9.8` o compatible.
- No se necesita Python para desarrollar o construir el frontend.
- El Backend real sigue siendo FastAPI/PostgreSQL y se ejecuta por separado.

## Cómo ejecutar

Todos los comandos de esta sección se ejecutan **dentro de `prototype/web`**. Desde la raíz del repositorio fallarán con `ENOENT` porque allí no hay `package.json`.

### Con el mock versionado del contrato

En dos terminales, desde `prototype/web`:

```bash
# Terminal 1: API simulada, solo para desarrollo local
npm run mock

# Terminal 2: Vite con proxy /api hacia 127.0.0.1:8000
npm run dev
```

Abrir `http://localhost:5173/login`.

Cuentas **sintéticas** del mock, solo para probar la interfaz en local:

| Correo | Contraseña de demostración | Rol |
| --- | --- | --- |
| `admin@example.com` | `AdminDemo123!` | ADMIN |
| `user@example.com` | `UserDemo123!` | USER |
| `inactive@example.com` | `InactiveDemo123!` | USER inactivo |

El mock está en `test/mock-api.mjs`, mantiene los datos en memoria y no usa PostgreSQL. **No es Backend real**, no usa TLS y no debe recibir credenciales personales. Sus contraseñas pueden cambiarse con variables de entorno `MOCK_ADMIN_PASSWORD`, `MOCK_USER_PASSWORD` y `MOCK_INACTIVE_PASSWORD`.

### Contra el Backend real

```bash
npm ci
npm run dev
```

El servidor de desarrollo de Vite redirige `/api` a `http://127.0.0.1:8000`, donde se supone que corre FastAPI. Si el Backend no está levantado, la interfaz muestra errores de conexión; **no simula un login**.

### Windows (PowerShell)

```powershell
cd prototype\web
npm ci
npm run mock   # terminal 1, solo si se usa el mock
npm run dev    # terminal 2
```

Para producir la versión que puede servir FastAPI:

```powershell
npm run build
```

La salida queda en `prototype/web/dist/`. `node_modules/` y `dist/` están ignorados por Git.

### Pruebas automatizadas

```bash
npm test          # una ejecución, 40 pruebas
npm run test:watch
```

Las pruebas cubren el cliente del contrato (rutas, JSON, CSRF, 204, errores), la validación y el reducer de sesión, la carrera de `AuthProvider`, la sección administrativa de `SessionPage` y los nueve endpoints del mock. La Action `.github/workflows/web-tests.yml` ejecuta `npm ci`, `npm test` y `npm run build`; no certifica el Backend.

## Rutas de la SPA

| Ruta | Pantalla |
| --- | --- |
| `/login` | Acceso con email y contraseña |
| `/session` | Sesión, rol, logout y consulta ADMIN |
| `/recover` | Solicitud genérica y canje de código temporal |
| `/change-password` | Cambio de contraseña autenticado |
| `/` | Redirección a `/login` |
| Otra | Pantalla “no encontrada” |

## Estructura

```text
prototype/web/
├── package.json
├── package-lock.json
├── vite.config.js
├── vitest.config.js
├── .env.example             Configuración opcional, sin secretos
├── index.html
├── .gitignore
├── README.md
├── evidence/                Capturas con datos ficticios
├── test/
│   ├── mock-api.mjs         Mock local de los 9 endpoints
│   └── mock-api.test.mjs    Pruebas del contrato simulado
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles.css
    ├── api/
    │   ├── client.js        Cliente fetch, CSRF y mismo origen
    │   └── client.test.js
    ├── auth/
    │   ├── AuthProvider.jsx Sesión, login, logout y carreras
    │   └── AuthProvider.test.jsx
    ├── components/
    │   ├── Layout.jsx
    │   ├── Notice.jsx
    │   ├── FocusHeading.jsx
    │   └── SessionGate.jsx
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── SessionPage.jsx  Sesión y administración de cuentas
    │   ├── SessionPage.test.jsx
    │   ├── RecoverPage.jsx
    │   ├── ChangePasswordPage.jsx
    │   └── NotFoundPage.jsx
    ├── test/setup.js
    └── utils/
        ├── roles.js
        ├── session.js       Validación y reducer de sesión
        └── session.test.js
```

## Contrato utilizado

| Acción | Método y ruta | Uso en la interfaz |
| --- | --- | --- |
| Iniciar sesión | `POST /api/v1/auth/login` | `/login` |
| Consultar sesión | `GET /api/v1/auth/me` | `AuthProvider`, `/session`, `/change-password` |
| Cerrar sesión | `POST /api/v1/auth/logout` | `/session` |
| Solicitar recuperación | `POST /api/v1/auth/forgot-password` | `/recover` |
| Canjear código temporal | `POST /api/v1/auth/reset-password` | `/recover` |
| Cambiar contraseña | `POST /api/v1/auth/change-password` | `/change-password` |
| Listar usuarios | `GET /api/v1/admin/users` | `/session`, solo si el rol es `ADMIN` |
| Crear cuenta | `POST /api/v1/admin/users` | `/session`, solo ADMIN |
| Emitir código temporal | `POST /api/v1/admin/password-resets` | `/session`, solo ADMIN |

Reglas aplicadas:

- `fetch` con `credentials: "same-origin"` y base `/api/v1`.
- La cookie de sesión es HttpOnly; el JavaScript no la lee ni la escribe.
- No se usa `localStorage`, `sessionStorage`, IndexedDB ni variables globales para secretos. El código temporal de recuperación solo vive en el estado de React de la pantalla y se descarta al recargar.
- Los mensajes de error de login no confirman si un correo existe.
- La recuperación no afirma que se envían correos. El código lo entrega un administrador por un canal externo.
- Ocultar botones de ADMIN es solo presentación; el Backend debe responder 401/403 aunque se modifique la solicitud.

### CSRF y sesión: estado provisional

El contrato deja pendiente el mecanismo CSRF definitivo. Para no bloquear la interfaz, el cliente implementa un patrón **double-submit cookie** configurable:

1. Backend publica un token en una cookie legible por JavaScript (`csrf_token` por defecto), separada de la cookie HttpOnly de sesión.
2. El cliente lo envía en la cabecera `X-CSRF-Token` en `POST`, `PUT`, `PATCH` y `DELETE`.
3. Si Backend devuelve el token en la cabecera `X-CSRF-Token`, el cliente lo recuerda para peticiones posteriores.
4. Los nombres pueden cambiarse con `VITE_CSRF_COOKIE`, `VITE_CSRF_HEADER` y `VITE_CSRF_META`. Ver `.env.example`.

**Esto no es una decisión cerrada.** Backend debe confirmar el nombre de la cookie, la cabecera, el momento de emisión y la verificación del origen. Si elige otro mecanismo, solo se ajusta `src/api/client.js`; la interfaz no necesita rehacerse. Los límites de intentos, la expiración y la revocación de sesiones se aplican en el servidor.

`VITE_API_BASE` debe ser una ruta del mismo origen. Una URL absoluta del mismo origen se reduce a su ruta; una URL externa se descarta con una advertencia y se usa `/api/v1`, porque `credentials: "same-origin"` no enviaría la cookie de sesión.

El estado de sesión se valida en dos niveles: `normalizeUser()` exige `id`, `email` y `role` limitado a `ADMIN`/`USER`; el reducer descarta respuestas de peticiones antiguas mediante un `requestId`. Así, un `/auth/me` lento no sobrescribe un login reciente.

## Integración con FastAPI en la LAN (propuesta)

Este repositorio **no modifica** `prototype/app/main.py` porque pertenece al área de Backend. Para integrar, Backend debe:

1. Ejecutar `npm run build` en la laptop servidor.
2. Montar `prototype/web/dist/assets` como archivos estáticos.
3. Servir `prototype/web/dist/index.html` en las rutas explícitas de la SPA: `/login`, `/session`, `/recover` y `/change-password`.
4. Mantener la API bajo `/api/v1` en el mismo origen.
5. **Conservar `GET /` del dashboard heartbeat de la POC** durante la integración inicial. Por eso se recomienda no usar un catch-all: un comodín puede ocultar `/`, `/api/v1`, `/docs` o los assets. La SPA se abre por `/login`.

Ejemplo orientativo, pendiente de implementación y revisión por Backend:

```python
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()
# ... ruta "/" de la POC y rutas /api/v1 existentes ...

app.mount("/assets", StaticFiles(directory="web/dist/assets"), name="assets")

def spa_index() -> FileResponse:
    return FileResponse("web/dist/index.html")

# Rutas explícitas: no se registra un catch-all que tape "/", "/docs" o "/api".
for ruta in ("/login", "/session", "/recover", "/change-password"):
    app.add_api_route(ruta, spa_index, include_in_schema=False)
```

Cuando el equipo decida migrar el dashboard a la SPA, ese cambio debe ser deliberado, con sus pruebas. Mientras tanto, la POC sigue accesible en `/` y la interfaz de autenticación en `/login`. Los clientes de la LAN abren `http://IP_PRIVADA_DEL_SERVIDOR:8000/login`. No instalan Node, Vite ni PostgreSQL. No se debe exponer PostgreSQL ni usar credenciales reales sin HTTPS/TLS.

## Capturas de evidencia

Las imágenes están en [`evidence/`](evidence/). Todas usan correos ficticios (`user@example.com`, `admin@example.com`, `inactive@example.com`) y no muestran contraseñas.

| Archivo | Qué muestra | Condición |
| --- | --- | --- |
| `01-login.png` | Formulario de acceso | Build servido sin API |
| `02-login-error-api-ausente.png` | Error al no existir la ruta de login | Build servido sin API |
| `03-recuperacion.png` | Solicitud y canje del código temporal | Build servido sin API |
| `04-sesion-sin-api.png` | Estado de sesión sin API disponible | Build servido sin API |
| `05-cambio-sin-api.png` | Cambio de contraseña sin API disponible | Build servido sin API |
| `06-sesion-usuario-mock.png` | Sesión de USER y acciones visibles | **Mock de contrato**, no Backend real |
| `07-sesion-admin-mock.png` | Sesión ADMIN y lista de usuarios | **Mock de contrato**, no Backend real |
| `08-cambio-contrasena-mock.png` | Cambio exitoso y revocación de sesiones | **Mock de contrato**, no Backend real |
| `09-recuperacion-exitosa-mock.png` | Recuperación exitosa sin login automático | **Mock de contrato**, no Backend real |

Las capturas `06` a `09` llevan un banner visible que dice **“VISTA DE PRUEBA: respuestas simuladas del contrato. No es integración real con Backend”**. El servidor temporal usado para generarlas no está versionado; era un servidor Node de prueba. No se debe presentar como evidencia de login real.

Las capturas existentes son anteriores a la sección de creación de cuentas, emisión de códigos y CSRF de esta revisión. Las pantallas nuevas están cubiertas por pruebas automatizadas, pero **todavía no tienen captura propia**; se generarán contra el mock versionado o contra el Backend real cuando el equipo lo autorice. No se reemplazan las evidencias anteriores ni se presentan como si mostraran las pantallas nuevas.

## Validaciones ejecutadas

Se registran aquí únicamente comprobaciones realizadas.

| Fecha | Verificación | Comando o método | Resultado |
| --- | --- | --- | --- |
| 22/11/2026 | Instalación de dependencias | `npm ci` | OK; instalación reproducible con lockfile, sin fallos |
| 22/11/2026 | Build de producción | `npm run build` | OK; Vite 8.3.8, 35 módulos; JS ~283 KB (88 KB gzip), CSS ~5,5 KB (1,9 KB gzip) |
| 22/11/2026 | Cliente API con `fetch` simulado | Node + 10 comprobaciones de rutas, métodos, cuerpo JSON, 401, 403, 404, 422 y error de red | OK |
| 22/11/2026 | Rutas de la SPA servidas desde `dist` | Servidor Node temporal con fallback a `index.html` | HTTP 200 en `/login`, `/recover`, `/session`, `/change-password` |
| 22/11/2026 | Navegación y estados de error sin API | Playwright + Chromium headless sobre build de producción | OK; formularios, avisos, navegación activa y almacenamiento vacío; sin errores de página |
| 22/11/2026 | Flujos contra un mock Node del contrato | Playwright: login USER/ADMIN, `/auth/me`, 403 de USER en `/admin/users`, lista ADMIN, logout, cambio de contraseña, contraseña anterior rechazada, recuperación, código inválido y reutilizado | OK; **no es integración real con Backend** |
| 23/11/2026 | Pruebas automatizadas del Frontend | `npm test` (Vitest 5 + Testing Library + jsdom) | **40 pruebas aprobadas**; cliente, CSRF, validación/reducer de sesión, carrera de `AuthProvider`, administración de `SessionPage` y mock del contrato |
| 23/11/2026 | Build de producción | `npm run build` | OK; Vite 8.3.8, 36 módulos; JS ~290,6 KB (90,4 KB gzip), CSS ~6,1 KB (2,1 KB gzip) |
| 23/11/2026 | Mock versionado del contrato | `npm run mock` y `curl` a `/api/v1/auth/login` con ADMIN sintético | HTTP 200, usuario ADMIN y cookies `session_id`/`csrf_token`; **simulación local, no Backend** |
| 22/11/2026 | Login real contra `/api/v1/auth/login` | Backend/AUTH-001 | **NO EJECUTADO**: endpoint no disponible en el PR #14 |
| 22/11/2026 | Pruebas con PostgreSQL, cookies del Backend real y CSRF definitivo | Requiere integración | **NO EJECUTADO** |

Las capturas y el mock no sustituyen la prueba con el Backend real. El mock versionado en `test/mock-api.mjs` existe para desarrollo y pruebas reproducibles; sus resultados no demuestran login real.

## Pendientes y dependencias

1. Registrar en la Issue #10 la decisión de coordinación sobre Vite + React y enlazar la respuesta de la auditoría del PR #15.
2. Backend debe confirmar el mecanismo CSRF definitivo: nombres de cookie/cabecera, emisión y verificación de origen. El cliente ya envía el token provisional; si cambia el mecanismo, solo se ajusta `src/api/client.js`.
3. Backend debe confirmar el nombre del campo del código en `POST /admin/password-resets`. El cliente espera `code` y, opcionalmente, `expires_at`; el contrato actual no fija el JSON de éxito.
4. Backend debe implementar los nueve endpoints del contrato y servir `dist/` en `/login`, `/session`, `/recover` y `/change-password`, conservando `/` de la POC y sin catch-all.
5. Revisar la política de contraseñas y los códigos de error reales para ajustar los mensajes sin revelar información.
6. Ejecutar pruebas funcionales reales con ADMIN y USER ficticios, cookies del Backend, CSRF, logout, expiración, 403 y recuperación de un solo uso.
7. Reemplazar o ampliar las capturas con evidencia del Backend real cuando esté disponible; las pantallas administrativas nuevas aún no tienen captura.
8. Revisión de otro integrante y del equipo antes de fusionar el PR.
9. Mantener actualizado el PR Draft #15 y no fusionar hasta cumplir los pendientes anteriores.

## Registro del proceso

1. Se identificó la Issue #10 y se comprobó que la rama `feat/auth-frontend-p0` existía vacía y dos commits detrás de `integration/auth-p0`.
2. Se actualizó la rama por fast-forward, sin crear una rama nueva ni tocar `main`.
3. La primera versión se hizo con HTML/CSS/JavaScript sin framework. Después se solicitó cambiar el frontend a **Node + Vite + React**.
4. Se retiraron las vistas estáticas anteriores y se creó una SPA con Vite, React, React Router y un cliente `fetch` modular bajo `prototype/web/`.
5. Se instalaron las dependencias, se generó `package-lock.json` y se construyó `dist/` con `npm run build`.
6. Se validó la interfaz con Playwright y Chromium headless; se usó un servidor Node temporal con respuestas del contrato para probar los flujos, sin versionarlo.
7. Se generaron capturas nuevas y se marcaron las que dependen del mock como simuladas.
8. No se modificaron Backend, Base de Datos ni QA. No se hizo merge ni push a `main`.
9. El push inicial falló con **403** porque la sesión activa de `gh` era `KingPandX`, sin permiso de escritura. Se cambió la sesión a `jbrkll007`, se generó una clave SSH específica para esa cuenta, se agregó a GitHub y se configuró `core.sshCommand` en el repositorio local. El push por SSH funcionó.
10. La revisión funcional real queda pendiente de AUTH-001 y de la revisión de otro integrante. La auditoría del PR #15 mantuvo Vite + React y pidió mejoras incrementales.
11. Se abrió el PR Draft #15 hacia `integration/auth-p0`, sin fusionarlo.
12. Tras la auditoría técnica del PR #15, se conservó Vite + React y se atendieron los hallazgos dentro de `prototype/web/`, sin rehacer la interfaz.
13. Se añadió la sección ADMIN para crear cuentas y emitir códigos temporales, además de la lista existente. El código se muestra una sola vez y no se guarda en el navegador.
14. Se añadió el envío provisional de CSRF en el cliente, la validación de la forma de `user` y la invalidación de respuestas obsoletas de sesión. Los nombres del mecanismo CSRF quedan pendientes de confirmación por Backend.
15. Se versionó un mock del contrato y se añadieron 40 pruebas automatizadas con Vitest/Testing Library, más una Action que ejecuta pruebas y build del Frontend.
16. No se modificaron archivos de Backend, Base de Datos ni QA. El PR #15 permanece en Draft y no se fusionó.

## Autoría y alcance

Este prototipo se preparó en la rama `feat/auth-frontend-p0`. No se modificaron archivos de Backend, Base de Datos ni QA. La autoría real queda registrada en los commits y en el PR #15; no se atribuye revisión ni aprobación a integrantes que no hayan participado.

Los commits creados antes del cambio de identidad local conservan su autoría original; los posteriores figuran como `jbrkll007 <jbrkll007@gmail.com>`. No se reescribió la historia ya publicada para no usar force push.

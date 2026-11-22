# Prototipo web — FRONT-002 (Vite + React)

Pantallas de acceso, sesión, recuperación y cambio de contraseña para la revisión de autenticación P0. Este trabajo corresponde a la [Issue #10](https://github.com/maorusohh/soporte-redes-unefa/issues/10) y sigue el contrato de [docs/10-CONTRATO-INTEGRACION-AUTH.md](../../docs/10-CONTRATO-INTEGRACION-AUTH.md).

## Estado real de la entrega

- **Stack implementado:** Vite 8 + React 19 + React Router 7, con JavaScript/JSX y Node/npm como herramienta de desarrollo.
- **Implementado:** SPA con rutas `/login`, `/session`, `/recover` y `/change-password`; estados de carga, errores, navegación, cierre de sesión, cambio y recuperación de contraseña.
- **No implementado:** autenticación real, endpoints de FastAPI, esquema PostgreSQL, CSRF definitivo y pruebas funcionales completas.
- **No verificado:** login exitoso contra Backend. El PR de Backend (#14) contiene modelos y utilidades de seguridad, pero todavía no expone `/auth/login`.
- **Publicación:** la rama `feat/auth-frontend-p0` se publica en `origin` por SSH desde la cuenta `jbrkll007`; el PR Draft [#15](https://github.com/maorusohh/soporte-redes-unefa/pull/15) se abre hacia `integration/auth-p0` y se enlaza desde la Issue #10.
- **Regla respetada:** no hay usuarios, contraseñas ni sesiones simuladas en el código de la aplicación. Si la API no está disponible, la interfaz muestra un error honesto.

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

Desde `prototype/web`:

```bash
npm ci
npm run dev
```

Abrir `http://localhost:5173/login`.

El servidor de desarrollo de Vite redirige `/api` a `http://127.0.0.1:8000`, donde se supone que corre FastAPI. Si el Backend no está levantado, la interfaz muestra errores de conexión; **no simula un login**.

### Windows (PowerShell)

```powershell
cd prototype\web
npm ci
npm run dev
```

Para producir la versión que puede servir FastAPI:

```powershell
npm run build
```

La salida queda en `prototype/web/dist/`. `node_modules/` y `dist/` están ignorados por Git.

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
├── index.html
├── .gitignore
├── README.md
├── evidence/                  Capturas con datos ficticios
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles.css
    ├── api/client.js          Cliente fetch del contrato /api/v1
    ├── auth/AuthProvider.jsx  Sesión, login, logout y errores
    ├── components/
    │   ├── Layout.jsx
    │   ├── Notice.jsx
    │   ├── FocusHeading.jsx
    │   └── SessionGate.jsx
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── SessionPage.jsx
    │   ├── RecoverPage.jsx
    │   ├── ChangePasswordPage.jsx
    │   └── NotFoundPage.jsx
    └── utils/roles.js
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

Reglas aplicadas:

- `fetch` con `credentials: "same-origin"` y base `/api/v1`.
- La cookie de sesión es HttpOnly; el JavaScript no la lee ni la escribe.
- No se usa `localStorage`, `sessionStorage`, IndexedDB ni variables globales para secretos.
- Los mensajes de error de login no confirman si un correo existe.
- La recuperación no afirma que se envían correos. El código lo entrega un administrador por un canal externo.
- No se inventa un token CSRF: el contrato indica que el mecanismo definitivo sigue pendiente en Backend. Cuando se defina, debe añadirse en `src/api/client.js` para las operaciones mutantes.
- Ocultar botones de ADMIN es solo presentación; el Backend debe responder 401/403 aunque se modifique la solicitud.

## Integración con FastAPI en la LAN (propuesta)

Este repositorio **no modifica** `prototype/app/main.py` porque pertenece al área de Backend. Para integrar, Backend debe:

1. Ejecutar `npm run build` en la laptop servidor.
2. Montar `prototype/web/dist/assets` como archivos estáticos.
3. Devolver `prototype/web/dist/index.html` para las rutas de la SPA (`/login`, `/session`, `/recover`, `/change-password`).
4. Mantener la API bajo `/api/v1` en el mismo origen.
5. Definir el catch-all de la SPA **después** de las rutas de la API y de `/docs`, para no taparlas.

Ejemplo orientativo, pendiente de implementación y revisión por Backend:

```python
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()
# ... rutas /api/v1 existentes ...

app.mount("/assets", StaticFiles(directory="web/dist/assets"), name="assets")

@app.get("/{full_path:path}", include_in_schema=False)
def spa(full_path: str) -> FileResponse:
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404)
    return FileResponse("web/dist/index.html")
```

Los clientes de la LAN abren `http://IP_PRIVADA_DEL_SERVIDOR:8000/`. No instalan Node, Vite ni PostgreSQL. No se debe exponer PostgreSQL ni usar credenciales reales sin HTTPS/TLS.

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
| 22/11/2026 | Login real contra `/api/v1/auth/login` | Backend/AUTH-001 | **NO EJECUTADO**: endpoint no disponible en el PR #14 |
| 22/11/2026 | Pruebas con PostgreSQL, cookies del Backend real y CSRF definitivo | Requiere integración | **NO EJECUTADO** |

Las capturas y el mock no sustituyen la prueba con el Backend real. El mock no se commiteó: era un servidor Node temporal en `/tmp` para validar la interfaz.

## Pendientes y dependencias

1. Registrar en la Issue #10 la propuesta Vite + React y obtener la decisión de coordinación, si aún no está aprobada.
2. Backend debe implementar los endpoints del contrato y el mecanismo CSRF antes de probar los formularios de forma integrada.
3. Backend debe servir `dist/` desde FastAPI, con fallback de la SPA en el mismo origen.
4. Revisar la política de contraseñas y los códigos de error reales para ajustar los mensajes sin revelar información.
5. Ejecutar pruebas funcionales reales con ADMIN y USER ficticios, logout, expiración, 403 y recuperación de un solo uso.
6. Reemplazar las capturas con mock por capturas contra el Backend real cuando esté disponible.
7. Revisión de otro integrante y del equipo antes de fusionar el PR.
8. Mantener actualizado el PR Draft #15 y no fusionar hasta cumplir los pendientes anteriores.

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
10. La revisión funcional real queda pendiente de AUTH-001, de la aprobación del stack y de la revisión de otro integrante.
11. Se abrió el PR Draft #15 hacia `integration/auth-p0`, sin fusionarlo.

## Autoría y alcance

Este prototipo se preparó en la rama `feat/auth-frontend-p0`. No se modificaron archivos de Backend, Base de Datos ni QA. La autoría real queda registrada en los commits y en el PR #15; no se atribuye revisión ni aprobación a integrantes que no hayan participado.

Los commits creados antes del cambio de identidad local conservan su autoría original; los posteriores figuran como `jbrkll007 <jbrkll007@gmail.com>`. No se reescribió la historia ya publicada para no usar force push.

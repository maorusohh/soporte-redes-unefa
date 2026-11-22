# Prototipo web — FRONT-002

Pantallas de acceso, sesión, recuperación y cambio de contraseña para la revisión de autenticación P0. Este trabajo corresponde a la [Issue #10](https://github.com/maorusohh/soporte-redes-unefa/issues/10) y sigue el contrato de [docs/10-CONTRATO-INTEGRACION-AUTH.md](../../docs/10-CONTRATO-INTEGRACION-AUTH.md).

## Estado real de la entrega

- **Implementado:** HTML, CSS y JavaScript modular para las cuatro pantallas, con estados de carga, errores, navegación y llamadas `fetch` al contrato `/api/v1`.
- **No implementado:** autenticación real, endpoints de FastAPI, esquema PostgreSQL, CSRF definitivo y pruebas funcionales completas.
- **No verificado:** login exitoso contra Backend. El PR de Backend (#14) contiene modelos y utilidades de seguridad, pero todavía no expone `/auth/login`.
- **Publicación:** los commits están en la rama local `feat/auth-frontend-p0`. El push a `origin` fue rechazado con 403 porque la cuenta usada tiene permiso de lectura pero no de escritura. No se abrió PR.
- **Regla respetada:** no hay usuarios, contraseñas ni sesiones simuladas en el código. Si la API no está disponible, la interfaz muestra un error honesto.

La Issue #10 está asignada a Joiber (`jbrkll007`), responsable de Frontend. Este trabajo debe ser revisado por esa área antes de considerarse terminado o fusionarse.

## Archivos

```text
prototype/web/
├── index.html                 Redirección de entrada a login.html
├── login.html                 Formulario de acceso
├── session.html               Sesión, rol, logout y consulta ADMIN
├── recover.html               Solicitud genérica y canje de código temporal
├── change-password.html       Cambio de contraseña autenticado
├── assets/
│   ├── css/styles.css         Estilos propios, sin fuentes ni CDN externos
│   └── js/
│       ├── api.js             Cliente fetch del contrato /api/v1
│       ├── ui.js              Mensajes, estados de carga y utilidades
│       ├── login.js
│       ├── session.js
│       ├── recover.js
│       └── change-password.js
├── evidence/                  Capturas con datos ficticios (ver más abajo)
└── README.md
```

## Contrato utilizado

| Acción | Método y ruta | Uso en la interfaz |
| --- | --- | --- |
| Iniciar sesión | `POST /api/v1/auth/login` | `login.html` |
| Consultar sesión | `GET /api/v1/auth/me` | `session.html`, `change-password.html`, `login.html` |
| Cerrar sesión | `POST /api/v1/auth/logout` | `session.html` |
| Solicitar recuperación | `POST /api/v1/auth/forgot-password` | `recover.html` |
| Canjear código temporal | `POST /api/v1/auth/reset-password` | `recover.html` |
| Cambiar contraseña | `POST /api/v1/auth/change-password` | `change-password.html` |
| Listar usuarios | `GET /api/v1/admin/users` | `session.html`, solo si el rol es `ADMIN` |

Reglas aplicadas:

- `fetch` con `credentials: "same-origin"` y base `/api/v1`.
- La cookie de sesión es HttpOnly; el JavaScript no la lee ni la escribe.
- No se usa `localStorage`, `sessionStorage`, IndexedDB ni variables globales para secretos.
- Los mensajes de error de login no confirman si un correo existe.
- La recuperación no afirma que se envían correos. El código lo entrega un administrador por un canal externo.
- No se inventa un token CSRF: el contrato indica que el mecanismo definitivo sigue pendiente en Backend. Cuando se defina, debe añadirse en `api.js` para las operaciones mutantes.
- Ocultar botones de ADMIN es solo presentación; el Backend debe responder 401/403 aunque se modifique la solicitud.

## Cómo revisar las vistas

Desde la raíz del repositorio:

```bash
cd prototype/web
python -m http.server 8000
```

Abrir `http://localhost:8000/login.html`.

Con ese servidor estático, las llamadas a `/api/v1/...` devuelven 404 porque no existe Backend en ese origen. Ese comportamiento es esperado y sirve para comprobar los estados de error; **no demuestra integración real**.

Para la integración real, Backend debe servir estas vistas y la API desde el **mismo origen**, por ejemplo montando `prototype/web` como archivos estáticos en FastAPI. No se modificó `prototype/app/main.py` porque pertenece al área de Backend.

## Capturas de evidencia

Las imágenes están en [`evidence/`](evidence/). Todas usan correos ficticios (`user@example.com`, `admin@example.com`, `inactive@example.com`) y no muestran contraseñas.

| Archivo | Qué muestra | Condición |
| --- | --- | --- |
| `01-login.png` | Formulario de acceso | Servidor estático, sin API |
| `02-login-error-api-ausente.png` | Error al no existir la ruta de login | Servidor estático, sin API |
| `03-recuperacion.png` | Solicitud y canje del código temporal | Servidor estático, sin API |
| `04-sesion-sin-api.png` | Estado de sesión sin API disponible | Servidor estático, sin API |
| `05-cambio-sin-api.png` | Cambio de contraseña sin API disponible | Servidor estático, sin API |
| `06-sesion-usuario-mock.png` | Sesión de USER y acciones visibles | **Mock de contrato**, no Backend real |
| `07-sesion-admin-mock.png` | Sesión ADMIN y lista de usuarios | **Mock de contrato**, no Backend real |
| `08-cambio-contrasena-mock.png` | Cambio exitoso y revocación de sesiones | **Mock de contrato**, no Backend real |
| `09-recuperacion-exitosa-mock.png` | Recuperación exitosa sin login automático | **Mock de contrato**, no Backend real |

Las capturas `06` a `09` llevan un banner visible que dice **“VISTA DE PRUEBA: respuestas simuladas del contrato. No es integración real con Backend”**. El servidor temporal usado para generarlas no está versionado; solo sirvió para comprobar el comportamiento del JavaScript. No se debe presentar como evidencia de login real.

## Validaciones ejecutadas

Se registran aquí únicamente comprobaciones realizadas.

| Fecha | Verificación | Comando o método | Resultado |
| --- | --- | --- | --- |
| 22/11/2026 | Rama y base contra `integration/auth-p0` | `git switch -c feat/auth-frontend-p0 --track origin/feat/auth-frontend-p0` + `git merge --ff-only origin/integration/auth-p0` | OK; la rama quedó en `67be96a` |
| 22/11/2026 | Sintaxis de los archivos JavaScript | `node --check prototype/web/assets/js/*.js` | OK en los 6 archivos |
| 22/11/2026 | Referencias HTML/CSS/JS, ids, labels, `aria-*`, enlaces y ausencia de almacenamiento | Validador Python temporal sin dependencias | OK; 5 páginas, ids únicos, todos los `getElementById` existen |
| 22/11/2026 | Cliente API con `fetch` simulado | Node + 8 comprobaciones de rutas, métodos, cuerpo JSON, 401, 403, 422, 404 y error de red | OK |
| 22/11/2026 | Servidor estático | `python -m http.server 8000` y `curl` a las 5 páginas y recursos | HTTP 200 en todas las páginas y recursos |
| 22/11/2026 | Navegación y estados de error en Chromium headless | Playwright: login, error sin API, recuperación, sesión sin API, cambio sin API, 4 enlaces de navegación y almacenamiento vacío | OK; `localStorage` y `sessionStorage` vacíos; sin errores de página |
| 22/11/2026 | Flujos contra un mock temporal del contrato | Playwright: login USER/ADMIN, `/auth/me`, 403 de USER en `/admin/users`, lista ADMIN, logout, cambio de contraseña, contraseña anterior rechazada, recuperación, código inválido y código reutilizado | OK; **no es integración real con Backend** |
| 22/11/2026 | Login real contra `/api/v1/auth/login` | Backend/AUTH-001 | **NO EJECUTADO**: endpoint no disponible en el PR #14 |
| 22/11/2026 | Pruebas con PostgreSQL, cookies del Backend real y CSRF definitivo | Requiere integración | **NO EJECUTADO** |

Las capturas y el mock no sustituyen la prueba con el Backend real. El mock no se commiteó: era un servidor temporal en `/tmp` para validar la interfaz.

## Pendientes y dependencias

1. Backend debe implementar los endpoints del contrato y el mecanismo CSRF antes de probar los formularios de forma integrada.
2. Definir cómo se sirve `prototype/web` desde FastAPI en el mismo origen.
3. Revisar la política de contraseñas y los códigos de error reales para ajustar los mensajes sin revelar información.
4. Ejecutar pruebas funcionales reales con ADMIN y USER ficticios, logout, expiración, 403 y recuperación de un solo uso.
5. Reemplazar las capturas con mock por capturas contra el Backend real cuando esté disponible.
6. Revisión de Joiber (Frontend) y del equipo antes de fusionar el PR.

## Registro del proceso

1. Se identificó la Issue #10 y se comprobó que la rama `feat/auth-frontend-p0` existía vacía y dos commits detrás de `integration/auth-p0`.
2. Se actualizó la rama por fast-forward, sin crear una rama nueva ni tocar `main`.
3. Se crearon las vistas y el cliente `fetch` bajo `prototype/web/`, respetando la propiedad de carpetas del documento 10.
4. Se validó la estructura, la sintaxis, el cliente API y los estados de error con un servidor estático.
5. Se levantó un mock temporal del contrato para comprobar los flujos completos de UI; se marcó cada captura como simulada.
6. No se modificaron Backend, Base de Datos ni QA. No se hizo merge ni push a `main`.
7. Se intentó publicar la rama en `origin`. GitHub respondió **403**: la cuenta usada tiene `pull: true` y `push: false` sobre el repositorio. No se abrió Pull Request.
8. La revisión funcional real queda pendiente de AUTH-001 y de la revisión humana del área de Frontend. La publicación requiere que un colaborador con permiso de escritura suba la rama o autorice la cuenta usada.

## Autoría y alcance

Este prototipo se preparó en la rama `feat/auth-frontend-p0`. No se modificaron archivos de Backend, Base de Datos ni QA. La autoría real queda registrada en los commits y, cuando se publique, en el Pull Request; no se atribuye revisión ni aprobación a integrantes que no hayan participado.

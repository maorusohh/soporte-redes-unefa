# 10. Contrato de integración — autenticación P0

**Estado:** propuesta técnica común para la revisión de la semana 23–29/11/2026. Requiere validación del equipo antes de considerarse contrato cerrado. Fuente: [PR #13](https://github.com/maorusohh/soporte-redes-unefa/pull/13), [AUTH #9](https://github.com/maorusohh/soporte-redes-unefa/issues/9), [Frontend #10](https://github.com/maorusohh/soporte-redes-unefa/issues/10), [Datos #11](https://github.com/maorusohh/soporte-redes-unefa/issues/11) y [QA #12](https://github.com/maorusohh/soporte-redes-unefa/issues/12). Es **una especificación**, no endpoints implementados.

## Regla de arquitectura para el equipo

- Una laptop ejecutará la aplicación FastAPI y PostgreSQL. Los clientes acceden desde su navegador al **mismo origen HTTP(S)** del servidor por localhost o por LAN privada propia autorizada. PostgreSQL **no se instala ni expone en laptops cliente**.
- Un **usuario** inicia sesión en navegador; un **agente** envía heartbeats y, en incrementos posteriores, métricas. Son identidades y procesos distintos. No activar monitoreo automáticamente por iniciar sesión.
- Usar solo datos y correos ficticios en pruebas; sin servicios de Internet obligatorios. Para introducir **credenciales reales** sobre LAN se requerirá HTTPS/TLS; HTTP local o en laboratorio con credenciales sintéticas no representa producción segura.
- El sistema **no** incorpora Google OAuth, registro público libre, correo SMTP, acceso remoto a pantallas ni lectura de navegación.

## Propuesta de API HTTP/JSON (`/api/v1`)

Respuestas JSON y nombres de campos en inglés; interfaz y mensajes legibles en español. El frontend usa `fetch` con `credentials: "same-origin"` y no almacena secretos en `localStorage`. Backend controla permisos **siempre**, incluso si el frontend oculta los botones.

| Método | Ruta | Request JSON | Éxito / respuesta esperada | Quién |
| --- | --- | --- | --- | --- |
| POST | /auth/login | `{"email":"user@example.com","password":"<secreto>"}` | 200 `{"user":{"id":"...","email":"...","role":"USER"}}` + cookie de sesión HttpOnly | Público |
| GET | /auth/me | — | 200 `{"user":{"id":"...","email":"...","role":"ADMIN"}}` | Sesión válida |
| POST | /auth/logout | — | 204; cookie e identificador de sesión revocados | Sesión válida |
| POST | /auth/change-password | `{"current_password":"...","new_password":"..."}` | 204 y revocación de sesiones anteriores | Sesión válida |
| POST | /auth/forgot-password | `{"email":"user@example.com"}` | 202 con respuesta genérica, haya o no cuenta; **no envía correos** | Público |
| POST | /auth/reset-password | `{"email":"user@example.com","code":"...","new_password":"..."}` | 204 cuando código autorizado es válido, no consumido ni expirado | Código supervisado |
| GET | /admin/users | — | 200 `{"users":[{"id":"...","email":"...","role":"USER","active":true}]}` | ADMIN |
| POST | /admin/users | `{"email":"user@example.com","role":"USER"}` | 201 `{"user":{...}}`; contraseña inicial se configura por activación/código | ADMIN |
| POST | /admin/password-resets | `{"user_id":"..."}` | 201 con código temporal visible **solo al ADMIN**, una vez; se entrega fuera de la API pública | ADMIN |

Nota: `/api/v1` precede todas las rutas de la tabla. La estructura de errores usa `{"detail":"mensaje sin secretos"}`; sesión ausente o inválida → **401**, sesión válida sin privilegios → **403**, validación → **422**. No revelar si una dirección de correo existe en login/recuperación. Se acuerda identificador `id` opaco (UUID propuesto) y `role` limitado a `ADMIN` o `USER` en P0.

**Seguridad antes de dar por implementado este contrato:** cookies HttpOnly, SameSite, Secure en HTTPS, sesiones con tokens impredecibles almacenados como hash en PostgreSQL, límites de intentos, invalidación, CSRF para operaciones mutantes y verificación de origen. El mecanismo exacto de CSRF y la activación inicial de cuentas deben acordarse y probarse en Backend antes de fusionar. La forma final del contrato podría cambiar mediante una decisión y PR visible.

## Propiedad de carpetas para evitar conflictos

| Área | Carpeta principal asignada | Puede leer | No debería modificar sin coordinación |
| --- | --- | --- | --- |
| Mauricio — Backend | `prototype/app/` (excepto agentes de prueba existentes, conservarlos) y `prototype/tests/test_auth_*.py` | Todas | `prototype/web/`, migraciones de BD, documentación de QA |
| Joiber — Frontend | `prototype/web/` (HTML, CSS, JS); vistas login, perfil, reset | Todas | `prototype/app/main.py`, esquema PostgreSQL |
| Yosward — BD | `prototype/db/`, `docs/diccionario-auth.md` | Todas | Vistas web, endpoints de FastAPI |
| Nessler — QA | `docs/qa/` con matriz y evidencias; pruebas automáticas solo con coordinación de Backend | Todas | Endpoints, migraciones, estilos de Frontend |

**Integración de interfaz:** Joiber construye vistas independientes bajo `prototype/web/`; Mauricio conectará esas vistas al servidor FastAPI en una tarea de integración, sin sobrescribir trabajo del Frontend. Las rutas del dashboard actual y agentes heartbeat deben continuar funcionando. **No se aceptan interfaces con usuarios predefinidos en JavaScript que aparenten un login auténtico.**

## Prueba integrada mínima para P0

1. Se crea ADMIN mediante un procedimiento seguro de inicialización y este crea USER autorizado.
2. Login real de ambos desde navegadores separados; `/auth/me` devuelve identidades distintas de PostgreSQL.
3. USER recibe 403 al invocar `/admin/users` aunque modifique manualmente la solicitud.
4. Logout revoca sesión; cambio y recuperación de contraseña funcionan sin SMTP y no permiten reutilizar códigos.
5. El sistema conserva usuarios tras reiniciar la aplicación.
6. El prototipo heartbeat sigue funcionando y sus 5 tests existentes no se rompen.
7. Nessler consigna las pruebas ejecutadas con resultados, no solo un checklist por completar.

## Gestión de cambios del contrato

Un cambio en nombre de ruta, JSON, rol, esquema de identidad o significado de error requiere aviso a los cuatro integrantes en Issue/PR. Nunca cambiar solamente una parte. Las propuestas de cada IA deben someterse a este mismo contrato y revisiones humanas.


## Acuerdo técnico CSRF entre Backend y Frontend — 23/11/2026

**Implementado en Backend PR #14; probado de forma aislada con un repositorio de tests, todavía sin prueba E2E React + FastAPI ni PostgreSQL.**

- `POST /api/v1/auth/login` (con credenciales válidas) devuelve dos cookies del mismo origen: `unefa_session` (HttpOnly, SameSite=Strict) y `csrf_token` (legible por JavaScript, SameSite=Strict). Ambas tienen duración alineada a la sesión; se aplica `Secure` cuando hay HTTPS. **No usar credenciales reales en HTTP de LAN.**
- El Backend deriva el valor de `csrf_token` usando HMAC-SHA256 ligado al token de sesión aleatorio; **no expone el token de sesión HttpOnly a JavaScript**. La API compara de forma constante la cookie CSRF, la cabecera `X-CSRF-Token` y el valor derivado.
- En `POST /api/v1/auth/logout`, `POST /api/v1/auth/change-password`, `POST /api/v1/admin/users` y `POST /api/v1/admin/password-resets` **se exige** sesión autenticada, validación de origen y CSRF correcto. La autorización ADMIN continúa en el servidor.
- Las operaciones públicas `login`, `forgot-password` y `reset-password` no requieren una sesión previa; conservan control `Origin/Referer` del mismo origen. No deben exponerse a otros orígenes con CORS permisivo.
- En logout y cambio de contraseña, la API elimina las cookies de sesión y CSRF. El almacenamiento persistente de sesión aún debe ser aportado por PostgreSQL.
- El `client.js` de Joiber en PR #15 ya utiliza por defecto `csrf_token` y `X-CSRF-Token` en operaciones mutantes. **No se requiere cambiar esos nombres en Frontend.** Debe probarse el flujo real y corregirse la validación de URL `//otro-host` antes del merge.
- Tests del Backend: sesión válida con/sin token, cookie/cabecera incorrectas, token de otra sesión, revocación y comprobación de permisos. GitHub Actions run `45114971828`: **25 passed, 1 warning** en tests Python (no incluye compilación React ni integración PostgreSQL).

**Alcance de seguridad:** protección inicial razonable para la aplicación académica, no auditoría de producción. Quedan pendientes límites de intentos, validación HTTPS/TLS para datos reales, proxy/Host, pruebas E2E y cualquier ajuste surgido al conectar la persistencia.

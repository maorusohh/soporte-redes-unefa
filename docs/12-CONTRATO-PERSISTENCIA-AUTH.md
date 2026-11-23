# 12. Contrato de persistencia para AUTH-P0

**Estado:** interfaz técnica propuesta e implementada en Backend; adaptador PostgreSQL **pendiente**. Issue [#9](https://github.com/maorusohh/soporte-redes-unefa/issues/9) (Backend) e Issue [#11](https://github.com/maorusohh/soporte-redes-unefa/issues/11) (Base de Datos). Este documento acompaña al [PR #14](https://github.com/maorusohh/soporte-redes-unefa/pull/14), que permanece Draft.

## Qué está implementado

- `app/auth/router.py`: nueve endpoints HTTP documentados en el contrato #10 (`login`, `me`, `logout`, `change-password`, `forgot-password`, `reset-password`, `admin/users` GET/POST y `admin/password-resets` POST).
- `app/auth/repository.py`: protocolo `AuthRepository` y tipos `AuthAccount`/`AuthSession`.
- `app/auth/security.py` y `schemas.py`: Argon2, tokens aleatorios y contratos.
- `tests/test_auth_http.py`: pruebas HTTP de funciones y permisos usando **FakeAuthRepository solo para tests**, no base de datos.
- El servicio **no autentica a nadie en runtime** si no se configura un repositorio real: responde **HTTP 503**. No hay cuentas predeterminadas ni almacenamiento temporal habilitado en producción.

## Modelo PostgreSQL mínimo a proponer por Yosward

| Tabla | Campos obligatorios propuestos | Invariantes |
| --- | --- | --- |
| `users` | `id UUID PK`, `email TEXT`, `role TEXT`, `active BOOLEAN`, `password_hash TEXT NULL`, `created_at TIMESTAMPTZ` | Email único normalizado, rol `ADMIN/USER`, hash nunca contraseña clara |
| `auth_sessions` | `token_digest CHAR(64) PK`, `user_id UUID FK`, `expires_at TIMESTAMPTZ`, `revoked_at TIMESTAMPTZ NULL`, `created_at TIMESTAMPTZ` | Solo SHA-256 del token de alta entropía, revocación por usuario, no token claro |
| `password_reset_tokens` | `token_digest CHAR(64) PK`, `user_id UUID FK`, `created_by_admin_id UUID FK`, `expires_at TIMESTAMPTZ`, `consumed_at TIMESTAMPTZ NULL`, `created_at TIMESTAMPTZ` | Un solo uso, 15 min, emisión por ADMIN, revocar tokens previos |
| `recovery_requests` | `id UUID PK`, `user_id UUID FK`, `requested_at TIMESTAMPTZ` | Registro sin revelar existencia de cuenta a clientes públicos |

Estos campos son la **propuesta de contrato mínimo**, no DDL final. Yosward debe contrastarlos con el diccionario de datos de la asignatura; no cambiar sin aviso semántica/tipos que consume el Backend. PostgreSQL ejecuta en laptop-servidor; no en cada cliente.

## Métodos obligatorios de `AuthRepository` (API actual)

| Método | Responsabilidad y resultado |
| --- | --- |
| `find_user_by_email(email)` | Buscar por email normalizado. `AuthAccount` o `None`. |
| `find_user_by_id(user_id)` | Buscar cuenta por UUID. `AuthAccount` o `None`. |
| `list_users()` | Listar cuentas para ADMIN, sin contraseña en respuesta HTTP. |
| `create_user(email, role)` | Crear cuenta autorizada inicialmente sin contraseña, `password_hash=NULL`. Ante duplicidad lanzar `DuplicateEmailError`. |
| `save_session(token_digest, user_id, expires_at)` | Guardar **digest**, no valor original de la cookie. |
| `find_session(token_digest)` | Buscar y devolver `AuthSession`; router comprueba vencimiento, revocación y usuario activo. |
| `revoke_session(token_digest, now)` | Revocación efectiva de la sesión exacta. |
| `replace_password_and_revoke_sessions(user_id, password_hash, now)` | **Transacción única** que cambia el hash y revoca todas las sesiones de esa cuenta. |
| `record_recovery_request(user_id, now)` | Registrar la petición; HTTP devuelve lo mismo si existe o no el email. |
| `issue_reset_token(user_id, token_digest, expires_at, admin_id, now)` | **Transacción** para invalidar códigos anteriores de esa cuenta y registrar el nuevo código por ADMIN. |
| `consume_reset_and_change_password(email, token_digest, new_password_hash, now)` | **Transacción atómica**: verificar email, token no usado ni caducado; consumir, reemplazar hash y revocar sesiones. Devuelve `True` una sola vez incluso ante dos solicitudes concurrentes. |

Conexiones PostgreSQL con usuario de mínimo privilegio, variables de entorno, control de errores y migraciones versionadas. No agregar credenciales, secretos, tokens de prueba ni IP privadas al repositorio.

## Acuerdo de Backend y Frontend

- Rutas HTTP/JSON **ya fijadas** en [docs/10](10-CONTRATO-INTEGRACION-AUTH.md). Joiber las implementó como cliente `fetch` en [PR #15](https://github.com/maorusohh/soporte-redes-unefa/pull/15). No renombrarlas unilateralmente.
- Sesión en cookie `unefa_session`, HttpOnly y SameSite Strict. En HTTPS se marca Secure; **no introducir credenciales reales en una demo HTTP de LAN**.
- La API comprueba `Origin` o `Referer` del mismo origen en mutaciones, sin aceptar origen ausente. Es defensa inicial; quedan por evaluar protección CSRF completa, compatibilidad con proxy/Vite, límites de intentos, HTTPS final y provisión segura del primer ADMIN.
- `GET /` sigue mostrando la POC heartbeat. La SPA se montará de forma explícita conservando esa ruta hasta que la migración de UI se decida con pruebas.
- No se añadió Bootstrap de administrador ni un almacén in-memory para runtime. Hasta tener PostgreSQL configurado, rutas de autenticación responden 503.

## Pruebas y próximos pasos

1. Confirmar en Issue #11 el DDL/migraciones y el mapeo a estas interfaces. Entregar por rama `feat/auth-database-p0` y PR hacia `integration/auth-p0`.
2. Integrar un adaptador PostgreSQL para `AuthRepository`, con transacciones y manejo de concurrencia de tokens.
3. Crear comando de provisión inicial de ADMIN seguro e idempotente; no hardcodear contraseñas.
4. Testear contra PostgreSQL real: persistencia tras reinicio, dos sesiones independientes, ADMIN/USER, recuperación de un solo uso, revocación y concurrencia.
5. Integrar build Vite/React de Joiber en FastAPI y probar rutas/cookies/mismo origen, sin exponer servicios al público.
6. QA valida pruebas reales y distingue pruebas con Fake de pruebas de BD.

**Evidencia disponible al 22/11/2026:** GitHub Actions ejecutó `20 passed, 1 warning` en el Backend (5 pruebas heartbeat, 6 de núcleo y 9 HTTP con Fake). Esto **no certifica PostgreSQL ni login final en LAN**.

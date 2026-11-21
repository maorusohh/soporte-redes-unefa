# 08. Diseño propuesto: autenticación multiusuario y ejecución sin hosting

**Estado:** contrato técnico **propuesto**, no implementado ni aprobado por los compañeros. Base [07-ALCANCE-Y-REQUISITOS.md](07-ALCANCE-Y-REQUISITOS.md).

## Topología

```text
LAPTOP SERVIDOR (LAN privada, con permiso)
  - FastAPI / Uvicorn: aplicación y endpoints web, por ejemplo :8000
  - PostgreSQL: localhost:5432 (sin exposición a otras laptops)
  - Un mismo conjunto central de usuarios, sesiones, equipos e incidencias
        ^
        | HTTP(S) por LAN -- TLS requerido para contraseñas reales
        |
  +-----------+-------------+
  |           |             |
Navegador A  Navegador B   Navegador C
ADMIN        USER          USER
```

Los navegadores consultan datos por la API y **no instalan ni conectan directamente PostgreSQL**. Wi-Fi y Ethernet sirven para la conectividad, no sustituyen el Backend. La laptop-servidor debe permanecer encendida y accesible para que funcione la aplicación. No se necesita pagar hosting, VPS ni dominio. Para el primer ensayo pueden usarse dos perfiles de navegador en una misma laptop; eso demuestra sesiones separadas pero **no** una LAN entre equipos distintos.

Los agentes de monitoreo son procesos diferentes de los usuarios humanos. Un usuario que inicia sesión **no convierte automáticamente su laptop en un agente**. Para reportar CPU, RAM y disco en una computadora del grupo se instalaría/ejecutaría voluntariamente un agente autorizado con una identidad de dispositivo separada; la POC actual solo maneja heartbeats de prueba.

## Identidades y acceso

- ADMIN: crear/habilitar cuentas, emitir un token temporal de recuperación tras comprobar la identidad y consultar equipo/incidencias según reglas posteriores.
- USER: iniciar/cerrar sesión, consultar sus datos autorizados y cambiar su propia contraseña. Permisos sobre incidencias y métricas quedan por especificar.
- **Cuentas por invitación/alta administrativa:** email normalizado y aprobado; sin botón de registro público libre, sin Google OAuth.
- Primer ADMIN: provisión por comando administrativo interactivo o configuración segura local de una sola vez; sin credenciales predeterminadas ni almacenamiento de contraseñas en Git.

## Contrato HTTP propuesto (JSON, versión v1)

| Método y ruta | Función | Acceso |
| --- | --- | --- |
| POST /api/v1/auth/login | Iniciar sesión por email y contraseña; emitir cookie segura según entorno | Público; limitado por intentos |
| GET /api/v1/auth/me | Consultar cuenta y rol de la sesión activa | Autenticado |
| POST /api/v1/auth/logout | Invalidar sesión | Autenticado |
| POST /api/v1/auth/change-password | Cambiar clave indicando la actual | Autenticado |
| POST /api/v1/auth/forgot-password | Devolver respuesta genérica y crear solicitud local sin revelar existencia | Público; limitado por intentos |
| POST /api/v1/auth/reset-password | Consumir código temporal emitido de manera supervisada y guardar clave nueva | Código válido |
| POST /api/v1/admin/users | Crear cuenta autorizada, sin registro público | ADMIN |
| GET /api/v1/admin/users | Listar cuentas sin exponer hashes | ADMIN |
| POST /api/v1/admin/password-resets | Verificación humana previa, generar código único para cuenta seleccionada | ADMIN |

Ninguna ruta se considera implementada por estar aquí documentada. **No exponer un código de recuperación en respuestas de un endpoint público.** Si un ADMIN crea un código, entregarlo solo mediante la sesión admin y por un canal controlado en la demostración; nunca agregarlo a Git ni logs.

## Flujo: acceso

1. ADMIN crea cuenta con email permitido y un mecanismo seguro de activación; la cuenta empieza con rol definido.
2. Usuario envía credenciales a la API, con validación, límites de intentos y verificación de hash Argon2id.
3. API crea sesión independiente en almacenamiento central y devuelve cookie HttpOnly/SameSite, con protección CSRF para operaciones que modifican datos. **Secure=true exige HTTPS**; fuera de localhost no usar credenciales reales sin TLS.
4. Navegador consulta `/auth/me`; servidor verifica rol y permisos antes de cada operación protegida.
5. Logout revoca la sesión en el servidor.

## Flujo: «Olvidé mi contraseña», sin email

1. La interfaz permite solicitar ayuda de recuperación y muestra un mensaje genérico sin revelar si existe la cuenta.
2. El titular contacta al ADMIN por un canal acordado; el ADMIN verifica la identidad fuera del sistema.
3. ADMIN genera **token aleatorio de un único uso**, con vencimiento propuesto de 15 minutos; en BD solo se conserva su hash y estado.
4. El titular introduce el código en la interfaz y establece una nueva contraseña. API verifica token, consumo único, plazo y nueva clave; revoca otras sesiones y códigos antiguos.
5. El sistema no inicia sesión automáticamente tras reset. Se prueba código vencido, reutilizado, inexistente y revocado.

Este flujo evita depender de Google, SMTP, SMS o de Internet. El mecanismo de recuperación es **supervisado**, no un restablecimiento autónomo por correo. La profesora debe conocer esta delimitación.

## Esquema preliminar (a diseñar con responsable de Base de Datos)

- users: id, email único normalizado, password_hash, role, active, created_at, updated_at.
- sessions: id interno, user_id FK, token_hash único, created_at, expires_at, revoked_at.
- password_reset_requests: id, user_id FK, requested_at, state.
- password_reset_tokens: id, user_id FK, token_hash único, expires_at, consumed_at, created_by_admin_id FK.
- audit_events: id, event_type, actor_user_id?, target_user_id?, created_at; sin secretos.

Tablas, constraints, migraciones, estados y política de retención quedan por acordar; no se admite acceso directo de laptops cliente a PostgreSQL.

## Riesgos conocidos y restricciones

- Login multiusuario ≠ varias terminales Python: la POC actual tiene agentes de prueba, no usuarios autenticados.
- El sistema no observará pestañas del navegador, pantallas ni actividad personal; esto no se necesita para medir CPU/RAM y no se autoriza como alcance.
- Un equipo apagado o el servidor fuera de servicio interrumpen la aplicación local; se documentará contingencia.
- Cuando se haga una demo LAN con credenciales sintéticas, no presentarla como instalación productiva segura. Para credenciales reales, habilitar HTTPS/TLS y controles adecuados.
- Dependencias y PostgreSQL pueden requerir instalación inicial con Internet; **operación dentro de la LAN** no requiere Internet.
- No copiar contraseñas, tokens ni IP privadas reales al repositorio o evidencia pública.

## Criterios de calidad y referencias

Seguir recomendaciones de seguridad de sesiones, autenticación y recuperación de OWASP, y la documentación oficial de FastAPI para hash de contraseñas; registrar pruebas realmente ejecutadas. Revisión humana y PR antes de fusionar.

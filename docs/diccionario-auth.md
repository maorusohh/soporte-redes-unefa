# Diccionario de datos — AUTH-P0

**Proyecto:** Sistema de Soporte de Redes UNEFA  
**Motor de base de datos propuesto:** PostgreSQL  
**Estado:** Propuesta técnica pendiente de validación del equipo  
**Responsable:** Base de Datos

## 1. Objetivo

Definir la estructura de almacenamiento de los datos necesarios para el módulo de autenticación AUTH-P0, respetando los contratos de integración y persistencia establecidos por Backend.

La base de datos almacenará cuentas de usuario, sesiones, códigos de recuperación y solicitudes de recuperación de contraseña.

## 2. Convenciones generales

- Los identificadores principales serán de tipo UUID.
- Los correos electrónicos se almacenarán normalizados: sin espacios externos y en minúsculas.
- Las contraseñas nunca se almacenarán en texto plano.
- Los tokens de sesión y recuperación se almacenarán mediante su resumen SHA-256.
- Las fechas y horas utilizarán `TIMESTAMPTZ`.
- Los roles permitidos serán `ADMIN` y `USER`.

## 3. Tabla: users

Almacena las cuentas registradas en el sistema.

| Campo | Tipo PostgreSQL | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PRIMARY KEY | Identificador único del usuario |
| email | TEXT | NOT NULL, UNIQUE | Correo electrónico normalizado |
| role | TEXT | NOT NULL, CHECK | Rol: ADMIN o USER |
| active | BOOLEAN | NOT NULL | Estado de la cuenta |
| password_hash | TEXT | NULL permitido | Hash de la contraseña |
| created_at | TIMESTAMPTZ | NOT NULL | Fecha de creación |

**Reglas:**
- No pueden existir dos cuentas con el mismo correo normalizado.
- El rol solo puede ser `ADMIN` o `USER`.
- Una cuenta nueva puede tener `password_hash` en NULL hasta que establezca su contraseña.
- Nunca se almacena la contraseña original.

## 4. Tabla: auth_sessions

Almacena las sesiones de autenticación de los usuarios.

| Campo | Tipo PostgreSQL | Restricciones | Descripción |
|---|---|---|---|
| token_digest | CHAR(64) | PRIMARY KEY | Resumen SHA-256 del token |
| user_id | UUID | NOT NULL, FOREIGN KEY | Usuario propietario de la sesión |
| expires_at | TIMESTAMPTZ | NOT NULL | Fecha de vencimiento |
| revoked_at | TIMESTAMPTZ | NULL permitido | Fecha de revocación |
| created_at | TIMESTAMPTZ | NOT NULL | Fecha de creación |

**Reglas:**
- No se almacena el token original.
- El resumen SHA-256 se representa mediante 64 caracteres hexadecimales.
- Una sesión puede estar revocada o vencida.
- La revocación debe poder realizarse individualmente o para todas las sesiones de un usuario.

## 5. Tabla: password_reset_tokens

Almacena los códigos utilizados para restablecer contraseñas.

| Campo | Tipo PostgreSQL | Restricciones | Descripción |
|---|---|---|---|
| token_digest | CHAR(64) | PRIMARY KEY | Resumen SHA-256 del código |
| user_id | UUID | NOT NULL, FOREIGN KEY | Usuario que solicita el restablecimiento |
| created_by_admin_id | UUID | NOT NULL, FOREIGN KEY | Administrador que emite el código |
| expires_at | TIMESTAMPTZ | NOT NULL | Fecha de vencimiento |
| consumed_at | TIMESTAMPTZ | NULL permitido | Fecha de utilización |
| created_at | TIMESTAMPTZ | NOT NULL | Fecha de creación |

**Reglas:**
- Los códigos se generan con 32 bytes aleatorios.
- Se almacena únicamente el resumen SHA-256.
- El código tiene una vigencia de 15 minutos.
- Cada código puede utilizarse una sola vez.
- Al emitir un código nuevo, se invalidan los anteriores del mismo usuario.
- El código debe ser emitido por un usuario con rol ADMIN.

## 6. Tabla: recovery_requests

Registra las solicitudes de recuperación de contraseña.

| Campo | Tipo PostgreSQL | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PRIMARY KEY | Identificador de la solicitud |
| user_id | UUID | NOT NULL, FOREIGN KEY | Usuario asociado a la solicitud |
| requested_at | TIMESTAMPTZ | NOT NULL | Fecha y hora de la solicitud |

**Reglas:**
- Registra las solicitudes realizadas por los usuarios.
- La respuesta pública no debe revelar si un correo electrónico está registrado.
- No almacena contraseñas ni tokens.

## 7. Relaciones entre tablas

La tabla `users` es la entidad principal del modelo. Las demás tablas se relacionan con ella mediante claves foráneas.

### 7.1 Relación users - auth_sessions

- Clave primaria: `users.id`.
- Clave foránea: `auth_sessions.user_id`.
- Cardinalidad: uno a muchos (1:N).
- Descripción: un usuario puede tener varias sesiones de autenticación, pero cada sesión pertenece a un solo usuario.

### 7.2 Relación users - password_reset_tokens

- Clave primaria: `users.id`.
- Clave foránea: `password_reset_tokens.user_id`.
- Cardinalidad: uno a muchos (1:N).
- Descripción: un usuario puede tener varios registros de códigos de recuperación a lo largo del tiempo. Cada código pertenece a un solo usuario.

### 7.3 Relación users - password_reset_tokens (administrador emisor)

- Clave primaria: `users.id`.
- Clave foránea: `password_reset_tokens.created_by_admin_id`.
- Cardinalidad: uno a muchos (1:N).
- Descripción: un administrador puede emitir varios códigos de recuperación. Cada registro identifica al administrador que emitió el código.
- Regla: Backend debe comprobar que el usuario emisor tenga el rol `ADMIN`.

### 7.4 Relación users - recovery_requests

- Clave primaria: `users.id`.
- Clave foránea: `recovery_requests.user_id`.
- Cardinalidad: uno a muchos (1:N).
- Descripción: un usuario puede generar varias solicitudes de recuperación. Cada solicitud pertenece a un solo usuario.

### 7.5 Integridad referencial

- Todas las claves foráneas deben apuntar a registros existentes en `users`.
- No se deben crear sesiones, códigos o solicitudes asociados a usuarios inexistentes.
- La desactivación de una cuenta debe conservar los registros históricos.
- Se propone utilizar `ON DELETE RESTRICT` para evitar eliminar accidentalmente usuarios que tengan registros relacionados. Esta decisión queda pendiente de validación con Backend y el equipo.

## 8. Reglas de seguridad y persistencia

1. Las contraseñas tendrán una longitud permitida de 12 a 128 caracteres.
2. Los hashes de contraseña se generarán utilizando `pwdlib`.
3. Los tokens se generarán con `secrets.token_urlsafe(32)`.
4. Los tokens se protegerán mediante SHA-256 antes de almacenarse.
5. Los cambios de contraseña y la revocación de sesiones deberán ejecutarse en una misma transacción.
6. El consumo de un código de recuperación y el cambio de contraseña deberán ejecutarse atómicamente.
7. La base de datos utilizará credenciales de acceso mediante variables de entorno.
8. No se publicarán contraseñas, tokens ni credenciales en el repositorio.

## 9. Correspondencia con Backend

La implementación PostgreSQL deberá respetar los métodos definidos en `prototype/app/auth/repository.py`, especialmente:

- `find_user_by_email`
- `find_user_by_id`
- `list_users`
- `create_user`
- `save_session`
- `find_session`
- `revoke_session`
- `replace_password_and_revoke_sessions`
- `record_recovery_request`
- `issue_reset_token`
- `consume_reset_and_change_password`

## 10. Estado del documento

Este diccionario constituye una propuesta inicial basada en los contratos de integración y persistencia de AUTH-P0. Antes de implementar las migraciones SQL, deberá revisarse con Backend y validarse con el equipo del proyecto.
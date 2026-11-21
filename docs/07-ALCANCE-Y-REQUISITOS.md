# 07. Alcance, requisitos funcionales y no funcionales

**Estado:** propuesta de alcance para la siguiente revisión; validación pendiente con las consignas y con los cuatro integrantes. **Fuente académica disponible:** requisitos reportados en [01-REQUISITOS.md](01-REQUISITOS.md) y conversación de coordinación de Mauricio (21/11/2026). No equivale a aprobación de la docente. La profesora recibió favorablemente la POC de monitoreo y pidió definir el siguiente avance; Mauricio comprometió un login con perfiles de administrador y no administrador para la próxima semana (día exacto sin confirmar).

## Problema y delimitación

Se propone una aplicación académica de **gestión de incidencias y monitoreo básico de equipos autorizados**, con clientes web multiusuario conectados por LAN y API central. Referencia contextual: UNEFANB, Extensión Santa Teresa del Tuy; **no hay permiso de uso de la infraestructura institucional**. La prueba se realizará con laptops personales y datos sintéticos. El desarrollo no constituye un sistema productivo de administración remota.

### Incluido en el producto académico objetivo

- Usuarios humanos diferenciados por cuenta, rol y permisos; credenciales y sesiones.
- Inventario de equipos propios autorizados, estados y mediciones limitadas.
- Incidencias con seguimiento básico y trazabilidad.
- Consultas y reportes simples.
- PostgreSQL central, diccionario de datos y pruebas de acceso concurrente.
- Comunicación HTTP/JSON sobre TCP/IP, con ejecución en LAN Wi-Fi o Ethernet.
- Recuperación y cambio de contraseña sin servicios externos obligatorios.

### Fuera de alcance

- Hosting, VPS, Google OAuth, autenticación abierta a cualquier persona, correo electrónico automático sin infraestructura SMTP.
- Monitorización de redes institucionales, escaneo indiscriminado, control remoto de usuarios, grabación de pantalla, capturas ocultas, historial de navegación o lectura de pestañas abiertas.
- Alta disponibilidad, despliegue público, aplicaciones móviles nativas, facturación, pagos y telemetría empresarial avanzada.
- Prometer una velocidad, disponibilidad o cantidad de clientes sin medirla.

## Requisitos funcionales propuestos (RF)

| ID | Funcionalidad | Alcance observable | Prioridad |
| --- | --- | --- | --- |
| RF-01 | Provisionar cuenta | El administrador crea/habilita/deshabilita cuentas con email único autorizado; no hay registro público libre | P0 |
| RF-02 | Iniciar sesión | Email + contraseña válidos abren sesión individual; inválidos no | P0 |
| RF-03 | Aplicar roles | ADMIN gestiona cuentas; USER solo accede a lo permitido; API responde 403 ante acceso indebido | P0 |
| RF-04 | Consultar sesión y salir | Vista de usuario autenticado, logout e invalidación efectiva de la sesión | P0 |
| RF-05 | Cambiar contraseña | Usuario autenticado confirma contraseña vigente y establece otra; sesiones previas se revocan | P0 |
| RF-06 | Olvidé contraseña | Solicitud sin revelar existencia de cuenta; administrador verifica identidad y emite código temporal de un uso; usuario establece clave nueva | P0 |
| RF-07 | Multiusuario compartido | Dos usuarios con sesiones distintas consultan datos del mismo servidor/BD | P0 |
| RF-08 | Registro de agentes | Un agente autorizado envía heartbeat, se conserva última recepción y estado por timeout | POC vigente |
| RF-09 | Inventario | Registrar equipos permitidos con atributos mínimos y estado | P1 |
| RF-10 | Métricas | Agente voluntario reporta CPU/RAM/espacio en disco en equipos propios; registrar fecha y origen | P1 |
| RF-11 | Incidencias | Crear, consultar, actualizar estado, asignar y cerrar incidencias con historial básico | P1 |
| RF-12 | Reportes | Consultar por equipos/estados/incidencias y generar reporte simple | P1 |
| RF-13 | Diccionario de datos | Documentar tablas, campos, tipos, claves y restricciones del esquema PostgreSQL | P0 documental |

P0 = meta para la siguiente revisión, sujeta a capacidad real del equipo. P1 = incremento posterior; POC vigente no implica implementación P0.

## Requisitos no funcionales propuestos (RNF)

| ID | Criterio verificable propuesto | Verificación |
| --- | --- | --- |
| RNF-01 Seguridad | Contraseñas almacenadas como hash resistente (Argon2id); no en repositorio, respuestas ni logs | Revisar BD/código y ejecutar test de hash |
| RNF-02 Autorización | Controles en API, no solo ocultando botones | USER obtiene 403 al invocar función de ADMIN |
| RNF-03 Sesiones | Identificadores impredecibles, caducidad y revocación; cookies HttpOnly/SameSite con defensa CSRF | Pruebas de logout, expiración, CSRF |
| RNF-04 Recuperación | Códigos aleatorios caducan, son de un uso, no se almacenan en claro y revocan sesiones anteriores | Pruebas de consumo, repetición y caducidad |
| RNF-05 Integridad | Email único normalizado; claves externas y constraints de PostgreSQL; migraciones reproducibles | Casos de duplicidad, reinicio y esquema |
| RNF-06 Concurrencia | Demostración mínima propuesta: 2 usuarios simultáneos y 2 agentes independientes | Prueba observada en dos navegadores; LAN física si hay recursos |
| RNF-07 Operación sin hosting | Una laptop anfitriona ejecuta app y BD; clientes LAN no necesitan instalar PostgreSQL | Ejecutar tras desconectar Internet, con dependencias instaladas |
| RNF-08 Trazabilidad | Tests/PR registran cambios y evidencia; logs de eventos sin contraseñas ni tokens | Checklist QA y revisión de commits |
| RNF-09 Errores | Fallos de credenciales no revelan si email existe; validación de entradas y límites de intentos | Tests de respuesta y abuso |
| RNF-10 Usabilidad | Formularios con etiquetas, estados de error, navegación clara y feedback para acciones | Revisión manual contra casos de uso |
| RNF-11 Protección LAN | No exponer PostgreSQL ni servicio no autenticado a Internet; no emplear claves reales por HTTP sin TLS | Verificar configuración de interfaces, firewall y protocolo |

Los valores exactos de rendimiento y carga se medirán en laptops disponibles y quedarán registrados; **no se garantizan todavía**. La demo local puede usar exclusivamente cuentas ficticias. El HTTP sin TLS en una LAN, aun privada, **no debe presentarse como seguro para credenciales reales**.

## Condiciones de aceptación del producto

La prueba de concepto heartbeat completó pruebas locales y CI; no acredita RF-01 a RF-07. La revisión P0 requiere evidencia real de login ADMIN/USER, controles de rol, contraseña incorrecta, logout, cambio y recuperación supervisada, reinicio con persistencia y acceso simultáneo al mismo servidor. Registrar resultados verdaderamente ejecutados, sin asumir que se completaron.

## Vínculos

- [AUTH-001 #9](https://github.com/maorusohh/soporte-redes-unefa/issues/9), [FRONT-002 #10](https://github.com/maorusohh/soporte-redes-unefa/issues/10), [DATA-002 #11](https://github.com/maorusohh/soporte-redes-unefa/issues/11), [QA-002 #12](https://github.com/maorusohh/soporte-redes-unefa/issues/12).

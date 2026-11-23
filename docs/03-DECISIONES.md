# 03. Registro de decisiones

## Cómo mantener el registro

Cada entrada debe indicar ID, estado, decisión o pregunta, fuente y siguiente acción. Estados: **aprobada**, **propuesta**, **pendiente** y **sustituida**. Una aprobación necesita evidencia identificable y quién la emite; no se inventan acuerdos del grupo ni de las profesoras.

Las aprobaciones iniciales de este documento proceden del encargo del usuario para esta tarea. Son directrices de trabajo, no constancias de aprobación de las profesoras. Las propuestas de estos documentos siguen siendo propuestas aunque el PR documental sea aceptado, salvo acuerdo explícito registrado. Para sustituir una decisión, conservar la anterior y enlazar su reemplazo y motivo.

La [revisión del PR #1](https://github.com/maorusohh/soporte-redes-unefa/pull/1#pullrequestreview-5914173968) recoge requisitos «informados por integrante del equipo». Se registran como **reportados y pendientes de verificación**, no como decisiones aprobadas ni como requisitos confirmados documentalmente por las docentes. Su detalle e IDs `REP-TP-...` y `REP-BD-...` están en [01-REQUISITOS.md](01-REQUISITOS.md). La mención de creatividad en pagos es condicional a sistemas con pagos y no incorpora una obligación general ni una funcionalidad de pagos al proyecto.

## Directrices aprobadas para esta tarea

Fuente de todas las entradas de esta tabla: encargo del usuario de preparar la estructura documental inicial, registrado como `DOC-001` en el [plan](04-PLAN-DE-TRABAJO.md). No consta una fecha de aprobación académica.

| ID | Estado | Directriz | Consecuencia |
| --- | --- | --- | --- |
| DEC-01 | Aprobada por el encargo | Preparar solo documentación y organización, conservar README y no elegir todavía un stack definitivo. | No implementar login, frontend, backend, base de datos ni pruebas funcionales en esta tarea. |
| DEC-02 | Aprobada por el encargo | Trabajar con el objetivo multiusuario cliente-servidor de incidencias y monitoreo sobre TCP/IP. | Los detalles y el alcance mínimo deben validarse; no se fija protocolo de aplicación. |
| DEC-03 | Aprobada por el encargo | Usar preferentemente computadoras personales del grupo y LAN propia; UNEFANB es referencia académica, no despliegue autorizado. | No intervenir equipos ni redes institucionales. Preparar alternativas Wi-Fi y Ethernet. |
| DEC-04 | Aprobada por el encargo | Reconocer pertenencia académica de los cuatro integrantes. | La administración técnica del repositorio no equivale a autoría exclusiva. |
| DEC-05 | Aprobada por el encargo | Asociar toda modificación futura a una tarea verificable y no subir información sensible ni credenciales. | Aplicar el procedimiento de CONTRIBUTING.md y conservar evidencia real. |
| DEC-06 | Aprobada por el encargo | Preparar estos cambios en `docs/project-foundation` y un PR hacia `main`, sin merge automático. | La fusión queda para revisión y acción humana posterior. |

## Propuestas de organización y diseño

| ID | Estado | Propuesta | Fuente y paso para resolver |
| --- | --- | --- | --- |
| DEC-07 | Propuesta | Distribuir responsabilidades lógicas entre interfaz, comunicación, identidad, incidencias, monitoreo y persistencia/reportes, centralizando reglas en el servidor. | Desarrollo conceptual de [02-ARQUITECTURA.md](02-ARQUITECTURA.md); revisar con el grupo y requisitos académicos. |
| DEC-08 | Propuesta | Avanzar por hitos e integrar incrementos pequeños mediante contratos acordados y revisión cruzada. | Plan preliminar de [04-PLAN-DE-TRABAJO.md](04-PLAN-DE-TRABAJO.md); acordar prioridades y responsables. |
| DEC-09 | Propuesta | Ensayar una misma demostración en Wi-Fi y Ethernet, con datos sintéticos y equipos propios expresamente autorizados. | Estrategia de [05-DEMOSTRACION-LAN.md](05-DEMOSTRACION-LAN.md); confirmar recursos y criterios. |

## Pendientes sin decisión definitiva

| ID | Estado | Asunto | Evidencia o acuerdo necesario |
| --- | --- | --- | --- |
| DEC-10 | Pendiente | Verificar los requisitos reportados de ambas asignaturas y acordar el alcance mínimo. | Contrastar `REP-TP-...` y `REP-BD-...` de 01-REQUISITOS.md con consignas, rúbricas o confirmaciones documentales de las docentes; registrar diferencias y criterios de aceptación. El reporte del equipo no resuelve este pendiente. |
| DEC-11 | Pendiente | Stack tecnológico, tipo de cliente y protocolo de aplicación sobre TCP/IP. | Comparación justificada según requisitos y recursos; acuerdo explícito del grupo. |
| DEC-12 | Pendiente | Modelo y motor de base de datos, reglas de integridad y concurrencia. | Requisitos de la asignatura y revisión del diseño. |
| DEC-13 | Pendiente | Mecanismo, métricas y frecuencia de monitoreo; autenticación, permisos y tratamiento de desconexiones. | Alcance funcional aceptado y evaluación de seguridad y viabilidad. |
| DEC-14 | Pendiente | Asignar personas a Backend/Teleprocesos, Frontend, Base de Datos y QA/Requisitos. | Acuerdo de los cuatro integrantes; no hay asignaciones realizadas. |
| DEC-15 | Pendiente | Confirmar fecha final. La previsión es febrero de 2027. | Confirmación formal de la fecha; no hay día ni plazo oficial registrado. |
| DEC-16 | Pendiente | Recursos de la LAN y guion final de demostración. | Inventario propio, permisos de propietarios y requisitos de evaluación confirmados. |

Al resolver un pendiente, registrar tarea o PR, fuente, fecha real disponible y motivo. Si no hay evidencia, mantenerlo pendiente y explicar qué información falta.


## Actualización técnica de Frontend — 22/11/2026

| ID | Estado | Decisión acotada | Justificación y condiciones |
| --- | --- | --- | --- |
| DEC-17 | **Aceptada técnicamente para integración, sin merge ni validación final del equipo** | Mantener **Vite 8 + React 19 + React Router 7** en `prototype/web/`, según [PR #15](https://github.com/maorusohh/soporte-redes-unefa/pull/15), sin exigir reescritura a HTML estático. | Decisión de coordinación técnica delegada por Mauricio al solicitar conservar el diseño si es correcto/mantenible. Componentes y rutas reutilizables, build estático para servirlo con FastAPI en LAN, costo cero de hosting y compatibilidad de 7 endpoints con el contrato de [docs/10](10-CONTRATO-INTEGRACION-AUTH.md). Node.js de desarrollo conforme a requisitos de Vite. **Pendientes antes del merge:** CI para `npm ci && npm run build`, integración real con FastAPI/PostgreSQL, seguridad de cookies/CSRF, preservación de la POC heartbeat, política de formularios ADMIN y revisión cruzada. La decisión no resuelve automáticamente el pendiente global DEC-11 de stack ni constituye aprobación de la profesora. |

**Evidencia de revisión:** [Review técnica del PR #15](https://github.com/maorusohh/soporte-redes-unefa/pull/15). El PR #15 es Draft y sus pruebas de UI con mock Node, descritas por Joiber, **no** son una prueba de login real. GitHub Actions del commit `885f1c00ff9c18d3ec4d47498aa01037d8878fda` solo ejecutó la suite Python (`5 passed, 1 warning`) y no el build frontend.

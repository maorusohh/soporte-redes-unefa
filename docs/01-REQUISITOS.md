# 01. Requisitos y alcance

## Fuentes y estados

Fuentes disponibles: el [README](../README.md) original, el encargo del usuario de preparar la base documental y la [revisión documental del PR #1](https://github.com/maorusohh/soporte-redes-unefa/pull/1#pullrequestreview-5914173968), que recoge requisitos comunicados verbalmente por el equipo. No se han adjuntado consignas ni rúbricas oficiales de las profesoras. El README describe funcionalidades previstas; la revisión registra información reportada, sin acreditar confirmación documental de las docentes.

Se distinguen cuatro categorías: contexto confirmado por el encargo, requisitos académicos confirmados documentalmente por las docentes, requisitos comunicados por el equipo pendientes de verificación y funcionalidades propuestas. El estado de una categoría no se transfiere a otra por aparecer en un PR.

## Contexto confirmado por el encargo

| ID | Alcance o restricción | Fuente |
| --- | --- | --- |
| CTX-01 | Proyecto académico colaborativo de cuatro estudiantes para Teleprocesos y Sistemas Avanzados de Bases de Datos. La pertenencia académica es compartida, aunque haya un administrador técnico. | Encargo del usuario y contexto del README. |
| CTX-02 | Objetivo de aplicación multiusuario cliente-servidor para gestionar incidencias y monitorear equipos de red mediante comunicación TCP/IP. | Encargo del usuario y README. |
| CTX-03 | UNEFANB, Extensión Santa Teresa del Tuy, es referencia académica, no entorno de despliegue autorizado. Se prefieren computadoras personales del grupo y una LAN propia. | Encargo del usuario. |
| CTX-04 | Etapa actual documental: conservar README; no implementar funcionalidades ni pruebas funcionales y no elegir aún un stack definitivo. | Encargo del usuario. |
| CTX-05 | Roles individuales pendientes de asignación. Presentación prevista en febrero de 2027, pendiente de confirmación formal. | Encargo del usuario. |
| CTX-06 | Toda modificación futura debe estar asociada a una tarea verificable. No publicar información sensible ni credenciales. | Encargo del usuario. |

## Requisitos confirmados documentalmente por las docentes

No hay requisitos específicos respaldados por una consigna, rúbrica o confirmación documental de las docentes disponible para ninguna de las dos asignaturas. Sí hay requisitos reportados por el equipo, registrados en la sección siguiente. No deben deducirse requisitos adicionales del nombre de la materia ni del objetivo general del sistema.

| Asignatura | Requisitos confirmados disponibles | Acción para completar el registro |
| --- | --- | --- |
| Teleprocesos | Ninguno con respaldo documental de la docente disponible. | Contrastar los requisitos reportados con la consigna o confirmación de la profesora y registrar fuente, fecha y criterio de aceptación. |
| Sistemas Avanzados de Bases de Datos | Ninguno con respaldo documental de la docente disponible. | Contrastar los requisitos reportados con la consigna o confirmación de la profesora y registrar fuente, fecha y criterio de aceptación. |

Al recibir evidencia documental de la docente, asignar IDs `REQ-TP-...` o `REQ-BD-...`, conservar su redacción y registrar cómo se comprobará cada requisito. Mantener la referencia al ID reportado cuando corresponda y documentar diferencias. No completar fuentes ni aprobaciones de memoria. Enlazar la tarea y la decisión correspondiente.

## Requisitos comunicados por el equipo (pendientes de verificación con la consigna oficial)

**Estado de todas las entradas: reportado, pendiente de verificación con la consigna oficial. Fuente: «informado por integrante del equipo»**, recogido en la [revisión del PR #1](https://github.com/maorusohh/soporte-redes-unefa/pull/1#pullrequestreview-5914173968). Esa revisión deja constancia del reporte; no sustituye la confirmación documental de las docentes. Los IDs `REP-...` permiten su seguimiento sin presentarlos como requisitos oficialmente confirmados.

### Teleprocesos (reportado)

| ID | Requisito comunicado |
| --- | --- |
| REP-TP-01 | Programa funcional relacionado con comunicación entre sistemas. |
| REP-TP-02 | Informe con título y delimitación real o ficticia. |
| REP-TP-03 | Introducción y planteamiento sin diagnóstico, con progresión macro–meso–micro en párrafos continuos. |
| REP-TP-04 | Objetivo general, tres objetivos específicos y justificación. |
| REP-TP-05 | Marco teórico/conceptual, propuesta de solución, pruebas y resultados, conclusiones y recomendaciones. |

### Sistemas Avanzados de Bases de Datos (reportado)

| ID | Requisito comunicado |
| --- | --- |
| REP-BD-01 | Programa con inicio de sesión. |
| REP-BD-02 | Usuarios/perfiles diferenciados. |
| REP-BD-03 | Funcionamiento multiusuario. |
| REP-BD-04 | Módulos/modularidad. |
| REP-BD-05 | Reportes. |
| REP-BD-06 | Recuperación de contraseña. |
| REP-BD-07 | Cambio de contraseña. |
| REP-BD-08 | Validaciones. |
| REP-BD-09 | Diccionario de datos. |

La creatividad en pagos fue reportada como condicional a un sistema con pagos; no constituye una obligación general ni incorpora una funcionalidad de pagos a este proyecto. El detalle y los criterios de aceptación de estas entradas deben contrastarse con la consigna oficial. Registrar estos requisitos no autoriza implementarlos en esta etapa documental ni significa que ya estén implementados o probados.

## Funcionalidades propuestas

Estas capacidades provienen de «Funcionalidades previstas» del README. Su alcance detallado, prioridad y aceptación por las profesoras siguen pendientes. Ninguna está implementada.

Algunas coinciden con requisitos reportados: `PROP-01` con `REP-BD-01`, `REP-BD-06` y `REP-BD-07`; `PROP-02` con usuarios/perfiles de `REP-BD-02` (los permisos detallados siguen por definir); `PROP-05` con reportes de `REP-BD-05`; y `PROP-06` con comunicación entre sistemas de `REP-TP-01`. Se conservan ambas referencias para distinguir la propuesta del README y el reporte del equipo, sin elevarlas a confirmación documental de la docente.

| ID | Funcionalidad propuesta | Aspectos por precisar |
| --- | --- | --- |
| PROP-01 | Inicio de sesión, recuperación y cambio de contraseña. | Identidad de usuarios, recuperación segura, reglas de sesión y alcance mínimo. |
| PROP-02 | Usuarios con roles y permisos. | Roles de la aplicación y permisos; son distintos de los cuatro roles de trabajo del equipo. |
| PROP-03 | Registro y monitoreo de equipos. | Datos de inventario, equipos autorizados, significado de «monitoreo», mecanismo y frecuencia. |
| PROP-04 | Gestión de incidencias técnicas. | Campos, estados, responsables, transiciones y operaciones mínimas. |
| PROP-05 | Reportes y base de datos. | Reportes esperados, información persistida, consultas y exigencias académicas verificables. |
| PROP-06 | Comunicación cliente-servidor mediante TCP/IP. | Protocolo de aplicación, mensajes, errores y comportamiento ante desconexiones. TCP/IP forma parte del objetivo; el protocolo concreto no está decidido. |

Los criterios de concurrencia, tiempos de respuesta, cantidad de usuarios, seguridad de sesiones, integridad de datos y disponibilidad deberán definirse en tareas posteriores. No hay valores ni compromisos de rendimiento aprobados.

## Decisiones pendientes y validación futura

- Obtener las consignas y rúbricas de ambas profesoras y contrastarlas con los requisitos reportados, incluyendo entregables y criterios de demostración.
- Acordar un alcance mínimo y criterios observables para cada funcionalidad aceptada.
- Elegir el stack y el protocolo de aplicación después de evaluar requisitos, recursos y conocimientos del grupo.
- Precisar modelo de datos, reglas de integridad, concurrencia y mecanismo de monitoreo sin asumir tecnologías.
- Asignar personas a los cuatro roles y confirmar formalmente la fecha de presentación.
- Inventariar laptops, sistemas operativos y conectividad propios disponibles para la demostración.

El [registro de decisiones](03-DECISIONES.md) identifica el estado de estos asuntos. El [plan](04-PLAN-DE-TRABAJO.md) deberá vincular cada futura implementación con un requisito aceptado y una tarea verificable. Este documento no informa pruebas ejecutadas.

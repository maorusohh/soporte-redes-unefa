# 01. Requisitos y alcance

## Fuentes y estados

Fuentes disponibles: el [README](../README.md) original y el encargo del usuario de preparar la base documental. No se han proporcionado consignas, rúbricas ni confirmaciones específicas de las profesoras. El README describe funcionalidades previstas; no acredita aprobación académica.

Se distinguen tres categorías: contexto confirmado por el encargo, requisitos académicos confirmados con evidencia y funcionalidades propuestas. El estado de una categoría no se transfiere a otra por aparecer en un PR.

## Contexto confirmado por el encargo

| ID | Alcance o restricción | Fuente |
| --- | --- | --- |
| CTX-01 | Proyecto académico colaborativo de cuatro estudiantes para Teleprocesos y Sistemas Avanzados de Bases de Datos. La pertenencia académica es compartida, aunque haya un administrador técnico. | Encargo del usuario y contexto del README. |
| CTX-02 | Objetivo de aplicación multiusuario cliente-servidor para gestionar incidencias y monitorear equipos de red mediante comunicación TCP/IP. | Encargo del usuario y README. |
| CTX-03 | UNEFANB, Extensión Santa Teresa del Tuy, es referencia académica, no entorno de despliegue autorizado. Se prefieren computadoras personales del grupo y una LAN propia. | Encargo del usuario. |
| CTX-04 | Etapa actual documental: conservar README; no implementar funcionalidades ni pruebas funcionales y no elegir aún un stack definitivo. | Encargo del usuario. |
| CTX-05 | Roles individuales pendientes de asignación. Presentación prevista en febrero de 2027, pendiente de confirmación formal. | Encargo del usuario. |
| CTX-06 | Toda modificación futura debe estar asociada a una tarea verificable. No publicar información sensible ni credenciales. | Encargo del usuario. |

## Requisitos confirmados por las profesoras

No hay requisitos específicos confirmados con evidencia disponible para ninguna de las dos asignaturas. No deben deducirse del nombre de la materia ni del objetivo general del sistema.

| Asignatura | Requisitos confirmados disponibles | Acción para completar el registro |
| --- | --- | --- |
| Teleprocesos | Ninguno documentado todavía. | Obtener la consigna o confirmación de la profesora y registrar requisito, fuente, fecha y criterio de aceptación. |
| Sistemas Avanzados de Bases de Datos | Ninguno documentado todavía. | Obtener la consigna o confirmación de la profesora y registrar requisito, fuente, fecha y criterio de aceptación. |

Al recibir evidencia, asignar IDs `REQ-TP-...` o `REQ-BD-...`, conservar su redacción y registrar cómo se comprobará cada requisito. No completar fuentes ni aprobaciones de memoria. Enlazar la tarea y la decisión correspondiente.

## Funcionalidades propuestas

Estas capacidades provienen de «Funcionalidades previstas» del README. Su alcance detallado, prioridad y aceptación por las profesoras siguen pendientes. Ninguna está implementada.

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

- Recabar y contrastar las exigencias de ambas profesoras, incluyendo entregables, rúbricas y criterios de demostración.
- Acordar un alcance mínimo y criterios observables para cada funcionalidad aceptada.
- Elegir el stack y el protocolo de aplicación después de evaluar requisitos, recursos y conocimientos del grupo.
- Precisar modelo de datos, reglas de integridad, concurrencia y mecanismo de monitoreo sin asumir tecnologías.
- Asignar personas a los cuatro roles y confirmar formalmente la fecha de presentación.
- Inventariar laptops, sistemas operativos y conectividad propios disponibles para la demostración.

El [registro de decisiones](03-DECISIONES.md) identifica el estado de estos asuntos. El [plan](04-PLAN-DE-TRABAJO.md) deberá vincular cada futura implementación con un requisito aceptado y una tarea verificable. Este documento no informa pruebas ejecutadas.

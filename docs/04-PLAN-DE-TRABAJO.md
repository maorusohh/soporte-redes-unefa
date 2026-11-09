# 04. Plan de trabajo

## Estado y organización

Este plan organiza el trabajo documental y propone una secuencia futura; no acredita desarrollo realizado. Participan cuatro estudiantes con pertenencia académica compartida. La administración técnica del repositorio es una función operativa, no un quinto rol académico ni una asignación individual.

La distribución individual está pendiente de acuerdo del grupo. Las áreas no deben convertirse en compartimentos aislados: cada integrante documentará sus entregables y colaborará en la integración y revisión de los demás.

| Área de trabajo | Responsabilidades previstas | Coordinación necesaria | Persona |
| --- | --- | --- | --- |
| Backend/Teleprocesos | Proponer lógica del servidor y contrato de comunicación; recoger evidencia de comunicación y comportamiento multiusuario cuando se implemente. | Frontend, Base de Datos y QA/Requisitos. | Pendiente de asignación. |
| Frontend | Proponer flujos de interacción y consumir el contrato acordado cuando se autorice la implementación. | Backend/Teleprocesos y QA/Requisitos. | Pendiente de asignación. |
| Base de Datos | Recabar exigencias de la asignatura, proponer modelo, integridad, consultas y estrategia de persistencia. | Backend/Teleprocesos y QA/Requisitos. | Pendiente de asignación. |
| QA/Requisitos | Mantener trazabilidad de requisitos y decisiones; proponer criterios, coordinar revisión y reunir evidencia real. | Las otras tres áreas; la calidad es responsabilidad compartida. | Pendiente de asignación. |

Los roles del equipo no definen roles de usuarios de la aplicación. Ninguna persona, tecnología ni entrega individual se da por aprobada en esta tabla.

## Tarea documental inicial: DOC-001

- **Fuente:** encargo del usuario de preparar la estructura documental y organizativa inicial del proyecto.
- **Objetivo:** crear AGENTS.md, CONTRIBUTING.md y los cinco documentos numerados de `docs/`, conservando el README.
- **Alcance:** instrucciones de trabajo, colaboración, requisitos por estado, arquitectura conceptual, decisiones, plan y demostración LAN preliminar.
- **Fuera de alcance:** implementación, elección de stack definitivo, pruebas funcionales y merge del PR.
- **Branch y destino:** `docs/project-foundation` hacia `main`.
- **Responsables individuales y revisor:** pendientes de asignación por el grupo; no se atribuye revisión a ningún integrante.
- **Estado:** documentación preparada para revisión; la apertura del PR y la revisión humana se comprueban en GitHub, no se dan por realizadas aquí.

Criterios de aceptación para revisar en el PR:

- Existen los siete archivos solicitados y el README no cambia.
- Se distinguen requisitos académicos confirmados, funcionalidades propuestas y decisiones pendientes, con sus fuentes disponibles.
- No se afirman asignaciones, tecnologías, requisitos de las profesoras ni pruebas inexistentes.
- Se mantiene febrero de 2027 como previsión pendiente de confirmación formal.
- Se explicitan pertenencia académica compartida, tareas verificables y pruebas de red únicamente sobre recursos autorizados.
- Los enlaces internos resuelven y el contenido es coherente entre documentos.
- El PR se dirige a `main` y no se fusiona automáticamente.

Validación correspondiente: lectura cruzada, revisión del diff, enlaces relativos y conservación del README. No aplica ejecución de pruebas funcionales. Esta tarea no tiene un número de Issue asignado; `DOC-001` es su referencia documental verificable.

## Hitos propuestos

La presentación final se prevé para **febrero de 2027**, pendiente de confirmación formal. No se asignan fechas oficiales a los hitos ni se presume disponibilidad semanal. El grupo deberá calendarizarlos tras conocer consignas y recursos.

| Hito | Entregables propuestos | Criterio de salida | Dependencia |
| --- | --- | --- | --- |
| H0. Base documental | Los siete documentos de DOC-001 y PR de revisión. | Criterios documentales comprobados y revisión del grupo. | Encargo actual; no exige código. |
| H1. Requisitos y organización | Consignas de ambas profesoras, alcance mínimo, criterios y asignación de personas. | Requisitos con evidencia y decisiones pendientes identificadas o resueltas. | H0 y consulta académica. |
| H2. Diseño acordado | Comparación de stack, contrato de comunicación, modelo de datos y guion mínimo. | Acuerdos explícitos registrados y tareas de implementación verificables. | H1. |
| H3. Primera integración | Un flujo mínimo autorizado entre cliente, servidor y persistencia según el diseño aprobado. | Flujo realmente ejecutado con evidencia; alcance exacto por acordar en su tarea. | H2; requiere autorización de implementación posterior. |
| H4. Incrementos funcionales | Funciones priorizadas y monitoreo autorizado según requisitos aceptados. | Criterios de cada tarea comprobados e integración revisada. | H3 y tareas acordadas. |
| H5. Ensayo LAN | Guion reproducible en equipos propios, alternativas Wi-Fi/Ethernet y registro de resultados. | Comportamiento observado, limitaciones y alternativa de contingencia documentados. | H4 y recursos/criterios confirmados. |
| H6. Presentación | Versión revisada, documentación y evidencias acordes con ambas consignas. | Fecha y formato formalmente confirmados; preparación validada por el grupo. | H5 y confirmación académica. |

Estos hitos orientan la planificación; las modificaciones futuras requieren sus propias Issues o tareas documentadas antes de iniciarse. No autorizan por sí solos desarrollar todas las funcionalidades.

## Estrategia de integración propuesta

1. Acordar primero el contrato entre áreas: operaciones, mensajes, errores, datos y responsabilidades. Documentar la decisión sin confundir un ejemplo con un contrato aprobado.
2. Dividir cada incremento en tareas pequeñas con dependencias y criterios de aceptación; coordinar antes los cambios sobre archivos compartidos.
3. Usar branches por tarea y PR hacia `main`, con revisión de otro integrante según [CONTRIBUTING.md](../CONTRIBUTING.md).
4. Cuando exista implementación, integrar un flujo completo y pequeño antes de ampliar funciones. Verificar con los comandos y escenarios reales que se definan entonces; no inventar ahora un test runner o resultados.
5. Registrar incompatibilidades y fallos en tareas; actualizar contrato, requisitos o decisiones cuando el cambio sea aprobado. No dejar la integración para el ensayo final.
6. Antes de cada demostración, elegir una versión revisada y registrar su commit, configuración no sensible y evidencia obtenida. No afirmar que un merge por sí solo demuestra funcionamiento.

## Siguientes tareas por acordar

Recabar consignas, asignar integrantes, confirmar fecha y recursos, y evaluar alternativas técnicas. Son asuntos identificados, no Issues creadas ni tareas de implementación aprobadas. Al priorizarlos, registrar cada tarea según CONTRIBUTING.md y enlazar los IDs del [registro de decisiones](03-DECISIONES.md).

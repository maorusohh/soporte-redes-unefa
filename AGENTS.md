# Instrucciones para asistentes de IA

## Contexto y alcance

Este repositorio contiene un proyecto académico colaborativo de cuatro estudiantes de Teleprocesos y Sistemas Avanzados de Bases de Datos. El objetivo es un sistema multiusuario cliente-servidor para gestionar incidencias de soporte técnico y monitorear equipos de red mediante comunicación TCP/IP.

La UNEFANB, Extensión Santa Teresa del Tuy, es una referencia académica; no es un entorno de despliegue ni de pruebas autorizado. El proyecto pertenece académicamente a los cuatro integrantes. La administración técnica del repositorio no otorga autoría exclusiva ni autoridad para decidir por el grupo.

## Antes de modificar archivos

1. Lee la solicitud vigente, este archivo, el [README](README.md), la [guía de contribución](CONTRIBUTING.md) y los documentos de [requisitos](docs/01-REQUISITOS.md), [arquitectura](docs/02-ARQUITECTURA.md), [decisiones](docs/03-DECISIONES.md), [plan de trabajo](docs/04-PLAN-DE-TRABAJO.md) y [demostración LAN](docs/05-DEMOSTRACION-LAN.md).
2. Inspecciona el contenido actual y el estado de Git. Conserva los cambios ajenos y usa el checkout existente: cada tarea cloud ya dispone de un entorno aislado; no crees un Git worktree salvo solicitud explícita.
3. Identifica la tarea verificable que autoriza el cambio, su alcance, criterios de aceptación y referencia. Usa una Issue o, si no está disponible, una tarea documental identificada según CONTRIBUTING.md. No inventes números de Issues ni enlaces.
4. Distingue requisitos confirmados, funcionalidades propuestas y decisiones pendientes. Si falta un dato que impide avanzar, solicita una aclaración concreta; continúa el trabajo independiente que sí esté autorizado.

## Decisiones y conservación de contexto

- Respeta las decisiones aprobadas registradas con fuente en [03-DECISIONES.md](docs/03-DECISIONES.md). No conviertas propuestas en acuerdos ni atribuyas requisitos a las profesoras sin evidencia.
- Ante contradicciones, señala la diferencia y su fuente. No cambies silenciosamente el alcance ni el estado de aprobación. Registra cualquier sustitución de una decisión con su motivo y evidencia.
- Mantén requisitos, decisiones y plan coherentes con la tarea. Al terminar, informa archivos modificados, validaciones ejecutadas, resultados, pendientes y siguiente paso verificable.
- Conserva el contexto duradero en la documentación y en la Issue o PR correspondiente; no dependas de la memoria de una conversación. No incluyas conversaciones privadas completas.
- Redacta las explicaciones en español. Conserva nombres técnicos en inglés cuando corresponda.

## Etapa actual — AUTH-P0 (vigente desde 21–23/11/2026)

La sección anterior que limitaba este repositorio a preparación documental **correspondía al primer PR de fundación** y quedó superada por las tareas técnicas aprobadas posteriormente. **No debe aplicarse como prohibición global** frente a Issues explícitas posteriores.

- **Alcance actual de trabajo:** implementar y comprobar autenticación por roles, sesiones, cambio/recuperación de contraseña, Backend FastAPI, Frontend React/Vite y PostgreSQL; se conservan las pruebas del heartbeat de Teleprocesos.
- **Tareas autorizadas:** [Backend #9](https://github.com/maorusohh/soporte-redes-unefa/issues/9), [Frontend #10](https://github.com/maorusohh/soporte-redes-unefa/issues/10), [BD #11](https://github.com/maorusohh/soporte-redes-unefa/issues/11), [QA #12](https://github.com/maorusohh/soporte-redes-unefa/issues/12), y las documentales específicas, como Capítulo 2 #16.
- **Contratos y criterios:** [docs/07](docs/07-ALCANCE-Y-REQUISITOS.md), [docs/10](docs/10-CONTRATO-INTEGRACION-AUTH.md), [docs/11](docs/11-GUIA-COLABORACION-PRACTICA.md), y el [contrato de persistencia de Backend](https://github.com/maorusohh/soporte-redes-unefa/blob/feat/auth-backend-p0/docs/12-CONTRATO-PERSISTENCIA-AUTH.md). Distinguir propuestas aún por validar de decisiones confirmadas.
- **Ramas ya creadas:** `feat/auth-backend-p0`, `feat/auth-frontend-p0`, `feat/auth-database-p0` y `test/auth-qa-p0`. No duplicarlas. Cada integrante trabaja en su rama, publica PR hacia **`integration/auth-p0`**, y **no fusiona** sin revisión y autorización humana. Integración final hacia `main` solo después de revisar los PRs base en orden.
- **Asignación comunicada:** Mauricio Backend/integración, Joiber Frontend, Yosward BD, Nessler QA y documentación académica de la Issue #16. Los hechos documentados y las pruebas verificables prevalecen sobre afirmaciones de avance.
- **Arquitectura propuesta:** una laptop anfitriona con FastAPI y PostgreSQL; navegadores cliente acceden por LAN privada autorizada. Datos ficticios y equipos propios del grupo. La simulación local en memoria no constituye persistencia PostgreSQL ni autenticación productiva.

Los requisitos nuevos deben quedar en la Issue pertinente y no pueden ampliar el alcance silenciosamente. La presentación académica y sus fechas oficiales requieren confirmación; no inventar plazos.

## Seguridad y evidencia

- Usa únicamente equipos, redes y datos autorizados. Prefiere computadoras personales del grupo y una LAN propia. No accedas, escanees, monitorees ni cambies equipos o redes institucionales.
- Limita cualquier futura prueba de red a equipos concretos autorizados por sus propietarios. No abras acceso público ni desactives globalmente el firewall para facilitar una demostración.
- No subas credenciales, tokens, contraseñas, archivos de configuración con secretos, datos personales ni registros sensibles. Usa datos sintéticos y ejemplos sin valores reales; no pidas secretos en el chat.
- No inventes implementaciones, comandos ejecutados, resultados, capturas, cobertura ni pruebas aprobadas. Distingue lo propuesto, lo implementado, lo ejecutado y lo verificado.
- Para cambios documentales revisa contenido, enlaces, coherencia y diff. No presentes esa revisión como una prueba funcional de una aplicación.
- Trabaja en tu rama individual de AUTH-P0 y prepara un PR hacia `integration/auth-p0` (luego integración revisada hacia `main`). No hagas push directo a `main`, no uses force push ni fusiones un PR automáticamente. Un bloqueo de permisos debe informarse; no justifica omitir las verificaciones restantes.

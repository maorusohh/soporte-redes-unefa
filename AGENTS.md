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

## Límites de la etapa actual

- Esta etapa prepara documentación y organización. No implementes login, frontend, backend, base de datos ni pruebas funcionales sin una tarea posterior explícita.
- No selecciones ni instales un stack definitivo por iniciativa propia. Lenguajes, frameworks, motor de base de datos, formato de mensajes y mecanismos de monitoreo siguen pendientes.
- Los cuatro roles están definidos como áreas de trabajo, pero las personas siguen sin asignación. No inventes nombres, responsables ni disponibilidad.
- La presentación final está prevista para febrero de 2027, pendiente de confirmación formal. No la presentes como fecha oficial ni inventes un día.
- Conserva el README existente en esta tarea. Cualquier cambio posterior requiere su propia tarea verificable.

## Seguridad y evidencia

- Usa únicamente equipos, redes y datos autorizados. Prefiere computadoras personales del grupo y una LAN propia. No accedas, escanees, monitorees ni cambies equipos o redes institucionales.
- Limita cualquier futura prueba de red a equipos concretos autorizados por sus propietarios. No abras acceso público ni desactives globalmente el firewall para facilitar una demostración.
- No subas credenciales, tokens, contraseñas, archivos de configuración con secretos, datos personales ni registros sensibles. Usa datos sintéticos y ejemplos sin valores reales; no pidas secretos en el chat.
- No inventes implementaciones, comandos ejecutados, resultados, capturas, cobertura ni pruebas aprobadas. Distingue lo propuesto, lo implementado, lo ejecutado y lo verificado.
- Para cambios documentales revisa contenido, enlaces, coherencia y diff. No presentes esa revisión como una prueba funcional de una aplicación.
- Trabaja en una branch por tarea y prepara un PR hacia `main`. No hagas push directo a `main`, no uses force push ni fusiones un PR automáticamente. Un bloqueo de permisos debe informarse; no justifica omitir las verificaciones restantes.

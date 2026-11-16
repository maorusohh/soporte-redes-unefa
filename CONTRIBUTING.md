# Guía de colaboración

## Equipo y acuerdos

El proyecto pertenece académicamente a los cuatro integrantes. El administrador técnico facilita el acceso y la operación de GitHub; las decisiones académicas y técnicas se documentan para revisión del grupo. Las asignaciones individuales de Backend/Teleprocesos, Frontend, Base de Datos y QA/Requisitos siguen pendientes.

Consulta [AGENTS.md](AGENTS.md) y el [plan de trabajo](docs/04-PLAN-DE-TRABAJO.md). Este procedimiento regula la colaboración; no afirma que existan reglas de protección o automatizaciones configuradas en GitHub.

## 1. Registrar una tarea verificable

Antes de modificar archivos, abre o identifica una Issue con:

- Objetivo, motivo y alcance, incluyendo qué queda fuera.
- Requisito o decisión relacionado, si existe, y dependencias.
- Entregables y criterios de aceptación comprobables.
- Forma de validación y evidencia esperada, sin afirmar resultados anticipados.
- Responsable y revisor cuando el grupo los asigne; mientras tanto, indicar «pendiente de asignación».

Si no se dispone de Issues, registra esos mismos datos en una tarea con ID dentro del [plan de trabajo](docs/04-PLAN-DE-TRABAJO.md) y enlázala desde commits y PR. No hace falta duplicar una Issue existente. La tarea inicial es `DOC-001`, basada en el encargo de preparar esta estructura documental. Las tareas posteriores deben existir antes de empezar sus cambios.

Un requisito de una profesora necesita fuente verificable: consigna, rúbrica o confirmación registrada, con fecha cuando esté disponible. Las sugerencias del equipo no sustituyen esa evidencia.

## 2. Crear una branch por tarea

Parte de `main` actualizado, conserva los cambios locales y evita mezclar tareas. Usa nombres como `docs/<tarea>`, `feat/<tarea>` o `fix/<tarea>`; estos nombres no autorizan por sí mismos la implementación.

La branch de `DOC-001` es `docs/project-foundation`. No trabajes directamente sobre `main`. Si el nombre ya existe, revisa su contenido antes de reutilizarlo; no sobrescribas trabajo ajeno.

## 3. Preparar commits

- Haz cambios pequeños y relacionados con la tarea, con mensajes claros en español. Ejemplo: `docs: preparar base documental (DOC-001)`.
- Revisa el diff antes de cada commit. No incluyas archivos ajenos al objetivo, secretos, datos reales de usuarios ni salidas temporales.
- Conserva la autoría real. No atribuyas trabajo, revisiones o aprobaciones a compañeros que no hayan participado.
- Actualiza los documentos afectados por una decisión y su evidencia. Una propuesta debe seguir marcada como propuesta hasta que se apruebe.

## 4. Abrir un Pull Request hacia main

Publica la branch y abre un PR con título descriptivo y estos datos:

- Referencia de Issue o tarea documental; usa `Closes #N` solo con una Issue real y cuando corresponda cerrarla.
- Problema u objetivo y resultado del cambio.
- Archivos o áreas afectadas y decisiones que siguen pendientes.
- Verificaciones realmente ejecutadas y sus resultados; separa fallos, comprobaciones pendientes y validaciones que no aplican.

Para esta etapa solo corresponde revisión documental. No hay implementación ni pruebas funcionales que ejecutar. Si el cambio no está listo para revisión, usa un Draft PR.

## 5. Revisar y corregir

Solicita la revisión de al menos otro integrante antes de fusionar. El revisor comprueba criterios de aceptación, alcance, coherencia con requisitos y decisiones, seguridad de los datos y evidencia de validación. Si una decisión requiere consulta académica, registra el pendiente; una aprobación del PR no equivale a aprobación de las profesoras.

Resuelve observaciones en la misma branch. Ante conflictos, conserva ambas intenciones y acuerda la solución con quienes realizaron los cambios. No uses force push ni descartes cambios ajenos para resolverlos.

## 6. Fusionar y dar seguimiento

El merge lo realiza una persona con permisos después de la revisión requerida y de comprobar los criterios de aceptación. No se permite el merge automático por un asistente. Esta tarea autoriza crear el PR, no fusionarlo.

Registra el resultado en la tarea y las decisiones realmente aprobadas en [03-DECISIONES.md](docs/03-DECISIONES.md). Elimina la branch remota solo cuando ya esté fusionada y no tenga trabajo pendiente, mediante una acción acordada del equipo. Mantén `main` como base compartida de cambios revisados.

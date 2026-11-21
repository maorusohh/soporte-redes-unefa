# 11. Arranque del equipo: ramas, entregas y revisión

**Lectura obligatoria:** [AGENTS.md](../AGENTS.md), [CONTRIBUTING.md](../CONTRIBUTING.md), [07 Alcance](07-ALCANCE-Y-REQUISITOS.md) y [10 Contrato Auth](10-CONTRATO-INTEGRACION-AUTH.md). Los tres primeros documentos y la POC aún dependen de PR abiertos, por eso hay una rama de integración temporal.

## Rama base de trabajo: `integration/auth-p0`

- Nadie debe crear cambios directamente en `main` ni en `integration/auth-p0`.
- Cada integrante crea su rama **desde `integration/auth-p0`**, y abre PR **hacia `integration/auth-p0`** para revisión cruzada.
- Cuando PR #1, #3 y #13 se revisen e integren en orden, la coordinación evaluará la integración final hacia `main`, sin fusionar automáticamente ni sobrescribir commits.
- No usar `git push --force`, no subir `.env`, secretos, contraseñas, paquetes instalados ni archivos `.venv`.

| Persona | Rama propia sugerida | Issue |
| --- | --- | --- |
| Mauricio | `feat/auth-backend-p0` | [#9](https://github.com/maorusohh/soporte-redes-unefa/issues/9) |
| Joiber | `feat/auth-frontend-p0` | [#10](https://github.com/maorusohh/soporte-redes-unefa/issues/10) |
| Yosward | `feat/auth-database-p0` | [#11](https://github.com/maorusohh/soporte-redes-unefa/issues/11) |
| Nessler | `test/auth-qa-p0` | [#12](https://github.com/maorusohh/soporte-redes-unefa/issues/12) |

## Primeros pasos para cada compañero, incluso si usa IA gratuita

1. Abrir https://github.com/maorusohh/soporte-redes-unefa y verificar que esté iniciada su sesión y tenga acceso como colaborador.
2. Abrir la Issue asignada, leer el alcance y comentar **«Asumo esta tarea»** o preguntar por una duda técnica específica. Yosward se asignará en GitHub cuando tengamos su username.
3. En el selector de ramas del repositorio elegir **`integration/auth-p0`** y luego escribir el nombre de su rama personal y seleccionar **Create branch** a partir de esa base. Si no aparece `integration/auth-p0`, avisar antes de modificar archivos.
4. Trabajar **solo en su carpeta asignada** y respetar el contrato del documento 10. Las IA pueden ayudar a producir archivos, pero cada integrante comprueba qué cambió.
5. Subir los commits a **su rama**, no a `main`, y abrir un Pull Request con **base = `integration/auth-p0`**. En la descripción, enlazar la Issue, describir archivos, pruebas reales, pendientes y capturas sin datos sensibles.
6. Esperar revisión: Mauricio verifica compatibilidad y seguridad; Nessler prueba el flujo final, sin considerar autoaprobadas sus propias pruebas. Corregir observaciones **en la misma rama** y actualizar el PR.
7. Solo integrar una vez revisados contratos, pruebas y permisos; ninguna IA debe fusionar sin autorización humana.

## Si usan Codex, ChatGPT Free, DeepSeek o Perplexity

Proporcionar al asistente los enlaces del repositorio y la Issue; pedirle leer los documentos 07, 10, 11 y `AGENTS.md`, respetar la carpeta correspondiente, escribir cambios **verificables**, ejecutar lo que permita su entorno y distinguir las pruebas hechas de las no ejecutadas. Si la IA no puede acceder al repositorio, usar el código desde una copia local, sin inventar lectura de archivos.

## Primer entrega mínima por rol

- **Frontend (Joiber):** `login.html` y `login.js` en `prototype/web/`, estado de errores, formularios para olvido/cambio de contraseña, manejo correcto de sesiones, UI que consuma rutas reales o explique qué parte espera API. No simular credenciales válidas como si hubiera autenticación.
- **BD (Yosward):** `prototype/db/` con migración inicial de usuarios, sesiones y códigos de recuperación; documentar campos, PK/FK, índices, integridad y puesta en marcha de PostgreSQL. No subir contraseñas.
- **QA (Nessler):** `docs/qa/matriz-auth.md` con al menos diez casos basados en Issue #12, pasos reproducibles y columna «no ejecutado» hasta que exista el sistema; luego ejecutar y adjuntar evidencia.
- **Backend (Mauricio):** API de login/roles/sesiones/recuperación según contrato, integración con BD, cobertura automática, conservar heartbeat. Coordinar el método de sesión con Frontend y consultas con BD antes de fusionar.

## Reunión/coord. mínima: 10–15 minutos por cada entrega

Cada integrante responde: **qué terminé, qué probé, qué falta, qué necesito de otra área, y enlace a mi Issue/PR**. Si una dependencia está bloqueada se registra sin ocultarla. No dar por listo un módulo por tener una imagen bonita o solo un commit.

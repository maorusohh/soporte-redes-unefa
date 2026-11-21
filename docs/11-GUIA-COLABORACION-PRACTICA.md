# 11. Guía de colaboración práctica — autenticación P0

**Estado:** procedimientos de trabajo del equipo. Actualización: 21/11/2026. Documentación y contrato en PR #13; primer Backend en PR #14 (Draft). El login completo **no está implementado**.

## 1. Fuente de verdad

- [Repositorio público](https://github.com/maorusohh/soporte-redes-unefa)
- [Alcance, requisitos y delimitación (doc 07)](https://github.com/maorusohh/soporte-redes-unefa/blob/docs/auth-scope-next-review/docs/07-ALCANCE-Y-REQUISITOS.md)
- [Contrato de autenticación (doc 10)](https://github.com/maorusohh/soporte-redes-unefa/blob/docs/auth-scope-next-review/docs/10-CONTRATO-INTEGRACION-AUTH.md)
- [Este procedimiento (doc 11)](https://github.com/maorusohh/soporte-redes-unefa/blob/docs/auth-scope-next-review/docs/11-GUIA-COLABORACION-PRACTICA.md)
- [Primer Backend PR #14 — Draft](https://github.com/maorusohh/soporte-redes-unefa/pull/14), componentes de seguridad y modelos sin endpoints de login todavía
- [PR #13 documental](https://github.com/maorusohh/soporte-redes-unefa/pull/13), base técnica propuesta
- Revisar también `AGENTS.md` y `CONTRIBUTING.md` en la rama `integration/auth-p0`.

Los PR #1, #3, #13 y #14 todavía requieren revisión e integración. Ningún enlace a un PR representa automáticamente código disponible en `main`.

## 2. Responsables y ramas que YA ESTÁN CREADAS

| Responsable | Área y Issue | Rama existente | Carpeta principal |
| --- | --- | --- | --- |
| Mauricio | [Backend #9](https://github.com/maorusohh/soporte-redes-unefa/issues/9) | [`feat/auth-backend-p0`](https://github.com/maorusohh/soporte-redes-unefa/tree/feat/auth-backend-p0) | `prototype/app/auth/`, `prototype/tests/` |
| Joiber (`jbrkll007`) | [Frontend #10](https://github.com/maorusohh/soporte-redes-unefa/issues/10) | [`feat/auth-frontend-p0`](https://github.com/maorusohh/soporte-redes-unefa/tree/feat/auth-frontend-p0) | `prototype/web/` |
| Yosward (`yos_12`) | [BD #11](https://github.com/maorusohh/soporte-redes-unefa/issues/11) | [`feat/auth-database-p0`](https://github.com/maorusohh/soporte-redes-unefa/tree/feat/auth-database-p0) | `prototype/db/`, `docs/diccionario-auth.md` |
| Nessler (`NesslerjB`) | [QA #12](https://github.com/maorusohh/soporte-redes-unefa/issues/12) | [`test/auth-qa-p0`](https://github.com/maorusohh/soporte-redes-unefa/tree/test/auth-qa-p0) | `docs/qa/` |

**No crear de nuevo las ramas.** Abrir la rama personal existente desde el selector de GitHub o realizar `git switch nombre-de-rama` tras `git fetch origin` en una copia local. La base/destino de los PR técnicos es **`integration/auth-p0`**, no `main`; no editar directamente `main` ni la rama de integración.

**Acceso:** Mauricio aportó captura del menú Collaborators con `jbrkll007`, `NesslerjB` y `yos_12`, todos como Collaborator. La API de asignación devuelve error 422 al asignar Issue #11 a `yos_12`, pero eso no bloquea su trabajo en la rama.

## 3. Cómo revisar el código de los demás

1. Abrir el [repositorio](https://github.com/maorusohh/soporte-redes-unefa), menú **Code**, y seleccionar la rama deseada arriba de la lista de archivos.
2. Para examinar los cambios de Backend, abrir [PR #14](https://github.com/maorusohh/soporte-redes-unefa/pull/14) → **Files changed**; o navegar a [`prototype/app/auth/`](https://github.com/maorusohh/soporte-redes-unefa/tree/feat/auth-backend-p0/prototype/app/auth) en la rama Backend.
3. Para revisar trabajo de Frontend/BD/QA, abrir sus ramas individuales y luego el PR que cada integrante abra. **Que exista la rama no demuestra que tenga cambios nuevos.**
4. Consultar el contrato del documento 10 antes de cambiar rutas, nombres de campos, permisos o formato JSON. Si un cambio de contrato parece necesario, comentarlo en la Issue correspondiente y coordinarlo; nunca modificar unilateralmente frontend/backend/esquema.
5. En GitHub, seleccionar un archivo → **Raw** o usar el botón de copiar para obtener su contenido. Con varios archivos, Git → `git clone` o **Code → Download ZIP** en la rama correspondiente; al usar ZIP es una copia sin historial Git. No copiar código sin revisar su ruta y rama de origen.

## 4. Si utilizan una IA sin conexión directa a GitHub

1. Dar a la IA la finalidad del proyecto, la Issue asignada y los enlaces a documentos 07, 10, 11, `AGENTS.md` y PR #14.
2. Pedir a la IA que confirme qué enlaces **puede leer efectivamente**. Si no puede consultar una página o el repositorio, no debe inventar contenido ni asumir que accedió. Copiar del GitHub el texto de los **archivos relevantes**, indicando `ruta` y `rama` de cada uno, o entregar una copia ZIP local si su herramienta permite subir archivos.
3. Indicar el módulo propio, endpoints/contratos esperados, restricciones de carpetas y pruebas; pedir **archivos completos** cuando se cambie una porción sustancial.
4. Antes de subir el resultado, revisar que no altere rutas ajenas, que no contenga secretos y que no dependa de un servidor externo. Si no pudo ejecutar tests, declarar **no ejecutados**.
5. Abrir GitHub en la rama **personal**, crear/editar archivos en la ruta asignada y hacer commit **solo ahí**; o usar Git local + push a la rama personal. Nunca pegar archivos arbitrarios en `main` ni reemplazar el código de otro.
6. Abrir Pull Request con **base = `integration/auth-p0`** y **compare = la rama personal**. Añadir enlace a Issue, lista de cambios, pruebas ejecutadas, limitaciones y dependencias; **no hacer Merge**. Mauricio revisa compatibilidad y seguridad; Nessler aporta pruebas reales cuando esté disponible.
7. Corregir comentarios de revisión mediante nuevos commits **en la misma rama**. El PR se actualiza automáticamente.

### Prompt de partida para una IA sin GitHub integrado

> Trabajo como integrante de un proyecto académico cliente-servidor con FastAPI, PostgreSQL y Frontend web. Mi Issue es: [ENLACE]. Mi rama personal ya creada es [RAMA]. La rama destino de PR es integration/auth-p0. Debes basarte en el contrato docs/10-CONTRATO-INTEGRACION-AUTH.md y en los archivos que te adjunte (con su ruta y rama). Si no puedes abrir enlaces, pídeme el contenido relevante y no supongas haberlo leído. Cambia solo [MI CARPETA], conserva rutas y contratos, incluye pruebas o pasos concretos de validación y entrega archivos completos cuando sea pertinente. Distingue expresamente implementación, supuestos, validaciones ejecutadas y pendientes. No uses claves o tokens reales ni hagas merge.

## 5. Entregables mínimos y dependencias

- **Joiber:** formularios reales para login, perfil, cambio/recuperación y manejo de respuestas 401/403; propuesta de librería/framework permitida con justificación de instalación y compatibilidad LAN. No simular credenciales en JS.
- **Yosward:** esquema/migraciones versionadas PostgreSQL para usuarios, sesiones, recuperación, restricciones e índices; diccionario de datos; coordinar primero columnas y entidades con Backend.
- **Mauricio:** seguridad de contraseñas y tokens ya iniciada en PR #14; faltan endpoints HTTP, permisos, sesiones persistidas, integración de BD/Frontend y tests.
- **Nessler:** matriz simple de aceptación y pruebas exploratorias: login válido/inválido, ADMIN/USER, logout, recuperación, persistencia y dos sesiones independientes. Marcar **NO EJECUTADO** hasta observar el sistema; no atribuir pruebas no hechas.

## 6. Checkpoint de integración

Cada PR informa **qué terminó, qué probó, qué falta, qué requiere de otro componente y dónde está la evidencia**. La integración solo se aprueba con contratos compatibles, permisos de Backend correctos y tests comprobados. Una pantalla estática, tablas sin migraciones o pruebas sin ejecución real no cumplen el criterio de terminado.

No usar `git push --force`, no subir `.env`, `.venv`, contraseñas, tokens, secretos ni información institucional/privada.

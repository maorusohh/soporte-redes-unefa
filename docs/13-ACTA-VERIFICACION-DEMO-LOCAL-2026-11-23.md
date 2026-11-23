# 13. Acta de verificación: demostración local AUTH-P0

**Fecha:** 23 de noviembre de 2026  
**Estado:** DEMO LOCAL validada por el ejecutor; PostgreSQL y LAN pendientes.  
**Alcance:** integración temporal entre Backend FastAPI ([PR #14](https://github.com/maorusohh/soporte-redes-unefa/pull/14)) y Frontend React/Vite ([PR #15](https://github.com/maorusohh/soporte-redes-unefa/pull/15)), combinados **solo en una copia local de Windows** `preview/auth-local`, sin fusionar esos PR en GitHub.  
**Ejecutor de la prueba manual:** Mauricio (Backend/coordinación); **Front-end:** Joiber.  
**No aplica a entornos reales de la UNEFA ni a una base PostgreSQL.**

## Preparación y resultados obtenidos

En Windows PowerShell el ejecutor compartió salida que acredita:

| Acción | Evidencia reportada y resultado |
| --- | --- |
| Verificar herramientas | Git 2.52.0.windows.1, Python 3.13.3, Node 24.12.0, npm 11.6.2 |
| Copia independiente | `git clone --branch feat/auth-backend-p0` a `soporte-redes-unefa-demo` |
| Rama de prueba local | `git switch -c preview/auth-local`; `git merge --no-edit origin/feat/auth-frontend-p0` finalizó mediante `ort`, sin conflictos |
| Instalación API | `pip install -r requirements.txt` en `prototype/.venv` exitosa |
| Suite Python | `python -m pytest -q`: **25 passed, 1 warning**; aviso deprecación Starlette/httpx, no falla |
| Dependencias React | `npm ci`: instaló 86 paquetes, `npm audit` informó 0 vulnerabilidades; warnings `EBADENGINE` en jsdom/w3c-xmlserializer con Node 24.12.0 |
| Suite Frontend | `npm test`: **40 passed** en cinco archivos Vitest; ambiente jsdom con advertencia de rendimiento, no falla |
| Build React | `npm run build`: Vite compiló 36 módulos, produjo `dist/index.html` y assets JS/CSS |
| Inicio servidor | `python -m app.local_demo`: Uvicorn informó `Application startup complete`, escuchando únicamente `127.0.0.1:8000` |
| Capturas navegador | Tres vistas compartidas de `/session` como ADMIN, `/recover` y `/change-password`, con aviso «SIMULACIÓN LOCAL · SIN PostgreSQL» |
| Pruebas manuales | El ejecutor **afirma haber completado las seis comprobaciones** del checklist: abrir login, autenticarse ADMIN, consultar administración, autenticar USER desde incógnito, comparar permisos y hacer logout USER. Se registra como **validación manual informada por el ejecutor**. No contamos en GitHub con logs HTTP o capturas de cada uno de los seis pasos. |

Las contraseñas ficticias aleatorias mostradas en la consola **no se incorporan a esta acta**.

## Dictamen técnico

**APROBADA la demostración local funcional como evidencia del checkpoint AUTH-P0 provisional**, con estas limitaciones explícitas:

1. `app.local_demo` utiliza `VolatileDemoRepository`: no hay PostgreSQL, persistencia tras reinicio, ni migraciones verificadas por ese modo.
2. Los **25 tests Python** y los **40 tests Vitest** son suites independientes; no se presentarán como 65 pruebas integradas de extremo a extremo.
3. La interacción entre navegador y FastAPI se validó manualmente en **una sola laptop**, sin prueba de dos equipos físicos por LAN.
4. El modo simulado se limita a localhost y datos sintéticos; **no ingresar credenciales reales ni exponer la demo como servicio público**.
5. Las opciones visibles ADMIN no sustituyen los controles reales de Backend. El contrato prohíbe ocultar permisos solo desde React.
6. La versión Node 24.12.0 produjo warnings de engines; se recomienda normalizar a una versión que satisfaga las dependencias antes de CI/despliegue estable, sin bloquear esta demo probada.
7. La corrección del caso `VITE_API_BASE=//host-externo` en Frontend PR #15 sigue pendiente antes del merge definitivo.

## Siguiente checkpoint: PostgreSQL real

Yosward ya publicó los archivos `docs/diccionario-auth.md` y `prototype/db/migrations/001_create_auth_tables.sql` en `feat/auth-database-p0`; **es un aporte real, no una integración terminada**.

- Auditar y ejecutar la migración en una BD de prueba aislada y registrar el resultado.
- Revisar unicidad de email normalizado: `UNIQUE(email)` solo es sensible a la representación almacenada. Se recomienda `UNIQUE (lower(email))` o un `CHECK` que exija normalización consistente, según la decisión de diseño.
- Especificar un proceso seguro y repetible de inicialización ADMIN, sin credenciales hardcodeadas.
- Implementar el adaptador PostgreSQL de `AuthRepository`, con transacciones atómicas para cambios de contraseña y códigos de un solo uso.
- Probar login, logout, permisos 401/403, recuperación, concurrencia y **persistencia tras reinicio real**.
- Validar desde dos navegadores/equipos autorizados por LAN y registrar evidencia separada de la demo en memoria.

**Resultado académico defendible:** ya hay una demostración funcional de autenticación entre Frontend y API, con usuarios ficticios y almacenamiento temporal. No se ha completado el requisito de base de datos relacional ni el despliegue LAN multi-equipo.

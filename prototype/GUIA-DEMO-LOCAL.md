# Demostración local integrada sin PostgreSQL — AUTH-P0

**Uso académico exclusivamente con cuentas ficticias.** Esta guía se ejecuta en **Windows PowerShell** y prepara una vista temporal que combina el Backend del [PR #14](https://github.com/maorusohh/soporte-redes-unefa/pull/14) con la interfaz React del [PR #15](https://github.com/maorusohh/soporte-redes-unefa/pull/15) **sin fusionar sus PR en GitHub**.

> **Advertencia esencial:** Esta demo utiliza `VolatileDemoRepository`, implementado en `app/auth/volatile_demo_repository.py`, y **NO utiliza PostgreSQL**. Crea cuentas y claves aleatorias por arranque, no persiste sesiones tras reinicio y no es una prueba de LAN ni de autenticación productiva. Lleva un aviso en pantalla. El servidor normal `app.main:app` permanece sin Fake y devuelve 503 en autenticación mientras no tenga BD.

## Prerrequisitos

- Git; Python 3.13 y comando `py`.
- Node.js versión `>=22.12.0` y npm, para construir el frontend React de Joiber.
- Conexión a Internet para el primer `git clone`, `pip install` y `npm ci`; luego la demo localhost puede correr sin Internet.
- Puerto 8000 libre; detener otros servidores Uvicorn con `Ctrl + C`.
- Ejecutar en su **laptop Windows**, no desde la aplicación de GitHub ni en una red pública.

## Paso A — Copia independiente, segura para no tocar el proyecto previo

En **PowerShell**, sin ejecutar como administrador:

```powershell
cd $env:USERPROFILE
git clone --branch feat/auth-backend-p0 https://github.com/maorusohh/soporte-redes-unefa.git soporte-redes-unefa-demo
cd .\soporte-redes-unefa-demo
git switch -c preview/auth-local
git merge --no-edit origin/feat/auth-frontend-p0
git status -sb
```

Es una **copia adicional** en `C:\Users\ADMIN\soporte-redes-unefa-demo` si tu perfil es ADMIN. El merge sucede solo localmente en `preview/auth-local`; **no hace push ni fusiona PR**. Se esperan dos carpetas nuevas: `prototype/app/auth/` y `prototype/web/`. Si surge un conflicto de merge, no resolver eliminando archivos: copiar el error para revisión técnica.

Si el clon ya existe y Git dice `destination path already exists`, **no repetir el clone**. Abre esa carpeta y comprueba `git status -sb` para continuar según su estado actual, o elige otro directorio `soporte-redes-unefa-demo-2`.

## Paso B — Instalar la API y construir el Frontend

Desde la raíz de esa nueva copia:

```powershell
cd .\prototype
py --version
node --version
npm --version

py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest -q

cd .\web
npm ci
npm run build
cd ..
```

**Validación:** `pytest` debe finalizar sin tests fallidos; `npm run build` debe crear `prototype/web/dist/index.html`. Los números de tests pueden aumentar conforme se actualiza la rama; no asumir un valor hasta ejecutarlo. Si `node --version` es inferior a 22.12.0, actualizar Node antes de `npm ci`.

## Paso C — Iniciar DEMO (una única terminal)

Desde `...\soporte-redes-unefa-demo\prototype`:

```powershell
.\.venv\Scripts\python.exe -m app.local_demo
```

Esta orden arranca un servidor **solo en `127.0.0.1:8000`**. No usar `uvicorn app.main:app` para esta simulación, porque no tendrá un repositorio configurado.

En la consola aparecerán **dos correos ficticios y dos contraseñas temporales aleatorias**, una para ADMIN y otra para USER. No están en el código ni son contraseñas de uso real. **No enviarlas por WhatsApp ni subir capturas de esa terminal a un repositorio público.** Copiar las de esa ejecución a una nota local si las necesitas para la demo. Cuando detengas el servidor con `Ctrl + C` se perderán las cuentas/sesiones/cambios; al reiniciar se generarán claves nuevas.

## Paso D — Mostrar la pantalla y dos sesiones distintas

- **Navegador habitual:** abre `http://127.0.0.1:8000/login`, entra con `admin@example.com` y su clave temporal **impresa en esa ejecución**. En `/session` consulta la lista ADMIN.
- **Ventana de incógnito, independiente:** abre la misma URL, entra con `user@example.com` y la otra clave temporal. En `/session` verá su propia cuenta y no verá el control de lista de usuarios ADMIN.
- Esto comprueba dos sesiones HTTP independientes en **una misma laptop**, con estado temporal; **no prueba dos laptops en LAN ni persistencia**.
- Puedes demostrar logout o cambio de contraseña. Para recuperación supervisada, el flujo de emisión de código por ADMIN existe en `POST /api/v1/admin/password-resets` y el canje en React, pero **la interfaz ADMIN todavía no incluye un formulario para generar códigos**; no prometer una demostración de este paso desde la pantalla hasta que se agregue.
- El antiguo dashboard de heartbeat está conservado en `http://127.0.0.1:8000/`, y la documentación interactiva HTTP en `http://127.0.0.1:8000/docs`.
- La cabecera de la SPA contiene la advertencia visible: **SIMULACIÓN LOCAL · datos temporales en memoria · SIN PostgreSQL · NO ES UN LOGIN PRODUCTIVO**.
- Nunca ingresar claves reales ni exponer este servidor de demo a Internet. No usar `--host 0.0.0.0` ni cambiar el host fijado.

## Solución de fallos comunes

| Síntoma | Qué revisar |
| --- | --- |
| `git clone` dice destino existente | No repetir; usar otra carpeta o inspeccionar la copia existente |
| Error de `git merge` | No borrar archivos; compartir salida exacta y `git status -sb` |
| `node` o `npm` no existe | Instalar Node compatible desde el sitio oficial |
| `npm ci` falla | Internet, Node compatible y archivo `package-lock.json` |
| Se ve «Frontend aún no está compilado» | Falta `cd web; npm ci; npm run build`, y reiniciar servidor |
| `WinError 10048` o puerto 8000 ocupado | Detener Uvicorn anterior con `Ctrl + C` en su terminal |
| Login rechaza la contraseña | Usar las **nuevas** claves impresas en la consola al arrancar; son distintas en cada ejecución |
| Login devuelve 503 | Se arrancó `app.main:app` en vez de `app.local_demo`, o se usa otra versión/puerto |
| Error inesperado al cambiar sesión | Probar perfil normal vs incógnito para cookies independientes; compartir error HTTP |
| Al reiniciar desaparecen cuentas/sesiones | Es el comportamiento **previsto** por almacenamiento temporal; falta PostgreSQL |

## ¿Qué se puede demostrar solo desde GitHub o el celular?

- [PR #14 Backend](https://github.com/maorusohh/soporte-redes-unefa/pull/14): revisar **Files changed**, `app/auth/router.py`, `app/auth/repository.py` y pruebas.
- [PR #15 Frontend](https://github.com/maorusohh/soporte-redes-unefa/pull/15): código React, pantallas y capturas. **Las capturas con mock están etiquetadas como simuladas**, no son login productivo.
- [GitHub Actions del repositorio](https://github.com/maorusohh/soporte-redes-unefa/actions): resultados de CI, sin suponer que los tests cubren PostgreSQL o React cuando el workflow solo ejecuta Python.
- [Issue #8 seguimiento](https://github.com/maorusohh/soporte-redes-unefa/issues/8): pendientes y evidencias.
- **GitHub no aloja ni ejecuta la API FastAPI ni PostgreSQL por simplemente visitar el repositorio.** GitHub Pages, en caso de configurarse, solo publicaría contenido estático y no daría login real. La demo local de esta guía solo es accesible desde el ordenador anfitrión (localhost); **no desde el teléfono**.

## Qué decir con exactitud

> Ya tenemos el Backend con nueve endpoints HTTP y el Frontend React de Joiber. Las pruebas automatizadas comprobaron las reglas usando almacenamiento de prueba. Para visualizar el funcionamiento antes de integrar PostgreSQL, habilitamos una simulación LOCAL y explícita con dos cuentas ficticias, datos que se borran al reiniciar. Esto demuestra la comunicación entre pantallas y API, pero no equivale al sistema completo multiusuario persistente. PostgreSQL y las pruebas LAN reales son el siguiente checkpoint.

No atribuir persistencia ni funciones de monitoreo CPU/RAM a esta demo.

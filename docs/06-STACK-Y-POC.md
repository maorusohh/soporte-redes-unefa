# 06. Preselección tecnológica y primer incremento demostrable

**Estado:** propuesta del responsable técnico, **pendiente de revisión y ratificación del equipo**. No equivale a requisito oficial de las profesoras ni modifica por sí sola las decisiones pendientes de `03-DECISIONES.md`.

## Stack propuesto para el producto académico

- **Cliente web definitivo:** HTML5, CSS3, JavaScript sin framework obligatorio al inicio. Puede evolucionar solo si hay justificación y capacidad del equipo.
- **API y lógica de servidor:** Python 3.13 + FastAPI, ejecutado mediante Uvicorn. Comunicación HTTP/JSON sobre TCP/IP; evaluar WebSocket únicamente si existe un caso de uso real.
- **Persistencia objetivo:** PostgreSQL (versión soportada disponible), con modelado relacional, migraciones y reglas de integridad por diseñar con el integrante responsable de Base de Datos. No imponer su instalación en cada laptop cliente.
- **Validación:** pytest para código Python; posteriormente pruebas de integración, concurrencia y red, con evidencias reales y CI en GitHub Actions.
- **Colaboración:** GitHub Issues, branches por tarea, Pull Requests y revisión cruzada conforme a CONTRIBUTING.md.

Motivos: reutiliza conocimientos existentes, reduce carga en laptops antiguas, conserva capacidad de demostración sin nube y diferencia claramente clientes, servidor y base de datos.

## POC-001, separada del producto final

La carpeta [`prototype/`](../prototype/README.md) prueba únicamente que varios procesos de prueba puedan enviar un heartbeat con `device_id` ficticio y que un servidor registre su última recepción y calcule `online/offline` por timeout. Incluye una vista de inspección mínima **que no sustituye al Frontend asignado a otro integrante**.

No utiliza PostgreSQL ni guarda datos permanentemente. No hay autenticación; por ello se ejecuta en localhost por defecto y se restringen las pruebas LAN a equipos propios autorizados.

**Tarea:** [Issue #2](https://github.com/maorusohh/soporte-redes-unefa/issues/2). La POC no satisface por sí sola los requisitos de Sistemas Avanzados de Bases de Datos; hace visible un primer componente verificable de Teleprocesos.

## Pendientes antes de convertirlo en stack aprobado

- Contrastar las consignas de ambas profesoras y el sistema operativo de las laptops disponibles.
- Recibir observaciones de los cuatro integrantes y registrar la decisión en `03-DECISIONES.md`.
- Definir esquema de datos, contratos API, identidad/permisos, mecanismo de monitoreo permitido y métricas de calidad.
- Diseñar una primera funcionalidad integrada persistente sin reusar automáticamente el registro en memoria de esta POC.

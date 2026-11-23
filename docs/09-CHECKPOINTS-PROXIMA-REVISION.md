# 09. Checkpoints para la próxima revisión — login y multiusuario

**Fecha de preparación:** 21/11/2026. **Ventana comunicada:** semana del 23 al 29/11/2026, **día de evaluación por confirmar**. El alcance P0 es ambicioso; si no se logra probar algún punto, se declarará pendiente con evidencia.

## Responsabilidades comunicadas por Mauricio

| Persona | Área | Usuario GitHub comunicado | Primer compromiso |
| --- | --- | --- | --- |
| Mauricio | Backend/Teleprocesos, coordinación y revisión transversal | maorusohh | [AUTH #9](https://github.com/maorusohh/soporte-redes-unefa/issues/9), integración y presentación |
| Joiber | Frontend | JBRKLL007 | [FRONT #10](https://github.com/maorusohh/soporte-redes-unefa/issues/10), formularios reales |
| Yosward | Base de Datos | **Pendiente de informar** | [DATA #11](https://github.com/maorusohh/soporte-redes-unefa/issues/11), PostgreSQL/DDL/migraciones |
| Nessler | Tester/QA, requisitos y validación | NESSLERJB | [QA #12](https://github.com/maorusohh/soporte-redes-unefa/issues/12), casos/ejecución de pruebas |

**Estado:** roles comunicados por coordinación; no equivale a aceptación individual ni a invitaciones ya aceptadas. Revisión técnica transversal a cargo de Mauricio, asistido por IA; Nessler ejecuta QA con evidencia verificable. Las IA no reemplazan responsables humanos, no se atribuyen revisiones sin participación real.

## CP-0 — Confirmar base compartida
- [ ] Revisar [PR #1](https://github.com/maorusohh/soporte-redes-unefa/pull/1) y fusionar a main por una persona autorizada una vez aprobado.
- [ ] Después redirigir [PR #3](https://github.com/maorusohh/soporte-redes-unefa/pull/3) a main, revisar, fusionar solo si cumple.
- [ ] Invitar en GitHub a JBRKLL007 y NESSLERJB, comprobar aceptación; después invitar al responsable de BD cuando informe su username.
- [ ] Confirmar responsables, objetivos mínimos y contrato API de auth; publicar acuerdo de equipo.

## CP-1 — Persistencia/Backend
- [ ] Crear esquema PostgreSQL versionado para usuarios, sesiones y recuperación.
- [ ] Provisionar ADMIN sin contraseña hardcoded; alta de USER autorizada.
- [ ] Login real, /me, logout, roles y respuestas 401/403.
- [ ] Cambio de contraseña y recuperación supervisada de un solo uso.
- [ ] Pruebas de seguridad, revocación y persistencia de autenticación; no romper POC existente.

## CP-2 — Frontend y QA
- [ ] Joiber integra login, logout, perfil, cambio de clave y recuperación con API real.
- [ ] Nessler documenta y ejecuta pruebas de flujos, invalidación de tokens, roles y errores.
- [ ] Dos perfiles de navegador/usuarios con sesiones separadas y datos centralizados. Probar entre laptops en LAN propia **si los recursos están disponibles**.

## CP-3 — Evidencia para la profesora
- [ ] Capturas depuradas (sin contraseñas), comandos de ejecución, commits y resultados registrados.
- [ ] Mostrar ADMIN y USER iniciando sesión independientemente.
- [ ] Mostrar que USER no puede crear cuentas (403 del servidor).
- [ ] Mostrar logout y recuperación sin depender de correo externo.
- [ ] Mostrar persistencia tras reinicio y dos sesiones simultáneas.
- [ ] Explicar que CPU/RAM/disco, inventario completo, incidencias y reportes siguen en P1.

## Camino crítico y contingencias

1. Confirmar PostgreSQL disponible en la laptop-servidor y crear migración básica.
2. API y tests primero; Joiber puede trabajar con contrato, pero no declarar integración hasta que reciba respuestas reales.
3. Montar pantallas con navegador y probar juntos en localhost; después ensayar Wi-Fi/Ethernet propio.
4. Si otro integrante no entrega su módulo, registrar bloqueo y completar una implementación mínima de contingencia en tarea/PR transparente; **no atribuirle código no realizado**.
5. La presentación académica debe mostrar únicamente funcionalidades realmente ejecutadas. El POC heartbeat ya está validado por tests, pero auth y PostgreSQL aún están pendientes al redactar este plan.

## Definición de terminado para la revisión

Se considera terminado solo cuando existen PR revisados, prueba funcional completa con DB, roles y recuperación sin servicios externos, evidencia de verificación en Windows y explicación coherente. Una pantalla estática de login o datos hardcoded no cumplen.

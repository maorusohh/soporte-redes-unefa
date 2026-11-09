# 02. Arquitectura conceptual

## Estado y alcance

El objetivo confirmado es una aplicación multiusuario cliente-servidor para incidencias y monitoreo de equipos, con comunicación TCP/IP. La siguiente distribución interna es una **propuesta conceptual** para discutir; no representa componentes implementados ni fija un stack, un protocolo de aplicación o un modelo de datos.

Consulta [requisitos](01-REQUISITOS.md) y [decisiones](03-DECISIONES.md) antes de convertir una propuesta en una tarea de implementación.

## Vista conceptual propuesta

```text
Clientes en laptops propias
            |
       LAN propia
  Comunicación sobre TCP/IP
            |
Servidor de aplicación
  - Atención de solicitudes y validación
  - Coordinación de incidencias y usuarios
  - Coordinación del monitoreo autorizado
  - Acceso a persistencia y reportes
            |
Persistencia lógica del servidor
```

Se propone centralizar las reglas compartidas en el servidor y evitar que los clientes accedan directamente a la persistencia. La persistencia puede compartir una laptop con el servidor durante una futura demostración, sujeto a la evaluación de recursos. No se presupone un servidor físico dedicado, una nube, un navegador ni una aplicación de escritorio.

Los equipos que sean objeto de monitoreo son destinos autorizados de la LAN propia; no se confunden con el repositorio ni con infraestructura institucional. Pueden coincidir con laptops cliente si sus propietarios lo autorizan y el mecanismo elegido lo permite.

## Módulos lógicos previstos, sujetos a aprobación de alcance

| Módulo conceptual | Responsabilidad propuesta | Límite o decisión pendiente |
| --- | --- | --- |
| Interfaz cliente | Presentar información y enviar solicitudes del usuario. | Tipo de cliente y herramientas sin elegir; no implementar frontend todavía. |
| Comunicación | Intercambiar solicitudes, respuestas y errores entre cliente y servidor. | Protocolo, transporte concreto, formato, validación de mensajes y protección del canal por definir. |
| Identidad y permisos | Aplicar las capacidades propuestas de usuarios, sesiones y permisos. | No hay login ni política de autenticación implementados; falta aprobar el alcance. |
| Incidencias | Coordinar el registro y seguimiento de incidencias. | Estados, reglas y operaciones mínimas por definir. |
| Inventario y monitoreo | Identificar equipos autorizados y obtener las observaciones acordadas. | No se presupone agente, escaneo de red, ICMP, SNMP ni otro mecanismo. |
| Persistencia y reportes | Guardar y consultar la información necesaria para las funciones aceptadas. | Modelo, motor, integridad, concurrencia y reportes por definir con los requisitos de la asignatura. |

## Comunicación y varios usuarios

Wi-Fi y Ethernet son alternativas de conexión a la misma clase de LAN; no definen el protocolo de aplicación. Usar TCP/IP no decide entre sockets directos o un protocolo de mayor nivel. Esa elección requiere justificar compatibilidad, complejidad y evidencias académicas.

Antes de implementar se deberá acordar un contrato de comunicación: operaciones, campos, respuestas, errores, límites de mensajes, identificación de solicitudes y comportamiento ante pérdida de conexión. También habrá que definir qué ocurre si dos usuarios modifican la misma incidencia. No se ha elegido aún un mecanismo de concurrencia ni un número mínimo de clientes simultáneos.

## Límites y seguridad

- La arquitectura no autoriza conexiones a equipos institucionales ni a equipos de terceros.
- El monitoreo futuro se limitará a una lista explícita de equipos propios autorizados; no se presupone permiso para explorar toda una subred.
- Los clientes no deben recibir credenciales de administración de infraestructura ni de persistencia. El diseño detallado de credenciales, validación y permisos requiere una tarea posterior.
- No se decide exposición a Internet, despliegue institucional, acceso remoto público ni operación en producción.
- Este documento no crea directorios de código, dependencias, esquemas, servidores ni pruebas funcionales.

## Próxima validación de diseño

Contrastar el reparto de responsabilidades con ambas consignas, evaluar los recursos propios y registrar una propuesta de stack y contrato. Solo después de su aprobación documentada y de crear tareas verificables se podrá implementar una primera integración. La [estrategia LAN](05-DEMOSTRACION-LAN.md) describe cómo preparar el escenario, no una instalación ya realizada.

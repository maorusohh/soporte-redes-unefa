# 05. Estrategia preliminar de demostración LAN

## Propósito y límites

Se propone demostrar la futura comunicación cliente-servidor y las funcionalidades que se aprueben utilizando computadoras personales del grupo en una LAN propia. La UNEFANB, Extensión Santa Teresa del Tuy, es una referencia académica; no se autoriza intervenir equipos, redes, cuentas ni servicios institucionales.

Este documento es una estrategia preliminar: no hay aplicación implementada, ensayos ejecutados ni resultados de conectividad registrados. La presentación está prevista para febrero de 2027, pendiente de confirmación formal. Los criterios finales dependen de las consignas de ambas profesoras.

## Topología propuesta y recursos por confirmar

Una laptop podría alojar el servidor de aplicación y, si el diseño y sus recursos lo permiten, la persistencia. Otras laptops actuarían como clientes. Para observar comunicación entre máquinas se propone contar con al menos dos equipos físicos propios; la cantidad de clientes simultáneos exigida debe confirmarse. No se asignan máquinas ni personas todavía.

Antes del ensayo, inventariar recursos propios: laptops y sistemas operativos, alimentación, adaptadores de red, cables y router, punto de acceso o switch disponibles. No se presume que el grupo ya tenga todo ese material ni se requiere usar equipos institucionales para suplir faltantes.

## Alternativa Wi-Fi

- Conectar las laptops a un router o punto de acceso propio y autorizado por su propietario. Un hotspot de una laptop puede evaluarse si el sistema operativo permite comunicación entre clientes.
- Verificar en el equipo propio la red seleccionada y que no exista aislamiento entre los clientes participantes. No alterar redes ajenas para conseguir conectividad.
- Consultar localmente la dirección LAN del servidor y acordar cómo la conocerán los clientes. El método de asignación de direcciones y el puerto de la aplicación se definirán al elegir el stack.
- Comprobar, durante el futuro ensayo, una solicitud real desde otra laptop y su respuesta. Un indicador de Wi-Fi conectado o un ping aislado no demuestra que funcione la aplicación.

## Alternativa Ethernet

- Usar cables y un switch o router propio autorizado. Confirmar adaptadores Ethernet en las laptops que lo necesiten.
- Acordar una misma LAN para los participantes y verificar direcciones y conectividad. La conexión directa entre dos laptops solo se considerará si sus adaptadores y configuración lo permiten; no sustituye automáticamente un ensayo multiusuario.
- Utilizar el mismo guion funcional acordado para Wi-Fi y registrar las diferencias observadas. No suponer que ambas alternativas funcionaron porque una de ellas lo hizo.

En ambas alternativas la estrategia busca no depender de Internet durante la demostración. Las dependencias externas y la viabilidad de trabajar sin Internet se evaluarán después de elegir el diseño; no se presentan como capacidades ya comprobadas.

## Preparación segura del ensayo futuro

1. Crear una tarea verificable con versión o commit, criterios de aceptación y responsables acordados. Confirmar permiso de cada propietario y registrar qué equipos concretos participarán sin publicar identificadores sensibles.
2. Usar cuentas y datos sintéticos. Configurar secretos fuera de Git y no incluir contraseñas del Wi-Fi, tokens, direcciones reales, MAC, números de serie ni información personal en capturas públicas.
3. Configurar el servicio, cuando exista, para la interfaz de la LAN propia. Una aplicación enlazada únicamente a loopback no estará disponible desde otra laptop. No abrir puertos hacia Internet ni usar reenvío de puertos público.
4. Si hace falta una regla de firewall, limitarla al servicio y equipos autorizados. No desactivar el firewall globalmente; retirar las reglas temporales al terminar.
5. Para monitoreo, usar una lista explícita de equipos propios autorizados y el mecanismo aprobado. No explorar subredes completas ni interpretar la conexión a una LAN como permiso general de monitoreo.

## Guion propuesto, sujeto a aprobación del alcance

| Paso futuro | Evidencia que se buscará | Estado actual |
| --- | --- | --- |
| Iniciar servidor y clientes en laptops diferentes. | Una solicitud de aplicación y respuesta observable desde otro equipo. | No ejecutado; requiere implementación. |
| Realizar una operación mínima de incidencia acordada. | Resultado visible y persistencia comprobada según el diseño aceptado. | Propuesta; alcance por confirmar. |
| Interactuar desde varios clientes. | Resultado observable según la regla de concurrencia acordada. | Propuesta; cantidad y regla pendientes. |
| Consultar un equipo propio autorizado. | Observación real del mecanismo de monitoreo aprobado y tratamiento de un equipo no disponible. | Propuesta; mecanismo pendiente. |
| Ensayar una desconexión controlada de un equipo propio. | Comportamiento definido y observado, sin inventar recuperación automática. | Propuesta; criterio pendiente. |
| Repetir el guion en Wi-Fi y Ethernet cuando haya recursos. | Registro independiente de cada alternativa, con fallos y limitaciones. | No ejecutado; recursos por confirmar. |

Solo se incluirán autenticación, permisos o reportes si esas funciones se aprueban e implementan en tareas posteriores. El guion definitivo deberá enlazar requisitos confirmados y sus criterios de aceptación.

## Registro y contingencia

En cada ensayo registrar fecha real, commit, topología con identificadores ficticios, escenario, resultado esperado, resultado observado y evidencia depurada de información sensible. Distinguir aprobado, fallido y no ejecutado. No completar esta evidencia por anticipado.

Si Wi-Fi falla, considerar Ethernet propio cuando esté disponible; si fallan las dos opciones, registrar el bloqueo. Una simulación en una sola laptop puede ayudar al diagnóstico, pero no acredita una demostración LAN entre equipos. Capturas o grabaciones de ensayos reales solo servirán como alternativa de presentación si las profesoras lo aceptan; no reemplazan silenciosamente la demostración requerida.

Al terminar, detener los servicios de prueba y retirar accesos o reglas temporales. Los recursos, el guion y los criterios que siguen pendientes se recogen en [03-DECISIONES.md](03-DECISIONES.md).

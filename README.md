# HDcredit1.2

Sistema de control de pagos quincenal HD Crédit — PWA de archivo único (`index.html`), con sincronización opcional en Firebase/Firestore o almacenamiento solo local.

## Sincronización sin inicio de sesión

Por decisión explícita del dueño de los datos, esta app **ya no pide iniciar sesión con Google**. Todos los dispositivos leen y escriben la misma ruta compartida en Firestore (`usuarios/compartido/...`), protegida únicamente por las reglas del proyecto — no hay control de acceso por cuenta.

**Importante:** con esto, cualquier persona que conozca la configuración de Firebase de este proyecto puede leer y editar los datos. Se optó por esto deliberadamente para evitar los problemas de inicio de sesión (antivirus bloqueando el dominio de Firebase en PC, ventanas emergentes que no completaban el login en el celular). El código de Firebase Authentication (Google Sign-In) fue eliminado por completo del proyecto — no queda ningún rastro de esa integración.

## Modo offline

La app funciona normalmente sin internet: lee la última copia conocida de los datos guardada en el dispositivo. Los cobros que se registren sin conexión se guardan en cola y se suben solos en cuanto vuelve la señal, sin que haya que hacer nada manualmente (persistencia offline nativa de Firestore).

## Correcciones incluidas en esta actualización

- Se activó la persistencia offline de Firestore — la app sigue funcionando sin internet y sincroniza sola al recuperar la señal.
- Se redujo el riesgo de que dos dispositivos cobrando casi al mismo tiempo se pisen el registro de pagos entre sí.
- Corregido un hueco de seguridad (XSS) en el tooltip de fecha de inicio de la tabla de Acreditados.
- El respaldo automático ahora incluye el historial de pagos, no solo los acreditados.
- El indicador de sincronización ahora refleja el estado real de conexión con Firestore, no solo si hay red en el dispositivo.
- Corregido: la app se quedaba cargando indefinidamente si la red iba lenta al cargar el SDK de Firebase (ahora carga en paralelo con límite de espera de 10s).
- Corregido: eliminar el último acreditado o movimiento sincronizado ya no dejaba la pantalla con datos obsoletos.
- Corregido: los campos del historial ahora se escapan al mostrarse (previene HTML/scripts inyectados).
- Corregido: el saldo y el estado de un acreditado se calculan en un solo lugar (`resumenCliente()`), en vez de recalcularse de forma distinta en Reporte Personal y Estado de Cuenta.
- Corregido: los cobros y guardados que fallan en la nube ahora muestran un error real, en vez de un mensaje de éxito optimista.
- Corregido: reconectar Firebase ya no duplica la carga del SDK.

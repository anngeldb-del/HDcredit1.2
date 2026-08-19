# HDcredit1.2

Sistema de control de pagos quincenal HD Crédit — PWA de archivo único (`index.html`), con sincronización opcional en Firebase/Firestore o almacenamiento solo local.

## Sincronización sin inicio de sesión

Por decisión explícita del dueño de los datos, esta app **no pide iniciar sesión con Google** ni muestra ninguna pantalla de login. Todos los dispositivos leen y escriben la misma ruta compartida en Firestore (`usuarios/compartido/...`). El código de Firebase Authentication con Google Sign-In (el que causaba pantallas congeladas por antivirus/popups bloqueados) sigue eliminado por completo.

### Autenticación anónima silenciosa (nuevo)

La app ahora inicia sesión anónima en Firebase (`signInAnonymously()`) en segundo plano, sin ninguna interacción del usuario — no hay ventana, ni botón, ni cuenta que crear. Esto permite exigir en las reglas de Firestore `allow read, write: if request.auth != null;` en vez de dejarlas completamente abiertas a cualquiera que conozca la configuración del proyecto.

Si la autenticación anónima falla o tarda (por ejemplo, si el proveedor "Anónimo" no está habilitado en el proyecto), la app **sigue funcionando exactamente igual que antes** — no bloquea nada, solo deja de cumplir el requisito de las reglas nuevas hasta que se resuelva.

**Para activar esta protección en un proyecto ya conectado (como el actual), hay que hacer dos pasos manuales en Firebase Console, en este orden:**
1. **Authentication → Sign-in method → habilitar el proveedor "Anónimo".** Con este código ya desplegado, esto basta para que los dispositivos empiecen a autenticarse solos.
2. **Confirmar que aparecen usuarios anónimos** en Authentication → Users (uno por dispositivo/navegador) antes de seguir.
3. Recién entonces, **Firestore → Reglas** → cambiar `allow read, write: if true;` por `allow read, write: if request.auth != null;`. Hacerlo antes de confirmar el paso 2 dejaría la app sin poder sincronizar.

Mientras no se den estos pasos en la consola, las reglas siguen abiertas (`if true`) y todo sigue funcionando como hasta ahora — el cambio de código por sí solo no rompe nada, pero tampoco protege nada hasta que se actualicen las reglas.

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
- Corregido: el Historial (y los reportes, respaldo JSON y Excel que dependen de él) ya no perdía de vista los pagos más antiguos al superar los 500 registros — se quitó el límite fijo de la consulta a Firestore, así que ahora se sincroniza el historial completo.

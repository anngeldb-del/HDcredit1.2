# HDcredit1.2

Sistema de control de pagos quincenal HD Crédit — PWA de archivo único (`index.html`), con sincronización opcional en Firebase/Firestore o almacenamiento solo local.

## Sincronización sin inicio de sesión

Por decisión explícita del dueño de los datos, esta app **ya no pide iniciar sesión con Google**. Todos los dispositivos leen y escriben la misma ruta compartida en Firestore (`usuarios/compartido/...`), protegida únicamente por las reglas del proyecto — no hay control de acceso por cuenta.

**Importante:** con esto, cualquier persona que conozca la configuración de Firebase de este proyecto puede leer y editar los datos. Se optó por esto deliberadamente para evitar los problemas de inicio de sesión (antivirus bloqueando el dominio de Firebase en PC, ventanas emergentes que no completaban el login en el celular). Si en algún momento se quiere recuperar la protección por cuenta, se puede reactivar el flujo de login que ya existía antes de este cambio.

### Si vienes de una versión anterior con login obligatorio

Tus datos actuales viven en `usuarios/{tu-uid-de-Google}/...`. Sigue este orden para no perder nada:

1. **Abre `migrar-compartido.html`** en el mismo navegador donde ya usabas la app (para que cargue tu configuración de Firebase guardada).
2. **Inicia sesión con la misma cuenta de Google** que usabas antes.
3. Pulsa **"Copiar mis datos a modo sin login"**. Copia (no borra el original) tus acreditados e historial a la ruta compartida `usuarios/compartido/...`.
4. En Firebase Console → tu proyecto → **Firestore Database → Reglas**, pega las reglas abiertas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Abre `index.html` normalmente — ya no pedirá iniciar sesión, en ningún dispositivo.

## Correcciones incluidas en esta actualización

- Se quitó el inicio de sesión obligatorio (ver arriba) — decisión explícita para evitar bloqueos de login en algunos dispositivos/redes.
- Corregido: la app se quedaba cargando indefinidamente si la red iba lenta al cargar el SDK de Firebase (ahora carga en paralelo con límite de espera de 10s).
- Corregido: eliminar el último acreditado o movimiento sincronizado ya no dejaba la pantalla con datos obsoletos.
- Corregido: los campos del historial ahora se escapan al mostrarse (previene HTML/scripts inyectados).
- Corregido: el saldo y el estado de un acreditado se calculan en un solo lugar (`resumenCliente()`), en vez de recalcularse de forma distinta en Reporte Personal y Estado de Cuenta.
- Corregido: los cobros y guardados que fallan en la nube ahora muestran un error real, en vez de un mensaje de éxito optimista.
- Corregido: reconectar Firebase ya no duplica la carga del SDK.

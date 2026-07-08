# HDcredit1.2

Sistema de control de pagos quincenal HD Crédit — PWA de archivo único (`index.html`), con sincronización opcional en Firebase/Firestore o almacenamiento solo local.

## Seguridad — inicio de sesión obligatorio con Firebase

A partir de esta actualización, la sincronización en la nube requiere iniciar sesión con Google. Antes, las reglas de Firestore recomendadas dejaban la base de datos abierta a cualquiera en internet (`allow read, write: if true`); ahora cada acreditado y cada movimiento quedan protegidos por cuenta (`usuarios/{uid}/...`).

**Si nunca has usado Firebase con esta app (instalación nueva):** sigue los pasos que aparecen en la propia pantalla de configuración inicial de la app (botón "Firebase" en el menú). Ya incluyen crear el proyecto, habilitar el proveedor Google en Authentication, y pegar las reglas correctas.

**Si ya usabas HD Crédit conectado a Firebase antes de esta actualización**, tus datos siguen en las colecciones antiguas (`/clientes`, `/historial`, sin dueño). Sigue este orden exacto para no perder nada:

### 1. Habilita el inicio de sesión con Google
En Firebase Console → tu proyecto → **Authentication** → pestaña **Sign-in method** → habilita **Google**.

### 2. Aplica las reglas de TRANSICIÓN
En Firestore → **Reglas**, pega temporalmente:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clientes/{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    match /historial/{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    match /usuarios/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Esto permite leer (no escribir) las colecciones antiguas mientras migras, y protege ya la nueva ruta por cuenta.

### 3. Abre la app principal e inicia sesión
Abre `index.html`, inicia sesión con tu cuenta de Google. Verás la app vacía — es normal, tus datos aún están en la ruta antigua.

### 4. Ejecuta la migración una sola vez
Abre `migrar.html` en el mismo navegador, inicia sesión con la **misma cuenta de Google**, y pulsa **Iniciar migración**. Copia tus acreditados e historial a `usuarios/{tu-uid}/...` conservando los mismos IDs (no rompe las referencias entre historial y acreditados).

### 5. Verifica
Vuelve a `index.html` y confirma que tu cartera completa aparece correctamente (acreditados, saldos, historial).

### 6. Cierra las colecciones antiguas
Una vez verificado, reemplaza las reglas por las **finales**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clientes/{document=**} { allow read, write: if false; }
    match /historial/{document=**} { allow read, write: if false; }
    match /usuarios/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Estos son los mismos pasos manuales en Firebase Console que no se pueden aplicar desde el código — solo tú, con acceso a tu proyecto, puedes ejecutarlos.

## Correcciones incluidas en esta actualización

- Autenticación con Google + reglas de Firestore por cuenta (ver arriba).
- Corregido: eliminar el último acreditado o movimiento sincronizado ya no dejaba la pantalla con datos obsoletos.
- Corregido: los campos del historial ahora se escapan al mostrarse (previene HTML/scripts inyectados).
- Corregido: el saldo y el estado de un acreditado se calculan en un solo lugar (`resumenCliente()`), en vez de recalcularse de forma distinta en Reporte Personal y Estado de Cuenta.
- Corregido: los cobros y guardados que fallan en la nube ahora muestran un error real, en vez de un mensaje de éxito optimista.
- Corregido: reconectar Firebase ya no duplica la carga del SDK.

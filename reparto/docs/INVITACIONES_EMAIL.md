# Invitaciones por correo real

La app puede encolar correos en Firestore. Un servicio de Firebase los envía por ti.

## Opción recomendada: extensión **Trigger Email**

1. En [Firebase Console](https://console.firebase.google.com) → **Extensions** → instala **Trigger Email from Firestore**.
2. Configura un proveedor SMTP (SendGrid, Mailgun, o SMTP de Gmail con contraseña de app).
3. Indica la colección `mail` (es la que usa la app).
4. Despliega las reglas de `firestore.rules` (incluyen `match /mail/{mailId}`).

Cuando alguien toca **Agregar** en *Mi hogar y familia*, la app escribe un documento en `mail` con:

- `to`: correo del invitado
- `message.subject`, `message.text`, `message.html`

La extensión lo envía automáticamente.

## Probar que funciona

1. Invita un Gmail de prueba.
2. En Firestore → colección `mail` debe aparecer un documento nuevo.
3. Revisa bandeja y spam del invitado.

Si el documento se crea pero no llega el correo, el problema está en la configuración SMTP de la extensión.

## Sin extensión (manual)

Seguí usando **Copiar enlace**, **WhatsApp** o **Enviar correo** (abre tu cliente de correo con el texto listo).

## Reglas y deploy

```bash
firebase deploy --only firestore:rules
```

Publicá también la web en Netlify para que Patricia use la versión nueva del onboarding.

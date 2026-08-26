# Publicar A la PaR con Google, hogares y familias

Esta versión ya no usa una lista global de dos emails. Cualquier persona puede
ingresar con Google, completar su perfil, crear su hogar y dar acceso a su
familia desde **Mi hogar**.

## 1. Firebase

1. Creá un proyecto en <https://console.firebase.google.com>.
2. Registrá una app web con apodo `A la PaR`.
3. En **Authentication → Sign-in method**, activá **Google**.
4. En **Firestore Database**, creá la base en modo producción.
5. En la pestaña **Rules**, pegá el contenido completo de `firestore.rules` y
   publicalo.

Las reglas separan:

- `users/{uid}`: perfil privado del usuario.
- `households/{id}`: owner, plan y familia autorizada.
- `households/{id}/state/main`: información compartida del hogar.
- `households/{id}/private/{uid}`: espacios y gastos que solo puede leer ese UID.

No crees colecciones a mano: la aplicación lo hace en el primer ingreso.

## 2. Variables de Netlify

En **Site configuration → Environment variables**, agregá:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Ya no existe `VITE_ALLOWED_EMAILS`.

## 3. Build de Netlify

- Base directory: `reparto`
- Build command: `npm run build`
- Publish directory: `dist`

Después del deploy, agregá el dominio `*.netlify.app` en:

**Firebase → Authentication → Settings → Authorized domains**

## 4. Primer ingreso

1. Entrá con Google.
2. Completá nombre, apellido y teléfono.
3. La app crea **Mi hogar** y agrega tu perfil como primera persona.
4. En **Mi hogar**, el owner agrega emails de familiares.
5. La app genera un enlace para copiar y enviar.
6. El familiar abre el enlace y entra con el mismo Google autorizado.
7. Si es su primera vez, completa su perfil; si ya tenía cuenta, entra directo.

El link por sí solo no da acceso. El email debe haber sido autorizado por el
owner. Actualmente un integrante ve todos los espacios compartidos del hogar;
los espacios personales y gastos personales siguen siendo privados. Para
compartir solo espacios seleccionados hace falta el siguiente nivel de permisos:
rol `guest` + documentos/reglas Firestore por espacio.

## 5. Planes

La estructura incluye planes Personal, Familia y Plus con límites de personas,
espacios, gastos y funciones. El cobro todavía no está conectado: antes de
vender suscripciones hay que integrar Stripe o Mercado Pago mediante un backend
seguro (Cloud Functions/webhooks). Los límites visibles ya están centralizados
en `src/lib/plans.ts`.

## Checklist

- [ ] Google Sign-In activado
- [ ] Firestore creado
- [ ] Reglas nuevas publicadas
- [ ] Variables `VITE_FIREBASE_*` en Netlify
- [ ] Dominio Netlify autorizado en Firebase
- [ ] Primer usuario crea perfil y hogar
- [ ] Owner agrega un familiar y ese familiar puede ingresar
- [ ] Un usuario no invitado no puede leer ese hogar


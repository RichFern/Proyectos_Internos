# Publicar Reparto 100% privado con Google

Esta guía es para personas no técnicas. Al terminar:

- La app estará en internet (HTTPS) para instalarla en el teléfono
- **Solo** entran los Gmail que vos listes (ej. el tuyo y el de tu pareja)
- Quien tenga el link pero **no** esté autorizado **no puede** ver ni guardar gastos
- Los datos se sincronizan entre esos teléfonos (Firebase)

> Nadie puede darte “seguridad absoluta” contra un atacante de nivel estatal.  
> Esto sí bloquea a conocidos, links filtrados y gente random: **Auth de Google + reglas en el servidor**.

---

## Qué vas a usar (gratis)

1. **Firebase** (Google) — login y base de datos  
2. **Netlify** o **Vercel** — publicar la web  
3. Tus **2 emails de Gmail** (o Google Workspace)

Tiempo estimado: 20–40 minutos la primera vez.

---

## Paso 1 — Proyecto Firebase

1. Entrá a [https://console.firebase.google.com](https://console.firebase.google.com) con **tu** Google.
2. **Agregar proyecto** → nombre `reparto-privado` (o similar) → continuar.  
   Podés desactivar Google Analytics si no te interesa.
3. Cuando esté listo, tocá **Continuar**.

### 1.1 App web

1. En la portada del proyecto, tocá el ícono **Web** `</>`.
2. Apodo: `Reparto`.
3. **No** marques “Firebase Hosting” todavía (vamos a usar Netlify/Vercel).
4. Registrá la app.
5. Te muestra un objeto `firebaseConfig` con `apiKey`, `authDomain`, etc.  
   **Dejá esa pestaña abierta** (los vas a copiar al `.env`).

### 1.2 Login con Google

1. Menú izquierdo → **Build** → **Authentication** → **Comenzar**.
2. Pestaña **Sign-in method** → **Google** → Activar → elegir tu email de soporte → Guardar.

### 1.3 Base de datos Firestore

1. **Build** → **Firestore Database** → **Crear base de datos**.
2. Modo: empezá en **producción**.
3. Elegí ubicación cercana (ej. `southamerica-east1`) → Activar.

### 1.4 Reglas (lo más importante)

1. Pestaña **Reglas**.
2. Abrí el archivo del repo `firestore.rules`.
3. Reemplazá `EMAIL_UNO@gmail.com` y `EMAIL_DOS@gmail.com` por **tus emails en minúsculas**.
4. Pegá todo en la consola → **Publicar**.

Sin esto, alguien con conocimientos técnicos podría intentar leer datos. Con las reglas, Firebase **rechaza** a cualquiera que no sea esos emails.

### 1.5 Dominios autorizados (después de publicar)

Cuando tengas la URL de Netlify/Vercel (ej. `https://reparto-xx.netlify.app`):

1. Authentication → Settings → **Authorized domains**
2. Agregá ese dominio (sin `https://`).

---

## Paso 2 — Configurar el código

En tu PC, en la carpeta `reparto`:

```bash
cp .env.example .env
```

Editá `.env`:

```env
VITE_ALLOWED_EMAILS=tu_email@gmail.com,pareja@gmail.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Los valores salen del `firebaseConfig` del paso 1.1.

Probar en local:

```bash
npm install
npm run dev
```

Deberías ver **Entrar con Google**. Probá con un email **no** autorizado: debe rechazarlo.

---

## Paso 3 — Publicar (Netlify, recomendado)

### Opción A — Arrastrar (más fácil)

1. En la carpeta `reparto`:

```bash
npm run build
```

2. Creá cuenta en [https://app.netlify.com](https://app.netlify.com)
3. **Sites** → **Add new site** → **Deploy manually**
4. Arrastrá la carpeta `reparto/dist`
5. Copiá la URL que te da (https://….netlify.app)

### Opción B — Conectado a GitHub

1. Netlify → Import from Git → este repo
2. Base directory: `reparto`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. En **Environment variables**, cargá las mismas del `.env` (todas las `VITE_…`)
6. Deploy

Luego agregá el dominio en Firebase Authorized domains (paso 1.5).

### Variables en Netlify

Site configuration → Environment variables → agregar cada `VITE_…` → Redeploy.

---

## Paso 4 — Instalar en los teléfonos

1. Abrí la URL https en Chrome (Android) o Safari (iPhone).
2. **Entrar con Google** (solo los emails de la lista).
3. **Instalar app** / Agregar a pantalla de inicio.
4. Listo: ícono como cualquier app.

---

## Cómo queda la seguridad

| Amenaza | Qué pasa |
|---|---|
| Alguien encuentra el link | Ve la pantalla de Google; sin email autorizado no entra |
| Email no listado inicia sesión | La app lo echa; Firestore también niega lectura/escritura |
| Intenta llamar a la API a mano | Las **reglas de Firestore** bloquean |
| Pierde el teléfono | Cerrar sesión de Google / cambiar clave de Google |
| Quiere backup extra | Privacidad → Descargar respaldo → Drive |

La `apiKey` de Firebase **no es una contraseña secreta**: está pensada para el navegador. La seguridad real son **Auth + reglas**.

---

## Agregar o sacar a alguien

1. Cambiá `VITE_ALLOWED_EMAILS` en Netlify (y redeploy).
2. Actualizá la lista en `firestore.rules` y **Publicá** las reglas.

Los dos lugares deben coincidir.

---

## Checklist final

- [ ] Google Sign-In activado  
- [ ] Firestore creado  
- [ ] Reglas publicadas con **tus** emails  
- [ ] `.env` / variables Netlify completas  
- [ ] Dominio autorizado en Firebase  
- [ ] Probaste un email **ajeno** → acceso denegado  
- [ ] Probaste tus 2 emails → entran y ven lo mismo  

Si querés, en el siguiente mensaje pegá (sin secretos) “ya creé el proyecto Firebase” y te guío click a click en Netlify con tu caso.

# Acceso, instalación y respaldo (guía simple)

Esta guía es para usar **A la PaR** en el teléfono/PC **sin que cualquiera entre**, y para **no perder** los gastos.

## Cómo está hoy (importante)

| Pregunta | Respuesta corta |
|---|---|
| ¿Dónde se guardan los gastos? | En **ese** teléfono o PC (navegador), o en Firebase si activaste el modo Google. |
| ¿Puede entrar un desconocido por internet? | Solo si publicás la web sin protección **y** le pasan el link. Con Google + emails autorizados, no. |
| ¿Se sincroniza solo entre dos teléfonos? | Sí, con Firebase (ver `PUBLICAR_PRIVADO_GOOGLE.md`). También podés pasar un **respaldo** `.json` por Drive. |
| ¿Sirve Google Drive? | Sí: guardás ahí el archivo de respaldo. |

---

## 1. Instalar como app

1. Abrí A la PaR en el navegador.
2. Tocá **Instalar app** (o en el menú: *Agregar a pantalla de inicio* / *Instalar*).
3. En Android usá Chrome; en iPhone, Safari.

Para instalarla “de verdad” en celulares de casa, la web tiene que estar publicada con **https** (gratis con Netlify o Vercel).

---

## 2. Que solo entren vos y quien vos quieras

### En el dispositivo (ya está en la app)

1. Abrí **Privacidad**.
2. Activá un **PIN** (mínimo 4 caracteres).
3. Decíselo **solo** a la persona de confianza.
4. Opcional: anotá nombres/emails en el campo de nota (“Ana y Luis”).

Cada vez que abran la app (nueva sesión), pide el PIN.

> El PIN protege el uso diario en ese aparato. No es un banco: alguien con mucho conocimiento técnico y acceso físico al teléfono podría intentar eludir bloqueos del navegador. Para uso familiar es una buena barrera.

### Si la publicás en internet

Pedí (o configurá) una de estas protecciones en el hosting:

- **Contraseña del sitio** (Netlify Password Protection / Vercel Password Protection): nadie ve la app sin esa clave.
- Más adelante: **entrar con Google** y lista de emails permitidos (sincronización en la nube). Eso se puede agregar cuando quieras; hace falta una cuenta gratis en Firebase.

---

## 3. Respaldo en Google Drive (recomendado)

Así no perdés datos si borrás el navegador o cambiás de teléfono, y podés pasarlos a la otra persona.

### Guardar (exportar)

1. En A la PaR → **Privacidad** → **Descargar respaldo**.
2. Se baja un archivo `.json` (ej. `reparto-respaldo-2026-08-25.json`).
3. Abrí **Google Drive** → carpeta (ej. `A la PaR privado`).
4. Subí el archivo.
5. Compartí la carpeta **solo** con el Gmail de tu pareja (permiso de lector o editor).

### Restaurar en el otro teléfono

1. En Drive, descargá el `.json` más reciente.
2. Abrí A la PaR en ese teléfono → **Privacidad** → **Restaurar desde archivo**.
3. Elegí el `.json`.
4. Confirmá. Los gastos quedan en ese dispositivo.

**Tip:** después de cargar varios gastos del mes, exportá de nuevo y reemplazá el archivo en Drive.

---

## 4. Rutina simple para dos personas

1. Uno carga gastos en su teléfono.
2. Exporta a Drive (carpeta compartida).
3. El otro restaura desde Drive cuando quiere actualizar.
4. Ambos usan el mismo PIN (o cada uno el suyo en su teléfono).

No es automático al instante, pero es **privado**, **gratis** y no requiere saber programar.

---

## 5. Lo que vendría después (si lo pedís)

- Entrar con **cuenta Google**.
- Lista de emails invitados (solo Ana y Luis).
- Sincronización automática en la nube (los dos ven lo mismo sin pasar archivos).

Eso usa Firebase (gratis para uso hogareño) y se puede implementar cuando quieras dar el siguiente paso.

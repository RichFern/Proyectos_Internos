# Administración de A la PaR

## Lo que administra cada familia

El owner entra en **Familia** (arriba a la derecha), **☰ → Mi hogar y familia**,
o el nombre del hogar debajo del logo:

1. autoriza el Gmail del familiar;
2. copia el enlace `/?join=...` y se lo envía;
3. esa persona entra con **ese mismo Google**.
4. puede quitar integrantes.

Cada usuario edita nombre, apellido y teléfono en **☰ → Ajustes**.

## Prueba privada (antes de vender planes)

Mientras no haya cobro, la app está cerrada:

1. En Netlify, `VITE_ALLOWED_EMAILS` con tu Gmail y el de las personas que
   autorices, separados por comas.
2. `VITE_ADMIN_EMAILS` también puede entrar (operadores). Las dos listas se
   juntan.
3. En producción, sin ninguna de las dos, nadie entra.
4. Opcional en Firestore: documento `config/allowlist` con campo `emails`
   (array). Si existe, las reglas también bloquean al resto.

Esas variables se graban **al publicar**. Si las cambiás en Netlify y no
redesplegás, la app vieja sigue sin ver el Gmail nuevo.

Para sumar a alguien: que esté en `VITE_ADMIN_EMAILS` o `VITE_ALLOWED_EMAILS`,
publicá, y después invitálo en **Familia** con **Agregar**.

## Planes

| Plan | Código `planTier` | Integrantes | Espacios | Gastos / espacio | Funciones |
|------|-------------------|-------------|----------|------------------|-----------|
| Personal | `personal` | 1 | 1 | 50 | Sin presupuestos, cuotas, exportar ni espacios personales |
| Familia | `family` | 3 | 3 | 500 | Presupuestos, cuotas, exportar y espacios personales |
| Plus | `plus` | 8 | 20 | 5000 | Todo Familia + multi-moneda (flag, todavía no implementado) |

Un hogar nuevo nace en **Familia**. Eso es a propósito: hasta que exista cobro,
no hace falta “modo demo” para usar la app.

### Cómo asignás vos el plan

Hay dos caminos, los dos válidos hasta conectar Stripe o Mercado Pago:

1. **Tu propio hogar (o uno del que seas miembro)**  
   Poné tu Gmail en `VITE_ADMIN_EMAILS` (Netlify y `.env` local). Entrá a
   **Mi hogar y familia** y tocá la tarjeta del plan. La app escribe
   `households/{id}.planTier`.

2. **Cualquier hogar de un cliente**  
   Firebase Console → Firestore → `households` → documento del hogar → campo
   `planTier` = `personal`, `family` o `plus`.  
   La consola usa privilegio de administrador y no pasa por la app.

Los integrantes normales ven los tres planes, pero no pueden cambiarlos desde
la interfaz. El cobro futuro debe escribir `planTier` con un webhook de backend,
no con un botón libre.

## Administración general de la plataforma

Hasta un panel interno, el operador usa Firebase Console:

- **Authentication → Users**: cuentas Google, bloqueo o eliminación;
- **Firestore → `users`**: perfiles;
- **Firestore → `households`**: hogares, owners, miembros y plan;
- **Firestore → `households/{id}/state/main`**: datos compartidos;
- **Firestore → `households/{id}/private/{uid}`**: datos privados (no editar salvo
  soporte excepcional).

## Demo vs producción

- **Producción** (Firebase configurado): Google obligatorio, hogar vacío, sin
  botón de datos de ejemplo.
- **Desarrollo local** (sin `.env` de Firebase): datos de ejemplo en el
  navegador, para diseñar y probar sin cuenta Google.

No hace falta dejar la app “en demo” hasta que alguien pague. El plan ya limita
personas, espacios y funciones. Cuando quieras vender, los hogares nuevos pueden
pasar a nacer en `personal` y el pago los sube a Familia o Plus.

## Panel super-admin futuro

Antes de vender membresías conviene un panel separado con Custom Claims
(`admin: true`) para buscar hogares, cambiar planes y atender soporte sin leer
gastos personales.

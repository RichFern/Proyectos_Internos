# Reparto

App para gestionar gastos compartidos del hogar, viajes o paseos.

## Qué hace

- **Espacios**: hogar, viaje, evento u otra cuenta compartida
- **Personas e ingresos**: cada integrante carga cuánto gana
- **Gastos por mes**: navegá mes a mes (ideal para el hogar)
- **Búsqueda**: encontrá un gasto por descripción, nota o quién pagó
- **Plantillas / repetir**: alquiler, luz, súper… con monto editable cada mes
- **Saldos**: cuánto pagó cada uno, cuánto le corresponde y quién le debe a quién
- **App instalable (PWA)**: en el teléfono y en la PC, sin App Store

Los datos se guardan en el navegador de ese dispositivo.

## Cómo correr (desarrollo)

```bash
cd reparto
npm install
npm run dev
```

Abrí la URL de Vite (por defecto `http://localhost:5173`).

```bash
npm run build
npm run preview
```

## Instalar como app (sin ser experto)

1. Abrí Reparto en el navegador (Chrome, Edge o Safari).
2. Tocá **Instalar app** en la barra superior, o:
   - **Android (Chrome):** menú ⋮ → *Instalar aplicación* / *Agregar a la pantalla de inicio*
   - **iPhone (Safari):** Compartir → *Agregar a pantalla de inicio*
   - **PC (Chrome/Edge):** ícono ⊕ en la barra de dirección → *Instalar Reparto*
3. Queda como una app: ícono en el escritorio o en el celular, se abre sola.

Para instalar de verdad en el teléfono necesitás publicar el sitio con **HTTPS** (por ejemplo Netlify, Vercel o GitHub Pages). En `localhost` también se puede probar.

## Stack

Vite + React + TypeScript + PWA. Sin backend.

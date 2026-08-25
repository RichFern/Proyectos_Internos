# Reparto

App para gestionar gastos compartidos del hogar, viajes o paseos.

## Qué hace

- **Espacios**: hogar, viaje, evento u otra cuenta compartida
- **Personas e ingresos**: cada integrante carga cuánto gana
- **Gastos**: descripción, categoría, monto, quién pagó y notas
- **Reparto**: en proporción al ingreso o en partes iguales
- **Saldos**: cuánto pagó cada uno, cuánto le corresponde y quién le debe a quién

Los datos se guardan en el navegador (`localStorage`).

## Cómo correr

```bash
cd reparto
npm install
npm run dev
```

Abrí la URL que muestra Vite (por defecto `http://localhost:5173`).

```bash
npm run build
npm run preview
```

## Stack

Vite + React + TypeScript. Sin backend.

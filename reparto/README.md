# A la PaR

Gastos compartidos del hogar, viajes o paseos — en proporción a lo que gana cada uno.

**A la PaR** = equilibrio entre **Patricia** y **Richard**.

## Qué hace

- **Espacios**, personas e ingresos, gastos por mes, búsqueda y plantillas
- **Saldos** (quién pagó / quién debe) y marcar transferencias como saldadas
- **Presupuestos** por categoría y exportación CSV/PDF
- **Espacios personales** privados
- **PWA** instalable en teléfono y PC
- **Cuentas Google**: hogares con owner, familia autorizada y sync en Firebase
- **Planes preparados**: Personal, Familia y Plus con límites por función
- PIN local y respaldo `.json` (Drive) como capas extra

## Desarrollo local (sin Google)

```bash
cd reparto
npm install
npm run dev
```

Sin archivo `.env` de Firebase, corre en **modo local**: datos en el navegador,
PIN opcional y un set de ejemplo para probar. En producción eso no aparece.

La familia se invita desde **Familia** / **Mi hogar y familia**, no desde un
espacio. Los planes y cómo asignarlos están en
[`docs/ADMINISTRACION.md`](docs/ADMINISTRACION.md).

## Modo privado (Google) + publicar

1. Copiá configuración:

```bash
cp .env.example .env
```

2. Completá las variables `VITE_FIREBASE_*`.
3. Seguá la guía paso a paso:

**[`docs/PUBLICAR_PRIVADO_GOOGLE.md`](docs/PUBLICAR_PRIVADO_GOOGLE.md)**

También: [`docs/ACCESO_Y_RESPALDO.md`](docs/ACCESO_Y_RESPALDO.md) (PIN y Drive).

## Marca

- Tipografía: **Outfit**
- Colores: Teal `#008080`, Coral `#FF7F50`, Naranja `#FFA500`, Verde `#3CB371`
- Logo: marca P+R (Equilibrium Mark) en `/public/logo-mark.svg`

## Stack

Vite + React + TypeScript + PWA + Firebase Auth/Firestore.

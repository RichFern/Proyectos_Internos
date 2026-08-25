# Reparto

App para gestionar gastos compartidos del hogar, viajes o paseos.

## Qué hace

- **Espacios**, personas e ingresos, gastos por mes, búsqueda y plantillas
- **Saldos** (quién pagó / quién debe)
- **PWA** instalable en teléfono y PC
- **Modo privado con Google**: solo emails autorizados + sync en Firebase
- PIN local y respaldo `.json` (Drive) como capas extra

## Desarrollo local (sin Google)

```bash
cd reparto
npm install
npm run dev
```

Sin archivo `.env`, corre en **modo local** (datos en el navegador + PIN opcional).

## Modo privado (Google) + publicar

1. Copiá configuración:

```bash
cp .env.example .env
```

2. Completá Firebase y `VITE_ALLOWED_EMAILS` (tus 2 Gmail).
3. Seguá la guía paso a paso:

**[`docs/PUBLICAR_PRIVADO_GOOGLE.md`](docs/PUBLICAR_PRIVADO_GOOGLE.md)**

También: [`docs/ACCESO_Y_RESPALDO.md`](docs/ACCESO_Y_RESPALDO.md) (PIN y Drive).

## Stack

Vite + React + TypeScript + PWA + Firebase Auth/Firestore.

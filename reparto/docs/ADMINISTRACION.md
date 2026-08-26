# Administración de A la PaR

## Lo que administra cada usuario

El owner entra en **☰ → Mi hogar y familia**:

- ve integrantes y accesos pendientes;
- invita familiares por email;
- ve su plan y el consumo de personas/espacios;
- administra sus espacios y gastos.

Cada usuario edita sus datos en **☰ → Ajustes**.

## Administración general de la plataforma

Hasta incorporar un panel interno, el operador administra el sistema desde
Firebase Console:

- **Authentication → Users**: cuentas Google registradas, bloqueo o eliminación;
- **Firestore → `users`**: perfiles;
- **Firestore → `households`**: hogares, owners, miembros y plan;
- **Firestore → `households/{id}/state/main`**: datos compartidos;
- **Firestore → `households/{id}/private/{uid}`**: datos privados (no editar salvo
  soporte excepcional).

Cambiar un plan manualmente: editar `households/{id}.planTier` con uno de estos
valores: `personal`, `family`, `plus`.

## Panel super-admin futuro

Antes de vender membresías conviene crear un panel separado protegido por
Firebase Custom Claims (`admin: true`) para:

- buscar usuarios y hogares;
- cambiar/suspender planes;
- ver uso y errores;
- auditar invitaciones;
- atender soporte sin acceder a gastos personales.

Los cobros deben actualizar `planTier` mediante webhooks seguros de Stripe o
Mercado Pago; nunca desde un botón libre en el navegador.


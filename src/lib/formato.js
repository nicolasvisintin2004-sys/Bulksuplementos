// Formateo compartido entre servidor (build) y navegador.

const ARS = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

/** 98600 → "$98.600" */
export const pesos = (n) => `$${ARS.format(Math.round(n))}`;

/** Etiqueta legible de una variante: "Chocolate · 2 lb" */
export const etiquetaVariante = (v) => [v.sabor, v.presentacion].filter(Boolean).join(' · ');

export const slug = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[*&]/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

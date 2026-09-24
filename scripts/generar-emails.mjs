#!/usr/bin/env node
/**
 * Genera emails/bienvenida.html y emails/ofertas.html para pegar en Brevo.
 * - bienvenida.html usa las variables de plantilla transaccional {{ params.CODIGO }} y {{ params.NOMBRE }}.
 * - ofertas.html se arma con los primeros 4 productos en oferta del catálogo actual y el link de baja {{ unsubscribe }}.
 * Uso: npm run emails
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bienvenidaHtml, ofertasHtml } from '../emails/plantillas.mjs';
import negocio from '../src/config/negocio.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/productos.json'), 'utf8'));
const sitio = negocio.dominio || 'https://TU-DOMINIO';
const pesos = (n) => '$' + new Intl.NumberFormat('es-AR').format(n);
const marca = (s) => data.marcas.find((m) => m.slug === s)?.nombre ?? s;

const bienvenida = bienvenidaHtml({ codigo: '{{ params.CODIGO }}', nombre: '', sitio, baja: `${sitio}/baja/` })
  // el saludo con nombre se resuelve en Brevo
  .replace('¡Hola!', '¡Hola{% if params.NOMBRE %}, {{ params.NOMBRE }}{% endif %}!');

const productos = data.productos.filter((p) => p.oferta).slice(0, 4).map((p) => ({
  marca: marca(p.marca),
  nombre: p.nombre,
  detalle: [...new Set(p.variantes.map((v) => v.presentacion).filter(Boolean))].join(' · '),
  precio: (p.variantes.length > 1 ? 'desde ' : '') + pesos(p.desde),
  url: `${sitio}/producto/${p.id}/`,
}));
const ofertas = ofertasHtml({ productos, sitio });

fs.writeFileSync(path.join(ROOT, 'emails/bienvenida.html'), bienvenida);
fs.writeFileSync(path.join(ROOT, 'emails/ofertas.html'), ofertas);
console.log('✔ emails/bienvenida.html y emails/ofertas.html generados' + (negocio.dominio ? '' : ' (⚠ falta el dominio en negocio.js: los links dicen TU-DOMINIO)'));

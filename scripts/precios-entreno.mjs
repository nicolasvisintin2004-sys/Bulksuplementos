#!/usr/bin/env node
/**
 * Actualiza los precios con los de entreno.com.ar, menos DESCUENTO pesos.
 * Cada variante guarda en "entreno" qué página y qué opción de Entreno le corresponde:
 *   "entreno": { "slug": "ena-zma-60-caps", "opcion": "Neutro", "precio": 13855 }
 * Las variantes sin "entreno" no se tocan: las que no se venden igual en Entreno (mayorista × 1,4)
 * y las que tienen "precioFijo" (precio elegido comparando con la competencia).
 *
 * Uso: npm run precios:entreno
 * Si Entreno − $1.000 queda por debajo de mayorista + 10%, se usa ese piso y se avisa al final.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DESCUENTO = 1000;
export const MARGEN_MINIMO = 1.1; // ganancia mínima sobre el mayorista (10%)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVO = path.join(ROOT, 'src/data/productos.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function opciones(slug) {
  const r = await fetch(`https://www.entreno.com.ar/productos/${slug}/`, { headers: { 'User-Agent': UA, 'Accept-Language': 'es-AR' } });
  if (!r.ok) throw new Error(`${r.status}`);
  const m = (await r.text()).match(/data-variants="([^"]*)"/);
  if (!m) throw new Error('sin variantes');
  return JSON.parse(decode(m[1])).map((v) => ({ op: [v.option0, v.option1, v.option2].filter(Boolean).join(' / '), precio: Math.round(v.price_number) }));
}

const data = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'));
const slugs = [...new Set(data.productos.flatMap((p) => p.variantes.map((v) => v.entreno?.slug).filter(Boolean)))];
const cache = new Map();
for (const [i, slug] of slugs.entries()) {
  try { cache.set(slug, await opciones(slug)); } catch (e) { console.log(`  ✗ ${slug}: ${e.message}`); }
  if ((i + 1) % 25 === 0) console.log(`  páginas ${i + 1}/${slugs.length}`);
  await sleep(300); // sin apuro: no cargar el sitio
}

let cambios = 0;
const avisos = [];
const bajoCosto = [];
for (const p of data.productos) {
  for (const v of p.variantes) {
    if (!v.entreno) continue;
    const ops = cache.get(v.entreno.slug);
    const x = ops?.find((o) => o.op === v.entreno.opcion) ?? (ops?.length === 1 ? ops[0] : null);
    if (!x) { avisos.push(`${p.id} · ${v.id}: no se encontró "${v.entreno.opcion}" en ${v.entreno.slug} (queda el precio anterior)`); continue; }
    // nunca por debajo del costo: como mínimo mayorista + MARGEN_MINIMO
    const piso = Math.ceil((v.mayorista * MARGEN_MINIMO) / 100) * 100;
    const nuevo = Math.max(x.precio - DESCUENTO, piso);
    if (nuevo !== v.precio) cambios++;
    v.entreno.precio = x.precio;
    v.precio = nuevo;
    if (nuevo === piso && x.precio - DESCUENTO < piso) bajoCosto.push(`${p.id} · ${v.id}: Entreno $${x.precio} → queda en $${piso} (mayorista $${v.mayorista} + 10%)`);
  }
  p.desde = Math.min(...p.variantes.map((v) => v.precio));
}
data.generado = new Date().toISOString().slice(0, 10);
fs.writeFileSync(ARCHIVO, JSON.stringify(data, null, 2) + '\n');
console.log(`✔ Precios de Entreno actualizados (${cambios} cambios).`);
if (avisos.length) console.log(`\n⚠ Revisar:\n  ${avisos.join('\n  ')}`);
if (bajoCosto.length) console.log(`\n⚠ ${bajoCosto.length} precios de Entreno estaban por debajo del costo; quedaron en el piso:\n  ${bajoCosto.join('\n  ')}`);

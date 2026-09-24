#!/usr/bin/env node
/**
 * Recalcula el precio público de TODAS las variantes a partir de su "mayorista".
 * Útil si cambiaste precios mayoristas a mano en src/data/productos.json
 * o si cambiás el margen (MARGEN en scripts/importar-lista.mjs).
 *
 * Uso: npm run precios
 * Ojo: pisa cualquier "precio" que hayas editado a mano.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MARGEN = 1.4;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVO = path.join(ROOT, 'src/data/productos.json');

const data = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'));
let cambios = 0;
for (const p of data.productos) {
  for (const v of p.variantes) {
    if (v.entreno || v.precioFijo) continue; // siguen el precio de Entreno o uno elegido contra la competencia
    const nuevo = Math.ceil((v.mayorista * MARGEN) / 100) * 100;
    if (nuevo !== v.precio) { cambios++; v.precio = nuevo; }
  }
  p.desde = Math.min(...p.variantes.map((v) => v.precio));
}
fs.writeFileSync(ARCHIVO, JSON.stringify(data, null, 2) + '\n');
console.log(`✔ Precios recalculados (${cambios} cambios).`);

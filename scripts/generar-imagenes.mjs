#!/usr/bin/env node
/**
 * Genera public/og.jpg (1200×630, para compartir en redes) y public/apple-touch-icon.png.
 * El texto se convierte a trazos con la tipografía de la marca (Anybody, ancho 150, 900, itálica),
 * así la imagen no depende de las fuentes instaladas.
 * Uso: npm run imagenes
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';
import sharp from 'sharp';
import wawoff2 from 'wawoff2';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// fontkit no puede instanciar ejes variables desde woff2: se descomprime a TTF primero
const ttf = await wawoff2.decompress(fs.readFileSync(path.join(ROOT, 'public/fonts/anybody-italic.woff2')));
const base = fontkit.create(Buffer.from(ttf));
const LIME = '#c8ff00';

/** Texto → path SVG. Devuelve { d, width } en px para el tamaño dado. */
function texto(str, size, eje = { wdth: 150, wght: 900 }, tracking = 0) {
  const font = base.getVariation(eje);
  const run = font.layout(str);
  const scale = size / font.unitsPerEm;
  let x = 0;
  const partes = [];
  run.glyphs.forEach((g, i) => {
    partes.push(g.path.scale(scale, -scale).translate(x, 0).toSVG());
    x += run.positions[i].xAdvance * scale + tracking;
  });
  return { d: partes.join(' '), width: x - tracking };
}

// ---------- OG 1200×630 ----------
const W = 1200, H = 630;
const bulk = texto('BULK', 250);
const bajada = texto('SUPLEMENTOS Y NUTRICIÓN DEPORTIVA', 26, { wdth: 100, wght: 600 }, 6);
const l1 = texto('ARMÁ TU PEDIDO EN LA WEB', 40);
const l2 = texto('ENVÍOS A TODO EL PAÍS  /  10% OFF EN EFECTIVO', 24, { wdth: 110, wght: 800 }, 1);
const x0 = 80;

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.07 0"/></filter>
    <radialGradient id="g1" cx="100%" cy="0%" r="70%"><stop offset="0" stop-color="${LIME}" stop-opacity="0.16"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0%" cy="100%" r="60%"><stop offset="0" stop-color="${LIME}" stop-opacity="0.10"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0a0a0a"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  <rect width="${W}" height="${H}" filter="url(#n)"/>
  <g stroke="${LIME}" stroke-linecap="round">
    <line x1="-20" y1="200" x2="150" y2="-20" stroke-width="10"/><line x1="40" y1="200" x2="200" y2="-10" stroke-width="4"/>
    <line x1="1040" y1="650" x2="1220" y2="420" stroke-width="10"/><line x1="1000" y1="650" x2="1180" y2="420" stroke-width="4"/>
  </g>
  <path d="${l1.d}" transform="translate(${x0} 150)" fill="#f3f3ef"/>
  <path d="${bulk.d}" transform="translate(${x0 - 10} 400)" fill="#0a0a0a" stroke="${LIME}" stroke-width="5" stroke-linejoin="round"/>
  <path d="${bajada.d}" transform="translate(${x0} 460)" fill="#f3f3ef" fill-opacity="0.85"/>
  <rect x="${x0}" y="510" width="${l2.width + 48}" height="54" rx="27" fill="${LIME}"/>
  <path d="${l2.d}" transform="translate(${x0 + 24} 546)" fill="#0a0a0a"/>
</svg>`;
await sharp(Buffer.from(og)).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(ROOT, 'public/og.jpg'));

// ---------- apple-touch-icon 180×180 ----------
const b = texto('B', 128);
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="#0a0a0a"/>
  <path d="${b.d}" transform="translate(${(180 - b.width) / 2} 136)" fill="${LIME}"/>
</svg>`;
await sharp(Buffer.from(icon)).png().toFile(path.join(ROOT, 'public/apple-touch-icon.png'));

console.log('✔ public/og.jpg y public/apple-touch-icon.png');

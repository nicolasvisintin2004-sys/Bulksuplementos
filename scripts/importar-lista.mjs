#!/usr/bin/env node
/**
 * IMPORTADOR DE LISTA MAYORISTA → src/data/productos.json
 *
 * Uso:  npm run importar            (lee data/fuente/lista-mayorista.txt)
 *       npm run importar -- otra.txt
 *
 * Qué hace:
 *  1. Lee la lista tal como se copia de la web del proveedor (nombre corto, línea
 *     "MARCA - Nombre largo", badges OFERTA / 2x1 / 3x2 / Vto, precios, % o "por 1 unidad").
 *  2. Elige el precio mayorista según la regla del negocio:
 *       - un solo precio .................. ese
 *       - precio tachado + % de descuento . el precio con descuento
 *       - promo 2x1 / 3x2 "por 1 unidad" .. el precio de lista (el primero)
 *       - "OFERTA" ........................ el precio que figura
 *  3. Calcula el precio público: mayorista × 1,4 redondeado HACIA ARRIBA a múltiplos de $100.
 *  4. Agrupa variantes (sabor / presentación) en una sola ficha usando las REGLAS de abajo.
 *     Lo que no matchea ninguna regla se agrupa automáticamente y se avisa en consola.
 *  5. Conserva lo que cargaste a mano en productos.json (imagen, descripción, info nutricional,
 *     modo de uso, categoría) para que reimportar una lista nueva no borre ese trabajo.
 *  6. Escribe data/revisar.json con duplicados, conflictos de precio y dudas para revisar.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FUENTE = path.resolve(ROOT, process.argv[2] ?? 'data/fuente/lista-mayorista.txt');
const SALIDA = path.join(ROOT, 'src/data/productos.json');
const REVISAR = path.join(ROOT, 'data/revisar.json');

export const MARGEN = 1.4;
export const precioPublico = (mayorista) => Math.ceil((mayorista * MARGEN) / 100) * 100;
const DESCUENTO_ENTRENO = 1000;

/* ------------------------------------------------------------------ */
/* 1. PARSEO                                                           */
/* ------------------------------------------------------------------ */
const esPrecio = (l) => /^\$\s*[\d.]+$/.test(l);
const esDescuento = (l) => /^-\d+([.,]\d+)?%$/.test(l);
const esBadge = (l) => /^(OFERTA|2x1|3x2|Vto \d{2}\/\d{4})$/i.test(l);
const aNumero = (l) => Number(l.replace(/[^\d]/g, ''));

function parsear(texto) {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .filter((l) => l !== 'Unidades');
  const registros = [];
  let header = [];
  let i = 0;
  while (i < lineas.length) {
    const l = lineas[i];
    if (!esPrecio(l)) { header.push(l); i++; continue; }
    // bloque de precios
    const precios = [];
    while (i < lineas.length && esPrecio(lineas[i])) precios.push(aNumero(lineas[i++]));
    let descuento = null, porUnidad = false;
    if (i < lineas.length && esDescuento(lineas[i])) descuento = lineas[i++];
    else if (i < lineas.length && /^por 1 unidad$/i.test(lineas[i])) { porUnidad = true; i++; }

    const badges = header.filter(esBadge);
    // descartamos badges y líneas numéricas sueltas ("0" de Unidades, "12" de nombres rotos)
    const texto = header.filter((h) => !esBadge(h) && !/^\d+$/.test(h));
    const largo = texto[texto.length - 1];
    const corto = texto.length > 1 ? texto[0] : null;
    registros.push({ corto, largo, badges, precios, descuento, porUnidad });
    header = [];
  }
  return registros;
}

function precioMayorista(r) {
  const promo = r.badges.find((b) => /^(2x1|3x2)$/i.test(b));
  if (promo && r.porUnidad) return r.precios[0];
  if (r.descuento) return r.precios[r.precios.length - 1];
  return r.precios[0];
}

/* ------------------------------------------------------------------ */
/* 2. NORMALIZACIÓN DE TEXTO                                           */
/* ------------------------------------------------------------------ */
export const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[*&]/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const SIGLAS = new Set(['BCAA', 'ZMA', 'HMB', 'MCT', 'EPA', 'DHA', 'TACC', 'V8', '3D', 'C8', 'K2', 'D3', 'B12', 'UI', 'USA', 'EEUU', 'X']);
const MINUSC = new Set(['de', 'con', 'y', 'en', 'la', 'el', 'para', 'sin', 'a']);
function titulo(s) {
  if (!s) return s;
  if (/[a-záéíóúñ]/.test(s)) return s; // ya tiene minúsculas → se respeta
  return s.toLowerCase().split(/(\s+|-|\/)/).map((w, i) => {
    if (SIGLAS.has(w.toUpperCase())) return w.toUpperCase();
    if (i > 0 && MINUSC.has(w)) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join('');
}

const SABORES = {
  'vanilla': 'Vainilla', 'vainilla': 'Vainilla', 'sin sabor': 'Sin sabor', 'unflavored': 'Sin sabor',
  'limon': 'Limón', 'mani': 'Maní', 'arandanos': 'Arándanos', 'lima/limon': 'Lima Limón',
  'lima limón': 'Lima Limón', 'frutilla': 'Frutilla', 'frutillas': 'Frutilla', 'banana spl': 'Banana Split',
  'fp': 'Fruit Punch', 'cookie and cream': 'Cookies and Cream', 'cookies & cream': 'Cookies and Cream',
  'frutos': 'Frutos Rojos', 'caramel': 'Caramel', 'chocolate blanco': 'Chocolate Blanco',
};
function sabor(s) {
  if (s == null) return null;
  let t = String(s).replace(/\s+/g, ' ').trim().replace(/^-+$/, '');
  if (!t) return null;
  // "(20mg cafeína)" → "· 20 mg cafeína"
  t = t.replace(/\s*\((\d+)\s*mg cafe[ií]na\)/i, ' · $1 mg cafeína').replace(/\s*\(sin cafe[ií]na\)/i, ' · sin cafeína');
  t = t.replace(/\bLimon\b/g, 'Limón');
  const k = t.toLowerCase();
  if (SABORES[k]) return SABORES[k];
  return titulo(t);
}

/* ------------------------------------------------------------------ */
/* 3. MARCAS                                                           */
/* ------------------------------------------------------------------ */
// nombre visible + si aparece en la pieza "Marcas que trabajamos" (destacada)
const MARCAS = {
  'ADELGAFIT': ['Adelgafit'], 'AL FALLO': ['Al Fallo'], 'ATLHETICA': ['Atlhetica'], 'B3ST!': ['B3ST!'],
  'BODY ADVANCE': ['Body Advance'], 'BSN': ['BSN'], 'BULL BAR': ['Bull Bar'], 'CRUDDA': ['Crudda'],
  'DARKNESS': ['Darkness'], 'DIABLA': ['Diabla'], 'ENA': ['ENA', true], 'EVOGEN': ['Evogen'],
  'EXTRA LIFE': ['Extra Life'], 'F*YOU': ['F*YOU'], 'FALUX': ['Falux'], 'FLINT': ['Flint'],
  'GENTECH': ['Gentech'], 'GHOST': ['Ghost'], 'GOLD NUTRITION': ['Gold Nutrition', true],
  'GRANGER': ['Granger', true], 'GROSZ': ['Grosz'], 'GU': ['GU'], 'INNOVANATURALS': ['Innovanaturals'],
  'INTEGRALMEDICA': ['Integralmedica', true], 'LA GANEXA': ['La Ganexa'], 'LEGUILAB': ['Leguilab'],
  'MYPROTEIN': ['Myprotein', true], 'NATUFARMA': ['Natufarma'], 'NATUSVITA': ['Natusvita'],
  'NUTREMAX': ['Nutremax'], 'OPTIMUM NUTRITION': ['Optimum Nutrition'], 'OUTGROW': ['Outgrow'],
  'PROTA': ['Prota'], 'PROTEAR': ['ProteAr', true], 'RAW NUTRITION': ['Raw Nutrition', true],
  'SIGMA': ['Sigma'], 'STAR': ['Star Nutrition', true], 'SUMA': ['Suma'], 'TASTE': ['Taste'],
  'UNIVERSAL': ['Universal'], 'XTRENGHT': ['Xtrenght'],
};

/* ------------------------------------------------------------------ */
/* 4. REGLAS DE AGRUPACIÓN                                             */
/*    r(regex sobre la línea larga, id del grupo, nombre visible,      */
/*      sabor, presentación, extra)                                    */
/*    sabor / presentación: número = grupo de captura, string = fijo,  */
/*    null = no aplica, función (m) => valor                           */
/* ------------------------------------------------------------------ */
const REGLAS = [];
const r = (re, id, nombre, sab, pres, extra = {}) => REGLAS.push({ re, id, nombre, sab, pres, extra });
const g = (n) => (m) => m[n];

// ADELGAFIT · AL FALLO · ATLHETICA · B3ST · BODY ADVANCE
r(/^ADELGAFIT - Colagenfit (\S+)/, 'colagenfit', 'Colagenfit', 1, '360 g · 30 servicios');
r(/^AL FALLO - .*Barras Proteicas Caja X10 .* - (.+)$/, 'barras-proteicas-snack-fit', 'Barras Proteicas Snack Fit', 1, 'Caja x10 · 13 g de proteína');
r(/^ATLHETICA - .*Creatine 100% Pure 300g - (.+)$/, 'creatine-100-pure', 'Creatine 100% Pure', 1, '300 g');
r(/^B3ST! - Barras Proteicas B3ST 60g Alta Fibra .* - (.+)$/, 'barras-proteicas-alta-fibra', 'Barras Proteicas Alta Fibra', 1, 'Pack x10 · 60 g');
r(/^BODY ADVANCE - Body Advance Whey Protein (\S+) • 3kg/, 'whey-protein', 'Whey Protein', 1, '3 kg');
r(/^BODY ADVANCE - .*Whey Protein Doypack 907g - (.+)$/, 'whey-protein', 'Whey Protein', 1, 'Doypack 907 g');
r(/^BODY ADVANCE - .*Creatina Doypack 300g - (.+)$/, 'creatina', 'Creatina', 1, 'Doypack 300 g');
// BSN
r(/^BSN - Creatine Monohydrate/, 'creatine-monohydrate', 'Creatine Monohydrate', 'Sin sabor', '309 g · 60 servicios');
r(/^BSN - Syntha 6 Clasico (\S+)/, 'syntha-6', 'Syntha-6', 1, '2,91 lb · 28 servicios');
r(/^BSN - Syntha 6 ISOLATE (.+?) •/, 'syntha-6-isolate', 'Syntha-6 Isolate', 1, '2 lb · 24 servicios');
// BULL BAR · CRUDDA · DARKNESS
r(/^BULL BAR - .*Pasta de Mani con Proteina .* - (.+)$/, 'pasta-de-mani-con-proteina', 'Pasta de Maní con Proteína', 1, '420 g');
r(/^BULL BAR - .*Whey Protein 60g - Caja x10 .* - (.+)$/, 'barra-whey-protein', 'Barra Whey Protein', 1, 'Caja x10 · 60 g');
r(/^CRUDDA - .*Barra Proteica Caja 10 Unid - (.+)$/, 'barra-proteica', 'Barra Proteica', 1, 'Caja x10');
r(/^DARKNESS - .*Barras Proteicas 720g .* - (.+)$/, 'barras-proteicas-premium', 'Barras Proteicas Premium', 1, 'Caja x8 · 90 g c/u');
// DIABLA
r(/^DIABLA - .*Súper Proteína Caja x20 Sobres .* - (.+)$/, 'super-proteina-vegetal', 'Súper Proteína Vegetal', 1, 'Caja x20 sobres');
r(/^DIABLA - .*Súper Proteína Vegetal 660g - (.+)$/, 'super-proteina-vegetal', 'Súper Proteína Vegetal', 1, '660 g');
r(/^DIABLA - .*Súper Greens Blend Detox 150g - (.+)$/, 'super-greens-blend-detox', 'Súper Greens Blend Detox', 1, '150 g');
r(/^DIABLA - .*Súper Flora 60 Cápsulas/, 'super-flora-probioticos', 'Súper Flora Probióticos', null, '60 cápsulas');
r(/^DIABLA - .*Multivitamínico 30 cápsulas/, 'multivitaminico', 'Multivitamínico', null, '30 cápsulas');
r(/^DIABLA - .*Blend Calm 200g/, 'blend-calm', 'Blend Calm', null, '200 g');
r(/^DIABLA - .*Super Bar Caja x10 Unid 35g - (.+)$/, 'super-bar', 'Super Bar', 1, 'Caja x10 · 35 g');
// ENA
r(/^ENA - (?:ENA )?PROTEIN BAR (COCO|FRUTILLAS|BANANA SPL)/, 'protein-bar', 'Protein Bar', 1, 'Caja x16');
r(/^ENA - HYDROXY MAX BLACK/, 'hydroxy-max-black', 'Hydroxy Max Black', null, '120 tabletas');
r(/^ENA - HYDROXY MAX NIGHT/, 'hydroxy-max-night', 'Hydroxy Max Night', null, '120 tabletas');
r(/^ENA - RIPPED X/, 'ripped-x', 'Ripped X', null, '60 cápsulas');
r(/^ENA - CARNITINA PRO BURN/, 'carnitina-pro-burn', 'Carnitina Pro Burn', null, '60 cápsulas');
r(/^ENA - ENA SPORT Creatina \+ Electrolitos 300 GRS - (.+?) •/, 'sport-creatina-electrolitos', 'Sport Creatina + Electrolitos', 1, '300 g');
r(/^ENA - ENA Citrato de Magnesio Polvo 192gr - (.+)$/, 'citrato-de-magnesio', 'Citrato de Magnesio', 1, 'Polvo 192 g');
r(/^ENA - CITRATO DE MAGNESIO • 60 caps/, 'citrato-de-magnesio', 'Citrato de Magnesio', null, '60 cápsulas');
r(/^ENA - ISOPROT - (.+?) •/, 'isoprot', 'IsoProt', 1, '2,05 lb (930 g)');
r(/^ENA - WHEY PROTEIN TRUE MADE (.+?) • 2,05 LB/, 'whey-protein-true-made', 'Whey Protein True Made', 1, '2,05 lb (930 g)');
r(/^ENA - WHEY PROTEIN TRUE MADE (.+?) • 1 LB/, 'whey-protein-true-made', 'Whey Protein True Made', 1, '1 lb (453 g)');
r(/^ENA - WHEY X PRO (.+?) •/, 'whey-x-pro', 'Whey X Pro', 1, '2 lb (907 g)');
r(/^ENA - ULTRA MASS (.+?) •/, 'ultra-mass', 'Ultra Mass', 1, '1,5 kg', { cat: 'proteinas', ganador: true });
r(/^ENA - (?:ENA )?STARTER PROTEIN(?: 400 GRS -)? (CAF[EÉ] CON LECHE|Café con Leche)/i, 'starter-protein', 'Starter Protein', 1, '400 g');
r(/^ENA - 100% WHEY (\S+) •/, '100-whey', '100% Whey', 1, '2 lb');
r(/^ENA - TM P COLLAGEN (\S+) • (\d+) GRS/, 'truemade-pure-collagen', 'Truemade Pure Collagen', 1, null, { detalle: (m) => `${m[2]} g` });
r(/^ENA - ENA Truemade Pure Collagen (\d+) GRS - (.+)$/, 'truemade-pure-collagen', 'Truemade Pure Collagen', 2, null, { detalle: (m) => `${m[1]} g` });
r(/^ENA - COLAGENO SPORT (\S+)$/, 'colageno-sport', 'Colágeno Sport', 1, null);
r(/^ENA - PRE WAR SABOR (.+?) •/, 'pre-war', 'Pre War', 1, '400 g');
r(/^ENA - RELOAD SABOR (.+?) •/, 'reload', 'Reload BCAA 2:1:1', 1, '220 g', { cat: 'aminoacidos' });
r(/^ENA - AMINO 4500/, 'amino-4500', 'Amino 4500', null, '150 tabletas');
r(/^ENA - CREATINA MICRONIZADA SABOR (.+?) •/, 'creatina-micronizada', 'Creatina Micronizada', 1, '300 g');
r(/^ENA - ENA Creatina Micronizada 1 KG - (.+)$/, 'creatina-micronizada', 'Creatina Micronizada', 1, '1 kg');
r(/^ENA - Creatina Creapure 200/, 'creatina-creapure', 'Creatina Creapure', null, '200 g');
r(/^ENA - ENA-CREATINA-150/, 'creatina-150', 'Creatina', null, '150 g');
r(/^ENA - ENA Creatina Monohidrato 15 sobres x 5g - (.+)$/, 'creatina-monohidrato-sobres', 'Creatina Monohidrato en sobres', 1, '15 sobres x 5 g');
r(/^ENA - GLUTAMINA MICRONIZADA/, 'glutamina-micronizada', 'Glutamina Micronizada', null, '300 g');
r(/^ENA - BCAA 12:1:1/, 'bcaa-12-1-1', 'BCAA 12:1:1', null, '120 cápsulas');
r(/^ENA - BCAA 2:1:1/, 'bcaa-2-1-1', 'BCAA 2:1:1', null, '90 cápsulas');
r(/^ENA - MUSCLE MAX/, 'muscle-max', 'Muscle Max', null, '90 tabletas', { cat: 'aminoacidos' });
r(/^ENA - ZMA 60 CAPS/, 'zma', 'ZMA', null, '60 cápsulas');
r(/^ENA - CARBO ENERGY BLUEBERRY$/, 'carbo-energy', 'Carbo Energy', 'Blueberry', null);
r(/^ENA - CARBO ENERGY$/, 'carbo-energy', 'Carbo Energy', 'Sin especificar', null, { revisar: 'La lista no indica el sabor de esta variante.' });
r(/^ENA - MULTIVITAMIN •/, 'multivitamin', 'Multivitamin', null, '60 cápsulas');
r(/^ENA - ENA Fish Oil/, 'fish-oil-omega-3', 'Fish Oil Omega 3 EPA & DHA', null, '60 softgels');
r(/^ENA - ENA Truemade Amino Full 146 GRS - (.+)$/, 'truemade-amino-full', 'Truemade Amino Full', 1, '146 g');
r(/^ENA - Proteína vegetal sabor (.+)$/, 'proteina-vegetal', 'Proteína Vegetal', 1, null);
r(/^ENA - ENA Resveratrol 250mg/, 'resveratrol', 'Resveratrol 250 mg', null, '60 cápsulas');
r(/^ENA - ENA Protein Caja 12 Sobres x25g - (.+)$/, 'protein-sobres', 'Protein en sobres', 1, 'Caja x12 sobres de 25 g');
r(/^ENA - ENA Electrolitos .* 15 sobres 5g c\/u - (.+)$/, 'electrolitos', 'Electrolitos Hidratación y Recuperación', 1, '15 sobres x 5 g');
r(/^ENA - ENA Electrolitos .* 225g - (.+)$/, 'electrolitos', 'Electrolitos Hidratación y Recuperación', 1, '225 g');
r(/^ENA - ENA Enargy Gel Sin Cafeina 12 Unidades 38gr c\/s - (.+)$/, 'energy-gel-sin-cafeina', 'Energy Gel sin cafeína', 1, 'Caja x12 · 38 g c/u');
r(/^ENA - ENA Cúrcuma Y Jengibre/, 'curcuma-y-jengibre', 'Cúrcuma y Jengibre + Pimienta Negra y Vitamina C', null, '60 cápsulas');
r(/^ENA - ENA Melena De Leon/, 'melena-de-leon', 'Melena de León 1000 mg + Vitamina B12', null, '60 cápsulas');
r(/^ENA - ENA Magnesio Duo/, 'magnesio-duo', 'Magnesio Duo', null, 'Cápsulas');
r(/^ENA - ENA Vitamina D3 \+ K2/, 'vitamina-d3-k2', 'Vitamina D3 + K2', null, '60 cápsulas');
r(/^ENA - ENA Creatina con magnesio ENA 225g - (.+)$/, 'creatina-con-magnesio', 'Creatina con Magnesio', 1, '225 g');
// EVOGEN · EXTRA LIFE · F*YOU · FALUX · FLINT
r(/^EVOGEN - .*Creatine Monohydrate 60 SRV - (.+)$/, 'creatine-monohydrate', 'Creatine Monohydrate', 1, '60 servicios');
r(/^EVOGEN - .*Glicerol líquido EVP AQ 473 ml - (.+)$/, 'evp-aq-glicerol', 'EVP AQ Glicerol Líquido', 1, '473 ml', { cat: 'pre-entrenos' });
r(/^EXTRA LIFE - .*Pack (\d+) Sobres - (.+)$/, 'boost-de-hidratacion', 'Boost de Hidratación Electrolitos', 2, (m) => `Pack x${m[1]} sobres`);
r(/^F\*YOU - .*Electrolitos en polvo caja 30 sobres - (.+)$/, 'electrolitos-en-polvo', 'Electrolitos en polvo', 1, 'Caja x30 sobres');
r(/^FALUX - .*Creatina Monohydrate Ultramicronized 300 GRS - (.+)$/, 'creatina-ultramicronizada', 'Creatina Monohidrato Ultramicronizada', 1, '300 g');
r(/^FALUX - .*WHEY PROTEIN ULTRA - CONCENTRATE 2LB \(907GR\) - (.+)$/, 'whey-protein-ultra-concentrate', 'Whey Protein Ultra Concentrate', 1, '2 lb (907 g)');
r(/^FALUX - .*Omega 3 Fish Oil/, 'omega-3-fish-oil', 'Omega 3 Fish Oil 2000 mg (EPA 800 · DHA 400)', null, '60 cápsulas');
r(/^FLINT - .*PROTEIN BUT FOR REAL 2 LBS - (.+)$/, 'protein-but-for-real', 'Protein But For Real', 1, '2 lb');
r(/^FLINT - .*Creatina Monohidrato Ultramicronized 300 gr - (.+)$/, 'creatina-ultramicronizada', 'Creatina Monohidrato Ultramicronizada', 1, '300 g');
r(/^FLINT - .*Citrato de magnesio en polvo 300g - Sin TACC - (.+)$/, 'citrato-de-magnesio', 'Citrato de Magnesio en polvo', 1, '300 g');
r(/^FLINT - .*Colageno Hidrolizado Neutro 260g/, 'colageno-hidrolizado', 'Colágeno Hidrolizado', 'Neutro', '260 g');
r(/^FLINT - .*Omega 3 60 cápsulas/, 'omega-3', 'Omega 3 (DHA 363 mg · EPA 155 mg)', null, '60 cápsulas');
r(/^FLINT - .*Pre Workout 300g .* - (.+)$/, 'pre-workout', 'Pre Workout Beta Alanina + Citrulina', 1, '300 g · 30 porciones');
// GENTECH
r(/^Gentech - .*Snack Bar 40g x10 unidades - (.+)$/i, 'snack-bar', 'Snack Bar', 1, 'Caja x10 · 40 g');
r(/^GENTECH - .*Whey Protein 7900 1000g - (.+)$/, 'whey-protein-7900', 'Whey Protein 7900', 1, '1 kg');
r(/^GENTECH - CREATINA MONOHIDRATO - KOSHER • DOYPACK (\d+)g/, 'creatina-monohidrato-kosher', 'Creatina Monohidrato Kosher', null, (m) => `Doypack ${m[1]} g`);
r(/^GENTECH - IRON BAR - (.+?) •/, 'iron-bar', 'Iron Bar', 1, 'Display x20');
r(/^GENTECH - MULTIVITAMIN - KOSHER/, 'multivitamin-kosher', 'Multivitamin Kosher', null, '60 comprimidos');
r(/^GENTECH - OMEGA 3 EPA FISH OIL/, 'omega-3-epa-fish-oil', 'Omega 3 EPA Fish Oil', null, '60 cápsulas blandas');
r(/^GENTECH - PROTEIN BAR LOW CARB - (.+?)(?: •.*)?$/, 'protein-bar-low-carb', 'Protein Bar Low Carb', 1, 'Display x10');
r(/^GENTECH - GENTECH Low Carb Protein Bar 10 Unidades - (.+)$/, 'protein-bar-low-carb', 'Protein Bar Low Carb', 1, 'Display x10');
r(/^GENTECH - GENTECH Iron Gel Turbo Coffee 6 Unidades/, 'iron-gel-turbo-coffee', 'Iron Gel Turbo Coffee', null, 'Caja x6');
r(/^GENTECH - CREATINA MASTICABLE • (\d+)/, 'creatina-masticable', 'Creatina Masticable', null, (m) => `x${m[1]}`);
r(/^GENTECH - GENTECH Omega 3 EPA 460mg DHA 180mg/, 'omega-3-daily', 'Omega 3 Daily (EPA 460 mg · DHA 180 mg)', null, '30 cápsulas');
// GHOST
r(/^GHOST - .*Creatina monohidratada Creapure 258g .* - (.+)$/, 'creatina-creapure', 'Creatina Creapure', 1, '258 g · 50 servicios');
r(/^GHOST - .*Vegan V2 .* - (?:VEGAN )?(.+)$/, 'vegan-protein-v2', 'Vegan Protein V2', 1, '2,5 lb · 28 servicios', { cat: 'proteinas' });
r(/^GHOST - .*Whey Protein 2Lb .* - (.+)$/, 'whey-protein', 'Whey Protein con enzimas digestivas', 1, '2 lb');
// GOLD NUTRITION
r(/^GOLD NUTRITION - 100% Whey Protein (\S+) • (\d) lbs/, '100-whey-protein', '100% Whey Protein', 1, (m) => `${m[2]} lb`);
r(/^GOLD NUTRITION - Iso Gold Protein (\S+) •/, 'iso-gold-protein', 'Iso Gold Protein', 1, '2 lb');
r(/^GOLD NUTRITION - Vegetal Protein (\S+) • 2 lbs/, 'vegetal-protein-isolate', 'Vegetal Protein Isolate', 1, '2 lb');
r(/^GOLD NUTRITION - GOLD NUTRITION Vegetal Protein Isolate 2 LB - (.+)$/, 'vegetal-protein-isolate', 'Vegetal Protein Isolate', 1, '2 lb');
r(/^GOLD NUTRITION - Creatine Monohydrate • 300 g/, 'creatine-monohydrate', 'Creatine Monohydrate', null, '300 g');
r(/^GOLD NUTRITION - GOLD NUTRITION Creatine Monohydrate 1KG - (.+)$/, 'creatine-monohydrate', 'Creatine Monohydrate', 1, '1 kg');
r(/^GOLD NUTRITION - Amino Gold$/, 'amino-gold', 'Amino Gold', null, null);
r(/^GOLD NUTRITION - Electrolitos • 60 Caps/, 'electrolitos', 'Electrolitos', null, '60 cápsulas');
r(/^GOLD NUTRITION - Lipo Gold Elite/, 'lipo-gold-elite', 'Lipo Gold Elite', null, '60 cápsulas');
r(/^GOLD NUTRITION - ZMA •/, 'zma', 'ZMA', null, '60 cápsulas');
// GRANGER · GROSZ
r(/^GRANGER - PANCAKE PROTEICOS - (.+?) •/, 'pancakes-proteicos', 'Pancakes Proteicos', 1, '400 g');
r(/^GRANGER - .*Cookies Proteica con Chips Chocolate 220g/, 'cookies-proteicas', 'Cookies Proteicas con Chips de Chocolate', null, '220 g');
r(/^GROSZ - .*Citrato De Magnesio 150GR - (.+)$/, 'citrato-de-magnesio', 'Citrato de Magnesio', 1, '150 g');
r(/^GROSZ - .*Creatina 100% Pura 150GR - (.+)$/, 'creatina-100-pura', 'Creatina 100% Pura', 1, '150 g');
r(/^GROSZ - .*Vitamina C 100% Pura 500GR - (.+)$/, 'vitamina-c-100-pura', 'Vitamina C 100% Pura', 1, '500 g');
// GU
r(/^GU - GU Energy Gel 32g - (.+)$/, 'energy-gel', 'Energy Gel', 1, '32 g (1 unidad)');
r(/^GU - Gu Hydration Tabs .* - (.+)$/, 'hydration-tabs', 'Hydration Tabs', 1, 'Tubo x12 tabletas');
r(/^GU - GU Roctane Energy Gel .* Gel 32g - (.+)$/, 'roctane-energy-gel', 'Roctane Energy Gel', 1, '32 g (1 unidad)');
// INNOVANATURALS · INTEGRALMEDICA · LA GANEXA
r(/^INNOVANATURALS - .*Omega 3 Max/, 'omega-3-max', 'Omega 3 Max', null, '60 cápsulas blandas');
r(/^INNOVANATURALS - .*Omega 3 Pre Natal/, 'omega-3-pre-natal', 'Omega 3 Pre Natal', null, '60 cápsulas blandas');
r(/^INNOVANATURALS - .*Omega 3 800 EPA 400 DHA/, 'omega-3-800-epa-400-dha', 'Omega 3 (EPA 800 · DHA 400)', null, '60 cápsulas blandas');
r(/^INTEGRALMEDICA - .*Protein Crisp Bar Caja 12 unidades - (.+)$/, 'protein-crisp-bar', 'Protein Crisp Bar', 1, 'Caja x12');
r(/^INTEGRALMEDICA - Whey 100% Pure (.+?) •/, 'whey-100-pure', 'Whey 100% Pure', 1, '900 g');
r(/^INTEGRALMEDICA - Creatina Sin Sabor/, 'creatina', 'Creatina', 'Sin sabor', '300 g');
r(/^INTEGRALMEDICA - BCAA Top (.+?) •/, 'bcaa-top', 'BCAA Top', 1, '120 cápsulas');
r(/^INTEGRALMEDICA - INTEGRALMEDICA BCAA Top 120 Cápsulas - (.+)$/, 'bcaa-top', 'BCAA Top', 1, '120 cápsulas');
r(/^LA GANEXA - .*Pasta de Maní .* 450g - (.+)$/, 'pasta-de-mani', 'Pasta de Maní', 1, '450 g');
// LEGUILAB
r(/^LEGUILAB - Brain Focus/, 'brain-focus', 'Brain Focus', null, '60 cápsulas vegetales');
r(/^LEGUILAB - Happy Pill/, 'happy-pill', 'Happy Pill', null, '60 tabletas');
r(/^LEGUILAB - Stress Killer/, 'stress-killer', 'Stress Killer', null, '60 cápsulas vegetales');
r(/^LEGUILAB - Bisglicinato de Cobre/, 'bisglicinato-de-cobre', 'Bisglicinato de Cobre', null, '60 cápsulas vegetales');
r(/^LEGUILAB - Vitamina K2/, 'vitamina-k2', 'Vitamina K2', null, '60 cápsulas vegetales');
r(/^LEGUILAB - MCT Oil C8/, 'mct-oil-c8', 'MCT Oil C8', null, '250 ml');
r(/^LEGUILAB - MCT Oil 100% pure/, 'mct-oil-100-pure', 'MCT Oil 100% Pure', null, '475 ml');
r(/^LEGUILAB - MCT Oil Powder/, 'mct-oil-powder', 'MCT Oil Powder', null, '200 g');
r(/^LEGUILAB - LEGUILAB Actyb Curcuma/, 'actyb-curcuma-vitamina-d', 'Actyb Cúrcuma + Vitamina D', null, '120 cápsulas');
// MYPROTEIN · NATUFARMA · NATUSVITA
r(/^MYPROTEIN - .*Beauty Collagen Powder Unflavoured 165g/, 'beauty-collagen', 'Beauty Collagen', 'Sin sabor', '165 g');
r(/^MYPROTEIN - .*Tribulus Terrestris 90 cápsulas vegano/, 'tribulus-terrestris', 'Tribulus Terrestris', null, '90 cápsulas', { cat: 'vitaminas-y-minerales' });
r(/^NATUFARMA - OMEGA 3 •/, 'omega-3', 'Omega 3', null, '60 cápsulas');
r(/^NATUFARMA - .*Vitaneral Proteina Con Hmb .* - (.+)$/, 'vitaneral-proteina-hmb', 'Vitaneral Proteína con HMB', 1, '240 g', { cat: 'proteinas' });
r(/^NATUSVITA - .*Bisglicinato de Magnesio/, 'bisglicinato-de-magnesio', 'Bisglicinato de Magnesio 248 mg', null, '120 cápsulas');
r(/^NATUSVITA - .*Creatina Monohidratada Micronizada 250g - (.+)$/, 'creatina-micronizada', 'Creatina Monohidratada Micronizada', 1, '250 g');
r(/^NATUSVITA - .*Omega 3 Super EPA/, 'omega-3-super-epa', 'Omega 3 Super EPA (EPA 1500 mg · DHA 300 mg)', null, null);
r(/^NATUSVITA - .*Vitamina C Liposomal/, 'vitamina-c-liposomal-zinc', 'Vitamina C Liposomal 500 mg + Zinc', null, '60 softgels');
r(/^NATUSVITA - .*CDZ Max/, 'cdz-max', 'CDZ Max (Vitamina C + D + Zinc)', null, '60 cápsulas');
r(/^NATUSVITA - .*Malato de Magnesio/, 'malato-de-magnesio', 'Malato de Magnesio 96 mg', null, '60 cápsulas');
r(/^NATUSVITA - .*Cúrcuma Upper/, 'curcuma-upper', 'Cúrcuma Upper (curcumina liposomal con MCT)', null, '60 softgels');
r(/^NATUSVITA - .*Vitamina D3 2\.000 UI/, 'vitamina-d3-k2-mk7', 'Vitamina D3 2.000 UI + K2 MK7', null, '60 mini softgels');
// NUTREMAX
r(/^NUTREMAX - Hidromax Display (\S+) • Sobres/, 'hydromax-sport-drink', 'Hydromax Sport Drink', 1, 'Display de sobres');
r(/^NUTREMAX - NUTREMAX Hydromax Sport Drink (\d+) gr - (.+)$/, 'hydromax-sport-drink', 'Hydromax Sport Drink', 2, (m) => `${m[1]} g`);
r(/^NUTREMAX - NUTREMAX Hydromax Naranja Display 33gr \(1 sobre\) - (.+)$/, 'hydromax-sport-drink', 'Hydromax Sport Drink', 1, 'Sobre 33 g', { revisar: 'El nombre dice "Naranja" pero la variante dice "Pomelo". Se tomó Pomelo.' });
r(/^NUTREMAX - Prosalts/, 'prosalts', 'Prosalts', null, '60 cápsulas');
r(/^NUTREMAX - SportFuel Display/, 'sportfuel', 'SportFuel', null, 'Display', { cat: 'geles-y-energia' });
r(/^NUTREMAX - Recovery Display/, 'recovery-drink', 'Recovery Drink', null, 'Display de sobres');
r(/^NUTREMAX - Nutremax Recovery Drink 900g .* - (.+)$/, 'recovery-drink', 'Recovery Drink', 1, '900 g');
r(/^NUTREMAX - Creatina •/, 'creatina', 'Creatina', null, '200 g');
r(/^NUTREMAX - NUTREMAX Energy Gel Display 12u - Sin Cafeina - (.+)$/, 'energy-gel', 'Energy Gel', (m) => `${sabor(m[1])} · sin cafeína`, 'Caja x12');
r(/^NUTREMAX - NUTREMAX Energy Gel Display 12u - (.+?) •/, 'energy-gel', 'Energy Gel', 1, 'Caja x12');
r(/^NUTREMAX - Nutremax Endurance Gel 42g - (.+)$/, 'endurance-gel', 'Endurance Gel', (m) => m[1].replace(' - ', '-'), '42 g');
// OPTIMUM NUTRITION · OUTGROW · PROTA · PROTEAR
r(/^OPTIMUM NUTRITION - .*100% Whey Gold 5 LB - (.+)$/, '100-whey-gold', '100% Whey Gold', 1, '5 lb');
r(/^OPTIMUM NUTRITION - .*Micronized Creatine Powder 300g - (.+)$/, 'micronized-creatine-powder', 'Micronized Creatine Powder', 1, '300 g');
r(/^OPTIMUM NUTRITION - .*Opti Women/, 'opti-women', 'Opti-Women Multivitamínico', null, '60 cápsulas');
r(/^OPTIMUM NUTRITION - .*Opti Men/, 'opti-men', 'Opti-Men Multivitamínico', null, '90 cápsulas', { cat: 'vitaminas-y-minerales' });
r(/^OPTIMUM NUTRITION - .*Gold Protein Shake 1 unid de 325ml - (.+)$/, 'gold-protein-shake', 'Gold Protein Shake', 1, '325 ml (1 unidad)');
r(/^OUTGROW - .*Barra Proteica Caja 12 Unidades - (.+)$/, 'barra-proteica', 'Barra Proteica', 1, 'Caja x12');
r(/^PROTA - .*Protein Bar Caja x12 .* - (.+)$/i, 'protein-bar', 'Protein Bar', 1, 'Caja x12 · 23 g de proteína');
r(/^PROTEAR - .*Bebida Proteica 20g Aislada - 500ml - (.+)$/, 'bebida-proteica', 'Bebida Proteica Aislada 20 g', 1, '500 ml');
// RAW · SIGMA
r(/^RAW NUTRITION - Beta Alanina en Polvo 312g/, 'beta-alanina', 'Beta Alanina en polvo', null, '312 g');
r(/^RAW NUTRITION - Creatina Monohidratada 500g/, 'creatina-monohidratada', 'Creatina Monohidratada', null, '500 g');
r(/^RAW NUTRITION - Creatina Monohidratada 1\.275kg/, 'creatina-monohidratada', 'Creatina Monohidratada', null, '1,275 kg · 250 servicios');
r(/^RAW NUTRITION - Essential PreWorkout - (.+)$/, 'essential-pre-workout', 'Essential Pre-Workout', 1, null);
r(/^RAW NUTRITION - Proteína Itholate 2lb - 25 Serv - (.+?) •/, 'itholate-protein', 'Itholate Protein', 1, '2 lb · 25 servicios');
r(/^SIGMA - .*Alfajor Proteico Whey 15g – 1 unid 63gr - (.+)$/, 'alfajor-proteico-whey', 'Alfajor Proteico Whey', 1, '1 unidad (63 g)');
r(/^SIGMA - .*Alfajor Proteico Whey 15g – caja 22unid 63gr c\/u - (.+)$/, 'alfajor-proteico-whey', 'Alfajor Proteico Whey', 1, 'Caja x22');
// STAR NUTRITION
r(/^STAR - CREATINA MONOHIDRATO EEUU X 150 GRS/, 'creatina-monohidrato', 'Creatina Monohidrato', null, '150 g');
r(/^STAR - CREATINA MONOHIDRATO EEUU X 300 GRS POTE/, 'creatina-monohidrato', 'Creatina Monohidrato', null, 'Pote 300 g');
r(/^STAR - CREATINA MONOHIDRATO EEUU X 300 GRS\. DOYPACK FRUTOS ROJOS/, 'creatina-monohidrato', 'Creatina Monohidrato', 'Frutos Rojos', 'Doypack 300 g');
r(/^STAR - CREATINA MONOHIDRATO EEUU X 300 GRS\. DOYPACK •/, 'creatina-monohidrato', 'Creatina Monohidrato', 'Sin sabor', 'Doypack 300 g');
r(/^STAR - CREATINA MONOHIDRATO EEUU X 500 GRS/, 'creatina-monohidrato', 'Creatina Monohidrato', null, '500 g');
r(/^STAR - CREATINA MONOHIDRATO EEUU X 1 KILO/, 'creatina-monohidrato', 'Creatina Monohidrato', null, '1 kg');
r(/^STAR - STAR-OMEGA-FISH/, 'omega-fish', 'Omega Fish', null, '60 cápsulas');
r(/^STAR - STAR-RESVERATROL/, 'resveratrol', 'Resveratrol', null, '60 cápsulas');
r(/^STAR - STAR-VITAMINA-C/, 'vitamina-c', 'Vitamina C', null, '60 cápsulas');
r(/^STAR - STAR-ALL-IN-ONE-MULTI/, 'all-in-one-multi', 'All In One Multi', null, '60 comprimidos');
r(/^STAR - STAR-MAGNESIO-500 •/, 'magnesio', 'Magnesio', null, '60 cápsulas');
r(/^STAR - STAR-MAGNESIO-(NEUTRO|FRUTOS)-500/, 'magnesio', 'Magnesio', 1, 'Polvo 500 g');
r(/^STAR - STAR-COLLAGEN-FRUTOSROJOS-210/, 'collagen', 'Collagen', 'Frutos Rojos', '210 g');
r(/^STAR - STAR NUTRITION Collagen Limón 210gr - (.+)$/, 'collagen', 'Collagen', 1, '210 g', { revisar: 'Nombre "Collagen Limón" con variante "Frutos Rojos": se tomó como duplicado de STAR-COLLAGEN-FRUTOSROJOS-210 (mismo precio).' });
r(/^STAR - STAR-COLLAGEN-PLUS-LIMON/, 'collagen-plus', 'Collagen Plus', 'Limón', '360 g');
r(/^STAR - PUMP V8 (\S+) X/, 'pump-v8', 'Pump V8', 1, '285 g');
r(/^STAR - PUMP 3D EVOLUTION RIPPED (\S+) X/, 'pump-3d-evolution-ripped', 'Pump 3D Evolution Ripped', 1, '315 g');
r(/^STAR - PLATINUM WHEY ISOLATE (\S+) X/, 'platinum-whey-isolate', 'Platinum Whey Isolate', 1, '2 lb');
r(/^STAR - PLATINUM WHEY PROTEIN (\S+) X 3 KILOS/, 'platinum-whey-protein', 'Platinum Whey Protein', 1, '3 kg · zipper pack');
r(/^STAR - ZMA X 30 CAPS/, 'zma', 'ZMA', null, '30 cápsulas');
r(/^STAR - HMB X 180 CAPS/, 'hmb', 'HMB', null, '180 cápsulas');
r(/^STAR - MTOR BCAA (.+?) 270G/, 'mtor-bcaa', 'Mtor BCAA', 1, '270 g');
r(/^STAR - L-GLUTAMINE X (\d+) GRS/, 'l-glutamine', 'L-Glutamine', null, (m) => `${m[1]} g`);
r(/^STAR - BCAA 2000 X 120 CAPS/, 'bcaa-2000', 'BCAA 2000', null, '120 cápsulas');
r(/^STAR - STAR NUTRITION Vitamin K2 \+ D3/, 'vitamin-k2-d3', 'Vitamin K2 + D3', null, '60 cápsulas');
// SUMA · TASTE · UNIVERSAL
r(/^SUMA - SUMA Electrolitos Caja 15 Sobres - (.+)$/, 'electrolitos', 'Electrolitos', 1, 'Caja x15 sobres');
r(/^SUMA - SUMA Electrolitos Caja 30 Sobres - (.+)$/, 'electrolitos', 'Electrolitos', 1, 'Caja x30 sobres');
r(/^SUMA - SUMA Electrolitos CAJA 30 Sobres - (.+?) • 255g/, 'electrolitos', 'Electrolitos', 1, 'Caja x30 sobres');
r(/^TASTE - ADEREZOS PARA ENSALADAS - (.+?) •/, 'aderezo-para-ensaladas', 'Aderezo para Ensaladas', 1, '300 ml');
r(/^TASTE - ADEREZOS ZERO CALORIAS - (.+?)(?: - VEGANO)? •/, 'aderezo-zero-calorias', 'Aderezo Zero Calorías', 1, '350 g');
r(/^TASTE - CREMAS ZERO CALORIAS - (.+?) •/, 'crema-zero-calorias', 'Crema Zero Calorías', 1, '235 g');
r(/^TASTE - SALSA DE SOJA SIN CALORIAS/, 'salsa-de-soja-sin-calorias', 'Salsa de Soja sin calorías', null, '160 ml');
r(/^TASTE - SALSAS DULCES NATURAL - (.+?) - VEGANO •/, 'salsa-dulce-natural', 'Salsa Dulce Natural', 1, '280 g', { sinVegano: true, revisar: 'La lista dice "MIEL - VEGANO": la miel no es vegana, no se marcó como vegano.' });
r(/^TASTE - SALSAS DULCES ZERO CALORIAS - (.+?)(?: - VEGANO)? •/, 'salsa-dulce-zero-calorias', 'Salsa Dulce Zero Calorías', 1, '335 g');
r(/^UNIVERSAL - ANIMAL CREATINE/, 'animal-creatine', 'Animal Creatine', null, '300 g');
// XTRENGHT
r(/^XTRENGHT - NITROGAIN (\S+) •/, 'nitrogain', 'Nitrogain', 1, '1,5 kg', { cat: 'proteinas', ganador: true });
r(/^XTRENGHT - HYDRO BCAA (.+?) •/, 'hydro-bcaa', 'Hydro BCAA', 1, '30 servicios');
r(/^XTRENGHT - CREATINE (\d+) •/, 'creatine', 'Creatine', null, (m) => `${m[1]} g`);
r(/^XTRENGHT - NITROX •/, 'nitrox', 'Nitrox', null, '120 cápsulas', { cat: 'pre-entrenos' });
r(/^XTRENGHT - BETA ALANINE •/, 'beta-alanine', 'Beta Alanine', null, '180 cápsulas');
r(/^XTRENGHT - BCAA PRO •/, 'bcaa-pro', 'BCAA Pro', null, '120 cápsulas');
r(/^XTRENGHT - GLUTAMINE •/, 'glutamine', 'Glutamine', null, '300 g');
r(/^XTRENGHT - CUTTER •/, 'cutter', 'Cutter', null, '120 cápsulas', { cat: 'quemadores' });
r(/^XTRENGHT - CARNITINE •/, 'carnitine', 'Carnitine', null, '90 cápsulas');
r(/^XTRENGHT - XTRENGHT Best Whey 2 LBS - (.+)$/, 'best-whey', 'Best Whey', 1, '2 lb');
r(/^XTRENGHT - XTRENGHT Advanced Whey Protein 2 LBS - (.+)$/, 'advanced-whey-protein', 'Advanced Whey Protein', 1, '2 lb');

/* ------------------------------------------------------------------ */
/* 5. CATEGORÍAS Y ETIQUETAS (inferidas del nombre)                    */
/* ------------------------------------------------------------------ */
export const CATEGORIAS = [
  { slug: 'proteinas', nombre: 'Proteínas', corto: 'Proteínas', desc: 'Whey, isolate, vegetales y ganadores de peso.' },
  { slug: 'creatinas', nombre: 'Creatinas', corto: 'Creatinas', desc: 'Monohidrato, micronizada y Creapure.' },
  { slug: 'pre-entrenos', nombre: 'Pre-entrenos', corto: 'Pre-entrenos', desc: 'Fórmulas para antes de entrenar.' },
  { slug: 'aminoacidos', nombre: 'Aminoácidos', corto: 'Aminoácidos', desc: 'BCAA, glutamina, HMB y más.' },
  { slug: 'barras-y-snacks', nombre: 'Barras y snacks proteicos', corto: 'Barras y snacks', desc: 'Barras, alfajores, cookies y bebidas listas.' },
  { slug: 'hidratacion', nombre: 'Hidratación y electrolitos', corto: 'Hidratación', desc: 'Electrolitos en sobre, polvo y tabletas.' },
  { slug: 'geles-y-energia', nombre: 'Geles y energía para endurance', corto: 'Geles y energía', desc: 'Geles y carbohidratos para fondo.' },
  { slug: 'colageno', nombre: 'Colágeno', corto: 'Colágeno', desc: 'Colágeno hidrolizado y fórmulas con colágeno.' },
  { slug: 'vitaminas-y-minerales', nombre: 'Vitaminas, minerales y omega 3', corto: 'Vitaminas y omega 3', desc: 'Multivitamínicos, magnesio, omega 3 y más.' },
  { slug: 'quemadores', nombre: 'Quemadores y termogénicos', corto: 'Quemadores', desc: 'Termogénicos y L-carnitina.' },
  { slug: 'alimentos-fit', nombre: 'Alimentos y aderezos fit', corto: 'Alimentos fit', desc: 'Aderezos, salsas, pastas de maní y pancakes.' },
];

// orden de prioridad: la primera que matchea gana
const INFERENCIA = [
  ['alimentos-fit', /aderezo|salsa|crema zero|pasta de man[ií]|pancake|mct oil/i],
  ['barras-y-snacks', /\bbar\b|barra|snack|alfajor|cookies proteica|bebida proteica|protein shake/i],
  ['colageno', /col[aá]gen|collagen/i],
  ['creatinas', /creatin/i],
  ['pre-entrenos', /pre ?workout|pre war|pump|beta alan|nitrox|glicerol/i],
  ['aminoacidos', /bcaa|glutamin|\bhmb\b|amino/i],
  ['quemadores', /hydroxy|ripped|carnitin|burn|lipo gold|cutter/i],
  ['geles-y-energia', /\bgel\b|carbo energy|sportfuel/i],
  ['hidratacion', /electrol|hidrat|hydr|prosalts|recovery|reload/i],
  ['proteinas', /whey|protein|prote[ií]na|isolate|itholate|syntha|isoprot|mass|gain/i],
];
const inferirCategoria = (texto) => (INFERENCIA.find(([, re]) => re.test(texto)) ?? ['vitaminas-y-minerales'])[0];

export const OBJETIVOS = [
  { slug: 'masa-muscular', nombre: 'Ganar masa muscular' },
  { slug: 'definicion', nombre: 'Definición' },
  { slug: 'rendimiento', nombre: 'Rendimiento / endurance' },
  { slug: 'bienestar', nombre: 'Salud y bienestar' },
];
const OBJ_POR_CAT = {
  'proteinas': ['masa-muscular'], 'creatinas': ['masa-muscular', 'rendimiento'], 'pre-entrenos': ['rendimiento'],
  'aminoacidos': ['masa-muscular', 'rendimiento'], 'barras-y-snacks': ['masa-muscular'], 'hidratacion': ['rendimiento'],
  'geles-y-energia': ['rendimiento'], 'colageno': ['bienestar'], 'vitaminas-y-minerales': ['bienestar'],
  'quemadores': ['definicion'], 'alimentos-fit': ['definicion'],
};

/* ------------------------------------------------------------------ */
/* 6. ARMADO                                                           */
/* ------------------------------------------------------------------ */
function valor(spec, m) {
  if (spec == null) return null;
  if (typeof spec === 'number') return m[spec];
  if (typeof spec === 'function') return spec(m);
  return spec;
}

function autoAgrupar(marcaRaw, resto, detalle) {
  // fallback para productos nuevos que no tienen regla
  let base = resto.replace(/\s*-\s*-\s*$/, '').replace(new RegExp(`^${marcaRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i'), '');
  let sab = null;
  const partes = base.split(' - ');
  if (partes.length > 1) { sab = partes.pop(); base = partes.join(' - '); }
  return { id: slug(base), nombre: titulo(base), sab, pres: detalle ?? null, extra: {} };
}

// Productos que no se publican (sin foto ni datos confiables). Se saltean al importar.
const EXCLUIDOS = new Set(['nutremax-sportfuel', 'star-nutrition-zma', 'falux-omega-3-fish-oil']);

function main() {
  const texto = fs.readFileSync(FUENTE, 'utf8');
  const registros = parsear(texto);
  const previo = fs.existsSync(SALIDA) ? JSON.parse(fs.readFileSync(SALIDA, 'utf8')) : null;
  const previoPorId = new Map((previo?.productos ?? []).map((p) => [p.id, p]));

  const revisar = { sinRegla: [], duplicados: [], conflictosDePrecio: [], notas: [] };
  const grupos = new Map();
  const vistos = new Map(); // clave variante → variante (para detectar duplicados)

  for (const reg of registros) {
    const linea = reg.largo;
    const [marcaRaw, ...restoArr] = linea.split(' - ');
    const marcaKey = marcaRaw.toUpperCase();
    const [marcaNombre, destacada] = MARCAS[marcaKey] ?? [titulo(marcaRaw)];
    const marcaSlug = slug(marcaNombre);
    const [resto, detalle] = restoArr.join(' - ').split(' • ');

    const regla = REGLAS.find((x) => x.re.test(linea));
    let def;
    if (regla) {
      const m = linea.match(regla.re);
      def = {
        id: regla.id, nombre: regla.nombre, sab: valor(regla.sab, m), pres: valor(regla.pres, m),
        extra: { ...regla.extra, detalle: typeof regla.extra.detalle === 'function' ? regla.extra.detalle(m) : regla.extra.detalle },
      };
    } else {
      def = autoAgrupar(marcaRaw, resto, detalle);
      revisar.sinRegla.push(linea);
    }

    const productoId = `${marcaSlug}-${def.id}`;
    if (EXCLUIDOS.has(productoId)) continue;
    const saborTxt = sabor(def.sab);
    const presTxt = def.pres ?? null;
    const claveVar = `${productoId}|${saborTxt ?? ''}|${presTxt ?? ''}`;
    const mayorista = precioMayorista(reg);
    const promo = reg.badges.find((b) => /^(2x1|3x2)$/i.test(b)) ?? null;
    const vto = reg.badges.find((b) => /^Vto/i.test(b))?.replace(/^Vto\s*/i, '') ?? null;
    const oferta = reg.badges.some((b) => /^(OFERTA|2x1|3x2)$/i.test(b));

    if (def.extra.revisar) revisar.notas.push({ linea, nota: def.extra.revisar });

    if (vistos.has(claveVar)) {
      const prev = vistos.get(claveVar);
      if (prev.mayorista !== mayorista) {
        revisar.conflictosDePrecio.push({ variante: claveVar, seUso: { linea: prev.origen, mayorista: prev.mayorista }, descartada: { linea, mayorista } });
      } else {
        revisar.duplicados.push({ variante: claveVar, linea });
      }
      continue;
    }

    const textoTags = `${linea}`;
    const etiquetas = [];
    if (/sin tacc|sin gluten/i.test(textoTags)) etiquetas.push('sin-tacc');
    if (/vegan/i.test(textoTags) && !def.extra.sinVegano) etiquetas.push('vegano');

    const variante = {
      id: slug([saborTxt, presTxt].filter(Boolean).join(' ') || 'unica'),
      sabor: saborTxt,
      presentacion: presTxt,
      detalle: def.extra.detalle ?? null,
      precio: precioPublico(mayorista),
      mayorista,
      oferta,
      promoProveedor: promo,
      vtoPromo: vto,
      etiquetas,
      origen: linea,
    };
    vistos.set(claveVar, variante);

    if (!grupos.has(productoId)) {
      const cat = def.extra.cat ?? inferirCategoria(`${def.nombre} ${resto}`);
      grupos.set(productoId, {
        id: productoId,
        nombre: def.nombre,
        marca: marcaSlug,
        categoria: cat,
        ganador: !!def.extra.ganador,
        _marcaInfo: { slug: marcaSlug, nombre: marcaNombre, destacada: !!destacada },
        variantes: [],
      });
    }
    grupos.get(productoId).variantes.push(variante);
  }

  // armado final + preservación de contenido cargado a mano
  const marcas = new Map();
  const productos = [...grupos.values()].map((p) => {
    marcas.set(p._marcaInfo.slug, p._marcaInfo);
    const prev = previoPorId.get(p.id);
    const etiquetas = [...new Set(p.variantes.flatMap((v) => v.etiquetas))];
    // "categoriaFija" en productos.json pisa la categoría inferida y sobrevive a reimportaciones
    const categoria = prev?.categoriaFija ?? p.categoria;
    const variantes = p.variantes.map((v) => {
      const pv = prev?.variantes?.find((x) => x.id === v.id);
      const out = pv?.imagen ? { ...v, imagen: pv.imagen } : { ...v };
      // precio de Entreno − $1.000 (ver scripts/precios-entreno.mjs) tiene prioridad sobre mayorista × 1,4
      if (pv?.entreno) { out.entreno = pv.entreno; out.precio = Math.max(pv.entreno.precio - DESCUENTO_ENTRENO, Math.ceil((v.mayorista * 1.1) / 100) * 100); }
      // precio elegido a mano contra la competencia: se conserva mientras siga dejando ganancia
      else if (pv?.precioFijo && (pv.precioFijo.manual || pv.precio > v.mayorista)) { out.precioFijo = pv.precioFijo; out.precio = pv.precio; }
      return out;
    });
    // variantes cargadas a mano (no están en la lista mayorista): se mantienen
    for (const pv of prev?.variantes ?? []) {
      if (pv.mayorista == null && !variantes.some((v) => v.id === pv.id)) variantes.push(pv);
    }
    return {
      id: p.id,
      nombre: p.nombre,
      marca: p.marca,
      categoria,
      ...(prev?.categoriaFija ? { categoriaFija: prev.categoriaFija } : {}),
      objetivos: OBJ_POR_CAT[categoria] ?? [],
      etiquetas,
      oferta: p.variantes.some((v) => v.oferta),
      desde: Math.min(...variantes.map((v) => v.precio)),
      imagen: prev?.imagen ?? null,
      descripcion: prev?.descripcion ?? null,
      infoNutricional: prev?.infoNutricional ?? null,
      modoDeUso: prev?.modoDeUso ?? null,
      ...(p.ganador ? { subcategoria: 'Ganadores de peso' } : {}),
      variantes,
    };
  });
  // productos cargados a mano ("manual": true) no vienen en la lista: se conservan tal cual
  for (const pp of previo?.productos ?? []) {
    if (pp.manual && !productos.some((p) => p.id === pp.id)) {
      productos.push(pp);
      const m = previo.marcas?.find((x) => x.slug === pp.marca);
      if (m && !marcas.has(m.slug)) marcas.set(m.slug, m);
    }
  }

  const salida = {
    _leeme: 'Catálogo de BULK. "precio" es lo que ve el cliente. Si la variante tiene "entreno", el precio es el de entreno.com.ar − $1.000 (actualizar con: npm run precios:entreno). Si no, es mayorista × 1,4 (npm run precios). Para importar una lista nueva: npm run importar. Ver README.md.',
    generado: new Date().toISOString().slice(0, 10),
    regla: `precio = precio de entreno.com.ar − $${DESCUENTO_ENTRENO.toLocaleString('es-AR')}; si el producto no está en Entreno, mayorista × ${String(MARGEN).replace('.', ',')} redondeado hacia arriba a $100`,
    marcas: [...marcas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    categorias: CATEGORIAS,
    objetivos: OBJETIVOS,
    productos,
  };

  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, JSON.stringify(salida, null, 2) + '\n');
  fs.mkdirSync(path.dirname(REVISAR), { recursive: true });
  fs.writeFileSync(REVISAR, JSON.stringify(revisar, null, 2) + '\n');

  const nVar = productos.reduce((n, p) => n + p.variantes.length, 0);
  console.log(`✔ ${registros.length} líneas leídas → ${productos.length} productos / ${nVar} variantes / ${marcas.size} marcas`);
  console.log(`  duplicados descartados: ${revisar.duplicados.length} · conflictos de precio: ${revisar.conflictosDePrecio.length} · sin regla: ${revisar.sinRegla.length}`);
  if (revisar.sinRegla.length) console.log('  ⚠ sin regla (agrupados automáticamente):\n   - ' + revisar.sinRegla.join('\n   - '));
  console.log(`  → ${path.relative(ROOT, SALIDA)}  ·  ${path.relative(ROOT, REVISAR)}`);
}

main();

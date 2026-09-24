/**
 * Carrito persistente (localStorage). Emite "carrito:cambio" en window cada vez que cambia.
 * Item: { key, tipo: 'producto'|'combo', productoId, varianteId, nombre, marca, variante, precio, cantidad, url, contenido? }
 */
const KEY = 'bulk:carrito:v1';
const CODIGO_KEY = 'bulk:codigo:v1';

function leerRaw(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function escribirRaw(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* modo privado: queda en memoria */ }
}

let memoria = leerRaw(KEY, []);

export const leer = () => memoria.map((i) => ({ ...i }));

function guardar(items) {
  memoria = items;
  escribirRaw(KEY, items);
  window.dispatchEvent(new CustomEvent('carrito:cambio', { detail: leer() }));
}

export function agregar(item, cantidad = 1) {
  const items = leer();
  const ex = items.find((i) => i.key === item.key);
  if (ex) ex.cantidad = Math.min(99, ex.cantidad + cantidad);
  else items.push({ ...item, cantidad: Math.min(99, cantidad) });
  guardar(items);
  window.dispatchEvent(new CustomEvent('carrito:agregado', { detail: { ...item, cantidad } }));
}

export function setCantidad(key, n) {
  const items = leer();
  const it = items.find((i) => i.key === key);
  if (!it) return;
  if (n <= 0) return quitar(key);
  it.cantidad = Math.min(99, n);
  guardar(items);
}

export const quitar = (key) => guardar(leer().filter((i) => i.key !== key));
export const vaciar = () => guardar([]);
export const cantidadTotal = () => memoria.reduce((s, i) => s + i.cantidad, 0);

/** Código de bienvenida guardado (email + código), para precargar el checkout */
export const leerCodigo = () => leerRaw(CODIGO_KEY, null);
export const guardarCodigo = (v) => escribirRaw(CODIGO_KEY, v);

/** Actualiza precios con el catálogo publicado y saca lo que ya no existe. Devuelve nombres quitados. */
let indicePromesa = null;
export function cargarIndice() {
  indicePromesa ??= fetch('/catalogo.json').then((r) => r.json()).catch(() => null);
  return indicePromesa;
}

export async function sincronizar() {
  const idx = await cargarIndice();
  if (!idx) return [];
  const prods = new Map(idx.p.map((p) => [p.id, p]));
  const combos = new Map(idx.k.map((c) => [c.id, c]));
  const quitados = [];
  let cambio = false;
  const items = leer().filter((it) => {
    if (it.tipo === 'combo') {
      const c = combos.get(it.productoId);
      if (!c || !c.listo) { quitados.push(it.nombre); return false; }
      if (c.precio !== it.precio) { it.precio = c.precio; cambio = true; }
      return true;
    }
    const p = prods.get(it.productoId);
    const v = p?.v.find((x) => x[0] === it.varianteId);
    if (!v) { quitados.push(it.nombre); return false; }
    if (v[3] !== it.precio) { it.precio = v[3]; cambio = true; }
    return true;
  });
  if (cambio || quitados.length) guardar(items);
  return quitados;
}

// sincroniza entre pestañas
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    memoria = leerRaw(KEY, []);
    window.dispatchEvent(new CustomEvent('carrito:cambio', { detail: leer() }));
  }
});

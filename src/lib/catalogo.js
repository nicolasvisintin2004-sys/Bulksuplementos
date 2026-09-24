// Helpers de catálogo para el build (páginas estáticas).
import data from '../data/productos.json';
import combosData from '../data/combos.json';
import negocio from '../config/negocio.js';

export const productos = data.productos;
export const marcas = data.marcas;
export const categorias = data.categorias;
export const objetivos = data.objetivos;

const marcaPorSlug = new Map(marcas.map((m) => [m.slug, m]));
const catPorSlug = new Map(categorias.map((c) => [c.slug, c]));
const prodPorId = new Map(productos.map((p) => [p.id, p]));

export const marca = (slug) => marcaPorSlug.get(slug);
export const categoria = (slug) => catPorSlug.get(slug);
export const producto = (id) => prodPorId.get(id);
export const urlProducto = (p) => `/producto/${p.id}/`;

export const ICONO_CATEGORIA = {
  'proteinas': 'dumbbell', 'creatinas': 'spark', 'pre-entrenos': 'bolt', 'aminoacidos': 'target',
  'barras-y-snacks': 'tag', 'hidratacion': 'drop', 'geles-y-energia': 'run', 'colageno': 'shield',
  'vitaminas-y-minerales': 'heart', 'quemadores': 'fire', 'alimentos-fit': 'leaf',
};

export const contarPorCategoria = (slug) => productos.filter((p) => p.categoria === slug).length;
export const contarPorMarca = (slug) => productos.filter((p) => p.marca === slug).length;

/** Ofertas: productos con OFERTA / 2x1 / 3x2 en la lista del proveedor */
export const enOferta = () => productos.filter((p) => p.oferta);

export const masVendidos = () => (negocio.masVendidos ?? []).map(producto).filter(Boolean);

/** Resumen de variantes para cards: "4 sabores · 2 tamaños" */
export function resumenVariantes(p) {
  const sabores = new Set(p.variantes.map((v) => v.sabor).filter(Boolean));
  const pres = new Set(p.variantes.map((v) => v.presentacion).filter(Boolean));
  const partes = [];
  if (sabores.size > 1) partes.push(`${sabores.size} sabores`);
  else if (sabores.size === 1 && p.variantes.length === 1) partes.push([...sabores][0]);
  if (pres.size > 1) partes.push(`${pres.size} presentaciones`);
  else if (pres.size === 1) partes.push([...pres][0]);
  return partes.join(' · ');
}

/** Relacionados: misma categoría, primero de otras marcas, luego de la misma */
export function relacionados(p, n = 4) {
  const misma = productos.filter((x) => x.categoria === p.categoria && x.id !== p.id);
  const otras = misma.filter((x) => x.marca !== p.marca);
  const propias = misma.filter((x) => x.marca === p.marca);
  // orden estable pero variado según el producto
  const semilla = [...p.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const rotar = (arr) => arr.length ? [...arr.slice(semilla % arr.length), ...arr.slice(0, semilla % arr.length)] : arr;
  return [...rotar(otras), ...rotar(propias)].slice(0, n);
}

/** Combos con sus productos resueltos. listo = tiene items cargados. */
export function combos() {
  return combosData.combos.map((c) => {
    const items = (c.items ?? []).map((it) => {
      const p = producto(it.producto);
      const v = p?.variantes.find((x) => x.id === it.variante) ?? p?.variantes[0];
      return p && v ? { producto: p, variante: v, cantidad: it.cantidad ?? 1 } : null;
    }).filter(Boolean);
    const suma = items.reduce((s, i) => s + i.variante.precio * i.cantidad, 0);
    return { ...c, itemsResueltos: items, listo: items.length > 0, precioFinal: c.precio ?? suma, suma };
  });
}

/** Índice liviano para buscador, carrito y combos en el navegador */
export function indiceCliente() {
  return productos.map((p) => ({
    id: p.id,
    n: p.nombre,
    m: marca(p.marca)?.nombre ?? p.marca,
    c: categoria(p.categoria)?.corto ?? p.categoria,
    d: p.desde,
    o: p.oferta ? 1 : 0,
    v: p.variantes.map((v) => [v.id, v.sabor ?? '', v.presentacion ?? '', v.precio]),
  }));
}

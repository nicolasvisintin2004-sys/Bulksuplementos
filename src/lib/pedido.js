/**
 * Arma el mensaje del pedido (texto plano) y los links para mandarlo
 * por Instagram (mensaje directo) o por email. No se usa WhatsApp.
 */
import negocio from '../config/negocio.js';
import { pesos } from './formato.js';

export function numeroPedido() {
  const d = new Date();
  const f = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BK-${f}-${r}`;
}

export function mensajePedido({ numero, items, totales, datos, codigo }) {
  const L = [];
  L.push('NUEVO PEDIDO · BULK');
  L.push(`Pedido ${numero}`);
  L.push('');
  L.push('PRODUCTOS');
  for (const it of items) {
    const variante = it.variante ? ` — ${it.variante}` : '';
    L.push(`• ${it.cantidad} × ${it.marca ? it.marca + ' ' : ''}${it.nombre}${variante}`);
    L.push(`   ${pesos(it.precio)} c/u = ${pesos(it.precio * it.cantidad)}`);
    if (it.contenido?.length) for (const c of it.contenido) L.push(`   · ${c}`);
  }
  L.push('');
  L.push(`Subtotal: ${pesos(totales.subtotal)}`);
  for (const d of totales.descuentos) {
    L.push(`${d.etiqueta}${d.tipo === 'bienvenida' && codigo ? ` [${codigo}]` : ''}: -${pesos(d.monto)}`);
  }
  if (totales.codigoGuardado && codigo) L.push(`(Código ${codigo} no aplicado: los descuentos no se acumulan. Queda para otra compra.)`);
  L.push(`TOTAL: ${pesos(totales.total)}`);
  L.push('');
  L.push('ENTREGA');
  if (datos.entrega === 'retiro') {
    L.push(`Retiro en el local (${negocio.direccion.calle}, ${negocio.direccion.localidad})`);
  } else {
    L.push(`Envío a domicilio · ${datos.empresa || 'empresa a coordinar'}`);
    L.push(`${datos.direccion}, ${datos.localidad}, ${datos.provincia} (CP ${datos.cp})`);
    L.push(totales.envioGratis ? 'Envío: GRATIS' : 'Envío: a cotizar');
  }
  L.push('');
  L.push(`PAGO: ${datos.medioPago === 'efectivo' ? 'Efectivo en el local' : 'Transferencia bancaria'}`);
  L.push('');
  L.push('MIS DATOS');
  L.push(`${datos.nombre}`);
  L.push(`Tel: ${datos.telefono}`);
  if (datos.email) L.push(`Email: ${datos.email}`);
  if (datos.notas) { L.push(''); L.push(`Notas: ${datos.notas}`); }
  return L.join('\n');
}

/** Chat directo de Instagram (el texto no se puede precargar: se copia al portapapeles antes) */
export const linkInstagram = () => negocio.instagram.dm;

/** Email con el pedido ya escrito */
export function linkEmail(numero, texto) {
  const asunto = encodeURIComponent(`Pedido ${numero} · BULK`);
  const cuerpo = encodeURIComponent(texto.replace(/\n/g, '\r\n'));
  return `mailto:${negocio.email}?subject=${asunto}&body=${cuerpo}`;
}

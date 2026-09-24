/**
 * PLANTILLAS DE EMAIL — BULK (negro + lima)
 * Única fuente de las dos plantillas:
 *   - bienvenidaHtml(): la usa la función /api/suscribir para mandar el código.
 *   - ofertasHtml(): plantilla de campaña reutilizable.
 * `npm run emails` genera emails/bienvenida.html y emails/ofertas.html con variables de Brevo
 * listas para pegar en Brevo (Campaigns → Email → "Paste your code").
 *
 * HTML de email: tablas + estilos en línea (así lo leen Gmail, Outlook y Apple Mail).
 */
import negocio from '../src/config/negocio.js';

const D = negocio.direccion;
const IG = negocio.instagram;
const C = { ink: '#0a0a0a', ink2: '#141414', line: '#2a2a2a', paper: '#f3f3ef', soft: '#b9b9b4', mute: '#8a8a8a', lime: '#c8ff00' };
const DISPLAY = "font-family:'Arial Black',Impact,'Helvetica Neue',Arial,sans-serif;font-style:italic;font-weight:900;text-transform:uppercase;letter-spacing:.5px;";
const BODY = "font-family:Helvetica,Arial,sans-serif;";
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function marco({ preheader, contenido, pie }) {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>BULK</title></head>
<body style="margin:0;padding:0;background:${C.ink};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ink};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${C.ink};border:1px solid ${C.line};border-radius:18px;overflow:hidden;">
  <tr><td style="height:6px;background:${C.lime};font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr><td style="padding:28px 32px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="${DISPLAY}font-size:30px;color:${C.lime};">BULK</td>
      <td align="right" style="${BODY}font-size:10px;letter-spacing:3px;color:${C.soft};text-transform:uppercase;">Suplementos y<br>nutrición deportiva</td>
    </tr></table>
  </td></tr>
  ${contenido}
  <tr><td style="padding:24px 32px 30px;border-top:1px solid ${C.line};${BODY}font-size:12px;line-height:18px;color:${C.mute};">
    ${pie}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const boton = (href, texto) => `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:${C.lime};">
<a href="${href}" style="display:inline-block;padding:15px 30px;${BODY}font-size:15px;font-weight:800;color:${C.ink};text-decoration:none;border-radius:999px;">${texto}</a></td></tr></table>`;

const beneficios = () => `<tr><td style="padding:8px 32px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:14px;">
<tr>
  <td width="33%" align="center" style="padding:14px 6px;${BODY}font-size:11px;color:${C.soft};text-transform:uppercase;letter-spacing:1px;">Envíos a<br><b style="${DISPLAY}font-size:14px;color:${C.lime};">todo el país</b></td>
  <td width="34%" align="center" style="padding:14px 6px;border-left:1px solid ${C.line};border-right:1px solid ${C.line};${BODY}font-size:11px;color:${C.soft};text-transform:uppercase;letter-spacing:1px;">Envío gratis<br><b style="${DISPLAY}font-size:14px;color:${C.lime};">desde $100.000</b></td>
  <td width="33%" align="center" style="padding:14px 6px;${BODY}font-size:11px;color:${C.soft};text-transform:uppercase;letter-spacing:1px;">Efectivo en el local<br><b style="${DISPLAY}font-size:14px;color:${C.lime};">10% OFF</b></td>
</tr></table></td></tr>`;

const pieComun = (sitio, baja) => `BULK · ${D.calle}, ${D.localidad}, ${D.provincia} ·
<a href="${IG.url}" style="color:${C.lime};text-decoration:none;">@${IG.usuario}</a> · <a href="mailto:${negocio.email}" style="color:${C.lime};text-decoration:none;">${negocio.email}</a><br>
Consultá con un profesional de la salud antes de consumir suplementos.<br><br>
<a href="${baja}" style="color:${C.soft};text-decoration:underline;">Darme de baja de los emails</a> · <a href="${sitio}" style="color:${C.soft};text-decoration:underline;">Visitar la tienda</a>`;

/** Mail de bienvenida con el código de 10% OFF */
export function bienvenidaHtml({ codigo, nombre = '', sitio = 'https://example.com', baja } = {}) {
  const saludo = nombre ? `¡Hola, ${esc(nombre)}!` : '¡Hola!';
  const contenido = `
  <tr><td style="padding:24px 32px 6px;">
    <p style="margin:0 0 6px;${BODY}font-size:12px;font-weight:700;letter-spacing:3px;color:${C.lime};text-transform:uppercase;">Primera compra</p>
    <p style="margin:0;${DISPLAY}font-size:64px;line-height:60px;color:${C.lime};">10% OFF</p>
  </td></tr>
  <tr><td style="padding:14px 32px 0;${BODY}font-size:16px;line-height:25px;color:${C.paper};">
    ${saludo} Gracias por sumarte a BULK. Este es tu código de descuento para la primera compra:
  </td></tr>
  <tr><td style="padding:22px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px dashed ${C.lime};border-radius:14px;background:#1a2200;">
      <tr><td align="center" style="padding:22px 12px;${DISPLAY}font-size:30px;letter-spacing:3px;color:${C.lime};">${esc(codigo)}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 32px 8px;${BODY}font-size:14px;line-height:22px;color:${C.soft};">
    <b style="color:${C.paper};">Cómo usarlo:</b> armá tu carrito en la web, cargá el código en "Código de descuento" con este mismo email y mandanos el pedido por Instagram o por email. Vale una sola vez.
  </td></tr>
  <tr><td style="padding:18px 32px 26px;">${boton(`${sitio}/tienda/`, 'Armar mi pedido →')}</td></tr>
  ${beneficios()}`;
  return marco({
    preheader: `Tu código ${codigo}: 10% OFF en tu primera compra en BULK.`,
    contenido,
    pie: pieComun(sitio, baja ?? `${sitio}/baja/`),
  });
}

/**
 * Plantilla de campaña de ofertas. `productos`: [{ marca, nombre, detalle, precio, url }]
 * Por defecto deja las variables de Brevo para editar título y bajada desde Brevo.
 */
export function ofertasHtml({ titulo = 'Ofertas de la semana', bajada = 'Seleccionamos estos productos para vos.', productos = [], sitio = 'https://example.com', baja = '{{ unsubscribe }}' } = {}) {
  const celdas = productos.slice(0, 4).map((p) => `
    <td width="50%" valign="top" style="padding:6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:14px;background:${C.ink2};">
        <tr><td style="padding:18px 18px 4px;${BODY}font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${C.mute};">${esc(p.marca)}</td></tr>
        <tr><td style="padding:0 18px;${BODY}font-size:15px;line-height:20px;font-weight:800;color:${C.paper};">${esc(p.nombre)}</td></tr>
        <tr><td style="padding:4px 18px 0;${BODY}font-size:12px;color:${C.mute};">${esc(p.detalle)}</td></tr>
        <tr><td style="padding:12px 18px 4px;${DISPLAY}font-size:22px;color:${C.lime};">${esc(p.precio)}</td></tr>
        <tr><td style="padding:6px 18px 18px;"><a href="${p.url}" style="${BODY}font-size:13px;font-weight:800;color:${C.lime};text-decoration:none;">Ver producto →</a></td></tr>
      </table>
    </td>`);
  const filas = [];
  for (let i = 0; i < celdas.length; i += 2) filas.push(`<tr>${celdas[i]}${celdas[i + 1] ?? '<td width="50%"></td>'}</tr>`);
  const contenido = `
  <tr><td style="padding:24px 32px 6px;">
    <p style="margin:0 0 8px;${BODY}font-size:12px;font-weight:700;letter-spacing:3px;color:${C.lime};text-transform:uppercase;">Ofertas</p>
    <p style="margin:0;${DISPLAY}font-size:44px;line-height:44px;color:${C.paper};">${esc(titulo)}</p>
  </td></tr>
  <tr><td style="padding:14px 32px 18px;${BODY}font-size:15px;line-height:23px;color:${C.soft};">${esc(bajada)}</td></tr>
  <tr><td style="padding:0 26px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filas.join('')}</table></td></tr>
  <tr><td style="padding:14px 32px 26px;">${boton(`${sitio}/tienda/?oferta=1`, 'Ver todas las ofertas →')}</td></tr>
  ${beneficios()}`;
  return marco({ preheader: `${titulo} en BULK.`, contenido, pie: pieComun(sitio, baja) });
}

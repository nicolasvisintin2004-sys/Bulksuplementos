/**
 * POST /api/suscribir  { email, nombre?, consentimiento }
 * Genera un código único de bienvenida, crea el contacto en Brevo (a la lista de ofertas
 * sólo si dio consentimiento) y le manda el mail de bienvenida con el código.
 * Respuestas: 200 { ok, codigo, emailEnviado } · 409 { yaRegistrado: true } · 4xx/5xx { ok: false }
 */
import crypto from 'node:crypto';
import { brevo, json, leerJson, emailValido, configurado, obtenerContacto } from '../lib/brevo.mjs';
import { bienvenidaHtml } from '../../emails/plantillas.mjs';

const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para que no se confundan
const nuevoCodigo = () => 'BULK10-' + [...crypto.randomBytes(6)].map((b) => ABC[b % ABC.length]).join('');

export default async (req) => {
  const body = await leerJson(req);
  if (!body) return json({ ok: false, error: 'Pedido inválido' }, 400);
  const email = String(body.email ?? '').trim().toLowerCase();
  const nombre = String(body.nombre ?? '').trim().slice(0, 60);
  const consentimiento = body.consentimiento === true;
  if (!emailValido(email)) return json({ ok: false, error: 'Email inválido' }, 400);
  if (!configurado()) return json({ ok: false, error: 'no-configurado' }, 503);

  // ¿ya tiene código? → uno por email
  const existente = await obtenerContacto(email);
  if (existente?.attributes?.CODIGO_BIENVENIDA) return json({ ok: false, yaRegistrado: true }, 409);

  const codigo = nuevoCodigo();
  const listId = Number(process.env.BREVO_LIST_ID);
  const attributes = { CODIGO_BIENVENIDA: codigo, CODIGO_USADO: false, ...(nombre ? { FIRSTNAME: nombre } : {}) };

  const r = existente
    ? await brevo(`/contacts/${encodeURIComponent(email)}`, { method: 'PUT', body: { attributes, ...(consentimiento && listId ? { listIds: [listId] } : {}) } })
    : await brevo('/contacts', { method: 'POST', body: { email, attributes, ...(consentimiento && listId ? { listIds: [listId] } : {}), updateEnabled: false } });
  if (!r.ok) {
    console.error('Brevo contacto', r.status, r.data);
    return json({ ok: false, error: 'No se pudo registrar' }, 502);
  }

  // mail de bienvenida con el código (transaccional: le llega aunque no acepte ofertas)
  let emailEnviado = false;
  const sender = process.env.BREVO_SENDER_EMAIL;
  if (sender) {
    const sitio = process.env.URL || 'https://example.com';
    const tpl = Number(process.env.BREVO_TEMPLATE_BIENVENIDA);
    const payload = tpl
      ? { to: [{ email, ...(nombre ? { name: nombre } : {}) }], templateId: tpl, params: { CODIGO: codigo, NOMBRE: nombre, SITIO: sitio } }
      : {
          sender: { email: sender, name: process.env.BREVO_SENDER_NAME || 'BULK' },
          to: [{ email, ...(nombre ? { name: nombre } : {}) }],
          subject: `Tu 10% OFF en BULK: ${codigo}`,
          htmlContent: bienvenidaHtml({ codigo, nombre, sitio }),
        };
    const m = await brevo('/smtp/email', { method: 'POST', body: payload });
    emailEnviado = m.ok;
    if (!m.ok) console.error('Brevo email', m.status, m.data);
  }

  return json({ ok: true, codigo, emailEnviado });
};

export const config = { path: '/api/suscribir' };

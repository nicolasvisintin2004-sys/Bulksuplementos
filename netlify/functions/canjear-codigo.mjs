/**
 * POST /api/canjear-codigo  { email, codigo, pedido }
 * Marca el código como usado cuando se envía un pedido que lo aplica.
 */
import { brevo, json, leerJson, configurado, validarCodigo } from '../lib/brevo.mjs';

export default async (req) => {
  const body = await leerJson(req);
  if (!body) return json({ ok: false }, 400);
  if (!configurado()) return json({ ok: false, error: 'no-configurado' }, 503);
  const email = String(body.email ?? '').trim().toLowerCase();
  const codigo = String(body.codigo ?? '').trim().toUpperCase();
  const pedido = String(body.pedido ?? '').slice(0, 40);

  const v = await validarCodigo(email, codigo);
  if (!v.valido) return json({ ok: false, ...v }, 409);

  const r = await brevo(`/contacts/${encodeURIComponent(email)}`, {
    method: 'PUT',
    body: { attributes: { CODIGO_USADO: true, ...(pedido ? { PEDIDO_CODIGO: pedido } : {}) } },
  });
  return json({ ok: r.ok }, r.ok ? 200 : 502);
};

export const config = { path: '/api/canjear-codigo' };

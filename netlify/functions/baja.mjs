/**
 * POST /api/baja  { email }
 * Da de baja al contacto de los emails de ofertas (lo bloquea para campañas en Brevo).
 * Siempre responde ok para no revelar qué emails están registrados.
 */
import { brevo, json, leerJson, emailValido, configurado } from '../lib/brevo.mjs';

export default async (req) => {
  const body = await leerJson(req);
  const email = String(body?.email ?? '').trim().toLowerCase();
  if (!emailValido(email)) return json({ ok: false, error: 'Email inválido' }, 400);
  if (!configurado()) return json({ ok: false, error: 'no-configurado' }, 503);
  const r = await brevo(`/contacts/${encodeURIComponent(email)}`, { method: 'PUT', body: { emailBlacklisted: true } });
  if (!r.ok && r.status !== 404) console.error('Brevo baja', r.status, r.data);
  return json({ ok: true });
};

export const config = { path: '/api/baja' };

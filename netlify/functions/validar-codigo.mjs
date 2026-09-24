/**
 * POST /api/validar-codigo  { email, codigo }  →  { valido, motivo? }
 */
import { json, leerJson, configurado, validarCodigo } from '../lib/brevo.mjs';

export default async (req) => {
  const body = await leerJson(req);
  if (!body) return json({ valido: false, motivo: 'Pedido inválido' }, 400);
  if (!configurado()) return json({ error: 'no-configurado' }, 503);
  const email = String(body.email ?? '').trim().toLowerCase();
  const codigo = String(body.codigo ?? '').trim().toUpperCase();
  return json(await validarCodigo(email, codigo));
};

export const config = { path: '/api/validar-codigo' };

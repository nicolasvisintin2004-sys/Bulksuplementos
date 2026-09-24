/**
 * Cliente mínimo de Brevo (ex Sendinblue). La clave vive en variables de entorno de Netlify,
 * nunca en el navegador.
 *
 * Variables (Netlify → Site configuration → Environment variables):
 *   BREVO_API_KEY               clave API v3 de Brevo                          (obligatoria)
 *   BREVO_LIST_ID               id numérico de la lista de ofertas            (obligatoria)
 *   BREVO_SENDER_EMAIL          remitente verificado en Brevo                 (obligatoria para enviar el mail)
 *   BREVO_SENDER_NAME           nombre del remitente, ej. "BULK"              (opcional)
 *   BREVO_TEMPLATE_BIENVENIDA   id de plantilla transaccional en Brevo        (opcional; si no, se usa emails/plantillas.mjs)
 *
 * Atributos de contacto a crear en Brevo (Contacts → Settings → Contact attributes):
 *   CODIGO_BIENVENIDA (Text) · CODIGO_USADO (Boolean) · PEDIDO_CODIGO (Text)
 */
const API = 'https://api.brevo.com/v3';

export const configurado = () => Boolean(process.env.BREVO_API_KEY);

export async function brevo(path, { method = 'GET', body } = {}) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'accept': 'application/json',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { ok: r.ok, status: r.status, data };
}

export const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export const emailValido = (e) => typeof e === 'string' && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
export const codigoValido = (c) => typeof c === 'string' && /^BULK10-[A-Z0-9]{6}$/.test(c);

export async function leerJson(req) {
  if (req.method !== 'POST') return null;
  try { return await req.json(); } catch { return null; }
}

export async function obtenerContacto(email) {
  const r = await brevo(`/contacts/${encodeURIComponent(email)}`);
  return r.ok ? r.data : null;
}

/** El código tiene que ser el del email y no haber sido usado. */
export async function validarCodigo(email, codigo) {
  if (!emailValido(email) || !codigoValido(codigo)) return { valido: false, motivo: 'El código no es válido.' };
  const c = await obtenerContacto(email);
  const a = c?.attributes ?? {};
  if (!a.CODIGO_BIENVENIDA || a.CODIGO_BIENVENIDA !== codigo) {
    return { valido: false, motivo: 'Ese código no corresponde a este email. Usá el mismo email con el que te registraste.' };
  }
  if (a.CODIGO_USADO === true) return { valido: false, motivo: 'Este código ya se usó. El descuento de bienvenida es uno por email.' };
  return { valido: true };
}

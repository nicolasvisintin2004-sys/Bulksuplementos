// Índice liviano del catálogo para el navegador (buscador, carrito, combos).
import { indiceCliente, combos } from '../lib/catalogo.js';

export function GET() {
  const k = combos().map((c) => ({
    id: c.id,
    listo: c.listo,
    precio: c.precioFinal,
  }));
  return new Response(JSON.stringify({ p: indiceCliente(), k }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

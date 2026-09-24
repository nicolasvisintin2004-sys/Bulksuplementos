/**
 * Reglas de descuentos y envío. Se usa en el carrito (navegador) y en el mensaje del pedido,
 * así que el cálculo que ve el cliente y el que recibe el local es siempre el mismo.
 */
import negocio from '../config/negocio.js';

const cfg = negocio.descuentos;

/** Valores efectivos: si un dato falta (null) se usa el comportamiento por defecto documentado en negocio.js */
export const reglas = {
  efectivoPct: cfg.efectivoPct,
  bienvenidaPct: cfg.bienvenidaPct,
  acumulables: cfg.acumulables ?? false,
  envioGratisCalculo: cfg.envioGratisCalculo ?? 'antes',
  efectivoSoloRetiro: cfg.efectivoSoloRetiro ?? false,
  gratisDesde: negocio.envios.gratisDesde,
};

/**
 * @param {object} p
 * @param {{precio:number,cantidad:number}[]} p.items
 * @param {'transferencia'|'efectivo'|null} p.medioPago
 * @param {'envio'|'retiro'|null} p.entrega
 * @param {boolean} p.codigoValido  código de bienvenida validado
 */
export function calcularTotales({ items, medioPago = null, entrega = null, codigoValido = false }) {
  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const efectivoPermitido = !(reglas.efectivoSoloRetiro && entrega === 'envio');
  const aplicaEfectivo = medioPago === 'efectivo' && efectivoPermitido;
  let aplicaBienvenida = !!codigoValido;
  let codigoGuardado = false;

  // Si no se acumulan y aplican los dos, se usa el de efectivo y el código queda para otra compra.
  if (aplicaEfectivo && aplicaBienvenida && !reglas.acumulables) {
    aplicaBienvenida = false;
    codigoGuardado = true;
  }

  const descuentos = [];
  if (aplicaEfectivo) {
    descuentos.push({ tipo: 'efectivo', etiqueta: `Pago en efectivo (${reglas.efectivoPct}% OFF)`, monto: Math.round(subtotal * reglas.efectivoPct / 100) });
  }
  if (aplicaBienvenida) {
    descuentos.push({ tipo: 'bienvenida', etiqueta: `Primera compra (${reglas.bienvenidaPct}% OFF)`, monto: Math.round(subtotal * reglas.bienvenidaPct / 100) });
  }
  const totalDescuentos = descuentos.reduce((s, d) => s + d.monto, 0);
  const total = subtotal - totalDescuentos;

  const baseEnvio = reglas.envioGratisCalculo === 'despues' ? total : subtotal;
  const envioGratis = baseEnvio >= reglas.gratisDesde;
  const faltaParaGratis = Math.max(0, reglas.gratisDesde - baseEnvio);

  // Lo que ahorraría pagando en efectivo (para mostrarlo como beneficio)
  const ahorroEfectivo = efectivoPermitido ? Math.round(subtotal * reglas.efectivoPct / 100) : 0;

  return {
    subtotal, descuentos, totalDescuentos, total,
    envioGratis, faltaParaGratis, baseEnvio,
    ahorroEfectivo, efectivoPermitido, aplicaEfectivo, aplicaBienvenida, codigoGuardado,
  };
}

/** Precio con el 10% efectivo aplicado (para fichas y cards) */
export const precioEfectivo = (precio) => Math.round(precio * (1 - reglas.efectivoPct / 100));

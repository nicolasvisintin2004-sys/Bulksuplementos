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
  margenMinimoPct: cfg.margenMinimoPct ?? 5,
  gratisDesde: negocio.envios.gratisDesde,
};

/** Redondea a la centena más cercana (27.351 → 27.400, 27.349 → 27.300) */
export const redondear100 = (n) => Math.round(n / 100) * 100;

/** Precio mínimo de una variante con descuentos: costo mayorista + margenMinimoPct (0 si no se conoce el costo) */
export const minimoDe = (costo) => (costo ? Math.ceil(costo * (1 + reglas.margenMinimoPct / 100) / 100) * 100 : 0);

/** Código de referido (influencer) que coincide con el texto, o null */
export const buscarReferido = (codigo) => {
  const c = String(codigo ?? '').trim().toUpperCase();
  return (negocio.referidos ?? []).find((r) => r.codigo.toUpperCase() === c) ?? null;
};

/** Precio con el descuento en efectivo, redondeado a la centena y sin bajar del mínimo de la variante */
export const precioEfectivo = (precio, min = 0) =>
  Math.min(precio, Math.max(redondear100(precio * (1 - reglas.efectivoPct / 100)), min));

/**
 * Aplica los descuentos en orden, línea por línea: cada uno se calcula sobre el precio ya rebajado
 * y ninguna línea baja de su mínimo. Con efectivo, el total queda redondeado a la centena.
 */
function aplicarDescuentos(items, pasos, redondear) {
  const lineas = items.map((i) => {
    const v = i.precio * i.cantidad;
    return { v, min: Math.min((i.min ?? 0) * i.cantidad, v) };
  });
  const subtotal = lineas.reduce((s, l) => s + l.v, 0);
  const minTotal = lineas.reduce((s, l) => s + l.min, 0);
  let tope = false;
  const descuentos = pasos.map((p) => {
    let monto = 0;
    for (const l of lineas) {
      const ideal = l.v * (1 - p.pct / 100);
      const nuevo = Math.max(ideal, l.min);
      if (nuevo > ideal) tope = true;
      monto += l.v - nuevo;
      l.v = nuevo;
    }
    return { tipo: p.tipo, etiqueta: p.etiqueta, monto };
  });
  const bruto = lineas.reduce((s, l) => s + l.v, 0);
  let total = Math.round(bruto);
  if (redondear && descuentos.length) {
    total = redondear100(bruto);
    if (total < minTotal) total = Math.ceil(bruto / 100) * 100;
    total = Math.min(total, subtotal);
  }
  // montos enteros que suman exactamente subtotal − total (el redondeo lo absorbe el último)
  descuentos.forEach((d) => { d.monto = Math.round(d.monto); });
  if (descuentos.length) {
    const otros = descuentos.slice(0, -1).reduce((s, d) => s + d.monto, 0);
    descuentos[descuentos.length - 1].monto = subtotal - total - otros;
  }
  return { subtotal, total, tope, descuentos: descuentos.filter((d) => d.monto > 0) };
}

/**
 * @param {object} p
 * @param {{precio:number,cantidad:number,min?:number}[]} p.items  min = precio mínimo por unidad (minimoDe)
 * @param {'transferencia'|'efectivo'|null} p.medioPago
 * @param {'envio'|'retiro'|null} p.entrega
 * @param {boolean} p.codigoValido  código de bienvenida validado
 * @param {{codigo:string,pct:number,acumulaEfectivo?:boolean}|null} p.referido  código de referido (buscarReferido)
 */
export function calcularTotales({ items, medioPago = null, entrega = null, codigoValido = false, referido = null }) {
  const efectivoPermitido = !(reglas.efectivoSoloRetiro && entrega === 'envio');
  const aplicaEfectivo = medioPago === 'efectivo' && efectivoPermitido;
  let aplicaBienvenida = !!codigoValido;
  let codigoGuardado = false;
  let aplicaReferido = !!referido;
  let referidoNoAcumulado = false;

  // Si no se acumulan y aplican los dos, se usa el de efectivo y el código queda para otra compra.
  if (aplicaEfectivo && aplicaBienvenida && !reglas.acumulables) {
    aplicaBienvenida = false;
    codigoGuardado = true;
  }
  // El código de referido que no se acumula: con efectivo se aplica un solo descuento (el de efectivo).
  if (aplicaEfectivo && aplicaReferido && !referido.acumulaEfectivo) {
    aplicaReferido = false;
    referidoNoAcumulado = true;
  }

  const pasoEfectivo = { tipo: 'efectivo', etiqueta: `Pago en efectivo (${reglas.efectivoPct}% OFF)`, pct: reglas.efectivoPct };
  const pasos = [];
  if (aplicaEfectivo) pasos.push(pasoEfectivo);
  // acumulado: el 10% de bienvenida se calcula sobre el precio ya rebajado por efectivo (10% + 10% = 19%)
  if (aplicaBienvenida) pasos.push({ tipo: 'bienvenida', etiqueta: `Primera compra (${reglas.bienvenidaPct}% OFF)`, pct: reglas.bienvenidaPct });
  if (aplicaReferido) pasos.push({ tipo: 'referido', etiqueta: `Código ${referido.codigo} (${referido.pct}% OFF)`, pct: referido.pct });

  const { subtotal, total, tope, descuentos } = aplicarDescuentos(items, pasos, aplicaEfectivo);
  const totalDescuentos = subtotal - total;

  const baseEnvio = reglas.envioGratisCalculo === 'despues' ? total : subtotal;
  const envioGratis = baseEnvio >= reglas.gratisDesde;
  const faltaParaGratis = Math.max(0, reglas.gratisDesde - baseEnvio);

  // Lo que ahorraría pagando en efectivo (para mostrarlo como beneficio)
  const ahorroEfectivo = efectivoPermitido ? subtotal - aplicarDescuentos(items, [pasoEfectivo], true).total : 0;

  return {
    subtotal, descuentos, totalDescuentos, total,
    envioGratis, faltaParaGratis, baseEnvio,
    ahorroEfectivo, efectivoPermitido, aplicaEfectivo, aplicaBienvenida, codigoGuardado,
    aplicaReferido, referidoNoAcumulado, topeAplicado: tope && pasos.length > 0,
  };
}

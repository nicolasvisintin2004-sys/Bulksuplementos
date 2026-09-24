/**
 * Preguntas frecuentes de la tienda. `falta` = dato que todavía no está definido:
 * se muestra un cartel rojo en esa respuesta hasta completarlo en src/config/negocio.js.
 * Las respuestas se arman con los datos del negocio para que no queden desactualizadas.
 */
import negocio from '../config/negocio.js';
import { pesos } from '../lib/formato.js';

const d = negocio.descuentos;
const dir = negocio.direccion;

export const faq = [
  {
    grupo: 'Comprar',
    q: '¿Cómo compro?',
    a: `Armás tu carrito en la web, completás tus datos y tocás <b>Enviar pedido por Instagram</b>: copiamos el pedido y se abre el chat con @${negocio.instagram.usuario}. Lo pegás, lo mandás y te confirmamos stock, pago y entrega. También lo podés mandar por email a ${negocio.email}. <a href="/como-comprar/">Ver el paso a paso</a>.`,
  },
  {
    grupo: 'Comprar',
    q: '¿Se paga online?',
    a: 'No. En la web sólo armás el pedido. El pago es por transferencia bancaria o en efectivo en el local, una vez que confirmamos tu pedido por Instagram o email.',
  },
  {
    grupo: 'Comprar',
    q: '¿Cómo sé si hay stock?',
    a: 'Cuando recibimos tu pedido te confirmamos la disponibilidad de cada producto y sabor antes de que pagues.',
  },
  {
    grupo: 'Pagos y descuentos',
    q: '¿Qué medios de pago aceptan?',
    a: `Transferencia bancaria, o efectivo en el local con <b>${d.efectivoPct}% OFF</b>.`,
  },
  {
    grupo: 'Pagos y descuentos',
    q: '¿El pago en efectivo es sólo retirando en el local?',
    a: d.efectivoSoloRetiro == null ? '' : d.efectivoSoloRetiro
      ? 'Sí, el efectivo es sólo en el local: elegí "Retiro en el local" al armar el pedido. Con envío, el pago es por transferencia.'
      : 'No, también podés pagar en efectivo con envío.',
    falta: d.efectivoSoloRetiro == null ? 'si el efectivo es sólo para retiro en local o también contra entrega' : null,
  },
  {
    grupo: 'Pagos y descuentos',
    q: '¿Cómo uso el 10% OFF de primera compra?',
    a: `Dejás tu email en la ventana de bienvenida y te damos un código único (también te llega por email). Lo cargás en el carrito, en "Código de descuento". Vale <b>una sola vez por email</b>.`,
  },
  {
    grupo: 'Pagos y descuentos',
    q: '¿Se suman el descuento de efectivo y el de primera compra?',
    a: d.acumulables == null ? '' : d.acumulables
      ? `Sí: si pagás en efectivo y usás tu código, se aplican los dos (${d.efectivoPct}% + ${d.bienvenidaPct}%).`
      : 'No se acumulan: se aplica uno solo y tu código queda guardado para otra compra.',
    falta: d.acumulables == null ? 'si los descuentos de efectivo y bienvenida se acumulan' : null,
  },
  {
    grupo: 'Envíos',
    q: '¿Hacen envíos?',
    a: `Sí, enviamos a todo el país por ${negocio.envios.empresas.join(', ')}. Elegís la empresa que prefieras al armar el pedido.`,
  },
  {
    grupo: 'Envíos',
    q: '¿Cuánto cuesta el envío?',
    a: `Es <b>gratis en compras desde ${pesos(negocio.envios.gratisDesde)}</b>.${negocio.envios.costoYTiempos ? ' ' + negocio.envios.costoYTiempos : ''}`,
    falta: negocio.envios.costoYTiempos ? null : `costo de envío para compras menores a ${pesos(negocio.envios.gratisDesde)}`,
  },
  {
    grupo: 'Envíos',
    q: '¿Cuánto tarda en llegar?',
    a: negocio.envios.costoYTiempos ?? '',
    falta: negocio.envios.costoYTiempos ? null : 'tiempos de entrega de los envíos',
  },
  {
    grupo: 'Envíos',
    q: '¿Puedo retirar en el local?',
    a: `Sí. Elegí "Retiro en el local" al armar el pedido y lo pasás a buscar por ${dir.calle}, ${dir.localidad}.${negocio.horarios ? ' Horarios: ' + negocio.horarios.join(' · ') + '.' : ''}`,
    falta: negocio.horarios ? null : 'horarios de atención del local',
  },
  {
    grupo: 'Productos',
    q: '¿Hacen cambios o devoluciones?',
    a: negocio.politicas.cambios ?? '',
    falta: negocio.politicas.cambios ? null : 'política de cambios y devoluciones',
  },
  {
    grupo: 'Productos',
    q: '¿Qué suplemento me conviene?',
    a: 'Depende de tu objetivo, tu alimentación y tu salud. Te dejamos una <a href="/blog/que-suplemento-segun-objetivo/">guía general</a> y los <a href="/combos/">combos por objetivo</a>, pero lo ideal es que lo definas con un profesional de la salud.',
  },
];

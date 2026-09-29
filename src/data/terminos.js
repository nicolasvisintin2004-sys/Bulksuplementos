/**
 * Términos y condiciones de compra. Se arman con los datos de src/config/negocio.js
 * para que montos, porcentajes y contactos queden siempre actualizados.
 */
import negocio from '../config/negocio.js';
import { pesos } from '../lib/formato.js';

const d = negocio.descuentos;
const dir = negocio.direccion;
const ig = `<a href="${negocio.instagram.url}">@${negocio.instagram.usuario}</a>`;
const mail = `<a href="mailto:${negocio.email}">${negocio.email}</a>`;

export const terminos = [
  {
    t: 'Quiénes somos',
    p: [
      `${negocio.nombre} es un local de suplementos y nutrición deportiva ubicado en ${dir.calle}, ${dir.localidad}, provincia de ${dir.provincia}. Al hacer un pedido a través de este sitio aceptás estos términos y condiciones.`,
    ],
  },
  {
    t: 'Cómo se hace un pedido',
    p: [
      `En el sitio armás el carrito y lo enviás por mensaje directo de Instagram (${ig}) o por email (${mail}). No hay pago online: el sitio nunca te va a pedir datos de tarjeta.`,
      'Enviar el carrito no confirma la compra. El pedido queda confirmado cuando te respondemos con la disponibilidad, el total y la forma de entrega, y recibimos el pago.',
    ],
  },
  {
    t: 'Precios y stock',
    p: [
      'Los precios están expresados en pesos argentinos e incluyen impuestos. Pueden cambiar sin previo aviso; se respeta el precio vigente al momento en que confirmamos tu pedido.',
      'El stock de cada producto, sabor y presentación está sujeto a confirmación. Si algo no está disponible te avisamos antes de que pagues y te ofrecemos una alternativa o quitarlo del pedido.',
      'Las imágenes de los productos son ilustrativas. El envase puede variar según el lote del fabricante.',
    ],
  },
  {
    t: 'Medios de pago',
    p: [
      'Transferencia bancaria: te pasamos los datos para transferir cuando confirmamos el pedido, y nos mandás el comprobante por Instagram o email.',
      `Efectivo: con ${d.efectivoPct}% de descuento${d.efectivoSoloRetiro ? ', sólo pagando en el local' : ''}.`,
    ],
  },
  {
    t: 'Descuentos',
    p: [
      `Primera compra: ${d.bienvenidaPct}% de descuento con el código que te damos al dejar tu email. Hay un solo código por email y se puede usar una sola vez.`,
      d.acumulables
        ? `El descuento de primera compra se suma al de pago en efectivo. El segundo se calcula sobre el precio ya rebajado, así que juntos dan un 19% de descuento.`
        : 'El descuento de primera compra no se acumula con el de pago en efectivo.',
      'Los descuentos no son canjeables por dinero.',
    ],
  },
  {
    t: 'Envíos y retiro',
    p: [
      `Enviamos a todo el país por ${negocio.envios.empresas.join(', ')}. El envío es gratis en compras desde ${pesos(negocio.envios.gratisDesde)}, calculado sobre el subtotal ${d.envioGratisCalculo === 'despues' ? 'después' : 'antes'} de aplicar descuentos. ${negocio.envios.costo}`,
      `Tiempo de entrega: ${negocio.envios.tiempos}`,
      `También podés retirar tu pedido en el local, en ${dir.calle}, ${dir.localidad}${negocio.horarios ? ` (${negocio.horarios.join(', ')})` : ''}.`,
    ],
  },
  {
    t: 'Cambios, devoluciones y arrepentimiento',
    p: [
      negocio.politicas.cambios,
      `Según la Ley de Defensa del Consumidor (Ley 24.240, art. 34), en las compras a distancia podés arrepentirte dentro de los 10 días corridos desde que recibís el producto. Para hacerlo, escribinos por Instagram (${ig}) o por email (${mail}). Por razones de higiene y seguridad, el producto tiene que estar cerrado, sin abrir y en su envase original.`,
    ],
  },
  {
    t: 'Salud',
    p: [
      'La información de los productos es la que informa el fabricante y tiene fines informativos. No reemplaza el consejo de un profesional de la salud. Consultá con un médico o nutricionista antes de consumir suplementos, sobre todo si estás embarazada, amamantando, sos menor de edad o tenés alguna condición de salud.',
    ],
  },
  {
    t: 'Datos personales',
    p: [
      'Usamos los datos que nos mandás (nombre, email, teléfono y dirección) sólo para gestionar tu pedido y, si nos das tu consentimiento, para mandarte ofertas por email. No los vendemos ni los compartimos con terceros, salvo con la empresa de envío cuando corresponde.',
      'Podés darte de baja de los emails de ofertas en cualquier momento desde el link al pie de cada mail o en <a href="/baja/">esta página</a>, y pedirnos que modifiquemos o borremos tus datos escribiéndonos.',
    ],
  },
  {
    t: 'Contacto',
    p: [`Por cualquier consulta sobre estos términos escribinos por Instagram (${ig}) o por email (${mail}).`],
  },
];

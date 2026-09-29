/**
 * ═══════════════════════════════════════════════════════════════════
 *  DATOS DEL NEGOCIO — BULK
 *  Este es EL ÚNICO lugar donde se editan los datos del local.
 *
 *  Todo lo que está en `null` es un dato FALTANTE: mientras siga en null,
 *  el sitio muestra un cartel rojo "⚠ FALTA: ..." en cada lugar donde se usa.
 *  Completalo, guardá y volvé a publicar. La lista completa de faltantes
 *  se ve en /pendientes (página interna, no aparece en Google).
 * ═══════════════════════════════════════════════════════════════════
 */
export default {
  nombre: 'BULK',
  bajada: 'Suplementos y Nutrición Deportiva',

  direccion: {
    calle: 'Dr. Baraja 253',
    localidad: 'Carmen de Patagones',
    provincia: 'Buenos Aires',
    codigoPostal: null, // opcional, ej: '8504'
    pais: 'AR',
  },

  // Los pedidos y las consultas se reciben por Instagram (mensaje directo) o por email.
  // No se usa WhatsApp.
  instagram: {
    usuario: 'Bulk_Ar',
    url: 'https://instagram.com/Bulk_Ar',
    dm: 'https://ig.me/m/Bulk_Ar', // abre el chat directo con la cuenta
  },

  // Email de contacto y para recibir pedidos. El remitente de los mails automáticos se configura en Brevo.
  email: 'bulk.5upl3ntos@gmail.com',

  // Horarios del local (cada elemento es una línea)
  horarios: ['Lunes a sábado', '10 a 13:30 y 17:30 a 20:30'],
  // Los mismos horarios en formato de Google (datos estructurados)
  horariosSchema: ['Mo-Sa 10:00-13:30', 'Mo-Sa 17:30-20:30'],

  // Logo: por decisión del cliente se usa el wordmark tipográfico (null).
  // Para usar un archivo, poné su ruta dentro de /public. Ej: '/logo-bulk.svg'
  logo: null,

  // Dominio del sitio, con https.
  // Se usa para el sitemap, Open Graph y datos estructurados.
  dominio: 'https://bulksuplementos.com.ar',

  envios: {
    empresas: ['Correo Argentino', 'Andreani', 'OCA'],
    gratisDesde: 100000,
    // Costo de envío en compras por debajo de gratisDesde
    costo: 'En compras menores a ese monto, el costo depende de la zona del comprador.',
    // Tiempo de entrega
    tiempos: 'Depende de la disponibilidad del producto. Si no está en stock, la entrega se estima entre 10 y 30 días, según el momento del mes.',
    // Texto combinado para el carrito, Cómo comprar y Envíos y pagos
    costoYTiempos: 'El costo depende de la zona del comprador. El tiempo de entrega depende de la disponibilidad del producto: si no está en stock, se estima entre 10 y 30 días, según el momento del mes.',
  },

  descuentos: {
    efectivoPct: 10,     // 10% OFF pagando en efectivo
    bienvenidaPct: 10,   // 10% OFF primera compra con el código del popup

    // El 10% efectivo y el 10% de bienvenida se acumulan: el segundo se calcula sobre el precio
    // ya rebajado, así que juntos son un 19% (no 20%).
    acumulables: true,

    // El envío gratis se calcula sobre el subtotal ANTES de los descuentos ('antes' | 'despues')
    envioGratisCalculo: 'antes',

    // ¿El pago en efectivo es sólo en el local?
    //   true  → efectivo sólo retirando/pagando en el local (con envío, sólo transferencia)
    //   false → efectivo también con envío
    efectivoSoloRetiro: true,
  },

  // Productos más vendidos: ids de src/data/productos.json, en orden.
  masVendidos: ['ena-creatina-micronizada', 'gentech-omega-3-epa-fish-oil', 'ena-citrato-de-magnesio', 'integralmedica-whey-100-pure'],

  politicas: {
    // Política de cambios y devoluciones
    cambios: 'Mandanos tu problema por mensaje directo de Instagram (@Bulk_Ar) o escribinos a bulk.5upl3ntos@gmail.com y lo solucionamos.',
    // Términos y condiciones: el texto está en src/data/terminos.js
    terminos: true,
  },

  // Poné false cuando termines de completar todo para ocultar los carteles rojos
  // (los que sigan en null quedan ocultos, así que revisá /pendientes antes).
  mostrarFaltantes: false,
};

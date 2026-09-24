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

  // ⚠ FALTA — Datos para transferencia. Se muestran cuando el cliente elige "Transferencia".
  // Ej: { titular: 'Nombre Apellido', banco: 'Banco X', cbu: '0000...', alias: 'BULK.SUPLEMENTOS', cuit: '20-00000000-0' }
  datosBancarios: null,

  // ⚠ FALTA — Ruta al logo en alta calidad (SVG o PNG transparente) dentro de /public. Ej: '/logo-bulk.svg'
  // Mientras sea null se usa el wordmark tipográfico.
  logo: null,

  // ⚠ FALTA — Dominio del sitio, con https. Ej: 'https://bulksuplementos.com.ar'
  // Se usa para el sitemap, Open Graph y datos estructurados.
  dominio: null,

  envios: {
    empresas: ['Correo Argentino', 'Andreani', 'OCA'],
    gratisDesde: 100000,
    // ⚠ FALTA — Costos y tiempos de envío para compras por debajo de $100.000.
    // Ej: 'Se cotiza según destino. Llega en 3 a 7 días hábiles.'
    costoYTiempos: null,
  },

  descuentos: {
    efectivoPct: 10,     // 10% OFF pagando en efectivo
    bienvenidaPct: 10,   // 10% OFF primera compra con el código del popup

    // ⚠ FALTA — ¿Se acumulan el 10% efectivo y el 10% de bienvenida?
    //   true  → se suman (10% + 10% = 20% sobre el subtotal)
    //   false → se aplica uno solo (el código queda guardado para otra compra)
    //   null  → todavía no definido: el sitio se comporta como `false` y muestra el cartel rojo
    acumulables: null,

    // ⚠ FALTA — ¿El envío gratis se calcula sobre el subtotal antes o después de descuentos?
    //   'antes' | 'despues' | null (null = se comporta como 'antes' y muestra el cartel rojo)
    envioGratisCalculo: null,

    // ¿El pago en efectivo es sólo en el local?
    //   true  → efectivo sólo retirando/pagando en el local (con envío, sólo transferencia)
    //   false → efectivo también con envío
    efectivoSoloRetiro: true,
  },

  // ⚠ FALTA — Productos más vendidos: lista de ids de src/data/productos.json, en orden.
  // Ej: ['ena-whey-protein-true-made', 'star-nutrition-creatina-monohidrato']
  masVendidos: [],

  politicas: {
    // ⚠ FALTA — Texto de la política de cambios y devoluciones
    cambios: null,
    // ⚠ FALTA — Términos y condiciones
    terminos: null,
  },

  // Poné false cuando termines de completar todo para ocultar los carteles rojos
  // (los que sigan en null quedan ocultos, así que revisá /pendientes antes).
  mostrarFaltantes: true,
};

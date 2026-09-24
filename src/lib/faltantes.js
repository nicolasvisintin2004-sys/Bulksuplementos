/**
 * Lista central de datos faltantes. Alimenta la página /pendientes y el README.
 * Cada ítem dice qué falta y dónde se completa.
 */
import negocio from '../config/negocio.js';
import combos from '../data/combos.json';
import catalogo from '../data/productos.json';

export const mostrar = negocio.mostrarFaltantes;

export function listaFaltantes() {
  const d = negocio.descuentos;
  const sinFoto = catalogo.productos.filter((p) => !p.imagen).length;
  const sinDesc = catalogo.productos.filter((p) => !p.descripcion).length;
  const sinNutri = catalogo.productos.filter((p) => !p.infoNutricional).length;
  const sinUso = catalogo.productos.filter((p) => !p.modoDeUso).length;
  const combosVacios = combos.combos.filter((c) => !c.items?.length || c.precio == null).length;
  const items = [
    [!negocio.horarios, 'Horarios de atención del local', 'src/config/negocio.js → horarios'],
    [!negocio.datosBancarios, 'Datos bancarios para transferencia (titular, CBU/CVU, alias, banco, CUIT)', 'src/config/negocio.js → datosBancarios'],
    [!negocio.email, 'Email de contacto', 'src/config/negocio.js → email'],
    [true, 'Remitente de los emails, cuenta y claves de Brevo (email marketing)', 'Variables de entorno en Netlify (ver README → Email marketing)'],
    [!negocio.logo, 'Logo en alta calidad (SVG o PNG transparente)', 'public/ + src/config/negocio.js → logo'],
    [sinFoto > 0, `Fotos de producto (faltan ${sinFoto} de ${catalogo.productos.length})`, 'public/productos/ + campo "imagen" en src/data/productos.json'],
    [sinDesc > 0, `Descripción de producto (faltan ${sinDesc})`, 'src/data/productos.json → descripcion'],
    [sinNutri > 0, `Información nutricional (faltan ${sinNutri} productos; cargar desde la etiqueta)`, 'src/data/productos.json → infoNutricional'],
    [sinUso > 0, `Modo de uso (faltan ${sinUso} productos)`, 'src/data/productos.json → modoDeUso'],
    [d.acumulables == null, 'Si el 10% efectivo y el 10% de bienvenida se acumulan o no', 'src/config/negocio.js → descuentos.acumulables'],
    [d.efectivoSoloRetiro == null, 'Si el efectivo es sólo para retiro en local o también contra entrega', 'src/config/negocio.js → descuentos.efectivoSoloRetiro'],
    [d.envioGratisCalculo == null, 'Si el envío gratis se calcula antes o después de descuentos', 'src/config/negocio.js → descuentos.envioGratisCalculo'],
    [!negocio.envios.costoYTiempos, 'Costos y tiempos de envío por debajo de $100.000', 'src/config/negocio.js → envios.costoYTiempos'],
    [combosVacios > 0, `Contenido y precio de cada combo según objetivo (faltan ${combosVacios})`, 'src/data/combos.json'],
    [!negocio.dominio, 'Dominio del sitio', 'src/config/negocio.js → dominio'],
    [!negocio.politicas.cambios, 'Política de cambios y devoluciones', 'src/config/negocio.js → politicas.cambios'],
    [!negocio.politicas.terminos, 'Términos y condiciones', 'src/config/negocio.js → politicas.terminos'],
    [!negocio.masVendidos?.length, 'Productos "más vendidos" (para el orden y la home)', 'src/config/negocio.js → masVendidos'],
  ];
  return items.map(([falta, que, donde]) => ({ falta, que, donde }));
}

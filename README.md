# BULK — Tienda online

Suplementos y nutrición deportiva · Dr. Baraja 253, Carmen de Patagones · [@Bulk_Ar](https://instagram.com/Bulk_Ar) · bulk.5upl3ntos@gmail.com

Sitio estático hecho con [Astro](https://astro.build). No hay pago online y no se usa WhatsApp: el cliente arma el carrito y lo manda por **mensaje directo de Instagram** (el sitio copia el pedido y abre el chat con @Bulk_Ar) o por **email**. Paga por transferencia, o en efectivo sólo en el local. Los emails del popup de 10% OFF van a **Brevo** a través de funciones de Netlify (las claves nunca llegan al navegador).

---

## 1. Dónde se edita cada cosa

| Qué | Archivo |
| --- | --- |
| Datos del negocio (dirección, horarios, email, Instagram, banco, dominio, descuentos, envíos, políticas) | `src/config/negocio.js` |
| Productos, variantes y precios | `src/data/productos.json` |
| Combos según objetivo | `src/data/combos.json` |
| Preguntas frecuentes | `src/data/faq.js` |
| Artículos del blog | `src/content/blog/*.md` |
| Fotos de productos | `public/productos/` |
| Plantillas de email | `emails/plantillas.mjs` (genera `emails/*.html`) |

**Datos faltantes:** todo lo que está en `null` en `negocio.js` aparece en el sitio como un **cartel rojo "⚠ FALTA: …"**. La lista completa está en la página interna **`/pendientes`**, que no aparece en Google. Cuando completes todo, poné `mostrarFaltantes: false`.

## 2. Productos y precios

### Regla de precios
1. **Precio de [entreno.com.ar](https://www.entreno.com.ar) − $1.000.** 340 variantes siguen esta regla y guardan en `entreno` de qué página de Entreno sale su precio. Para actualizarlos: `npm run precios:entreno`.
2. **Nunca por debajo del costo.** Si el precio de Entreno − $1.000 queda por debajo de mayorista + 10%, se usa ese piso. En sep 2026 pasó con 45 variantes. Para esas se relevaron otras tiendas online argentinas y se puso un precio competitivo que igual deja ganancia; la comparación queda guardada en `precioFijo.competencia`. Las que quedan más caras que la competencia (su costo no permite bajarlas) se listan en `/pendientes`.
3. **Si no está en Entreno** (6 variantes: sobres sueltos, displays, Cúrcuma + D3 120 cáps., Nitrox 120 cáps.): `mayorista × 1,4`, redondeado **hacia arriba** a múltiplos de $100.

Qué precio mayorista se toma de la lista del proveedor:
- Un solo precio: ese.
- Precio tachado + % de descuento: el precio con descuento.
- 2x1 / 3x2 "por 1 unidad": el precio de lista (el primero). La promo del proveedor no se muestra en la tienda.
- "OFERTA": el precio que figura. Los productos con OFERTA, 2x1 o 3x2 salen en **Ofertas** en la home.

### Editar un precio a mano
En `src/data/productos.json`, cada producto tiene `variantes`. Cada variante tiene:

```json
{ "sabor": "Chocolate", "presentacion": "2,05 lb (930 g)", "precio": 98600, "mayorista": 70386 }
```

Cambiá `precio`, que es lo que ve el cliente. `mayorista` queda sólo como referencia.

- `npm run precios:entreno` vuelve a leer los precios de Entreno y aplica −$1.000, con el piso de mayorista + 10%.
- `npm run precios` recalcula a partir de `mayorista` sólo las variantes **sin** `entreno` ni `precioFijo`.

### Cargar una lista mayorista nueva
1. Copiá la lista de la web del proveedor tal cual y pegala en `data/fuente/lista-mayorista.txt`.
2. Corré `npm run importar`.
3. Revisá la consola y `data/revisar.json` (duplicados, conflictos de precio, productos nuevos sin regla).

El importador conserva lo que cargaste a mano: fotos, descripción, información nutricional, modo de uso y `categoriaFija`. Los productos nuevos que no tienen regla de agrupación se agrupan solos y quedan listados para revisar. Las reglas están en `scripts/importar-lista.mjs`, con una línea por producto.

### Fotos de producto
- **Los 185 productos tienen foto.** Se tomaron de las fichas de **entreno.com.ar**, emparejando cada producto y sabor; la de Xtrenght Nitrox 120 cápsulas sale del sitio oficial de Xtrenght. Las fotos están en `public/productos/` (WebP 720×720) y cada variante tiene su `imagen` en `productos.json`. En la ficha, la foto cambia al elegir otro sabor.
- **Sacados del catálogo:** Nutremax SportFuel y Star Nutrition ZMA 30 cápsulas (no hay foto ni datos confiables) y Falux Omega 3 (su costo mayorista era más del doble del precio de mercado). Están en `EXCLUIDOS` dentro de `scripts/importar-lista.mjs`, así que no vuelven al reimportar la lista.
- Esas fotos son de otra tienda o de las marcas. Si preferís no depender de eso, reemplazalas por fotos propias o por las oficiales de cada marca: pisás el archivo en `public/productos/` con el mismo nombre, o cambiás la ruta en `imagen`.

### Descripción, info nutricional y modo de uso
Estado actual:
- **Descripción: 185/185.** Son textos propios, cortos y sólo con datos del producto: qué es, formato, presentaciones y sabores, sin promesas de resultados.
- **Modo de uso: 185/185.** Se tomó de la información publicada por el vendedor y la marca, o de la foto de la etiqueta, resumida y sin el texto comercial.
- **Información nutricional: 176/185.** Se transcribieron los datos principales por porción desde las fotos de la etiqueta (galería de Entreno y sitios oficiales de las marcas). En el sitio aparecen con la aclaración "La tabla completa está en el envase".
- **Sin tabla todavía (9):** Adelgafit Colagenfit, Gentech Iron Bar, Gentech Iron Gel Turbo Coffee, Gentech Creatina Masticable, Granger Pancakes Proteicos, Integralmedica BCAA Top, La Ganexa Pasta de Maní (Caramelo Salado), Leguilab MCT Oil 100% Pure y Taste Crema Zero Calorías. No había una etiqueta legible de ese mismo sabor o formato, o la que había aclaraba "valores aproximados". Siguen con el cartel rojo.
- Conviene revisar los datos contra el envase real cuando llegue la mercadería. Los productos que faltan están listados en `/pendientes`.

Para cargar o corregir:
1. Para agregar una foto nueva, subila a `public/productos/` (ideal: WebP o JPG cuadrado de 1000×1000, fondo blanco).
2. En el producto de `productos.json` completá, por ejemplo:

```json
"imagen": "/productos/ena-whey-true-made.webp",
"descripcion": "Texto corto, tal cual lo describe el fabricante.",
"infoNutricional": ["Porción: 30 g", "Energía: 120 kcal", "Proteínas: 24 g"],
"modoDeUso": "Según indica el envase."
```

Mientras estén en `null`, la ficha muestra el cartel rojo. **No inventes datos nutricionales:** copiálos del envase.

### Categoría manual
Si un producto quedó en una categoría que no corresponde, agregale `"categoriaFija": "proteinas"` (valores posibles en `categorias` dentro del mismo archivo).

## 3. Combos

En `src/data/combos.json`, completá `items` y `precio` de cada objetivo:

```json
{
  "id": "masa-muscular",
  "items": [
    { "producto": "ena-whey-protein-true-made", "variante": "chocolate-2-05-lb-930-g", "cantidad": 1 },
    { "producto": "star-nutrition-creatina-monohidrato", "variante": "sin-sabor-doypack-300-g", "cantidad": 1 }
  ],
  "precio": 115000
}
```

Los ids de producto y variante están en `productos.json`. El id de la variante también aparece en la URL de la ficha al elegirla (`?v=…`). Cuando un combo tiene items, el botón "Agregar combo" se activa solo.

## 4. Email marketing (Brevo)

1. Creá una cuenta gratuita en [brevo.com](https://www.brevo.com).
2. **Remitente:** en *Senders, Domains & Dedicated IPs*, agregá y verificá el email remitente (idealmente con tu dominio).
3. **Lista:** en *Contacts → Lists*, creá una lista, por ejemplo "Ofertas BULK", y anotá su **ID**.
4. **Atributos:** en *Contacts → Settings → Contact attributes*, creá:
   - `CODIGO_BIENVENIDA` (Text)
   - `CODIGO_USADO` (Boolean)
   - `PEDIDO_CODIGO` (Text)
5. **Clave API:** en *SMTP & API → API Keys*, generá una clave.
6. En **Netlify → Site configuration → Environment variables**, cargá:

| Variable | Valor |
| --- | --- |
| `BREVO_API_KEY` | la clave API |
| `BREVO_LIST_ID` | el ID de la lista |
| `BREVO_SENDER_EMAIL` | el remitente verificado |
| `BREVO_SENDER_NAME` | `BULK` |
| `BREVO_TEMPLATE_BIENVENIDA` | *(opcional)* ID de la plantilla transaccional si la creás en Brevo |

7. Volvé a publicar el sitio.

**Cómo funciona**
- Popup → `/api/suscribir` genera un código único `BULK10-XXXXXX`, crea el contacto y manda el mail de bienvenida. El contacto entra a la lista de ofertas **sólo si tildó el consentimiento**.
- Carrito → `/api/validar-codigo` controla que el código sea de ese email y no se haya usado. Al enviar el pedido, `/api/canjear-codigo` lo marca como usado.
- `/baja` → `/api/baja` da de baja al contacto. Todos los emails tienen link de baja.
- **Mientras Brevo no esté configurado**, el popup igual entrega un código (generado en el navegador) y el pedido llega con la aclaración "Código a verificar por el local".

**Plantillas**
- `npm run emails` genera `emails/bienvenida.html` y `emails/ofertas.html`. La de ofertas sale con los primeros 4 productos en oferta del catálogo actual.
- Para una campaña: en Brevo, *Campaigns → Create → Email → Code your own* y pegá `emails/ofertas.html`. El link `{{ unsubscribe }}` ya está incluido.

## 5. Publicar el sitio

### Primera vez (Netlify, recomendado)
1. Subí esta carpeta a un repositorio de GitHub.
2. En [netlify.com](https://www.netlify.com): *Add new site → Import from Git* y elegí el repo. La configuración ya está en `netlify.toml` (build `npm run build`, carpeta `dist`, funciones en `netlify/functions`).
3. Cargá las variables de Brevo (punto 4).
4. *Domain management*: conectá tu dominio y ponelo también en `negocio.js → dominio`.

> Arrastrar la carpeta `dist` a Netlify publica el sitio, pero **sin las funciones de Brevo**. Para que el popup y los códigos funcionen, usá Git o `npx netlify deploy --prod`.

### Después de cada cambio
Editás el archivo, hacés *commit* y *push*: Netlify vuelve a publicar solo, en 1 o 2 minutos.

### Trabajar en tu compu
```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # genera dist/
npx netlify dev      # igual que dev, pero con las funciones /api/* andando
```

Otros comandos: `npm run importar`, `npm run precios`, `npm run emails`, `npm run imagenes` (regenera `public/og.jpg` y el ícono).

## 6. Decisiones tomadas con el catálogo (para revisar)

- **Duplicados descartados:** ENA Electrolitos Berries Bomb 15 sobres (aparecía dos veces); ENA Starter Protein 400 g (dos formatos de nombre, mismo precio); ENA Truemade Pure Collagen Lemonade y Blueberry (listados también como "TM P COLLAGEN", mismo precio); Star Collagen 210 g Frutos Rojos.
- **SUMA Electrolitos caja 30 sobres:** aparece dos veces con precios distintos ($54.337 y $42.263 mayorista). Se usó el **más alto** para no vender por debajo del costo. **Confirmá cuál es el correcto.**
- **ENA Carbo Energy:** una de las variantes no trae sabor en la lista; figura como "Sin especificar".
- **ENA Colágeno Sport "FP"** se interpretó como *Fruit Punch*.
- **Taste Salsa Dulce Natural "Miel - Vegano":** no se marcó como vegano (la miel no es vegana).
- **Nutremax Hydromax 33 g:** el nombre dice "Naranja" y la variante "Pomelo". Se tomó Pomelo.
- **Filtro "vegano":** sólo productos cuyo nombre dice "vegan/vegano". **"Sin TACC"** incluye también "sin gluten".
- Nombres de marca tal cual la lista: *Atlhetica*, *Xtrenght*.
- Las categorías y los objetivos se infieren del nombre del producto.

Todo esto también se ve en `/pendientes`.

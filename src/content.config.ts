import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Artículos del blog: src/content/blog/*.md
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string(),
    fecha: z.coerce.date(),
    minutos: z.number().default(4),
    etiqueta: z.string(),
    // productos relacionados: ids de src/data/productos.json
    productos: z.array(z.string()).default([]),
    // categoría para el botón "Ver todos"
    categoria: z.string().optional(),
    orden: z.number().default(0),
  }),
});

export const collections = { blog };

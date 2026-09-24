import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import negocio from './src/config/negocio.js';

// Dominio: el de negocio.js; si falta, el que da Netlify al publicar (URL); si no, localhost.
const site = negocio.dominio || process.env.URL || 'http://localhost:4321';

export default defineConfig({
  site,
  trailingSlash: 'always',
  // el puerto de desarrollo se puede cambiar con la variable PORT
  server: { port: Number(process.env.PORT) || 4321 },
  build: { format: 'directory', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    sitemap({
      filter: (page) => !/\/(pendientes|baja|carrito)\//.test(page),
    }),
  ],
});

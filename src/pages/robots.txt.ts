export function GET({ site }: { site: URL }) {
  const body = `User-agent: *
Allow: /
Disallow: /pendientes/
Disallow: /baja/
Disallow: /carrito/

Sitemap: ${new URL('/sitemap-index.xml', site).href}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

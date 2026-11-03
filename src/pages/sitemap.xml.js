// Sitemap gerado no build. Fora a administração e a página 404, são as páginas públicas do site.
// produto.html e pedido.html dependem de parâmetros (?id=, ?produto=), por isso ficam de fora.
const PAGINAS = ['', 'catalogo.html', 'servicos.html', 'arranjos-e-presentes.html', 'assinatura-floral.html',
  'eternizacao-de-flores.html', 'oficinas-florais.html', 'contato.html'];

export function GET({ site }) {
  const raiz = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const urls = site ? PAGINAS.map((p) => '  <url><loc>' + new URL(raiz + p, site).href + '</loc></url>') : [];
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('\n') + (urls.length ? '\n' : '') + '</urlset>\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

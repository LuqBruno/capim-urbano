// Sitemap gerado no build. Fora a administração e a página 404, são as páginas públicas do site, nas três línguas.
// produto.html e pedido.html dependem de parâmetros (?id=, ?produto=), por isso ficam de fora.
import { LINGUAS, LINGUA_PADRAO, pastaDaLingua } from '../i18n/interface.js';

const PAGINAS = ['', 'catalogo.html', 'servicos.html', 'arranjos-e-presentes.html', 'assinatura-floral.html',
  'eternizacao-de-flores.html', 'oficinas-florais.html', 'contato.html'];

export function GET({ site }) {
  const raiz = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const endereco = (lingua, pagina) => new URL(raiz + pastaDaLingua(lingua) + pagina, site).href;
  const urls = !site ? [] : PAGINAS.flatMap((pagina) => {
    const alternativas = LINGUAS.map((l) => '    <xhtml:link rel="alternate" hreflang="' + l + '" href="' + endereco(l, pagina) + '"/>')
      .concat('    <xhtml:link rel="alternate" hreflang="x-default" href="' + endereco(LINGUA_PADRAO, pagina) + '"/>');
    return LINGUAS.map((lingua) => '  <url>\n    <loc>' + endereco(lingua, pagina) + '</loc>\n' + alternativas.join('\n') + '\n  </url>');
  });
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + urls.join('\n') + (urls.length ? '\n' : '') + '</urlset>\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

// robots.txt gerado no build: o endereço do sitemap precisa ser absoluto, e só existe com SITE_URL (publicação).
export function GET({ site }) {
  const raiz = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const linhas = ['User-agent: *', 'Allow: ' + raiz, 'Disallow: ' + raiz + 'admin.html'];
  if (site) linhas.push('', 'Sitemap: ' + new URL(raiz + 'sitemap.xml', site).href);
  return new Response(linhas.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

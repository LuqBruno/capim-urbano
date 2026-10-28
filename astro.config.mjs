import { defineConfig } from 'astro/config';

// Site estático. format: 'file' gera catalogo.html, produto.html etc., mantendo os endereços do site anterior
// (os links e o Supabase continuam funcionando sem redirecionamento). Os produtos vêm do Supabase no navegador,
// por isso uma alteração na administração aparece no catálogo sem refazer o build.
//
// SITE_URL e BASE_PATH só são definidos na publicação (veja .github/workflows/deploy.yml). No GitHub Pages o site
// fica em https://<usuario>.github.io/<repositorio>/, então BASE_PATH vale "/<repositorio>". Localmente e nos testes
// ficam vazios e o site é servido na raiz.
export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || '/',
  build: { format: 'file' },
  trailingSlash: 'never'
});

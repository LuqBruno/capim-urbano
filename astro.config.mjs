import { defineConfig } from 'astro/config';

// Site estático. format: 'file' gera catalogo.html, produto.html etc., mantendo os endereços do site anterior
// (os links e o Supabase continuam funcionando sem redirecionamento). Os produtos vêm do Supabase no navegador,
// por isso uma alteração na administração aparece no catálogo sem refazer o build.
export default defineConfig({
  output: 'static',
  build: { format: 'file' },
  trailingSlash: 'never'
});

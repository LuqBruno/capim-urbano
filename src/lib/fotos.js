/* Fotos com versão menor (640px de largura) em public/imagens/web/<nome>-640.webp.
   São as fotos da curadoria de 16/11/2026; as mais antigas só têm o tamanho único. */
const COM_MENOR = /^(eternizacao|oficinas|presentes)-[a-z0-9-]+\.webp$/;

export const menor = (arquivo) => (COM_MENOR.test(arquivo) ? arquivo.replace(/\.webp$/, '-640.webp') : arquivo);

/* Atributos srcset/sizes para espalhar no <img>: {...fonte(r, 'x.webp', 1200, '(max-width: 820px) 92vw, 45vw')} */
export function fonte(r, arquivo, largura, sizes) {
  if (!COM_MENOR.test(arquivo)) return {};
  return { srcset: r + 'imagens/web/' + menor(arquivo) + ' 640w, ' + r + 'imagens/web/' + arquivo + ' ' + largura + 'w', sizes };
}

/* Foco do enquadramento, um para telas largas e outro para o celular (lido por object-position no CSS). */
export const foco = (largo, celular) => (largo ? '--foco:' + largo + ';--foco-m:' + (celular || largo) : undefined);

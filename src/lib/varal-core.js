/* Física do varal de fotos (sem DOM, testável em Node).
   Portado do "Polaroid Line Carousel": cordão que cede no meio, mola criticamente amortecida
   para deslizar até a foto escolhida e o balanço de cada foto presa no prendedor. */

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* Altura do cordão em x: preso em (0, y0) e (w, y0), cedendo `cede` px no meio (parábola). */
export function alturaCordao(x, w, y0, cede) {
  const t = clamp(x / w, 0, 1);
  return y0 + 4 * cede * t * (1 - t);
}

/* Um passo da mola criticamente amortecida em direção ao alvo. Retorna [posição, velocidade]. */
export function passoMola(x, v, alvo, dt, k = 70) {
  const c = 2 * Math.sqrt(k);
  const nv = v + (k * (alvo - x) - c * v) * dt;
  return [x + nv * dt, nv];
}

/* Um passo do balanço de uma foto. velCordao é a velocidade das fotos na tela (px/s, + = para a direita):
   a foto fica para trás do movimento, a gravidade a puxa de volta e o atrito amortece. Ângulo limitado a ±0,6 rad. */
export function passoBalanco(a, w, velCordao, dt, ganho) {
  const nw = w + (-38 * a - 4.2 * w + velCordao * 0.0034 * ganho) * dt;
  return [clamp(a + nw * dt, -0.6, 0.6), nw];
}

/* Índice da foto mais perto do centro para um deslocamento do cordão. */
export function maisProxima(desloc, espaco, n) {
  return clamp(Math.round(desloc / espaco), 0, Math.max(0, n - 1));
}

/* Próxima foto do autoplay: volta à primeira depois da última. */
export const proximaFoto = (atual, n) => (n ? (atual >= n - 1 ? 0 : atual + 1) : 0);

export const doisDigitos = (n) => (n < 10 ? '0' + n : String(n));

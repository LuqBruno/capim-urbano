import { LINGUAS, LINGUA_PADRAO, linguaValida, pastaDaLingua } from './interface.js';
import { montarLinkWhatsApp } from '../lib/catalogo-core.js';

export const LINGUAS_TRADUZIDAS = LINGUAS.filter((l) => l !== LINGUA_PADRAO);

export const PAGINAS_TRADUZIDAS = ['index', 'catalogo', 'produto', 'pedido', 'servicos', 'assinatura-floral',
  'eternizacao-de-flores', 'oficinas-florais', 'arranjos-e-presentes', 'contato'];

export const raizDe = (lingua) => (linguaValida(lingua) === LINGUA_PADRAO ? '' : '../');

export const linkNaLingua = (atual, destino, arquivo) => raizDe(atual) + pastaDaLingua(destino) + arquivo;

export const linkWhatsApp = montarLinkWhatsApp;

export const INSTAGRAM = 'https://www.instagram.com/capimurbano.ateliefloral/';

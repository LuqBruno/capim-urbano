import Inicio from './Inicio.astro';
import Catalogo from './Catalogo.astro';
import Produto from './Produto.astro';
import Pedido from './Pedido.astro';
import Servicos from './Servicos.astro';
import Assinatura from './Assinatura.astro';
import Eternizacao from './Eternizacao.astro';
import Oficinas from './Oficinas.astro';
import Arranjos from './Arranjos.astro';
import Contato from './Contato.astro';

export const PAGINAS = {
  index: Inicio,
  catalogo: Catalogo,
  produto: Produto,
  pedido: Pedido,
  servicos: Servicos,
  'assinatura-floral': Assinatura,
  'eternizacao-de-flores': Eternizacao,
  'oficinas-florais': Oficinas,
  'arranjos-e-presentes': Arranjos,
  contato: Contato
};

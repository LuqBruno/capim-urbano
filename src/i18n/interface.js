export const LINGUAS = ['pt-BR', 'en', 'es'];
export const LINGUA_PADRAO = 'pt-BR';
export const NOMES_LINGUAS = { 'pt-BR': 'Português', en: 'English', es: 'Español' };
export const SIGLAS_LINGUAS = { 'pt-BR': 'PT', en: 'EN', es: 'ES' };

export const linguaValida = (lingua) => (LINGUAS.includes(lingua) ? lingua : LINGUA_PADRAO);
export const pastaDaLingua = (lingua) => (linguaValida(lingua) === LINGUA_PADRAO ? '' : lingua + '/');

const plural = (n, um, varios) => (n === 1 ? um : n + ' ' + varios);

export const INTERFACE = {
  'pt-BR': {
    numeros: 'pt-BR',
    especime: 'Nº',
    disponibilidade: { disponivel: 'Disponível', 'sob-encomenda': 'Sob encomenda', indisponivel: 'Indisponível' },
    faixas: { 'ate-100': 'Até R$ 100', '100-200': 'R$ 100 a R$ 200', 'acima-200': 'Acima de R$ 200', orcamento: 'Sob orçamento' },
    tamanhos: ['Pequeno', 'Médio', 'Grande', 'Não sei, quero sugestão'],
    orcamentos: ['Até R$ 100', 'R$ 100 a R$ 200', 'R$ 200 a R$ 400', 'Acima de R$ 400', 'Prefiro conversar'],
    sobOrcamento: 'Sob orçamento',
    semInfo: 'Não informado. Consulte o ateliê pelo WhatsApp.',
    filtros: { ocasiao: 'Ocasião', cor: 'Cor', faixa: 'Faixa de preço' },
    erros: {
      nome: 'Informe seu nome.',
      produto: 'Este produto está indisponível no momento. Escolha outro ou faça um pedido personalizado.',
      quantidade: 'Informe uma quantidade entre 1 e 99.',
      ocasiao: 'Informe a ocasião ou a finalidade.',
      cores: 'Informe ao menos uma cor preferida.',
      referencia: 'Use um link completo, começando com http:// ou https://.'
    },
    mensagem: {
      abertura: 'Oi, Capim Urbano! Quero fazer um pedido pelo site.',
      produto: 'Produto', personalizado: 'Arranjo personalizado (sem produto do catálogo)', preco: 'Preço de referência',
      quantidade: 'Quantidade', ocasiao: 'Ocasião', cores: 'Cores preferidas', tamanho: 'Tamanho', orcamento: 'Orçamento',
      referencia: 'Referência visual', observacoes: 'Observações', nome: 'Nome',
      fechamento: 'Aguardo a confirmação de disponibilidade e valor final.'
    },
    tela: {
      carregando: 'Carregando produtos…',
      encontrados: (n) => plural(n, '1 produto encontrado', 'produtos encontrados'),
      removerFiltro: ', remover filtro',
      tentarDeNovo: 'Tentar de novo',
      carregandoProduto: 'Carregando produto…',
      erroProduto: 'Não foi possível carregar o produto.',
      verifiqueConexao: 'Verifique sua conexão e tente de novo.',
      voltarCatalogo: 'Voltar ao catálogo',
      naoEncontrado: 'Produto não encontrado',
      naoEncontradoTexto: 'Este produto não está mais no catálogo ou o link está incorreto.',
      catalogo: 'Catálogo',
      voceEstaEm: 'Você está em',
      outrasFotos: 'Outras fotos',
      verFoto: (n) => 'Ver foto ' + n,
      fichaDaPeca: 'Ficha da peça',
      rotuloFicha: 'Cuidados, durabilidade e prazo',
      prazo: 'Prazo de produção ou entrega', durabilidade: 'Durabilidade', cuidados: 'Cuidados', ocasioes: 'Ocasiões', cores: 'Cores',
      avisoIndisponivel: 'Este produto está indisponível no momento. Você pode pedir um arranjo personalizado parecido.',
      avisoConfirmacao: 'Disponibilidade e valor final são confirmados no atendimento pelo WhatsApp.',
      pedirPersonalizado: 'Pedir arranjo personalizado',
      fazerPedido: 'Fazer pedido',
      produtoEscolhido: 'Produto escolhido',
      removerEPedir: 'Remover e pedir personalizado',
      erroProdutoLink: 'Não foi possível carregar o produto do link. Verifique sua conexão e tente de novo.',
      produtoLinkAusente: 'O produto do link não foi encontrado. Você pode seguir com um arranjo personalizado.',
      abrirMenu: 'Abrir menu',
      fecharMenu: 'Fechar menu',
      pausar: 'Pausar a passagem automática',
      continuar: 'Continuar a passagem automática',
      fotoAnterior: 'Foto anterior',
      proximaFoto: 'Próxima foto',
      carrossel: 'carrossel',
      fotoDoVaral: (i, n, titulo) => 'Foto ' + i + ' de ' + n + (titulo ? ': ' + titulo : '')
    }
  },
  en: {
    numeros: 'en-US',
    especime: 'No.',
    disponibilidade: { disponivel: 'Available', 'sob-encomenda': 'Made to order', indisponivel: 'Unavailable' },
    faixas: { 'ate-100': 'Up to R$ 100', '100-200': 'R$ 100 to R$ 200', 'acima-200': 'Over R$ 200', orcamento: 'Price on request' },
    tamanhos: ['Small', 'Medium', 'Large', "I'm not sure, please suggest"],
    orcamentos: ['Up to R$ 100', 'R$ 100 to R$ 200', 'R$ 200 to R$ 400', 'Over R$ 400', "I'd rather talk it over"],
    sobOrcamento: 'Price on request',
    semInfo: 'Not provided. Ask the atelier on WhatsApp.',
    filtros: { ocasiao: 'Occasion', cor: 'Color', faixa: 'Price range' },
    erros: {
      nome: 'Enter your name.',
      produto: 'This product is unavailable right now. Choose another one or place a custom order.',
      quantidade: 'Enter a quantity between 1 and 99.',
      ocasiao: 'Enter the occasion or purpose.',
      cores: 'Enter at least one preferred color.',
      referencia: 'Use a full link starting with http:// or https://.'
    },
    mensagem: {
      abertura: 'Hi, Capim Urbano! I would like to place an order through the website.',
      produto: 'Product', personalizado: 'Custom arrangement (no catalog product)', preco: 'Reference price',
      quantidade: 'Quantity', ocasiao: 'Occasion', cores: 'Preferred colors', tamanho: 'Size', orcamento: 'Budget',
      referencia: 'Visual reference', observacoes: 'Notes', nome: 'Name',
      fechamento: 'I look forward to your confirmation of availability and final price.'
    },
    tela: {
      carregando: 'Loading products…',
      encontrados: (n) => plural(n, '1 product found', 'products found'),
      removerFiltro: ', remove filter',
      tentarDeNovo: 'Try again',
      carregandoProduto: 'Loading product…',
      erroProduto: 'We could not load this product.',
      verifiqueConexao: 'Check your connection and try again.',
      voltarCatalogo: 'Back to the catalog',
      naoEncontrado: 'Product not found',
      naoEncontradoTexto: 'This product is no longer in the catalog, or the link is incorrect.',
      catalogo: 'Catalog',
      voceEstaEm: 'You are here',
      outrasFotos: 'More photos',
      verFoto: (n) => 'View photo ' + n,
      fichaDaPeca: 'Specimen sheet',
      rotuloFicha: 'Care, durability and lead time',
      prazo: 'Production or delivery time', durabilidade: 'Durability', cuidados: 'Care', ocasioes: 'Occasions', cores: 'Colors',
      avisoIndisponivel: 'This product is unavailable right now. You can order a similar custom arrangement.',
      avisoConfirmacao: 'Availability and final price are confirmed with the atelier on WhatsApp.',
      pedirPersonalizado: 'Order a custom arrangement',
      fazerPedido: 'Place an order',
      produtoEscolhido: 'Selected product',
      removerEPedir: 'Remove and order a custom piece',
      erroProdutoLink: 'We could not load the product from the link. Check your connection and try again.',
      produtoLinkAusente: 'The product from the link was not found. You can continue with a custom arrangement.',
      abrirMenu: 'Open menu',
      fecharMenu: 'Close menu',
      pausar: 'Pause automatic slideshow',
      continuar: 'Resume automatic slideshow',
      fotoAnterior: 'Previous photo',
      proximaFoto: 'Next photo',
      carrossel: 'carousel',
      fotoDoVaral: (i, n, titulo) => 'Photo ' + i + ' of ' + n + (titulo ? ': ' + titulo : '')
    }
  },
  es: {
    numeros: 'es-AR',
    especime: 'N.º',
    disponibilidade: { disponivel: 'Disponible', 'sob-encomenda': 'Por encargo', indisponivel: 'No disponible' },
    faixas: { 'ate-100': 'Hasta R$ 100', '100-200': 'R$ 100 a R$ 200', 'acima-200': 'Más de R$ 200', orcamento: 'Precio a consultar' },
    tamanhos: ['Pequeño', 'Mediano', 'Grande', 'No sé, quiero una sugerencia'],
    orcamentos: ['Hasta R$ 100', 'R$ 100 a R$ 200', 'R$ 200 a R$ 400', 'Más de R$ 400', 'Prefiero conversarlo'],
    sobOrcamento: 'Precio a consultar',
    semInfo: 'Sin información. Consulta al atelier por WhatsApp.',
    filtros: { ocasiao: 'Ocasión', cor: 'Color', faixa: 'Rango de precio' },
    erros: {
      nome: 'Escribe tu nombre.',
      produto: 'Este producto no está disponible en este momento. Elige otro o haz un pedido personalizado.',
      quantidade: 'Indica una cantidad entre 1 y 99.',
      ocasiao: 'Indica la ocasión o la finalidad.',
      cores: 'Indica al menos un color preferido.',
      referencia: 'Usa un enlace completo, que empiece con http:// o https://.'
    },
    mensagem: {
      abertura: '¡Hola, Capim Urbano! Quiero hacer un pedido desde el sitio web.',
      produto: 'Producto', personalizado: 'Arreglo personalizado (sin producto del catálogo)', preco: 'Precio de referencia',
      quantidade: 'Cantidad', ocasiao: 'Ocasión', cores: 'Colores preferidos', tamanho: 'Tamaño', orcamento: 'Presupuesto',
      referencia: 'Referencia visual', observacoes: 'Observaciones', nome: 'Nombre',
      fechamento: 'Quedo a la espera de la confirmación de disponibilidad y del precio final.'
    },
    tela: {
      carregando: 'Cargando productos…',
      encontrados: (n) => plural(n, '1 producto encontrado', 'productos encontrados'),
      removerFiltro: ', quitar filtro',
      tentarDeNovo: 'Intentar de nuevo',
      carregandoProduto: 'Cargando producto…',
      erroProduto: 'No pudimos cargar el producto.',
      verifiqueConexao: 'Revisa tu conexión e intenta de nuevo.',
      voltarCatalogo: 'Volver al catálogo',
      naoEncontrado: 'Producto no encontrado',
      naoEncontradoTexto: 'Este producto ya no está en el catálogo o el enlace es incorrecto.',
      catalogo: 'Catálogo',
      voceEstaEm: 'Estás en',
      outrasFotos: 'Más fotos',
      verFoto: (n) => 'Ver foto ' + n,
      fichaDaPeca: 'Ficha de la pieza',
      rotuloFicha: 'Cuidados, durabilidad y plazo',
      prazo: 'Plazo de producción o entrega', durabilidade: 'Durabilidad', cuidados: 'Cuidados', ocasioes: 'Ocasiones', cores: 'Colores',
      avisoIndisponivel: 'Este producto no está disponible en este momento. Puedes pedir un arreglo personalizado parecido.',
      avisoConfirmacao: 'La disponibilidad y el precio final se confirman con el atelier por WhatsApp.',
      pedirPersonalizado: 'Pedir un arreglo personalizado',
      fazerPedido: 'Hacer el pedido',
      produtoEscolhido: 'Producto elegido',
      removerEPedir: 'Quitar y pedir uno personalizado',
      erroProdutoLink: 'No pudimos cargar el producto del enlace. Revisa tu conexión e intenta de nuevo.',
      produtoLinkAusente: 'No encontramos el producto del enlace. Puedes seguir con un arreglo personalizado.',
      abrirMenu: 'Abrir menú',
      fecharMenu: 'Cerrar menú',
      pausar: 'Pausar el pase automático',
      continuar: 'Reanudar el pase automático',
      fotoAnterior: 'Foto anterior',
      proximaFoto: 'Foto siguiente',
      carrossel: 'carrusel',
      fotoDoVaral: (i, n, titulo) => 'Foto ' + i + ' de ' + n + (titulo ? ': ' + titulo : '')
    }
  }
};

export const interfaceDe = (lingua) => INTERFACE[linguaValida(lingua)];

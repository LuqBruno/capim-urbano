/* Catálogo padrão da Capim Urbano.
   ATENÇÃO: preços, prazos e disponibilidade abaixo são EXEMPLOS para o MVP.
   A administradora deve conferi-los em admin.html (ou editar este arquivo) antes de publicar.
   preco: número em reais, ou null para "sob orçamento". */
(function (root) {
  root.CAPIM_PRODUTOS_PADRAO = [
    {
      id: 'vaso-terracota-capim',
      nome: 'Vaso terracota com capim laranja',
      categoria: 'Vasos',
      descricao: 'Vaso de terracota com capim desidratado em tom laranja queimado. Uma peça para dar calor a estantes, aparadores e mesas de apoio.',
      fotos: ['imagens/web/capim5.webp'],
      preco: 129,
      disponibilidade: 'disponivel',
      prazo: 'Pronta entrega em Tubarão (SC)',
      durabilidade: 'Mais de 1 ano com os cuidados indicados',
      cuidados: 'Mantenha longe de água, umidade e sol direto. Tire o pó com pincel macio ou ar frio do secador.',
      ocasioes: ['Decoração', 'Aniversário'],
      cores: ['Terracota', 'Laranja'],
      ativo: true
    },
    {
      id: 'vaso-branco-esculpido',
      nome: 'Vaso branco esculpido com flores',
      categoria: 'Vasos',
      descricao: 'Vaso branco esculpido com composição de flores desidratadas em tons neutros, finalizado com etiqueta do ateliê.',
      fotos: ['imagens/web/capim6.webp'],
      preco: 189,
      disponibilidade: 'disponivel',
      prazo: 'Pronta entrega em Tubarão (SC)',
      durabilidade: 'Mais de 1 ano com os cuidados indicados',
      cuidados: 'Evite umidade e luz solar direta. Não borrife água nem produtos sobre as flores.',
      ocasioes: ['Presente', 'Decoração', 'Agradecimento'],
      cores: ['Neutros', 'Creme'],
      ativo: true
    },
    {
      id: 'difusor-flores-vinho',
      nome: 'Difusor com raminho de flores vinho',
      categoria: 'Presentes',
      descricao: 'Difusor de ambiente com raminho de flores desidratadas em vinho sobre base de madeira. Um mimo perfumado e duradouro.',
      fotos: ['imagens/web/capim4.webp'],
      preco: 79,
      disponibilidade: 'disponivel',
      prazo: 'Pronta entrega em Tubarão (SC)',
      durabilidade: 'As flores duram mais de 1 ano; o aroma depende do refil',
      cuidados: 'Mantenha em local ventilado e longe de água. Reponha a essência conforme o uso.',
      ocasioes: ['Presente', 'Agradecimento', 'Aniversário'],
      cores: ['Vinho', 'Neutros'],
      ativo: true
    },
    {
      id: 'buque-presente-vivo',
      nome: 'Buquê desidratado para presente',
      categoria: 'Buquês',
      descricao: 'Buquê de flores desidratadas montado à mão, feito para presentear quem você ama sem pressa de ver as flores murcharem.',
      fotos: ['imagens/web/oficina-presente-vivo.webp'],
      preco: 159,
      disponibilidade: 'sob-encomenda',
      prazo: 'Produção em até 5 dias úteis',
      durabilidade: 'Mais de 1 ano com os cuidados indicados',
      cuidados: 'Guarde fora do sol e da umidade. Pode ser mantido no vaso ou pendurado de cabeça para baixo.',
      ocasioes: ['Aniversário', 'Datas comemorativas', 'Presente'],
      cores: ['Vinho', 'Creme', 'Neutros'],
      ativo: true
    },
    {
      id: 'arranjo-vaso-personalizado',
      nome: 'Arranjo de vaso personalizado',
      categoria: 'Arranjos',
      descricao: 'Arranjo criado sob medida: você escolhe ocasião, cores e tamanho e o ateliê monta a composição e escolhe o vaso.',
      fotos: ['imagens/web/oficina-arranjo-vaso.webp'],
      preco: null,
      disponibilidade: 'sob-encomenda',
      prazo: 'Produção em 5 a 10 dias úteis, conforme o projeto',
      durabilidade: 'Mais de 1 ano com os cuidados indicados',
      cuidados: 'Evite sol direto, umidade e vento forte. Limpe com pincel macio.',
      ocasioes: ['Decoração', 'Aniversário', 'Presente corporativo'],
      cores: ['Sob medida'],
      ativo: true
    },
    {
      id: 'guirlanda-desidratada',
      nome: 'Guirlanda de flores desidratadas',
      categoria: 'Decoração',
      descricao: 'Guirlanda artesanal para portas e paredes, com flores e folhagens desidratadas em composição natural.',
      fotos: ['imagens/web/oficina-guirlanda.webp'],
      preco: 220,
      disponibilidade: 'sob-encomenda',
      prazo: 'Produção em até 7 dias úteis',
      durabilidade: 'Mais de 1 ano em ambientes internos',
      cuidados: 'Use em área coberta, longe de chuva e umidade. Pendure com cuidado para não quebrar as hastes.',
      ocasioes: ['Decoração', 'Datas comemorativas'],
      cores: ['Verde', 'Neutros', 'Terracota'],
      ativo: true
    },
    {
      id: 'composicao-estudio-creme',
      nome: 'Composição de estúdio em creme e dourado',
      categoria: 'Arranjos',
      descricao: 'Composição de flores preservadas em creme, dourado e vinho, para presentear ou decorar ambientes com elegância.',
      fotos: ['imagens/web/capim1.webp', 'imagens/web/capim2.webp'],
      preco: 260,
      disponibilidade: 'indisponivel',
      prazo: 'Sem previsão no momento',
      durabilidade: 'Mais de 1 ano com os cuidados indicados',
      cuidados: 'Mantenha longe de água e umidade, e evite sol direto.',
      ocasioes: ['Decoração', 'Presente corporativo', 'Presente'],
      cores: ['Creme', 'Dourado', 'Vinho'],
      ativo: true
    }
  ];
})(typeof window !== 'undefined' ? window : globalThis);

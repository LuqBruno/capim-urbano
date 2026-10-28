/* Interface do catálogo, da página de produto e do pedido personalizado. */
import { createClient } from '@supabase/supabase-js';
import * as C from '../lib/catalogo-core.js';
import { PRODUTOS_PADRAO } from '../lib/catalogo-dados.js';
import { SUPABASE } from '../lib/supabase-config.js';

(function () {
  const page = document.body.dataset.page;

  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v === false || v == null) return;
      if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v === true ? '' : v);
    });
    [].concat(children).forEach((c) => c && node.append(c));
    return node;
  };

  let ativos = [];
  const porId = (id) => ativos.find((p) => p.id === id);

  /* Busca os produtos no Supabase. Retorna { produtos, origem, erro }; o erro vira a tela "Tentar de novo". */
  async function carregar() {
    let cliente;
    try { cliente = C.criarCliente(SUPABASE, { createClient }); }
    catch (erro) { return { produtos: [], origem: 'banco', erro }; }
    const r = await C.carregarProdutos(PRODUTOS_PADRAO, cliente);
    ativos = r.produtos.filter((p) => p.ativo !== false);
    return r;
  }

  const badge = (p) => el('span', { class: 'status status-' + p.disponibilidade, text: C.DISPONIBILIDADE[p.disponibilidade] });

  /* ---------- Catálogo ---------- */
  function iniciarCatalogo() {
    const erroBox = document.getElementById('catalogo-erro');
    const lista = document.getElementById('lista-produtos');
    const vazio = document.getElementById('catalogo-vazio');
    const contagem = document.getElementById('catalogo-contagem');
    const form = document.getElementById('filtros');
    const selOcasiao = form.elements.ocasiao;
    const selCor = form.elements.cor;
    const selFaixa = form.elements.faixa;

    // Refaz as opções mantendo o que já estava escolhido (na primeira carga, vem da URL).
    const opcoes = (sel, valores) => {
      const atual = sel.value || new URLSearchParams(location.search).get(sel.name) || '';
      sel.querySelectorAll('option:not(:first-child)').forEach((o) => o.remove());
      valores.forEach((v) => sel.append(el('option', { value: v[0], text: v[1] })));
      if ([...sel.options].some((o) => o.value === atual)) sel.value = atual;
    };
    const montarOpcoes = () => {
      opcoes(selOcasiao, C.unicos(ativos, 'ocasioes').map((v) => [v, v]));
      opcoes(selCor, C.unicos(ativos, 'cores').map((v) => [v, v]));
      opcoes(selFaixa, Object.entries(C.FAIXAS_PRECO).map(([k, f]) => [k, f.rotulo]));
    };

    const cartao = (p) => {
      const href = 'produto.html?id=' + encodeURIComponent(p.id);
      return el('li', { class: 'product-card' }, [
        el('a', { href, class: 'product-link' }, [
          el('div', { class: 'product-media' }, [el('img', { src: p.fotos[0], alt: p.nome, width: 800, height: 1000, loading: 'lazy' })]),
          el('div', { class: 'product-body' }, [
            el('div', { class: 'product-meta' }, [el('span', { text: p.categoria }), badge(p)]),
            el('h2', { text: p.nome }),
            el('p', { class: 'product-price', text: C.formatarPreco(p.preco) }),
            el('p', { class: 'product-lead', text: p.prazo })
          ])
        ])
      ]);
    };

    const desenhar = () => {
      const filtros = { ocasiao: selOcasiao.value, cor: selCor.value, faixa: selFaixa.value };
      const resultado = C.filtrarProdutos(ativos, filtros);
      lista.replaceChildren(...resultado.map(cartao));
      vazio.hidden = resultado.length > 0;
      lista.hidden = resultado.length === 0;
      contagem.textContent = resultado.length === 1 ? '1 produto encontrado' : resultado.length + ' produtos encontrados';
      const q = new URLSearchParams();
      Object.entries(filtros).forEach(([k, v]) => v && q.set(k, v));
      history.replaceState(null, '', q.toString() ? '?' + q : location.pathname);
    };

    // Estados: carregando, erro (com "Tentar de novo"), vazio e lista.
    const carregarEDesenhar = async () => {
      erroBox.hidden = true; vazio.hidden = true; lista.hidden = true;
      lista.replaceChildren();
      contagem.textContent = 'Carregando produtos…';
      const r = await carregar();
      if (r.erro) {
        contagem.textContent = '';
        erroBox.hidden = false;
        erroBox.focus();
        return;
      }
      montarOpcoes();
      desenhar();
    };

    const limpar = () => { form.reset(); desenhar(); selOcasiao.focus(); };
    form.addEventListener('change', desenhar);
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('reset', () => setTimeout(desenhar));
    document.getElementById('limpar-vazio').addEventListener('click', limpar);
    document.getElementById('tentar-de-novo').addEventListener('click', carregarEDesenhar);
    carregarEDesenhar();
  }

  /* ---------- Produto ---------- */
  async function iniciarProduto() {
    const alvo = document.getElementById('produto');
    const id = new URLSearchParams(location.search).get('id');
    alvo.replaceChildren(el('p', { role: 'status', text: 'Carregando produto…' }));
    const r = await carregar();
    if (r.erro) {
      const tentar = el('button', { class: 'button button-dark', type: 'button', text: 'Tentar de novo' });
      tentar.addEventListener('click', iniciarProduto);
      alvo.replaceChildren(el('div', { role: 'alert' }, [
        el('h1', { text: 'Não foi possível carregar o produto.' }),
        el('p', { text: 'Verifique sua conexão e tente de novo.' }),
        el('div', { class: 'actions' }, [tentar, el('a', { class: 'text-link', href: 'catalogo.html', text: 'Voltar ao catálogo' })])
      ]));
      return;
    }
    const p = porId(id);
    if (!p) {
      alvo.replaceChildren(
        el('h1', { text: 'Produto não encontrado' }),
        el('p', { text: 'Este produto não está mais no catálogo ou o link está incorreto.' }),
        el('a', { class: 'button button-dark', href: 'catalogo.html', text: 'Voltar ao catálogo' })
      );
      document.title = 'Produto não encontrado | Capim Urbano';
      return;
    }
    document.title = p.nome + ' | Capim Urbano';
    const indisponivel = p.disponibilidade === 'indisponivel';
    // Cuidados, durabilidade e prazo sempre aparecem; sem cadastro, mostram aviso (US04).
    const info = (rotulo, valor, obrigatorio) => {
      const texto = obrigatorio ? C.textoOuAviso(valor) : valor;
      if (!texto) return null;
      const ausente = obrigatorio && texto === C.AVISO_SEM_INFO;
      return el('div', { class: 'spec' + (ausente ? ' spec-missing' : '') }, [el('dt', { text: rotulo }), el('dd', { text: texto })]);
    };

    const principal = el('img', { src: p.fotos[0], alt: p.nome, width: 1200, height: 1500, id: 'foto-principal' });
    const miniaturas = p.fotos.length > 1 && el('ul', { class: 'thumbs', 'aria-label': 'Outras fotos' },
      p.fotos.map((src, i) => el('li', {}, [
        el('button', { type: 'button', 'aria-label': 'Ver foto ' + (i + 1), 'aria-pressed': String(i === 0) }, [el('img', { src, alt: '', width: 120, height: 150 })])
      ])));
    if (miniaturas) miniaturas.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      principal.src = b.querySelector('img').src;
      miniaturas.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });

    const pedidoHref = 'pedido.html?produto=' + encodeURIComponent(p.id);
    alvo.replaceChildren(
      el('div', { class: 'product-gallery' }, [el('div', { class: 'product-main' }, [principal]), miniaturas]),
      el('div', { class: 'product-info' }, [
        el('nav', { class: 'crumbs', 'aria-label': 'Você está em' }, [
          el('a', { href: 'catalogo.html', text: 'Catálogo' }), el('span', { 'aria-hidden': 'true', text: '/' }), el('span', { 'aria-current': 'page', text: p.categoria })
        ]),
        el('h1', { text: p.nome }),
        el('p', { class: 'product-price big', text: C.formatarPreco(p.preco) }),
        el('p', {}, [badge(p)]),
        el('p', { class: 'lead', text: p.descricao }),
        el('dl', { class: 'specs', 'aria-label': 'Cuidados, durabilidade e prazo' }, [
          info('Prazo de produção ou entrega', p.prazo, true), info('Durabilidade', p.durabilidade, true), info('Cuidados', p.cuidados, true),
          info('Ocasiões', (p.ocasioes || []).join(', ')), info('Cores', (p.cores || []).join(', '))
        ]),
        indisponivel
          ? el('p', { class: 'notice', role: 'status', text: 'Este produto está indisponível no momento. Você pode pedir um arranjo personalizado parecido.' })
          : el('p', { class: 'notice', text: 'Disponibilidade e valor final são confirmados no atendimento pelo WhatsApp.' }),
        el('div', { class: 'actions' }, [
          indisponivel
            ? el('a', { class: 'button button-dark', href: 'pedido.html', text: 'Pedir arranjo personalizado' })
            : el('a', { class: 'button button-dark', href: pedidoHref, text: 'Fazer pedido' }),
          el('a', { class: 'text-link', href: 'catalogo.html', text: 'Voltar ao catálogo' })
        ])
      ])
    );
  }

  /* ---------- Pedido personalizado ---------- */
  async function iniciarPedido() {
    const form = document.getElementById('pedido');
    const resumo = document.getElementById('resumo');
    const resumoTexto = document.getElementById('resumo-texto');
    const enviar = document.getElementById('enviar-whatsapp');
    const produtoBox = document.getElementById('produto-escolhido');
    const id = new URLSearchParams(location.search).get('produto');

    C.TAMANHOS.forEach((t) => form.elements.tamanho.append(el('option', { value: t, text: t })));
    C.ORCAMENTOS.forEach((t) => form.elements.orcamento.append(el('option', { value: t, text: t })));

    // Enquanto o produto do link não carrega (ou se falhar), não dá para saber se está indisponível: o pedido fica bloqueado.
    let produto = null;
    let bloqueado = Boolean(id);

    const dados = () => Object.fromEntries(new FormData(form).entries());
    const marcarErros = (erros) => {
      form.querySelectorAll('[data-campo]').forEach((campo) => {
        const nome = campo.dataset.campo;
        const input = campo.querySelector('input, select, textarea');
        const msg = campo.querySelector('.field-error');
        const erro = erros[nome];
        msg.textContent = erro || '';
        msg.hidden = !erro;
        if (erro) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      });
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (bloqueado) { resumo.hidden = true; produtoBox.scrollIntoView({ behavior: 'smooth' }); return; }
      const d = dados();
      const { valido, erros } = C.validarPedido(d, produto);
      marcarErros(erros);
      if (!valido) {
        resumo.hidden = true;
        const primeiro = form.querySelector('[aria-invalid="true"]');
        if (primeiro) primeiro.focus();
        else produtoBox.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      const mensagem = C.montarMensagem(d, produto);
      resumoTexto.textContent = mensagem;
      enviar.href = C.montarLinkWhatsApp(mensagem);
      resumo.hidden = false;
      resumo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      resumo.focus();
    });
    form.addEventListener('input', () => { resumo.hidden = true; });

    const carregarProdutoDoLink = async () => {
      const r = await carregar();
      produto = id ? porId(id) : null;
      bloqueado = false;
      const lista = document.getElementById('ocasioes-sugeridas');
      C.unicos(ativos, 'ocasioes').forEach((s) => lista.append(el('option', { value: s })));

      if (r.erro && id) {
        bloqueado = true;
        const tentar = el('button', { class: 'button button-light', type: 'button', text: 'Tentar de novo' });
        tentar.addEventListener('click', () => location.reload());
        produtoBox.hidden = false;
        produtoBox.append(el('p', { role: 'alert', text: 'Não foi possível carregar o produto do link. Verifique sua conexão e tente de novo.' }), tentar);
      } else if (id && !produto) {
        produtoBox.hidden = false;
        produtoBox.append(el('p', { role: 'alert', text: 'O produto do link não foi encontrado. Você pode seguir com um arranjo personalizado.' }));
      } else if (produto) {
        produtoBox.hidden = false;
        produtoBox.append(
          el('img', { src: produto.fotos[0], alt: '', width: 96, height: 120 }),
          el('div', {}, [
            el('p', { class: 'eyebrow', text: 'Produto escolhido' }),
            el('p', { class: 'product-name', text: produto.nome }),
            el('p', { text: C.formatarPreco(produto.preco) }),
            el('a', { href: 'pedido.html', text: 'Remover e pedir personalizado' })
          ])
        );
        if (produto.disponibilidade === 'indisponivel') {
          produtoBox.append(el('p', { class: 'field-error', role: 'alert', text: C.validarPedido({}, produto).erros.produto }));
        }
      }
    };

    carregarProdutoDoLink();
  }

  if (page === 'catalogo') iniciarCatalogo();
  else if (page === 'produto') iniciarProduto();
  else if (page === 'pedido') iniciarPedido();
})();

/* Cadastro de produtos (MVP): salva no navegador da administradora e exporta JSON. */
(function () {
  const C = window.CapimCore;
  const storage = (() => { try { return window.localStorage; } catch (e) { return null; } })();
  const form = document.getElementById('form-produto');
  const tabela = document.getElementById('tabela');
  const status = document.getElementById('admin-status');
  const titulo = document.getElementById('form-titulo');
  let produtos = C.carregarProdutos(window.CAPIM_PRODUTOS_PADRAO || [], storage);

  Object.entries(C.DISPONIBILIDADE).forEach(([v, t]) => {
    const o = document.createElement('option'); o.value = v; o.textContent = t; form.elements.disponibilidade.append(o);
  });

  const avisar = (texto) => { status.textContent = texto; };
  const persistir = () => {
    if (!storage) { avisar('Não foi possível salvar: o navegador bloqueou o armazenamento.'); return false; }
    C.salvarProdutos(produtos, storage);
    return true;
  };
  const lista = (texto) => texto.split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
  const paraNumero = (texto) => {
    const t = texto.trim();
    if (!t) return null;
    const n = Number(t.replace(/\./g, '').replace(',', '.'));
    return isFinite(n) ? n : NaN;
  };

  function desenhar() {
    tabela.replaceChildren(...produtos.map((p) => {
      const tr = document.createElement('tr');
      const cel = (t) => { const td = document.createElement('td'); td.textContent = t; return td; };
      const acao = (rotulo, fn) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'text-link'; b.textContent = rotulo;
        b.setAttribute('aria-label', rotulo + ': ' + p.nome); b.addEventListener('click', fn); return b;
      };
      const tdNome = document.createElement('th'); tdNome.scope = 'row'; tdNome.textContent = p.nome;
      const tdAcoes = document.createElement('td'); tdAcoes.className = 'row-actions';
      tdAcoes.append(
        acao('Editar', () => editar(p.id)),
        acao(p.ativo === false ? 'Reativar' : 'Desativar', () => { p.ativo = p.ativo === false; if (persistir()) { avisar((p.ativo ? 'Reativado: ' : 'Desativado: ') + p.nome); desenhar(); } })
      );
      tr.append(tdNome, cel(C.formatarPreco(p.preco)), cel(C.DISPONIBILIDADE[p.disponibilidade] || '—'), cel(p.ativo === false ? 'Não' : 'Sim'), tdAcoes);
      return tr;
    }));
  }

  function limparForm() {
    form.reset();
    form.elements.id.value = '';
    titulo.textContent = 'Novo produto';
    marcarErros({});
  }

  function editar(id) {
    const p = produtos.find((x) => x.id === id);
    if (!p) return;
    form.elements.id.value = p.id;
    form.elements.nome.value = p.nome || '';
    form.elements.categoria.value = p.categoria || '';
    form.elements.descricao.value = p.descricao || '';
    form.elements.fotos.value = (p.fotos || []).join('\n');
    form.elements.preco.value = typeof p.preco === 'number' ? String(p.preco).replace('.', ',') : '';
    form.elements.disponibilidade.value = p.disponibilidade;
    form.elements.prazo.value = p.prazo || '';
    form.elements.durabilidade.value = p.durabilidade || '';
    form.elements.cuidados.value = p.cuidados || '';
    form.elements.ocasioes.value = (p.ocasioes || []).join(', ');
    form.elements.cores.value = (p.cores || []).join(', ');
    form.elements.ativo.checked = p.ativo !== false;
    titulo.textContent = 'Editar produto';
    marcarErros({});
    form.elements.nome.focus();
  }

  function marcarErros(erros) {
    form.querySelectorAll('[data-campo]').forEach((campo) => {
      const input = campo.querySelector('input, select, textarea');
      const msg = campo.querySelector('.field-error');
      const erro = erros[campo.dataset.campo];
      msg.textContent = erro || ''; msg.hidden = !erro;
      if (erro) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = form.elements;
    const preco = paraNumero(f.preco.value);
    const produto = {
      id: f.id.value,
      nome: f.nome.value.trim(),
      categoria: f.categoria.value.trim(),
      descricao: f.descricao.value.trim(),
      fotos: lista(f.fotos.value),
      preco,
      disponibilidade: f.disponibilidade.value,
      prazo: f.prazo.value.trim(),
      durabilidade: f.durabilidade.value.trim(),
      cuidados: f.cuidados.value.trim(),
      ocasioes: lista(f.ocasioes.value),
      cores: lista(f.cores.value),
      ativo: f.ativo.checked
    };
    const { valido, erros } = C.validarProduto(produto);
    marcarErros(erros);
    if (!valido) { const p = form.querySelector('[aria-invalid="true"]'); if (p) p.focus(); return; }
    if (!produto.id) {
      let base = C.slug(produto.nome) || 'produto', id = base, n = 2;
      while (produtos.some((x) => x.id === id)) id = base + '-' + n++;
      produto.id = id;
      produtos.push(produto);
    } else {
      produtos = produtos.map((x) => (x.id === produto.id ? produto : x));
    }
    if (persistir()) { avisar('Produto salvo: ' + produto.nome); limparForm(); desenhar(); }
  });

  document.getElementById('novo').addEventListener('click', () => { limparForm(); form.elements.nome.focus(); });
  document.getElementById('cancelar').addEventListener('click', limparForm);

  document.getElementById('exportar').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(produtos, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'produtos-capim-urbano.json'; a.click();
    URL.revokeObjectURL(a.href);
    avisar('Arquivo exportado.');
  });

  document.getElementById('importar').addEventListener('change', (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    arquivo.text().then((texto) => {
      let lista;
      try { lista = JSON.parse(texto); } catch (err) { avisar('Arquivo inválido: não é um JSON.'); return; }
      if (!Array.isArray(lista) || !lista.every((p) => p && p.id && C.validarProduto(p).valido)) {
        avisar('Arquivo inválido: há produtos sem os campos obrigatórios.'); return;
      }
      produtos = lista;
      if (persistir()) { avisar(lista.length + ' produtos importados.'); desenhar(); }
    });
    e.target.value = '';
  });

  document.getElementById('restaurar').addEventListener('click', () => {
    if (!window.confirm('Descartar as alterações deste navegador e voltar ao catálogo padrão?')) return;
    try { storage && storage.removeItem(C.STORAGE_KEY); } catch (err) { /* ignora */ }
    produtos = C.carregarProdutos(window.CAPIM_PRODUTOS_PADRAO || [], null);
    avisar('Catálogo padrão restaurado.'); limparForm(); desenhar();
  });

  desenhar();
})();

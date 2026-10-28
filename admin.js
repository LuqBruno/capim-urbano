/* Cadastro de produtos: login da administradora (Supabase Auth) e gravação em public.produtos.
   Quem pode escrever é decidido pelo banco (RLS); esta tela só cuida da interface. */
(function () {
  const C = window.CapimCore;
  const form = document.getElementById('form-produto');
  const formLogin = document.getElementById('form-login');
  const areaLogin = document.getElementById('area-login');
  const areaAdmin = document.getElementById('area-admin');
  const carregando = document.getElementById('admin-carregando');
  const tabela = document.getElementById('tabela');
  const status = document.getElementById('admin-status');
  const loginStatus = document.getElementById('login-status');
  const titulo = document.getElementById('form-titulo');
  const botaoSalvar = form.querySelector('button[type=submit]');
  let cliente = null;
  let produtos = [];

  Object.entries(C.DISPONIBILIDADE).forEach(([v, t]) => {
    const o = document.createElement('option'); o.value = v; o.textContent = t; form.elements.disponibilidade.append(o);
  });

  // Estados de retorno: neutro, sucesso e erro (o erro também é lido por leitores de tela).
  const avisarEm = (alvo, texto, tipo) => {
    alvo.textContent = texto;
    alvo.className = 'admin-status' + (tipo ? ' is-' + tipo : '');
    alvo.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  };
  const avisar = (texto, tipo) => avisarEm(status, texto, tipo);
  const lista = (texto) => texto.split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
  const paraNumero = (texto) => {
    const t = texto.trim();
    if (!t) return null;
    const n = Number(t.replace(/\./g, '').replace(',', '.'));
    return isFinite(n) ? n : NaN;
  };

  const mostrar = (qual) => {
    carregando.hidden = qual !== 'carregando';
    areaLogin.hidden = qual !== 'login';
    areaAdmin.hidden = qual !== 'admin';
  };

  function marcarErrosEm(formulario, erros) {
    formulario.querySelectorAll('[data-campo]').forEach((campo) => {
      const input = campo.querySelector('input, select, textarea');
      const msg = campo.querySelector('.field-error');
      const erro = erros[campo.dataset.campo];
      msg.textContent = erro || ''; msg.hidden = !erro;
      if (erro) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    });
  }
  const marcarErros = (erros) => marcarErrosEm(form, erros);

  /* ---------- Tabela ---------- */
  function linhaDeEstado(texto, botao) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5; td.className = 'table-state';
    td.textContent = texto;
    if (botao) td.append(document.createElement('br'), botao);
    tr.append(td);
    tabela.replaceChildren(tr);
  }

  function desenhar() {
    if (produtos.length === 0) { linhaDeEstado('Nenhum produto cadastrado. Use "Novo produto" para começar.'); return; }
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
        acao(p.ativo === false ? 'Reativar' : 'Desativar', () => alternarAtivo(p))
      );
      tr.append(tdNome, cel(C.formatarPreco(p.preco)), cel(C.DISPONIBILIDADE[p.disponibilidade] || '—'), cel(p.ativo === false ? 'Não' : 'Sim'), tdAcoes);
      return tr;
    }));
  }

  async function carregarLista() {
    linhaDeEstado('Carregando produtos…');
    const r = await C.carregarProdutos([], cliente);
    if (r.erro) {
      produtos = [];
      const tentar = document.createElement('button');
      tentar.type = 'button'; tentar.className = 'button button-light'; tentar.textContent = 'Tentar de novo';
      tentar.addEventListener('click', carregarLista);
      linhaDeEstado('Não foi possível carregar os produtos. Verifique a conexão e tente de novo.', tentar);
      avisar('Não foi possível carregar os produtos.', 'error');
      return;
    }
    produtos = r.produtos;
    desenhar();
  }

  /* ---------- Formulário ---------- */
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
    form.elements.arquivos.value = '';
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

  async function alternarAtivo(p) {
    const ativo = p.ativo === false;
    const { data, error } = await cliente.from('produtos').update({ ativo }).eq('id', p.id).select();
    if (error || !data || data.length === 0) { avisar('Não foi possível alterar "' + p.nome + '". Entre de novo e tente outra vez.', 'error'); return; }
    p.ativo = ativo;
    avisar((ativo ? 'Reativado no catálogo: ' : 'Desativado, saiu do catálogo: ') + p.nome, 'success');
    desenhar();
  }

  /* Envia as fotos novas ao Storage e devolve as URLs públicas. Se uma falhar, apaga as já enviadas. */
  async function enviarFotos(idProduto, arquivos) {
    const bucket = cliente.storage.from('produtos');
    const enviados = [];
    for (const arquivo of arquivos) {
      const caminho = C.caminhoFoto(idProduto, arquivo, Date.now().toString(36) + enviados.length);
      const { error } = await bucket.upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
      if (error) {
        if (enviados.length) await bucket.remove(enviados);
        throw new Error('Não foi possível enviar a foto ' + arquivo.name + '.');
      }
      enviados.push(caminho);
    }
    return enviados.map((c) => bucket.getPublicUrl(c).data.publicUrl);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements;
    const arquivos = [...f.arquivos.files];
    const produto = {
      id: f.id.value,
      nome: f.nome.value.trim(),
      categoria: f.categoria.value.trim(),
      descricao: f.descricao.value.trim(),
      fotos: lista(f.fotos.value),
      preco: paraNumero(f.preco.value),
      disponibilidade: f.disponibilidade.value,
      prazo: f.prazo.value.trim(),
      durabilidade: f.durabilidade.value.trim(),
      cuidados: f.cuidados.value.trim(),
      ocasioes: lista(f.ocasioes.value),
      cores: lista(f.cores.value),
      ativo: f.ativo.checked
    };
    // As fotos novas ainda não têm URL; contam como fotos só para a validação.
    const { valido, erros } = C.validarProduto({ ...produto, fotos: produto.fotos.concat(arquivos.map((a) => a.name)) });
    const erroArquivo = arquivos.map(C.validarArquivoFoto).find(Boolean);
    if (erroArquivo) erros.arquivos = erroArquivo;
    if (erros.fotos) erros.fotos = 'Informe ao menos uma foto (envie um arquivo ou cole o caminho).';
    marcarErros(erros);
    if (!valido || erroArquivo) {
      avisar('Corrija os campos destacados e salve novamente.', 'error');
      const p = form.querySelector('[aria-invalid="true"]'); if (p) p.focus();
      return;
    }

    const novo = !produto.id;
    if (novo) {
      const base = C.slug(produto.nome) || 'produto';
      let id = base, n = 2;
      while (produtos.some((x) => x.id === id)) id = base + '-' + n++;
      produto.id = id;
    }
    botaoSalvar.disabled = true;
    avisar('Salvando…');
    try {
      if (arquivos.length) produto.fotos = produto.fotos.concat(await enviarFotos(produto.id, arquivos));
      const linha = C.produtoParaLinha(produto);
      const consulta = novo
        ? cliente.from('produtos').insert(linha).select()
        : cliente.from('produtos').update(linha).eq('id', produto.id).select();
      const { data, error } = await consulta;
      if (error || !data || data.length === 0) {
        throw new Error(error && error.code === '23505'
          ? 'Já existe um produto com este identificador. Mude o nome e tente de novo.'
          : 'Não foi possível salvar. Entre de novo e tente outra vez.');
      }
      const salvo = C.linhaParaProduto(data[0]);
      produtos = novo ? produtos.concat(salvo) : produtos.map((x) => (x.id === salvo.id ? salvo : x));
      avisar('Produto salvo: ' + salvo.nome + '. Já aparece no catálogo para todos os clientes.', 'success');
      limparForm(); desenhar();
    } catch (erro) {
      avisar(erro.message, 'error');
    } finally {
      botaoSalvar.disabled = false;
    }
  });

  document.getElementById('novo').addEventListener('click', () => { limparForm(); form.elements.nome.focus(); });
  document.getElementById('cancelar').addEventListener('click', limparForm);

  // Cópia de segurança: baixa a lista atual (inclusive desativados).
  document.getElementById('exportar').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(produtos, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'produtos-capim-urbano.json'; a.click();
    URL.revokeObjectURL(a.href);
    avisar('Cópia baixada.', 'success');
  });

  /* ---------- Login ---------- */
  async function entrarNaArea() {
    mostrar('carregando');
    const { data, error } = await cliente.from('administradoras').select('user_id');
    if (error) {
      mostrar('login');
      avisarEm(loginStatus, 'Não foi possível confirmar seu acesso. Verifique a conexão e tente de novo.', 'error');
      return;
    }
    if (!data || data.length === 0) {
      await cliente.auth.signOut();
      mostrar('login');
      avisarEm(loginStatus, 'Esta conta não tem permissão de administradora.', 'error');
      return;
    }
    mostrar('admin');
    avisar('');
    limparForm();
    await carregarLista();
  }

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = formLogin.elements.email.value.trim();
    const senha = formLogin.elements.senha.value;
    const erros = {};
    if (!email) erros.email = 'Informe o e-mail.';
    if (!senha) erros.senha = 'Informe a senha.';
    marcarErrosEm(formLogin, erros);
    if (Object.keys(erros).length) { avisarEm(loginStatus, ''); formLogin.querySelector('[aria-invalid="true"]').focus(); return; }
    const entrar = document.getElementById('entrar');
    entrar.disabled = true;
    avisarEm(loginStatus, 'Entrando…');
    const { error } = await cliente.auth.signInWithPassword({ email, password: senha });
    entrar.disabled = false;
    formLogin.elements.senha.value = '';
    if (error) {
      avisarEm(loginStatus, error.status === 400 || error.status === 401 || error.status === 422
        ? 'E-mail ou senha incorretos.'
        : 'Não foi possível entrar. Verifique a conexão e tente de novo.', 'error');
      return;
    }
    avisarEm(loginStatus, '');
    await entrarNaArea();
  });

  document.getElementById('sair').addEventListener('click', async () => {
    await cliente.auth.signOut();
    produtos = [];
    mostrar('login');
    avisarEm(loginStatus, 'Você saiu da administração.', 'success');
    formLogin.elements.email.focus();
  });

  /* ---------- Início ---------- */
  (async function iniciar() {
    try { cliente = C.criarCliente(window.CAPIM_SUPABASE, window.supabase); }
    catch (erro) { cliente = null; }
    if (!cliente) {
      mostrar('login');
      formLogin.querySelectorAll('input, button').forEach((c) => { c.disabled = true; });
      avisarEm(loginStatus, 'A administração está indisponível: não foi possível carregar o Supabase. Recarregue a página.', 'error');
      return;
    }
    const { data } = await cliente.auth.getSession();
    if (data && data.session) await entrarNaArea(); else mostrar('login');
  })();
})();

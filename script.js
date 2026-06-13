// ============================================
// STAGE TELECOM CRM - SCRIPT COMPLETO
// ============================================
let DB = JSON.parse(localStorage.getItem('stage_db'));

if (!DB) {
    DB = {
        usuarios: [
            { id: 1, usuario: "admin", senha: "admin123", nome: "Master Admin", email: "admin@stagetelecom.com.br", tipo: "admin", ativo: true, deletedAt: null, equipe: "Gestão", categoria: "admin" },
            { id: 2, usuario: "joao.silva", senha: "vend123", nome: "João Silva", email: "joao@stagetelecom.com.br", tipo: "vendedor", ativo: true, deletedAt: null, equipe: "Alpha", categoria: "vendedor" },
            { id: 3, usuario: "maria.santos", senha: "vend123", nome: "Maria Santos", email: "maria@stagetelecom.com.br", tipo: "vendedor", ativo: true, deletedAt: null, equipe: "Alpha", categoria: "vendedor" },
            { id: 4, usuario: "pedro.costa", senha: "vend123", nome: "Pedro Costa", email: "pedro@stagetelecom.com.br", tipo: "vendedor", ativo: true, deletedAt: null, equipe: "Beta", categoria: "vendedor" }
        ],
        clientes: [
            { id: 1, nome: "TechBrasil Ltda", cnpj: "00.000.000/0001-00", telefone: "(11) 3456-7890", email: "contato@techbrasil.com.br", vendedor_id: 2, status: "ativo", plano: "Premium", valor: 899.90, data: "2024-01-15" },
            { id: 2, nome: "Comércio Digital SA", cnpj: "11.111.111/0001-11", telefone: "(21) 2345-6789", email: "digital@comercio.com.br", vendedor_id: 2, status: "ativo", plano: "Empresarial", valor: 499.90, data: "2024-02-20" },
            { id: 3, nome: "NetConnect Provedor", cnpj: "22.222.222/0001-22", telefone: "(31) 3456-7890", email: "vendas@netconnect.com.br", vendedor_id: 3, status: "prospecto", plano: "Básico", valor: 299.90, data: "2024-03-10" },
            { id: 4, nome: "Fibra Ótica Brasil", cnpj: "33.333.333/0001-33", telefone: "(41) 3456-7890", email: "contato@fibraotica.com.br", vendedor_id: 3, status: "ativo", plano: "Premium", valor: 899.90, data: "2024-04-05" },
            { id: 5, nome: "Telecom Solutions", cnpj: "44.444.444/0001-44", telefone: "(51) 3456-7890", email: "vendas@telecomsolutions.com.br", vendedor_id: 4, status: "prospecto", plano: "Empresarial", valor: 499.90, data: "2024-05-15" },
            { id: 6, nome: "Internet Rápida Ltda", cnpj: "55.555.555/0001-55", telefone: "(61) 3456-7890", email: "suporte@internetrapida.com.br", vendedor_id: 4, status: "ativo", plano: "Básico", valor: 299.90, data: "2024-06-01" }
        ],
        config: { metaDiaria: 10, metaMensal: 50 },
        statusFlags: [
            { id: 1, nome: "Ativo", cor: "#2ed573" },
            { id: 2, nome: "Pendente", cor: "#ffa502" },
            { id: 3, nome: "Cancelado", cor: "#ff4757" }
        ],
        ativacoes: [],
        metas: {
            diariaVendas: 10, quinzenalVendas: 75, mensalVendas: 150,
            produtos: [],
            instalacoes: []
        },
        promocoes: [],
        notificacoes: []  // { id, userId, mensagem, lida }
    };
}

if (!DB.statusFlags) {
    DB.statusFlags = [
        { id: 1, nome: "Ativo", cor: "#2ed573" },
        { id: 2, nome: "Pendente", cor: "#ffa502" },
        { id: 3, nome: "Cancelado", cor: "#ff4757" }
    ];
}
if (!DB.ativacoes) DB.ativacoes = [];
if (!DB.metas) {
    DB.metas = {
        diariaVendas: 10, quinzenalVendas: 75, mensalVendas: 150,
        produtos: [],
        instalacoes: []
    };
}
if (!DB.metas.produtos) DB.metas.produtos = [];
if (!DB.metas.instalacoes) DB.metas.instalacoes = [];
if (!DB.promocoes) DB.promocoes = [];
if (!DB.notificacoes) DB.notificacoes = [];
DB.usuarios.forEach(u => { if (!u.categoria) u.categoria = u.tipo || 'vendedor'; });
DB.usuarios.forEach(u => { if (!u.equipe) u.equipe = 'Geral'; });

function salvarDB() { localStorage.setItem('stage_db', JSON.stringify(DB)); }

let sessao = JSON.parse(localStorage.getItem('stage_session'));
let comparativoAtual = 'diario';
let graficoVendedoresInstance = null;

// ===== RELÓGIO GLOBAL =====
setInterval(() => {
    const agora = new Date();
    const diasSemana = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];
    const meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
    const dataFormatada = `${diasSemana[agora.getDay()]}, ${agora.getDate()} DE ${meses[agora.getMonth()]} DE ${agora.getFullYear()}`;
    const horas = String(agora.getHours()).padStart(2,'0');
    const minutos = String(agora.getMinutes()).padStart(2,'0');
    const segundos = String(agora.getSeconds()).padStart(2,'0');
    const periodo = agora.getHours() < 12 ? '☀️ MANHÃ' : agora.getHours() < 18 ? '🌤️ TARDE' : '🌙 NOITE';

    ['dataAtual','dataAtualAtivacoes'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = dataFormatada; });
    ['horaAtual','horaAtualAtivacoes'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = `${horas}:${minutos}:${segundos}`; });
    ['periodoDia','periodoDiaAtivacoes'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = periodo; });
}, 1000);

// ===== LOGIN =====
function fazerLogin() {
    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value.trim();
    const erro = document.getElementById('mensagemErro');
    if (!usuario || !senha) { erro.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Preencha todos os campos!'; erro.style.color = '#ffa502'; return; }
    const user = DB.usuarios.find(u => u.usuario === usuario && u.senha === senha && u.ativo && !u.deletedAt);
    if (user) {
        sessao = { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo };
        localStorage.setItem('stage_session', JSON.stringify(sessao));
        erro.innerHTML = '<i class="fas fa-check-circle"></i> Login realizado! Redirecionando...';
        erro.style.color = '#2ed573';
        if (document.getElementById('lembrar')?.checked) localStorage.setItem('stage_remember', usuario);
        setTimeout(() => { if (user.tipo === 'admin') mostrarAdmin(); else mostrarVendedor(); }, 600);
    } else {
        erro.innerHTML = '<i class="fas fa-times-circle"></i> Usuário ou senha inválidos!';
        erro.style.color = '#ff4757';
        document.getElementById('senha').value = '';
        document.getElementById('senha').focus();
    }
}

function logout() {
    localStorage.removeItem('stage_session');
    sessao = null;
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'none';
}

function mostrarAdmin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'flex';
    document.getElementById('vendedorScreen').style.display = 'none';
    document.getElementById('userInfoAdmin').innerHTML = `<div style="font-weight:700;font-size:15px;">${sessao.nome}</div><div style="font-size:11px;color:var(--primary-light);margin-top:3px;">👑 Administrador</div><div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:3px;">${sessao.email}</div>`;
    carregarDashboard();
    verificarPromocoesAdmin(); // verifica promoções ao logar
}
function mostrarVendedor() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'flex';
    document.getElementById('userInfoVendedor').innerHTML = `<div style="font-weight:700;font-size:15px;">${sessao.nome}</div><div style="font-size:11px;color:var(--primary-light);margin-top:3px;">💼 Vendedor</div><div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:3px;">${sessao.email}</div>`;
    carregarMeusClientes();
    verificarNotificacoesVendedor(); // mostra notificações pendentes
}

// ===== DADOS DE VENDAS (mantidos) =====
function gerarDadosVendas() {
    // ... igual ao anterior ...
}
function gerarVendasDiaPassado() { /* ... */ }
function gerarVendasMesAtual() { /* ... */ }
function gerarVendasMesAnterior() { /* ... */ }

// ===== DASHBOARD (removida tabela de clientes) =====
function carregarDashboard() {
    const vendasMes = gerarVendasMesAtual();
    const realizado = vendasMes.length;
    const metaMensal = DB.metas.mensalVendas || 150;
    const percentual = Math.min((realizado / metaMensal) * 100, 100).toFixed(1);
    document.getElementById('metaMensalCard').textContent = metaMensal;
    document.getElementById('realizadoMeta').textContent = realizado;
    document.getElementById('faltamMeta').textContent = Math.max(metaMensal - realizado, 0);
    document.getElementById('percentualMeta').textContent = `${percentual}%`;
    document.getElementById('barraLiquida').style.width = `${percentual}%`;

    carregarVendasDiarias();
    mostrarComparativo(comparativoAtual);
    // Removida a chamada para carregar tabela de clientes
}

function carregarVendasDiarias() {
    // ... igual, usando DB.metas.diariaVendas
}

// ===== COMPARATIVO =====
// ... igual ...

// ===== NAVEGAÇÃO ADMIN =====
function mostrarSecao(secao) {
    document.querySelectorAll('.section-active,.section-hidden').forEach(s=>{s.style.display='none';s.className='section-hidden';});
    const el = document.getElementById(`secao-${secao}`); if(el){el.style.display='block';el.className='section-active';}
    document.querySelectorAll('.nav-item').forEach(a=>a.classList.remove('active'));
    const nav = document.querySelector(`[data-section="${secao}"]`); if(nav) nav.classList.add('active');
    document.getElementById('tituloSecao').innerHTML = {
        dashboard:'📊 Dashboard',
        cadastro:'👥 Cadastro',
        ativacoes:'⚡ Ativações',
        relatorios:'📈 Relatórios',
        metas:'🎯 Metas'
    }[secao]||secao;

    if(secao==='cadastro') carregarUsuarios();
    if(secao==='ativacoes') carregarAtivacoes();
    if(secao==='relatorios') carregarRelatorios();
    if(secao==='metas') {
        carregarMetas();
        carregarPromocoes();
    }
}

// ===== CADASTRO, ATIVAÇÕES, RELATÓRIOS (mantidos) =====
// ... (manter todas as funções anteriores) ...

// ===== METAS =====
function mostrarAbaMeta(aba) {
    document.querySelectorAll('.aba-meta').forEach(a => a.classList.remove('active'));
    document.getElementById(`aba-${aba}`).classList.add('active');
    document.querySelectorAll('.meta-tab').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    if (aba === 'definir') carregarMetas();
    if (aba === 'promocoes') carregarPromocoes();
}

function carregarMetas() {
    // Metas de Vendas
    document.getElementById('metaDiariaVendas').value = DB.metas.diariaVendas;
    document.getElementById('metaQuinzenalVendas').value = DB.metas.quinzenalVendas;
    document.getElementById('metaMensalVendas').value = DB.metas.mensalVendas;

    // Metas de Produtos (lista)
    const tabelaProd = document.getElementById('tabelaMetasProdutos');
    tabelaProd.innerHTML = DB.metas.produtos.map(p => `
        <tr>
            <td>${p.produto}</td>
            <td>${p.diaria}</td>
            <td>${p.quinzenal}</td>
            <td>${p.mensal}</td>
            <td><button onclick="removerMetaProduto(${p.id})" class="btn-glass-danger" style="padding:4px 10px; font-size:12px;"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');

    // Metas de Instalações
    carregarMetasInstalacoes();
    // Preencher dropdown de vendedores
    const selectVendedor = document.getElementById('vendedorMetaInstalacao');
    selectVendedor.innerHTML = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo && !u.deletedAt).map(u => 
        `<option value="${u.id}">${u.nome}</option>`
    ).join('');
}

function adicionarMetaProduto() {
    const produto = document.getElementById('produtoMetaSelect').value;
    const diaria = parseInt(document.getElementById('produtoDiaria').value) || 0;
    const quinzenal = parseInt(document.getElementById('produtoQuinzenal').value) || 0;
    const mensal = parseInt(document.getElementById('produtoMensal').value) || 0;
    if (diaria <= 0 || quinzenal <= 0 || mensal <= 0) return alert('Valores inválidos');
    DB.metas.produtos.push({
        id: Date.now(),
        produto,
        diaria,
        quinzenal,
        mensal
    });
    salvarDB();
    carregarMetas();
    // limpar campos? opcional
}

function removerMetaProduto(id) {
    DB.metas.produtos = DB.metas.produtos.filter(p => p.id !== id);
    salvarDB();
    carregarMetas();
}

function toggleMetaInstalacao() {
    const tipo = document.getElementById('tipoMetaInstalacao').value;
    document.getElementById('grupoVendedorInstalacao').style.display = tipo === 'vendedor' ? 'block' : 'none';
}

function adicionarMetaInstalacao() {
    const tipo = document.getElementById('tipoMetaInstalacao').value;
    const diaria = parseInt(document.getElementById('instalacaoDiaria').value) || 0;
    const quinzenal = parseInt(document.getElementById('instalacaoQuinzenal').value) || 0;
    const mensal = parseInt(document.getElementById('instalacaoMensal').value) || 0;
    if (diaria <= 0 || quinzenal <= 0 || mensal <= 0) return alert('Valores inválidos');
    
    let entidade = '';
    let entidadeId = null;
    if (tipo === 'vendedor') {
        entidadeId = parseInt(document.getElementById('vendedorMetaInstalacao').value);
        const vend = DB.usuarios.find(u => u.id === entidadeId);
        entidade = vend ? vend.nome : 'Vendedor';
    } else {
        entidade = 'STAGE TELECOM';
        entidadeId = 0;
    }
    DB.metas.instalacoes.push({
        id: Date.now(),
        tipo,
        entidade,
        entidadeId,
        diaria,
        quinzenal,
        mensal
    });
    salvarDB();
    carregarMetas();
}

function carregarMetasInstalacoes() {
    const tabelaInst = document.getElementById('tabelaMetasInstalacoes');
    tabelaInst.innerHTML = DB.metas.instalacoes.map(i => `
        <tr>
            <td>${i.tipo === 'vendedor' ? 'Vendedor' : 'Empresa'}</td>
            <td>${i.entidade}</td>
            <td>${i.diaria}</td>
            <td>${i.quinzenal}</td>
            <td>${i.mensal}</td>
            <td><button onclick="removerMetaInstalacao(${i.id})" class="btn-glass-danger" style="padding:4px 10px; font-size:12px;"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function removerMetaInstalacao(id) {
    DB.metas.instalacoes = DB.metas.instalacoes.filter(i => i.id !== id);
    salvarDB();
    carregarMetas();
}

function salvarMetas() {
    DB.metas.diariaVendas = parseInt(document.getElementById('metaDiariaVendas').value) || 10;
    DB.metas.quinzenalVendas = parseInt(document.getElementById('metaQuinzenalVendas').value) || 75;
    DB.metas.mensalVendas = parseInt(document.getElementById('metaMensalVendas').value) || 150;
    // As metas de produtos e instalações já foram salvas individualmente ao adicionar/remover
    salvarDB();
    alert('✅ Metas de vendas atualizadas!');
}

// ===== PROMOÇÕES (CORRIGIDAS) =====
function mostrarFormPromocao() {
    document.getElementById('formPromocao').style.display = 'block';
}

function cadastrarPromocao() {
    const tipo = document.getElementById('tipoPromocao').value;
    const quantidade = parseInt(document.getElementById('quantidadePromocao').value) || 0;
    const inicio = document.getElementById('inicioPromocao').value;
    const fim = document.getElementById('fimPromocao').value;
    const premio = document.getElementById('premioPromocao').value.trim();

    if (!inicio || !fim || !premio || quantidade <= 0) {
        return alert('Preencha todos os campos corretamente!');
    }

    DB.promocoes.push({
        id: Date.now(),
        tipo,
        quantidade,
        inicio,
        fim,
        premio,
        ativa: true,
        concluida: false,
        vencedores: [] // array de ids dos vendedores que bateram a meta
    });

    salvarDB();
    carregarPromocoes();
    document.getElementById('formPromocao').style.display = 'none';
    document.getElementById('premioPromocao').value = '';
    alert('✅ Promoção cadastrada!');
}

function carregarPromocoes() {
    const agora = new Date();
    const tabela = document.getElementById('tabelaPromocoes');

    // Atualizar status das promoções
    DB.promocoes.forEach(p => {
        const inicio = new Date(p.inicio);
        const fim = new Date(p.fim);
        if (agora < inicio) {
            p.status = '⏳ Aguardando';
        } else if (agora >= inicio && agora <= fim) {
            p.status = '▶️ Ativa';
            p.ativa = true;
        } else if (agora > fim && !p.concluida) {
            p.status = '⏹️ Encerrada';
            p.ativa = false;
            verificarVencedoresPromocao(p);
        }
    });
    salvarDB();

    tabela.innerHTML = DB.promocoes.map(p => `
        <tr>
            <td>${p.tipo}</td>
            <td>${p.quantidade}</td>
            <td>${new Date(p.inicio).toLocaleString('pt-BR')} → ${new Date(p.fim).toLocaleString('pt-BR')}</td>
            <td>${p.premio}</td>
            <td>${p.status || 'Ativa'}</td>
            <td>
                <button onclick="excluirPromocao(${p.id})" class="btn-glass-danger" style="padding:4px 10px; font-size:12px;"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function excluirPromocao(id) {
    if (confirm('Excluir esta promoção?')) {
        DB.promocoes = DB.promocoes.filter(p => p.id !== id);
        salvarDB();
        carregarPromocoes();
    }
}

// Função para obter vendas/produtos/instalações de um vendedor em um período
function obterQuantidadePeriodo(vendedorId, tipo, inicio, fim) {
    if (tipo === 'vendas') {
        // Aqui usamos os dados de vendas simulados, filtrando pelo período
        return gerarDadosVendasPeriodo(vendedorId, inicio, fim).length;
    } else if (tipo === 'produtos') {
        // similar, mas filtrando por produtos? Assumimos a quantidade de vendas de produtos
        return gerarDadosVendasPeriodo(vendedorId, inicio, fim).length;
    } else if (tipo === 'instalacoes') {
        // Simplificado: mesma lógica, mas poderia ser baseado em instalações
        return gerarDadosVendasPeriodo(vendedorId, inicio, fim).length;
    }
    return 0;
}

function gerarDadosVendasPeriodo(vendedorId, inicio, fim) {
    // Para simulação, usamos as vendas diárias geradas, mas filtrando pela data
    // Vamos gerar vendas para todas as datas do período
    const inicioDate = new Date(inicio);
    const fimDate = new Date(fim);
    const vendas = [];
    for (let d = new Date(inicioDate); d <= fimDate; d.setDate(d.getDate() + 1)) {
        const dataStr = d.toISOString().split('T')[0];
        // Usamos a função existente que gera vendas aleatórias para aquele dia, mas com seed fixa?
        // Para simplificar, chamamos gerarDadosVendas() que retorna vendas do dia atual; precisamos adaptar.
        // Vamos criar uma versão que retorna vendas simuladas para uma data específica.
        const vendasDia = gerarVendasParaData(dataStr);
        vendas.push(...vendasDia.filter(v => v.vendedor_id === vendedorId));
    }
    return vendas;
}

function gerarVendasParaData(data) {
    // Simula vendas para uma data específica (usando localStorage ou gerando aleatório)
    let vendas = JSON.parse(localStorage.getItem(`vendas_${data}`)) || [];
    if (!vendas.length) {
        const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && u.ativo && !u.deletedAt);
        const planos = [{nome:'Básico',valor:299.9},{nome:'Empresarial',valor:499.9},{nome:'Premium',valor:899.9},{nome:'Ultra',valor:1499.9}];
        const num = Math.floor(Math.random()*5)+1;
        for (let i=0;i<num;i++) {
            const v = vendedores[Math.floor(Math.random()*vendedores.length)];
            const p = planos[Math.floor(Math.random()*planos.length)];
            vendas.push({id:Date.now()+i, vendedor_id:v.id, vendedor_nome:v.nome, plano:p.nome, valor:p.valor, data});
        }
        localStorage.setItem(`vendas_${data}`, JSON.stringify(vendas));
    }
    return vendas;
}

function verificarVencedoresPromocao(promocao) {
    const vendedores = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo && !u.deletedAt);
    const vencedores = [];
    vendedores.forEach(v => {
        const qtd = obterQuantidadePeriodo(v.id, promocao.tipo, promocao.inicio, promocao.fim);
        if (qtd >= promocao.quantidade) {
            vencedores.push({ id: v.id, nome: v.nome, quantidade: qtd });
        }
    });
    promocao.vencedores = vencedores.map(v => v.id);
    promocao.concluida = true;
    salvarDB();

    if (vencedores.length > 0) {
        // Notificar admin
        const nomes = vencedores.map(v => v.nome).join(', ');
        mostrarModalParabens(`🏆 Meta bônus de ${promocao.tipo} batida! Vencedor(es): ${nomes}. Prêmio: ${promocao.premio}`);
        // Criar notificações para cada vencedor
        vencedores.forEach(v => {
            DB.notificacoes.push({
                id: Date.now() + Math.random(),
                userId: v.id,
                mensagem: `🎉 Você bateu a meta bônus de ${promocao.tipo} e ganhou: ${promocao.premio}!`,
                lida: false
            });
        });
        salvarDB();
    } else {
        mostrarModalParabens(`😞 Nenhum vendedor bateu a meta bônus de ${promocao.tipo}.`);
    }
}

function verificarPromocoesAdmin() {
    // Chamado ao logar admin, exibe modais de promoções recém-concluídas
    const agora = new Date();
    DB.promocoes.forEach(p => {
        if (p.ativa && new Date(p.fim) <= agora && !p.concluida) {
            verificarVencedoresPromocao(p);
        }
    });
}

function mostrarModalParabens(mensagem) {
    document.getElementById('parabensMensagem').textContent = mensagem;
    document.getElementById('modalParabens').style.display = 'flex';
}

// Notificações do vendedor
function verificarNotificacoesVendedor() {
    if (!sessao || sessao.tipo !== 'vendedor') return;
    const notificacoesPendentes = DB.notificacoes.filter(n => n.userId === sessao.id && !n.lida);
    if (notificacoesPendentes.length > 0) {
        // Exibe o modal com a primeira notificação (pode encadear)
        const notif = notificacoesPendentes[0];
        document.getElementById('parabensVendedorMensagem').textContent = notif.mensagem;
        document.getElementById('modalParabensVendedor').style.display = 'flex';
        // Marcar como lida
        notif.lida = true;
        salvarDB();
    }
}

// Verificação periódica de promoções (admin)
setInterval(() => {
    if (sessao && sessao.tipo === 'admin') {
        const agora = new Date();
        DB.promocoes.forEach(p => {
            if (p.ativa && new Date(p.fim) <= agora && !p.concluida) {
                verificarVencedoresPromocao(p);
            }
        });
    }
}, 30000);

// ===== DEMAIS FUNÇÕES (VENDEDOR SCREEN, ETC) =====
// ... (manter as funções de vendedor, cadastro, ativações, relatórios, etc., iguais ao último script completo) ...

// ============================================
// STAGE TELECOM CRM - SCRIPT COMPLETO FINAL
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
            { id: 3, nome: "Cancelado", cor: "#ff4757" },
            { id: 4, nome: "Aprovado", cor: "#2ed573" }
        ],
        ativacoes: [],
        metas: { diariaVendas: 10, quinzenalVendas: 75, mensalVendas: 150, produtos: [], instalacoes: [] },
        promocoes: [],
        notificacoes: [],
        chatMessages: [],
        produtos: ["Básico", "Empresarial", "Premium", "Ultra"],
        opcoesVenda: {
            velocidades: ["10MB", "50MB", "100MB", "300MB"],
            formasPagamento: ["Boleto", "Cartão", "PIX"],
            valores: ["79.90", "99.90", "149.90", "199.90"]
        }
    };
}

DB.promocoes = DB.promocoes || [];
DB.notificacoes = DB.notificacoes || [];
DB.ativacoes = DB.ativacoes || [];
DB.metas = DB.metas || { diariaVendas: 10, quinzenalVendas: 75, mensalVendas: 150, produtos: [], instalacoes: [] };
DB.metas.produtos = DB.metas.produtos || [];
DB.metas.instalacoes = DB.metas.instalacoes || [];
DB.chatMessages = DB.chatMessages || [];
DB.produtos = DB.produtos || ["Básico", "Empresarial", "Premium", "Ultra"];
DB.opcoesVenda = DB.opcoesVenda || { velocidades: [], formasPagamento: [], valores: [] };
if (!DB.statusFlags.find(f => f.nome === 'Aprovado')) {
    DB.statusFlags.push({ id: Date.now(), nome: 'Aprovado', cor: '#2ed573' });
}
DB.usuarios.forEach(u => { if (!u.categoria) u.categoria = u.tipo || 'vendedor'; if (!u.equipe) u.equipe = 'Geral'; });

function salvarDB() { localStorage.setItem('stage_db', JSON.stringify(DB)); }

let sessao = JSON.parse(sessionStorage.getItem('stage_session'));
let comparativoAtual = 'diario';
let graficoVendedoresInstance = null;
let vendaSendoVisualizada = null;
let novasVendas = true;
let ultimoIdAtivacao = DB.ativacoes.length ? Math.max(...DB.ativacoes.map(a => a.id)) : 0;

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

    const dataElV = document.getElementById('dataAtualVendedor');
    const horaElV = document.getElementById('horaAtualVendedor');
    const periodoElV = document.getElementById('periodoDiaVendedor');
    if(dataElV) dataElV.textContent = dataFormatada;
    if(horaElV) horaElV.textContent = `${horas}:${minutos}:${segundos}`;
    if(periodoElV) periodoElV.textContent = periodo;
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
        sessionStorage.setItem('stage_session', JSON.stringify(sessao));
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
    sessionStorage.removeItem('stage_session');
    sessao = null;
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'none';
    const chatWidget = document.getElementById('chatWidget');
    if (chatWidget) chatWidget.style.display = 'none';
}

function mostrarAdmin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'flex';
    document.getElementById('vendedorScreen').style.display = 'none';
    document.getElementById('userInfoAdmin').innerHTML = `<div style="font-weight:700;font-size:15px;">${sessao.nome}</div><div style="font-size:11px;color:var(--primary-light);margin-top:3px;">👑 Administrador</div><div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:3px;">${sessao.email}</div>`;
    carregarDashboard();
    verificarPromocoesAdmin();
    iniciarChat();
    iniciarVerificacaoNovasVendas();
}

function mostrarVendedor() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'flex';
    document.getElementById('userInfoVendedor').innerHTML = `<div style="font-weight:700;font-size:15px;">${sessao.nome}</div><div style="font-size:11px;color:var(--primary-light);margin-top:3px;">💼 Vendedor</div><div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:3px;">${sessao.email}</div>`;
    mostrarSecaoVendedor(null, 'inicio');
    verificarNotificacoesVendedor();
    iniciarChat();
}

// ========== LÓGICA DE VENDAS (APROVADAS E FINALIZADAS) ==========
function obterVendasAprovadas() {
    return DB.ativacoes.filter(a => a.status === 'Aprovado' && a.finalizada !== false);
}
function obterVendasAprovadasPorData(data) { return obterVendasAprovadas().filter(a => a.data === data); }
function obterVendasAprovadasPorMes(ano, mes) {
    return obterVendasAprovadas().filter(a => {
        const [aAno, aMes] = a.data.split('-').map(Number);
        return aAno === ano && aMes === mes;
    });
}
function obterVendasAprovadasHoje() { const hoje = new Date().toISOString().split('T')[0]; return obterVendasAprovadasPorData(hoje); }
function obterVendasAprovadasMesAtual() { const hoje = new Date(); return obterVendasAprovadasPorMes(hoje.getFullYear(), hoje.getMonth() + 1); }
function obterVendasAprovadasMesAnterior() {
    const hoje = new Date();
    const mes = hoje.getMonth() === 0 ? 12 : hoje.getMonth();
    const ano = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
    return obterVendasAprovadasPorMes(ano, mes);
}
function obterVendasAprovadasDiaPassado() {
    const hoje = new Date();
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());
    const data = mesPassado.toISOString().split('T')[0];
    return obterVendasAprovadasPorData(data);
}
function gerarDadosVendas() {
    return obterVendasAprovadasHoje().map(v => ({
        id: v.id, vendedor_id: v.vendedor_id, vendedor_nome: v.vendedorNome,
        plano: v.produto, valor: parseFloat(v.valor) || 0, data: v.data, hora: '00:00'
    }));
}
function gerarVendasDiaPassado() {
    return obterVendasAprovadasDiaPassado().map(v => ({
        id: v.id, vendedor_id: v.vendedor_id, vendedor_nome: v.vendedorNome,
        plano: v.produto, valor: parseFloat(v.valor) || 0, data: v.data
    }));
}
function gerarVendasMesAtual() {
    return obterVendasAprovadasMesAtual().map(v => ({
        id: v.id, vendedor_id: v.vendedor_id, vendedor_nome: v.vendedorNome,
        plano: v.produto, valor: parseFloat(v.valor) || 0, data: v.data
    }));
}
function gerarVendasMesAnterior() {
    return obterVendasAprovadasMesAnterior().map(v => ({
        id: v.id, vendedor_id: v.vendedor_id, vendedor_nome: v.vendedorNome,
        plano: v.produto, valor: parseFloat(v.valor) || 0, data: v.data
    }));
}

// ===== DASHBOARD ADMIN =====
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
}
function carregarVendasDiarias() {
    const hoje = new Date();
    document.getElementById('dataVendasDiarias').textContent = hoje.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
    const vendasHoje = gerarDadosVendas();
    const meta = DB.metas.diariaVendas || 10;
    document.getElementById('totalVendasHoje').textContent = vendasHoje.length;
    const pctDiario = Math.min((vendasHoje.length / meta) * 100, 100).toFixed(1);
    document.getElementById('barraLiquidaDiaria').style.width = `${pctDiario}%`;
    document.getElementById('realizadoMetaDiaria').textContent = vendasHoje.length;
    document.getElementById('faltamMetaDiaria').textContent = Math.max(meta - vendasHoje.length, 0);
    document.getElementById('metaDiaria').textContent = meta;
    const ranking = {}; vendasHoje.forEach(v => { if(!ranking[v.vendedor_id]) ranking[v.vendedor_id]={nome:v.vendedor_nome,vendas:0,valor:0}; ranking[v.vendedor_id].vendas++; ranking[v.vendedor_id].valor+=v.valor; });
    const rankingArr = Object.values(ranking).sort((a,b)=>b.vendas-a.vendas);
    const rankingEl = document.getElementById('rankingVendedores');
    rankingEl.innerHTML = rankingArr.length ? rankingArr.map((r,i)=>{
        const pos=i+1; const cls=pos===1?'top1':pos===2?'top2':pos===3?'top3':'normal';
        const medal=pos===1?'🥇':pos===2?'🥈':pos===3?'🥉':pos;
        return `<div class="ranking-item"><div class="ranking-posicao ${cls}">${medal}</div><div class="ranking-info"><span class="ranking-nome">${r.nome}</span><span class="ranking-vendas">${r.vendas} vendas</span></div><span class="ranking-pontos">${r.vendas}</span></div>`;
    }).join('') : '<p style="text-align:center;color:rgba(255,255,255,0.4);padding:20px;">Nenhuma venda hoje</p>';
    const produtos = {}; vendasHoje.forEach(v => { if(!produtos[v.plano]) produtos[v.plano]={nome:v.plano,qtd:0}; produtos[v.plano].qtd++; });
    const prodArr = Object.values(produtos).sort((a,b)=>b.qtd-a.qtd);
    const maxQtd = prodArr[0]?.qtd||1;
    const prodEl = document.getElementById('produtosVendidos');
    prodEl.innerHTML = prodArr.length ? prodArr.map(p=>`<div class="produto-item"><span class="produto-nome">${p.nome}</span><div class="produto-bar"><div class="produto-bar-fill" style="width:${(p.qtd/maxQtd)*100}%"></div></div><span class="produto-qtd">${p.qtd}x</span></div>`).join('') : '<p style="text-align:center;color:rgba(255,255,255,0.4);">Nenhum produto</p>';
}

// ===== COMPARATIVO =====
function mostrarComparativo(tipo) {
    comparativoAtual = tipo;
    document.querySelectorAll('.btn-compare').forEach(b=>b.classList.remove('active'));
    document.getElementById(tipo==='diario'?'btnDiario':'btnMensal').classList.add('active');
    document.getElementById('comparativoDiario').style.display = tipo==='diario'?'block':'none';
    document.getElementById('comparativoMensal').style.display = tipo==='mensal'?'block':'none';
    tipo==='diario' ? carregarComparativoDiario() : carregarComparativoMensal();
}
function carregarComparativoDiario() {
    const hoje = new Date();
    document.getElementById('compDataHoje').textContent = hoje.toLocaleDateString('pt-BR',{day:'numeric',month:'long'});
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth()-1, hoje.getDate());
    document.getElementById('compDataPassado').textContent = mesPassado.toLocaleDateString('pt-BR',{day:'numeric',month:'long'});
    const vHoje = gerarDadosVendas(), vPassado = gerarVendasDiaPassado();
    document.getElementById('compVendasHoje').textContent = vHoje.length;
    document.getElementById('compVendasPassado').textContent = vPassado.length;
    const dif = vHoje.length - vPassado.length;
    const diffEl = document.getElementById('compDiferencaDiario');
    diffEl.className = `comp-diferenca ${dif>0?'positivo':dif<0?'negativo':'positivo'}`;
    diffEl.innerHTML = dif>0?`📈 ${dif} vendas a mais (${((dif/Math.max(vPassado.length,1))*100).toFixed(1)}%)` : dif<0?`📉 ${Math.abs(dif)} vendas a menos (${((dif/Math.max(vPassado.length,1))*100).toFixed(1)}%)` : '➡️ Mesmo número de vendas';
    const ranking = {}; vHoje.forEach(v=>{ if(!ranking[v.vendedor_id]) ranking[v.vendedor_id]={nome:v.vendedor_nome,vendas:0}; ranking[v.vendedor_id].vendas++; });
    const melhor = Object.values(ranking).sort((a,b)=>b.vendas-a.vendas)[0];
    document.getElementById('destaqueDiario').innerHTML = melhor ? `<div class="destaque-card"><div class="destaque-icon">🏆</div><div><div class="destaque-nome">${melhor.nome}</div><div class="destaque-info">${melhor.vendas} vendas hoje</div></div></div>` : '<p style="color:rgba(255,255,255,0.4);">Nenhum vendedor</p>';
    carregarComparacaoProdutos(vHoje, vPassado, 'compProdutosDiario');
}
function carregarComparativoMensal() {
    const hoje = new Date();
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    document.getElementById('compMesAtual').textContent = meses[hoje.getMonth()];
    document.getElementById('compMesPassado').textContent = meses[hoje.getMonth()===0?11:hoje.getMonth()-1];
    const vAtual = gerarVendasMesAtual(), vAnterior = gerarVendasMesAnterior();
    document.getElementById('compVendasMesAtual').textContent = vAtual.length;
    document.getElementById('compVendasMesAnterior').textContent = vAnterior.length;
    const dif = vAtual.length - vAnterior.length;
    const diffEl = document.getElementById('compDiferencaMensal');
    diffEl.className = `comp-diferenca ${dif>0?'positivo':dif<0?'negativo':'positivo'}`;
    diffEl.innerHTML = dif>0?`📈 ${dif} vendas a mais (${((dif/Math.max(vAnterior.length,1))*100).toFixed(1)}%)` : dif<0?`📉 ${Math.abs(dif)} vendas a menos (${((dif/Math.max(vAnterior.length,1))*100).toFixed(1)}%)` : '➡️ Mesmo número de vendas';
    const ranking = {}; vAtual.forEach(v=>{ if(!ranking[v.vendedor_id]) ranking[v.vendedor_id]={nome:v.vendedor_nome,vendas:0}; ranking[v.vendedor_id].vendas++; });
    const melhor = Object.values(ranking).sort((a,b)=>b.vendas-a.vendas)[0];
    document.getElementById('destaqueMensal').innerHTML = melhor ? `<div class="destaque-card"><div class="destaque-icon">🏆</div><div><div class="destaque-nome">${melhor.nome}</div><div class="destaque-info">${melhor.vendas} vendas no mês</div></div></div>` : '<p style="color:rgba(255,255,255,0.4);">Nenhum vendedor</p>';
    carregarComparacaoProdutos(vAtual, vAnterior, 'compProdutosMensal');
    const meta = DB.metas.mensalVendas || 150, realizado = vAtual.length, pct = Math.min((realizado/meta)*100,100).toFixed(1);
    document.getElementById('metaMensalValor').textContent = meta;
    document.getElementById('metaMensalRealizado').textContent = realizado;
    document.getElementById('metaMensalPct').textContent = `${pct}%`;
    document.getElementById('metaMensalProgresso').style.width = `${pct}%`;
}
function carregarComparacaoProdutos(vAtual, vPassado, containerId) {
    const container = document.getElementById(containerId);
    const planos = ['Básico','Empresarial','Premium','Ultra'];
    const maxVendas = Math.max(...planos.map(p=>Math.max(vAtual.filter(v=>v.plano===p).length, vPassado.filter(v=>v.plano===p).length,1)),1);
    container.innerHTML = planos.map(p=>{
        const qAtual = vAtual.filter(v=>v.plano===p).length, qPassado = vPassado.filter(v=>v.plano===p).length;
        return `<div class="comp-produto-item"><span class="comp-produto-nome">${p}</span><div class="comp-produto-barras"><div class="comp-produto-atual" style="width:${(qAtual/maxVendas)*100}%;min-width:${qAtual>0?'25px':'0'}">${qAtual>0?qAtual:''}</div><div class="comp-produto-passado" style="width:${(qPassado/maxVendas)*100}%;min-width:${qPassado>0?'25px':'0'}">${qPassado>0?qPassado:''}</div></div></div>`;
    }).join('');
}

// ===== NAVEGAÇÃO ADMIN =====
function mostrarSecao(secao) {
    document.querySelectorAll('.section-active,.section-hidden').forEach(s=>{s.style.display='none';s.className='section-hidden';});
    const el = document.getElementById(`secao-${secao}`); if(el){el.style.display='block';el.className='section-active';}
    document.querySelectorAll('.nav-item').forEach(a=>a.classList.remove('active'));
    const nav = document.querySelector(`[data-section="${secao}"]`); if(nav) nav.classList.add('active');
    document.getElementById('tituloSecao').innerHTML = {
        dashboard:'📊 Dashboard', cadastro:'👥 Cadastro', ativacoes:'⚡ Ativações', relatorios:'📈 Relatórios', metas:'🎯 Metas', promocoes:'🏆 Promoções'
    }[secao]||secao;
    if(secao==='cadastro') carregarUsuarios();
    if(secao==='ativacoes') carregarAtivacoes();
    if(secao==='relatorios') carregarRelatorios();
    if(secao==='metas') carregarMetas();
    if(secao==='promocoes') carregarPromocoes();
}

// ===== CADASTRO DE USUÁRIOS (com campo Equipe) =====
function mostrarFormCadastro(){document.getElementById('formCadastro').style.display='block';}
function cadastrarUsuario(){
    const n=document.getElementById('nomeUsuario').value.trim();
    const u=document.getElementById('usuarioUsuario').value.trim();
    const s=document.getElementById('senhaUsuario').value.trim();
    const e=document.getElementById('emailUsuario').value.trim();
    const cat=document.getElementById('categoriaUsuario').value;
    const eq=document.getElementById('equipeUsuario').value.trim();
    if(!n||!u||!s||!e) return alert('Preencha todos os campos obrigatórios!');
    if(DB.usuarios.find(x=>x.usuario===u && !x.deletedAt)) return alert('Usuário já existe!');
    DB.usuarios.push({id:DB.usuarios.length+1,usuario:u,senha:s,nome:n,email:e,tipo:cat,categoria:cat,ativo:true,deletedAt:null,equipe:cat==='admin'?'Gestão':(eq||'Geral')});
    salvarDB(); carregarUsuarios(); document.getElementById('formCadastro').style.display='none';
    ['nomeUsuario','usuarioUsuario','senhaUsuario','emailUsuario','equipeUsuario'].forEach(id=>document.getElementById(id).value='');
}
function carregarUsuarios() {
    const agora = new Date();
    DB.usuarios = DB.usuarios.filter(u => { if(u.deletedAt){ const dias = (agora - new Date(u.deletedAt))/(1000*60*60*24); return dias <= 15; } return true; });
    salvarDB();
    const usuarios = DB.usuarios.filter(u => !u.deletedAt);
    const tabela = document.getElementById('tabelaUsuarios');
    if (!tabela) return;
    tabela.innerHTML = usuarios.map(u => `
        <tr>
            <td><strong>${u.nome}</strong><button onclick="abrirModalEditar(${u.id})" style="background:none;border:none;color:var(--primary-light);cursor:pointer;margin-left:8px;"><i class="fas fa-pencil-alt"></i></button></td>
            <td>@${u.usuario}</td><td>${u.email}</td>
            <td><span class="badge-cat">${u.categoria==='admin'?'👑 Admin':'💼 Vendedor'}</span></td>
            <td>${u.equipe||'Geral'}</td>
            <td class="${u.ativo?'status-ativo':''}">${u.ativo?'● Ativo':'○ Inativo'}</td>
            <td>
                <button onclick="toggleUsuario(${u.id})" style="background:${u.ativo?'rgba(255,71,87,0.2)':'rgba(46,213,115,0.2)'};border:1px solid ${u.ativo?'rgba(255,71,87,0.3)':'rgba(46,213,115,0.3)'};color:white;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;">${u.ativo?'🔒 Desativar':'🔓 Ativar'}</button>
                <button onclick="excluirUsuario(${u.id})" style="background:rgba(255,71,87,0.3);border:1px solid rgba(255,71,87,0.5);color:white;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;margin-left:5px;"><i class="fas fa-trash"></i> Excluir</button>
            </td>
        </tr>
    `).join('');
    const cont = document.getElementById('contadorLixeira'); if(cont) cont.textContent = DB.usuarios.filter(u => u.deletedAt).length;
}
function toggleUsuario(id){ const u=DB.usuarios.find(u=>u.id===id); if(u){u.ativo=!u.ativo;salvarDB();carregarUsuarios();} }
function excluirUsuario(id){
    const u=DB.usuarios.find(u=>u.id===id); if(!u) return;
    if(confirm(`⚠️ Excluir "${u.nome}"? Ele irá para a lixeira e perderá o acesso.`)){ u.deletedAt = new Date().toISOString(); u.ativo = false; salvarDB(); carregarUsuarios(); }
}
function abrirModalEditar(id){
    const u=DB.usuarios.find(u=>u.id===id); if(!u) return;
    document.getElementById('editUsuarioId').value = u.id;
    document.getElementById('editNomeUsuario').value = u.nome;
    document.getElementById('editLoginUsuario').value = u.usuario;
    document.getElementById('editEmailUsuario').value = u.email;
    document.getElementById('editCategoriaUsuario').value = u.categoria || u.tipo;
    document.getElementById('editSenhaUsuario').value = '';
    document.getElementById('editEquipeUsuario').value = u.equipe||'';
    document.getElementById('modalEditarUsuario').style.display = 'flex';
}
function fecharModalEditar(){ document.getElementById('modalEditarUsuario').style.display = 'none'; }
function salvarEdicaoUsuario(){
    const id = parseInt(document.getElementById('editUsuarioId').value);
    const nome = document.getElementById('editNomeUsuario').value.trim();
    const usuario = document.getElementById('editLoginUsuario').value.trim();
    const email = document.getElementById('editEmailUsuario').value.trim();
    const categoria = document.getElementById('editCategoriaUsuario').value;
    const novaSenha = document.getElementById('editSenhaUsuario').value.trim();
    const equipe = document.getElementById('editEquipeUsuario').value.trim();
    if(!nome||!usuario||!email) return alert('Nome, usuário e email são obrigatórios.');
    const u=DB.usuarios.find(u=>u.id===id); if(!u) return;
    const conflito = DB.usuarios.find(u=>u.usuario===usuario && u.id!==id && !u.deletedAt);
    if(conflito) return alert('Usuário já existe.');
    u.nome=nome; u.usuario=usuario; u.email=email; u.categoria=categoria; u.tipo=categoria;
    if(novaSenha) u.senha=novaSenha;
    u.equipe = categoria==='admin'?'Gestão':(equipe||'Geral');
    salvarDB(); carregarUsuarios(); fecharModalEditar();
}

// ===== LIXEIRA =====
function toggleLixeira(){ const l=document.getElementById('lixeiraUsuarios'); if(l.style.display==='none'||l.style.display===''){ carregarLixeira(); l.style.display='block'; } else l.style.display='none'; }
function carregarLixeira(){
    const agora = new Date();
    const lixeira = DB.usuarios.filter(u=>u.deletedAt);
    document.getElementById('contadorLixeira').textContent = lixeira.length;
    const tabela=document.getElementById('tabelaLixeira');
    if(!lixeira.length){ tabela.innerHTML='<tr><td colspan="7" style="text-align:center;padding:20px;">Lixeira vazia</td></tr>'; return; }
    tabela.innerHTML = lixeira.map(v=>{
        const dias = Math.ceil(15 - ((agora - new Date(v.deletedAt))/(1000*60*60*24)));
        return `<tr><td><strong>${v.nome}</strong></td><td>@${v.usuario}</td><td>${v.email}</td><td><span class="badge-cat">${v.categoria==='admin'?'👑 Admin':'💼 Vendedor'}</span></td><td>${v.equipe||'Geral'}</td><td><span style="color:#ffa502;">${dias} dia(s)</span></td><td><button onclick="recuperarUsuario(${v.id})" style="background:rgba(46,213,115,0.2);border:1px solid rgba(46,213,115,0.3);color:#2ed573;padding:6px 12px;border-radius:8px;cursor:pointer;"><i class="fas fa-undo"></i> Recuperar</button><button onclick="excluirPermanentemente(${v.id})" style="background:rgba(255,71,87,0.2);border:1px solid rgba(255,71,87,0.3);color:#ff4757;padding:6px 12px;border-radius:8px;cursor:pointer;margin-left:5px;"><i class="fas fa-times-circle"></i> Excluir definitivo</button></td></tr>`;
    }).join('');
}
function recuperarUsuario(id){ const u=DB.usuarios.find(u=>u.id===id); if(u){u.deletedAt=null;u.ativo=true;salvarDB();carregarUsuarios();carregarLixeira();} }
function excluirPermanentemente(id){ const u=DB.usuarios.find(u=>u.id===id); if(u && confirm(`Excluir definitivamente "${u.nome}"?`)){ DB.usuarios = DB.usuarios.filter(u=>u.id!==id); salvarDB(); carregarUsuarios(); carregarLixeira(); } }

// ===== ATIVAÇÕES =====
function carregarAtivacoes() {
    const tabela = document.getElementById('tabelaAtivacoes');
    if (!tabela) return;
    tabela.innerHTML = DB.ativacoes.map(a => {
        const vendedor = DB.usuarios.find(u => u.id === a.vendedor_id);
        const flag = DB.statusFlags.find(f => f.nome === a.status) || { cor: '#fff' };
        const tratando = a.tratandoPor || '—';
        return `<tr>
            <td><strong>${a.nomeCliente}</strong></td>
            <td>${a.produto}</td>
            <td>${vendedor?vendedor.nome:'N/A'}</td>
            <td><span style="color:${flag.cor};font-weight:600;">● ${a.status}</span></td>
            <td><span style="font-size:12px;">${tratando}</span></td>
            <td><button onclick="abrirModalAtivacao(${a.id})" class="btn-glass-sm"><i class="fas fa-search"></i></button></td>
        </tr>`;
    }).join('');
    filtrarAtivacoes();
}
function filtrarAtivacoes() {
    const input = document.getElementById('buscaAtivacao');
    if (!input) return;
    const termo = input.value.trim().toLowerCase();
    const linhas = document.querySelectorAll('#tabelaAtivacoes tr');
    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(termo) ? '' : 'none';
    });
}
function abrirModalAtivacao(id) {
    const a = DB.ativacoes.find(x => x.id === id);
    if (!a) return;
    vendaSendoVisualizada = id;
    a.tratandoPor = sessao.nome;
    salvarDB();
    const statusOptions = DB.statusFlags.map(f => `<option value="${f.nome}" ${a.status === f.nome ? 'selected' : ''}>${f.nome}</option>`).join('');
    document.getElementById('conteudoModalAtivacao').innerHTML = `
        <div class="form-grid">
            <div class="input-group"><label>Status</label><select id="editStatus">${statusOptions}</select></div>
            <div class="input-group"><label>Observação</label><textarea id="editObservacao">${a.observacao||''}</textarea></div>
            <div class="input-group"><label>Nome Completo</label><input value="${a.nomeCompleto||''}" id="editNomeCompleto"></div>
            <div class="input-group"><label>Nome da Mãe</label><input value="${a.nomeMae||''}" id="editNomeMae"></div>
            <div class="input-group"><label>Data Nasc.</label><input value="${a.dataNasc||''}" id="editDataNasc"></div>
            <div class="input-group"><label>CPF/CNPJ</label><input value="${a.cpfCnpj||''}" id="editCpfCnpj"></div>
            <div class="input-group"><label>Razão Social</label><input value="${a.razaoSocial||''}" id="editRazaoSocial"></div>
            <div class="input-group"><label>Email</label><input value="${a.email||''}" id="editEmail"></div>
            <div class="input-group"><label>CEP</label><input value="${a.cep||''}" id="editCep"></div>
            <div class="input-group"><label>UF</label><input value="${a.uf||''}" id="editUf"></div>
            <div class="input-group"><label>Endereço</label><input value="${a.endereco||''}" id="editEndereco"></div>
            <div class="input-group"><label>Bairro</label><input value="${a.bairro||''}" id="editBairro"></div>
            <div class="input-group"><label>Cidade</label><input value="${a.cidade||''}" id="editCidade"></div>
            <div class="input-group"><label>N°/Compl.</label><input value="${a.numeroComplemento||''}" id="editNumeroComplemento"></div>
            <div class="input-group"><label>Referência</label><input value="${a.referencia||''}" id="editReferencia"></div>
            <div class="input-group"><label>Telefone</label><input value="${a.telefone||''}" id="editTelefone"></div>
            <div class="input-group"><label>WhatsApp</label><input value="${a.whatsapp||''}" id="editWhatsapp"></div>
            <div class="input-group"><label>Valor</label><input value="${a.valor||''}" id="editValor"></div>
            <div class="input-group"><label>Velocidade</label><input value="${a.velocidade||''}" id="editVelocidade"></div>
            <div class="input-group"><label>Forma Pag.</label><input value="${a.formaPagamento||''}" id="editFormaPagamento"></div>
            <div class="input-group"><label>Vencimento</label><input value="${a.vencimento||''}" id="editVencimento"></div>
            <div class="input-group"><label>Plano</label><input value="${a.plano||''}" id="editPlano"></div>
        </div>`;
    document.getElementById('modalAtivacao').style.display = 'flex';
    carregarAtivacoes();
}
function fecharModalAtivacao() {
    const a = DB.ativacoes.find(x => x.id === vendaSendoVisualizada);
    if (a) {
        const novoStatus = document.getElementById('editStatus')?.value;
        if (novoStatus) {
            if (novoStatus === 'Aprovado' && a.status !== 'Aprovado') {
                if (confirm('Deseja finalizar essa venda? Ao aprovar, ela será contabilizada.')) {
                    a.status = 'Aprovado';
                    a.finalizada = true;
                    if (!a.instalacaoStatus) a.instalacaoStatus = 'Aguardando';
                }
            } else {
                a.status = novoStatus;
            }
        }
        a.observacao = document.getElementById('editObservacao')?.value || '';
        a.nomeCompleto = document.getElementById('editNomeCompleto')?.value || '';
        a.nomeMae = document.getElementById('editNomeMae')?.value || '';
        a.dataNasc = document.getElementById('editDataNasc')?.value || '';
        a.cpfCnpj = document.getElementById('editCpfCnpj')?.value || '';
        a.razaoSocial = document.getElementById('editRazaoSocial')?.value || '';
        a.email = document.getElementById('editEmail')?.value || '';
        a.cep = document.getElementById('editCep')?.value || '';
        a.uf = document.getElementById('editUf')?.value || '';
        a.endereco = document.getElementById('editEndereco')?.value || '';
        a.bairro = document.getElementById('editBairro')?.value || '';
        a.cidade = document.getElementById('editCidade')?.value || '';
        a.numeroComplemento = document.getElementById('editNumeroComplemento')?.value || '';
        a.referencia = document.getElementById('editReferencia')?.value || '';
        a.telefone = document.getElementById('editTelefone')?.value || '';
        a.whatsapp = document.getElementById('editWhatsapp')?.value || '';
        a.valor = document.getElementById('editValor')?.value || '';
        a.velocidade = document.getElementById('editVelocidade')?.value || '';
        a.formaPagamento = document.getElementById('editFormaPagamento')?.value || '';
        a.vencimento = document.getElementById('editVencimento')?.value || '';
        a.plano = document.getElementById('editPlano')?.value || '';
        a.tratandoPor = null;
        salvarDB();
    }
    document.getElementById('modalAtivacao').style.display = 'none';
    vendaSendoVisualizada = null;
    carregarAtivacoes();
    carregarDashboard();
}

// ========== SINCRONIZAÇÃO EM TEMPO REAL ==========
window.addEventListener('storage', function(e) {
    if (e.key === 'stage_db') {
        DB = JSON.parse(e.newValue);
        if (sessao && sessao.tipo === 'admin') {
            carregarDashboard();
            if (document.getElementById('secao-ativacoes')?.classList.contains('section-active')) {
                carregarAtivacoes();
            }
            const idsAtuais = DB.ativacoes.map(a => a.id);
            const maxId = idsAtuais.length ? Math.max(...idsAtuais) : 0;
            if (maxId > ultimoIdAtivacao) {
                ultimoIdAtivacao = maxId;
                mostrarModalNovaVenda();
            }
        }
        if (sessao) {
            atualizarBadge();
            if (document.getElementById('chatSidebar')?.style.display !== 'none') {
                atualizarListaConversas();
            }
            if (chatConversationAtual && document.getElementById('chatMain')?.style.display === 'flex') {
                renderizarMensagensChat();
            }
            // Atualiza dropdowns de venda se a seção estiver ativa
            if (document.getElementById('secao-enviarVenda')?.classList.contains('section-active')) {
                carregarOpcoesVenda();
                carregarSelectProdutos();
            }
        }
    }
});

// ===== NOTIFICAÇÃO DE NOVA VENDA =====
function mostrarModalNovaVenda() {
    const existente = document.getElementById('modalNovaVenda');
    if (existente) existente.remove();
    const modal = document.createElement('div');
    modal.id = 'modalNovaVenda';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.style.zIndex = '99999';
    modal.innerHTML = `
        <div class="modal-glass modal-parabens modal-vibrando" style="text-align:center;max-width:450px;">
            <div class="parabens-icon" style="font-size:64px;">🔔</div>
            <h2 style="color:#ffd700;font-size:28px;margin:15px 0;">NOVA VENDA!</h2>
            <p style="color:#fff;font-size:16px;">Uma nova venda foi recebida no sistema.</p>
            <button onclick="fecharModalNovaVenda()" class="btn-glass-primary" style="margin-top:20px;background:#ff4757;">Fechar (X)</button>
        </div>
    `;
    document.body.appendChild(modal);
    tocarAlerta();
}
function fecharModalNovaVenda() {
    const modal = document.getElementById('modalNovaVenda');
    if (modal) modal.remove();
    novasVendas = false;
}

// ===== GERENCIAR STATUS =====
function abrirGerenciadorStatus() { carregarListaStatusFlags(); document.getElementById('modalStatus').style.display = 'flex'; }
function fecharModalStatus() { document.getElementById('modalStatus').style.display = 'none'; }
function carregarListaStatusFlags() {
    const container = document.getElementById('listaStatusFlags');
    if (!container) return;
    container.innerHTML = DB.statusFlags.map(f => `<div class="flag-item"><span class="flag-color" style="background:${f.cor};"></span><span>${f.nome}</span><button onclick="removerStatusFlag(${f.id})"><i class="fas fa-trash"></i></button></div>`).join('');
}
function adicionarStatusFlag() {
    const nome = document.getElementById('novoStatusNome').value.trim();
    const cor = document.getElementById('novoStatusCor').value;
    if (!nome) return alert('Digite um nome para a flag!');
    DB.statusFlags.push({ id: Date.now(), nome, cor }); salvarDB(); carregarListaStatusFlags(); document.getElementById('novoStatusNome').value = '';
}
function removerStatusFlag(id) { DB.statusFlags = DB.statusFlags.filter(f => f.id !== id); salvarDB(); carregarListaStatusFlags(); if (document.getElementById('secao-ativacoes')?.classList.contains('section-active')) carregarAtivacoes(); }

// ===== RELATÓRIOS =====
function carregarRelatorios() {
    const periodo = document.getElementById('filtroPeriodo').value;
    let dadosAtual, dadosAnterior;
    if (periodo === 'diario') { dadosAtual = gerarDadosVendas(); dadosAnterior = gerarVendasDiaPassado(); }
    else if (periodo === 'quinzena') { dadosAtual = gerarVendasQuinzenaAtual(); dadosAnterior = gerarVendasQuinzenaAnterior(); }
    else { dadosAtual = gerarVendasMesAtual(); dadosAnterior = gerarVendasMesAnterior(); }
    carregarComparativoProdutos(dadosAtual, dadosAnterior, periodo);
    carregarVendasPorVendedor(dadosAtual, dadosAnterior);
    carregarVendasPorEquipe(dadosAtual, dadosAnterior);
    carregarRankingRelatorio(dadosAtual);
}
function gerarVendasQuinzenaAtual() {
    const hoje = new Date(); const dia = hoje.getDate();
    const todas = gerarVendasMesAtual();
    if (dia <= 15) return todas.filter(v => { const d = parseInt(v.data.split('-')[2]); return d >= 1 && d <= 15; });
    else return todas.filter(v => { const d = parseInt(v.data.split('-')[2]); return d >= 16; });
}
function gerarVendasQuinzenaAnterior() {
    const hoje = new Date(); const dia = hoje.getDate(); let vendas = [];
    if (dia <= 15) {
        const mesAnterior = hoje.getMonth() === 0 ? 12 : hoje.getMonth();
        const ano = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
        vendas = gerarVendasMesAnterior().filter(v => { const [y, m, d] = v.data.split('-').map(Number); return y === ano && m === mesAnterior && d >= 16; });
    } else { vendas = gerarVendasMesAtual().filter(v => { const d = parseInt(v.data.split('-')[2]); return d >= 1 && d <= 15; }); }
    if (vendas.length === 0) {
        const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && u.ativo && !u.deletedAt);
        const planos = [{nome:'Básico',valor:299.9},{nome:'Empresarial',valor:499.9},{nome:'Premium',valor:899.9}];
        const num = Math.floor(Math.random()*12)+4;
        for (let i=0;i<num;i++) { const v = vendedores[Math.floor(Math.random()*vendedores.length)]; const p = planos[Math.floor(Math.random()*planos.length)]; vendas.push({id:Date.now()+i, vendedor_id:v.id, vendedor_nome:v.nome, plano:p.nome, valor:p.valor, data:`2024-06-${String(Math.floor(Math.random()*15)+1).padStart(2,'0')}`}); }
    }
    return vendas;
}
function carregarComparativoProdutos(atual, anterior, periodo) {
    const produtos = ['Básico', 'Empresarial', 'Premium', 'Ultra'];
    let html = '<table><thead><tr><th>Produto</th><th>Período Atual</th><th>Período Anterior</th><th>Variação</th></tr></thead><tbody>';
    produtos.forEach(p => {
        const qtdAtual = atual.filter(v => v.plano === p).length;
        const qtdAnterior = anterior.filter(v => v.plano === p).length;
        const variacao = qtdAnterior > 0 ? (((qtdAtual - qtdAnterior) / qtdAnterior) * 100).toFixed(1) : (qtdAtual > 0 ? 100 : 0);
        const corVar = variacao >= 0 ? 'var(--success)' : 'var(--danger)';
        html += `<tr><td><strong>${p}</strong></td><td>${qtdAtual}</td><td>${qtdAnterior}</td><td style="color:${corVar}">${variacao >= 0 ? '+' + variacao : variacao}%</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('tabelaComparativaProdutos').innerHTML = html;
}
function carregarVendasPorVendedor(atual, anterior) {
    const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && !u.deletedAt);
    const dados = vendedores.map(v => ({
        nome: v.nome,
        atual: atual.filter(vd => vd.vendedor_id === v.id).length,
        anterior: anterior.filter(vd => vd.vendedor_id === v.id).length
    })).sort((a,b) => b.atual - a.atual);
    let html = '<table><thead><tr><th>Vendedor</th><th>Atual</th><th>Anterior</th><th>% Variação</th></tr></thead><tbody>';
    dados.forEach(d => {
        const variacao = d.anterior > 0 ? (((d.atual - d.anterior) / d.anterior) * 100).toFixed(1) : (d.atual > 0 ? 100 : 0);
        const corVar = variacao >= 0 ? 'var(--success)' : 'var(--danger)';
        html += `<tr><td>${d.nome}</td><td>${d.atual}</td><td>${d.anterior}</td><td style="color:${corVar}">${variacao >= 0 ? '+' + variacao : variacao}%</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('tabelaVendedoresRelatorio').innerHTML = html;
    const ctx = document.getElementById('graficoVendedores').getContext('2d');
    if (graficoVendedoresInstance) graficoVendedoresInstance.destroy();
    graficoVendedoresInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: dados.map(d => d.nome), datasets: [{ label: 'Vendas Atual', data: dados.map(d => d.atual), backgroundColor: '#e74c3c', borderRadius: 5 }, { label: 'Período Anterior', data: dados.map(d => d.anterior), backgroundColor: '#555', borderRadius: 5 }] },
        options: { responsive: true, plugins: { legend: { labels: { color: '#fff' } } }, scales: { y: { beginAtZero: true, ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { ticks: { color: '#fff' }, grid: { display: false } } } }
    });
}
function carregarVendasPorEquipe(atual, anterior) {
    const equipes = {};
    DB.usuarios.filter(u => u.tipo==='vendedor' && !u.deletedAt).forEach(u => { const eq = u.equipe || 'Sem equipe'; if (!equipes[eq]) equipes[eq] = { atual: 0, anterior: 0 }; });
    atual.forEach(v => { const user = DB.usuarios.find(u => u.id === v.vendedor_id); const eq = user?.equipe || 'Sem equipe'; if (equipes[eq]) equipes[eq].atual++; });
    anterior.forEach(v => { const user = DB.usuarios.find(u => u.id === v.vendedor_id); const eq = user?.equipe || 'Sem equipe'; if (equipes[eq]) equipes[eq].anterior++; });
    let html = '<table><thead><tr><th>Equipe</th><th>Atual</th><th>Anterior</th><th>% Variação</th></tr></thead><tbody>';
    Object.entries(equipes).forEach(([nome, valores]) => {
        const variacao = valores.anterior > 0 ? (((valores.atual - valores.anterior) / valores.anterior) * 100).toFixed(1) : (valores.atual > 0 ? 100 : 0);
        const corVar = variacao >= 0 ? 'var(--success)' : 'var(--danger)';
        html += `<tr><td><strong>${nome}</strong></td><td>${valores.atual}</td><td>${valores.anterior}</td><td style="color:${corVar}">${variacao >= 0 ? '+' + variacao : variacao}%</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('tabelaEquipesRelatorio').innerHTML = html;
}
function carregarRankingRelatorio(atual) {
    const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && !u.deletedAt);
    const ranking = vendedores.map(v => ({ nome: v.nome, vendas: atual.filter(vd => vd.vendedor_id === v.id).length })).sort((a,b) => b.vendas - a.vendas);
    const maxVendas = ranking[0]?.vendas || 1;
    let html = '';
    ranking.forEach((v, i) => {
        const medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
        const pct = maxVendas > 0 ? (v.vendas / maxVendas * 100).toFixed(0) : 0;
        html += `<div class="ranking-item-relatorio"><div class="ranking-posicao-relatorio">${medalha || i+1}</div><div class="ranking-info-relatorio"><span class="ranking-nome-relatorio">${v.nome}</span><span class="ranking-detalhes-relatorio">${v.vendas} vendas</span><div class="barra-progresso-relatorio"><div class="barra-progresso-preenchimento" style="width:${pct}%"></div></div></div><div class="ranking-pontos-relatorio">${v.vendas}</div></div>`;
    });
    document.getElementById('rankingRelatorio').innerHTML = html;
}

// ===== GERAR PDF =====
function gerarPDF() {
    const periodo = document.getElementById('filtroPeriodo').value;
    let dadosAtual, dadosAnterior;
    if (periodo === 'diario') {
        dadosAtual = gerarDadosVendas();
        dadosAnterior = gerarVendasDiaPassado();
    } else if (periodo === 'quinzena') {
        dadosAtual = gerarVendasQuinzenaAtual();
        dadosAnterior = gerarVendasQuinzenaAnterior();
    } else {
        dadosAtual = gerarVendasMesAtual();
        dadosAnterior = gerarVendasMesAnterior();
    }

    let html = `<div style="font-family:Arial,sans-serif;padding:15px;color:#000;background:#fff;max-width:700px;margin:0 auto;">`;
    html += `<h1 style="font-size:18px;color:#000;margin-bottom:10px;">📊 Relatório de Vendas - STAGE TELECOM</h1>`;
    html += `<p style="font-size:12px;color:#333;margin-bottom:20px;">Período: ${periodo} | Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>`;
    html += `<h2 style="font-size:14px;color:#000;border-bottom:2px solid #e74c3c;padding-bottom:5px;">Comparativo de Produtos</h2>`;
    html += `<table style="width:100%;border-collapse:collapse;font-size:11px;color:#000;margin-bottom:20px;"><tr style="background:#f5f5f5;"><th style="padding:8px;">Produto</th><th>Atual</th><th>Anterior</th><th>Variação</th></tr>`;
    const produtos = ['Básico','Empresarial','Premium','Ultra'];
    produtos.forEach(p => {
        const qAt = dadosAtual.filter(v => v.plano === p).length;
        const qAnt = dadosAnterior.filter(v => v.plano === p).length;
        const variacao = qAnt > 0 ? ((qAt - qAnt) / qAnt * 100).toFixed(1) : (qAt > 0 ? 100 : 0);
        const corVar = variacao >= 0 ? '#2ed573' : '#ff4757';
        html += `<tr><td style="padding:6px;">${p}</td><td>${qAt}</td><td>${qAnt}</td><td style="color:${corVar};">${variacao >= 0 ? '+' + variacao : variacao}%</td></tr>`;
    });
    html += `</table>`;
    const vendedores = DB.usuarios.filter(u => u.tipo === 'vendedor' && !u.deletedAt);
    const dadosVend = vendedores.map(v => ({
        nome: v.nome,
        atual: dadosAtual.filter(vd => vd.vendedor_id === v.id).length,
        anterior: dadosAnterior.filter(vd => vd.vendedor_id === v.id).length
    })).sort((a,b) => b.atual - a.atual);
    html += `<h2 style="font-size:14px;color:#000;border-bottom:2px solid #e74c3c;padding-bottom:5px;">Vendas por Vendedor</h2>`;
    html += `<table style="width:100%;border-collapse:collapse;font-size:11px;color:#000;margin-bottom:20px;"><tr style="background:#f5f5f5;"><th>Vendedor</th><th>Atual</th><th>Anterior</th><th>Var.</th></tr>`;
    dadosVend.forEach(d => {
        const variacao = d.anterior > 0 ? ((d.atual - d.anterior) / d.anterior * 100).toFixed(1) : (d.atual > 0 ? 100 : 0);
        const corVar = variacao >= 0 ? '#2ed573' : '#ff4757';
        html += `<tr><td style="padding:6px;">${d.nome}</td><td>${d.atual}</td><td>${d.anterior}</td><td style="color:${corVar};">${variacao >= 0 ? '+' + variacao : variacao}%</td></tr>`;
    });
    html += `</table>`;
    html += `<div style="text-align:center;margin:20px 0;"><canvas id="graficoPDF" width="500" height="220"></canvas></div>`;
    html += `<h2 style="font-size:14px;color:#000;border-bottom:2px solid #e74c3c;padding-bottom:5px;">Ranking de Vendedores</h2>`;
    const maxVendas = dadosVend[0]?.atual || 1;
    dadosVend.forEach((v, i) => {
        const pct = Math.round((v.atual / maxVendas) * 100);
        html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;font-size:12px;color:#000;"><span style="font-weight:bold;width:25px;">${i+1}º</span><span style="flex:1;">${v.nome} - ${v.atual} vendas</span><div style="width:120px;height:8px;background:#eee;border-radius:4px;"><div style="width:${pct}%;height:100%;background:#e74c3c;border-radius:4px;"></div></div></div>`;
    });
    html += `</div>`;
    document.getElementById('conteudoPDF').innerHTML = html;
    document.getElementById('modalPDF').style.display = 'flex';
    setTimeout(() => {
        const canvas = document.getElementById('graficoPDF');
        if (canvas) {
            new Chart(canvas, {
                type: 'bar',
                data: { labels: dadosVend.map(d => d.nome), datasets: [{ label: 'Atual', data: dadosVend.map(d => d.atual), backgroundColor: '#e74c3c' }, { label: 'Anterior', data: dadosVend.map(d => d.anterior), backgroundColor: '#aaa' }] },
                options: {
                    responsive: false,
                    animation: { onComplete: function() { gerarArquivoPDF(); } },
                    plugins: { legend: { labels: { color: '#000', font: { size: 10 } } } },
                    scales: { y: { beginAtZero: true, ticks: { color: '#000', font: { size: 9 } } }, x: { ticks: { color: '#000', font: { size: 9 } } } }
                }
            });
        } else { gerarArquivoPDF(); }
    }, 300);
    function gerarArquivoPDF() {
        const elemento = document.getElementById('conteudoPDF');
        html2pdf().set({ margin: 0.5, filename: `relatorio_${new Date().toISOString().slice(0,10)}.pdf`, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, backgroundColor: '#ffffff', logging: false, allowTaint: true, useCORS: true }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }, pagebreak: { mode: 'avoid-all' } }).from(elemento).save();
    }
}
function fecharModalPDF() { document.getElementById('modalPDF').style.display = 'none'; }

// ===== METAS (com gerenciamento de produtos e opções de venda) =====
function carregarMetas() {
    document.getElementById('metaDiariaVendas').value = DB.metas.diariaVendas || 10;
    document.getElementById('metaQuinzenalVendas').value = DB.metas.quinzenalVendas || 75;
    document.getElementById('metaMensalVendas').value = DB.metas.mensalVendas || 150;
    carregarSelectProdutos();
    const tabelaProd = document.getElementById('tabelaMetasProdutos');
    tabelaProd.innerHTML = DB.metas.produtos.map(p => `<tr><td>${p.produto}</td><td>${p.diaria}</td><td>${p.quinzenal}</td><td>${p.mensal}</td><td><button onclick="removerMetaProduto(${p.id})" class="btn-glass-danger" style="padding:4px 10px; font-size:12px;"><i class="fas fa-trash"></i></button></td></tr>`).join('');
    carregarMetasInstalacoes();
    const selectVendedor = document.getElementById('vendedorMetaInstalacao');
    selectVendedor.innerHTML = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo && !u.deletedAt).map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
    carregarTabelaProdutos();
    // Carregar opções de venda
    carregarOpcoesVendaAdmin();
}

function carregarSelectProdutos() {
    const select = document.getElementById('produtoMetaSelect');
    if (select) {
        select.innerHTML = DB.produtos.map(p => `<option value="${p}">${p}</option>`).join('');
    }
    const selectVenda = document.getElementById('vPlano');
    if (selectVenda) {
        selectVenda.innerHTML = '<option value="">Selecione o plano</option>' + DB.produtos.map(p => `<option value="${p}">${p}</option>`).join('');
    }
}

function adicionarMetaProduto() {
    const produto = document.getElementById('produtoMetaSelect').value;
    const diaria = parseInt(document.getElementById('produtoDiaria').value) || 0;
    const quinzenal = parseInt(document.getElementById('produtoQuinzenal').value) || 0;
    const mensal = parseInt(document.getElementById('produtoMensal').value) || 0;
    if (!produto || diaria <= 0 || quinzenal <= 0 || mensal <= 0) return alert('Preencha todos os campos corretamente!');
    DB.metas.produtos.push({ id: Date.now(), produto, diaria, quinzenal, mensal }); salvarDB(); carregarMetas();
}
function removerMetaProduto(id) { DB.metas.produtos = DB.metas.produtos.filter(p => p.id !== id); salvarDB(); carregarMetas(); }
function toggleMetaInstalacao() { document.getElementById('grupoVendedorInstalacao').style.display = document.getElementById('tipoMetaInstalacao').value === 'vendedor' ? 'block' : 'none'; }
function adicionarMetaInstalacao() {
    const tipo = document.getElementById('tipoMetaInstalacao').value;
    const diaria = parseInt(document.getElementById('instalacaoDiaria').value) || 0;
    const quinzenal = parseInt(document.getElementById('instalacaoQuinzenal').value) || 0;
    const mensal = parseInt(document.getElementById('instalacaoMensal').value) || 0;
    if (diaria <= 0 || quinzenal <= 0 || mensal <= 0) return alert('Valores inválidos');
    let entidade = '', entidadeId = null;
    if (tipo === 'vendedor') { entidadeId = parseInt(document.getElementById('vendedorMetaInstalacao').value); const vend = DB.usuarios.find(u => u.id === entidadeId); entidade = vend ? vend.nome : 'Vendedor'; }
    else { entidade = 'STAGE TELECOM'; entidadeId = 0; }
    DB.metas.instalacoes.push({ id: Date.now(), tipo, entidade, entidadeId, diaria, quinzenal, mensal }); salvarDB(); carregarMetas();
}
function carregarMetasInstalacoes() {
    const tabelaInst = document.getElementById('tabelaMetasInstalacoes');
    tabelaInst.innerHTML = DB.metas.instalacoes.map(i => `<tr><td>${i.tipo === 'vendedor' ? 'Vendedor' : 'Empresa'}</td><td>${i.entidade}</td><td>${i.diaria}</td><td>${i.quinzenal}</td><td>${i.mensal}</td><td><button onclick="removerMetaInstalacao(${i.id})" class="btn-glass-danger" style="padding:4px 10px; font-size:12px;"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function removerMetaInstalacao(id) { DB.metas.instalacoes = DB.metas.instalacoes.filter(i => i.id !== id); salvarDB(); carregarMetas(); }
function salvarMetas() { DB.metas.diariaVendas = parseInt(document.getElementById('metaDiariaVendas').value) || 10; DB.metas.quinzenalVendas = parseInt(document.getElementById('metaQuinzenalVendas').value) || 75; DB.metas.mensalVendas = parseInt(document.getElementById('metaMensalVendas').value) || 150; salvarDB(); alert('✅ Metas de vendas atualizadas!'); }

// Gerenciamento de Produtos
function carregarTabelaProdutos() {
    const tbody = document.getElementById('tabelaProdutos');
    if (!tbody) return;
    tbody.innerHTML = DB.produtos.map((p, index) => `
        <tr>
            <td>${p}</td>
            <td>
                <button onclick="editarProduto(${index})" class="btn-glass-sm" style="margin-right:5px;"><i class="fas fa-edit"></i></button>
                <button onclick="excluirProduto(${index})" class="btn-glass-sm" style="background:rgba(255,71,87,0.2);border-color:#ff4757;color:#ff4757;"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}
function adicionarProduto() {
    const nome = document.getElementById('novoProdutoNome').value.trim();
    if (!nome) return alert('Digite um nome para o produto.');
    if (DB.produtos.includes(nome)) return alert('Produto já existe.');
    DB.produtos.push(nome);
    salvarDB();
    document.getElementById('novoProdutoNome').value = '';
    carregarTabelaProdutos();
    carregarSelectProdutos();
}
function editarProduto(index) {
    const novoNome = prompt('Novo nome do produto:', DB.produtos[index]);
    if (novoNome && novoNome.trim() && novoNome.trim() !== DB.produtos[index]) {
        if (DB.produtos.includes(novoNome.trim())) return alert('Produto já existe.');
        DB.produtos[index] = novoNome.trim();
        salvarDB();
        carregarTabelaProdutos();
        carregarSelectProdutos();
    }
}
function excluirProduto(index) {
    if (confirm(`Excluir produto "${DB.produtos[index]}"?`)) {
        DB.produtos.splice(index, 1);
        salvarDB();
        carregarTabelaProdutos();
        carregarSelectProdutos();
    }
}

// Opções de Venda (Admin)
function carregarOpcoesVendaAdmin() {
    const vel = document.getElementById('opcoesVelocidade');
    const formPag = document.getElementById('opcoesFormaPagamento');
    const val = document.getElementById('opcoesValor');
    if (vel) vel.value = (DB.opcoesVenda.velocidades || []).join(', ');
    if (formPag) formPag.value = (DB.opcoesVenda.formasPagamento || []).join(', ');
    if (val) val.value = (DB.opcoesVenda.valores || []).join(', ');
}

function salvarOpcoesVenda() {
    const velRaw = document.getElementById('opcoesVelocidade').value;
    const formPagRaw = document.getElementById('opcoesFormaPagamento').value;
    const valRaw = document.getElementById('opcoesValor').value;
    DB.opcoesVenda.velocidades = velRaw.split(',').map(v => v.trim()).filter(v => v);
    DB.opcoesVenda.formasPagamento = formPagRaw.split(',').map(v => v.trim()).filter(v => v);
    DB.opcoesVenda.valores = valRaw.split(',').map(v => v.trim()).filter(v => v);
    salvarDB();
    alert('✅ Opções de venda salvas!');
    // Atualizar imediatamente os dropdowns do vendedor se a página estiver aberta
    carregarOpcoesVenda();
}

// Popula dropdowns do vendedor
function carregarOpcoesVenda() {
    const selVel = document.getElementById('vVelocidade');
    const selForm = document.getElementById('vFormaPagamento');
    const selVal = document.getElementById('vValor');
    if (selVel) {
        selVel.innerHTML = '<option value="">Selecione a velocidade</option>' + (DB.opcoesVenda.velocidades || []).map(v => `<option value="${v}">${v}</option>`).join('');
    }
    if (selForm) {
        selForm.innerHTML = '<option value="">Forma de Pagamento</option>' + (DB.opcoesVenda.formasPagamento || []).map(v => `<option value="${v}">${v}</option>`).join('');
    }
    if (selVal) {
        selVal.innerHTML = '<option value="">Selecione o valor</option>' + (DB.opcoesVenda.valores || []).map(v => `<option value="${v}">${v}</option>`).join('');
    }
}

// ===== PROMOÇÕES =====
function mostrarFormPromocao() { document.getElementById('formPromocao').style.display = 'block'; }
function cadastrarPromocao() {
    const tipo = document.getElementById('tipoPromocao').value;
    const quantidade = parseInt(document.getElementById('quantidadePromocao').value) || 0;
    const inicio = document.getElementById('inicioPromocao').value;
    const fim = document.getElementById('fimPromocao').value;
    const premio = document.getElementById('premioPromocao').value.trim();
    if (!inicio || !fim || !premio || quantidade <= 0) return alert('Preencha todos os campos corretamente!');
    DB.promocoes.push({ id: Date.now(), tipo, quantidade, inicio, fim, premio, ativa: true, concluida: false, vencedores: [] });
    salvarDB(); carregarPromocoes(); document.getElementById('formPromocao').style.display = 'none'; document.getElementById('premioPromocao').value = '';
    alert('✅ Promoção cadastrada!');
}
function carregarPromocoes() {
    const agora = new Date();
    const tabela = document.getElementById('tabelaPromocoes');
    const divVazia = document.getElementById('promocoesVazia');
    if (!tabela || !divVazia) return;
    DB.promocoes.forEach(p => {
        const inicio = new Date(p.inicio);
        const fim = new Date(p.fim);
        if (agora < inicio) p.status = '⏳ Aguardando';
        else if (agora >= inicio && agora <= fim) { p.status = '▶️ Ativa'; p.ativa = true; }
        else if (agora > fim && !p.concluida) { p.status = '⏹️ Encerrada'; p.ativa = false; verificarVencedoresPromocao(p); }
    });
    salvarDB();
    if (DB.promocoes.length === 0) { tabela.innerHTML = ''; divVazia.style.display = 'block'; }
    else { divVazia.style.display = 'none'; tabela.innerHTML = DB.promocoes.map(p => `<tr><td>${p.tipo}</td><td>${p.quantidade}</td><td>${new Date(p.inicio).toLocaleString('pt-BR')} → ${new Date(p.fim).toLocaleString('pt-BR')}</td><td>${p.premio}</td><td>${p.status || 'Ativa'}</td><td><button onclick="excluirPromocao(${p.id})" class="btn-glass-danger" style="padding:4px 10px; font-size:12px;"><i class="fas fa-trash"></i></button></td></tr>`).join(''); }
}
function excluirPromocao(id) { if (confirm('Excluir esta promoção?')) { DB.promocoes = DB.promocoes.filter(p => p.id !== id); salvarDB(); carregarPromocoes(); } }
function obterQuantidadePeriodo(vendedorId, tipo, inicio, fim) { return gerarVendasParaPeriodo(vendedorId, inicio, fim).length; }
function gerarVendasParaPeriodo(vendedorId, inicio, fim) {
    const inicioDate = new Date(inicio); const fimDate = new Date(fim); const vendas = [];
    for (let d = new Date(inicioDate); d <= fimDate; d.setDate(d.getDate() + 1)) {
        const dataStr = d.toISOString().split('T')[0];
        const vendasDia = gerarVendasParaData(dataStr);
        vendas.push(...vendasDia.filter(v => v.vendedor_id === vendedorId));
    }
    return vendas;
}
function gerarVendasParaData(data) {
    return obterVendasAprovadasPorData(data).map(v => ({
        id: v.id, vendedor_id: v.vendedor_id, vendedor_nome: v.vendedorNome,
        plano: v.produto, valor: parseFloat(v.valor) || 0, data: v.data
    }));
}
function verificarVencedoresPromocao(promocao) {
    const vendedores = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo && !u.deletedAt);
    const vencedores = [];
    vendedores.forEach(v => { const qtd = obterQuantidadePeriodo(v.id, promocao.tipo, promocao.inicio, promocao.fim); if (qtd >= promocao.quantidade) vencedores.push({ id: v.id, nome: v.nome, quantidade: qtd }); });
    promocao.vencedores = vencedores.map(v => v.id);
    promocao.concluida = true; salvarDB();
    if (vencedores.length > 0) {
        const nomes = vencedores.map(v => v.nome).join(', ');
        mostrarModalParabens(`🏆 Meta bônus de ${promocao.tipo} batida! Vencedor(es): ${nomes}. Prêmio: ${promocao.premio}`);
        vencedores.forEach(v => { DB.notificacoes.push({ id: Date.now() + Math.random(), userId: v.id, mensagem: `🎉 Você bateu a meta bônus de ${promocao.tipo} e ganhou: ${promocao.premio}!`, lida: false }); });
        salvarDB();
    } else { mostrarModalParabens(`😞 Nenhum vendedor bateu a meta bônus de ${promocao.tipo}.`); }
}
function verificarPromocoesAdmin() { const agora = new Date(); DB.promocoes.forEach(p => { if (p.ativa && new Date(p.fim) <= agora && !p.concluida) verificarVencedoresPromocao(p); }); }
function mostrarModalParabens(mensagem) { document.getElementById('parabensMensagem').textContent = mensagem; document.getElementById('modalParabens').style.display = 'flex'; }
function verificarNotificacoesVendedor() { if (!sessao || sessao.tipo !== 'vendedor') return; const notificacoesPendentes = DB.notificacoes.filter(n => n.userId === sessao.id && !n.lida); if (notificacoesPendentes.length > 0) { const notif = notificacoesPendentes[0]; document.getElementById('parabensVendedorMensagem').textContent = notif.mensagem; document.getElementById('modalParabensVendedor').style.display = 'flex'; notif.lida = true; salvarDB(); } }
setInterval(() => { if (sessao && sessao.tipo === 'admin') { const agora = new Date(); DB.promocoes.forEach(p => { if (p.ativa && new Date(p.fim) <= agora && !p.concluida) verificarVencedoresPromocao(p); }); } }, 30000);

// ===== NOTIFICAÇÃO TOAST =====
function mostrarNotificacao(mensagem) {
    const toast = document.getElementById('toastNotificacao');
    document.getElementById('toastMensagem').textContent = mensagem;
    toast.style.display = 'flex';
    setTimeout(() => { toast.style.display = 'none'; }, 5000);
}
function fecharToast() { document.getElementById('toastNotificacao').style.display = 'none'; }

// ===== SOM DE ALERTA =====
function tocarAlerta() {
    try {
        const ctx = new (window.AudioContext||window.webkitAudioContext)();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 800; osc.type = 'square';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime+0.3);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.3);
    } catch(e){}
}

// ========== NOVAS FUNÇÕES DO VENDEDOR ==========
function carregarInicioVendedor() {
    if (!sessao) return;
    const metaMensal = DB.metas.mensalVendas || 150;
    const metaDiaria = DB.metas.diariaVendas || 10;
    document.getElementById('metaMensalVendedor').textContent = metaMensal;
    document.getElementById('metaDiariaVendedor').textContent = metaDiaria;

    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    const vendasAprovadas = DB.ativacoes.filter(a => {
        if (a.vendedor_id !== sessao.id) return false;
        if (a.status !== 'Aprovado' || a.finalizada === false) return false;
        const dataVenda = new Date(a.data + 'T00:00:00');
        return dataVenda.getMonth() + 1 === mesAtual && dataVenda.getFullYear() === anoAtual;
    });
    const totalVendas = vendasAprovadas.length;
    const percentual = Math.min((totalVendas / metaMensal) * 100, 100).toFixed(1);
    document.getElementById('realizadoVendedorMes').textContent = totalVendas;
    document.getElementById('faltamVendedorMes').textContent = Math.max(metaMensal - totalVendas, 0);
    document.getElementById('totalVendasMesVendedor').textContent = totalVendas;
    document.getElementById('barraProgressoVendedor').style.width = `${percentual}%`;
}

function buscarCep() {
    const cep = document.getElementById('vCep').value.replace(/\D/g, '');
    if (cep.length !== 8) return alert('Digite um CEP válido com 8 dígitos.');
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
        .then(data => {
            if (data.erro) { alert('CEP não encontrado.'); return; }
            document.getElementById('vEndereco').value = data.logradouro || '';
            document.getElementById('vBairro').value = data.bairro || '';
            document.getElementById('vCidade').value = data.localidade || '';
            document.getElementById('vUf').value = data.uf || '';
            document.getElementById('vNumeroComplemento').focus();
        })
        .catch(() => alert('Erro ao buscar CEP.'));
}

function enviarVenda() {
    if (!sessao) { alert('Sessão expirada. Faça login novamente.'); return; }
    const campos = {
        nomeCompleto: document.getElementById('vNomeCompleto').value.trim(),
        nomeMae: document.getElementById('vNomeMae').value.trim(),
        dataNasc: document.getElementById('vDataNasc').value,
        cpfCnpj: document.getElementById('vCpfCnpj').value.trim(),
        razaoSocial: document.getElementById('vRazaoSocial').value.trim(),
        email: document.getElementById('vEmail').value.trim(),
        cep: document.getElementById('vCep').value.trim(),
        uf: document.getElementById('vUf').value.trim(),
        endereco: document.getElementById('vEndereco').value.trim(),
        bairro: document.getElementById('vBairro').value.trim(),
        cidade: document.getElementById('vCidade').value.trim(),
        numeroComplemento: document.getElementById('vNumeroComplemento').value.trim(),
        referencia: document.getElementById('vReferencia').value.trim(),
        telefone: document.getElementById('vTelefone').value.trim(),
        whatsapp: document.getElementById('vWhatsapp').value.trim(),
        valor: document.getElementById('vValor').value,
        velocidade: document.getElementById('vVelocidade').value,
        formaPagamento: document.getElementById('vFormaPagamento').value,
        vencimento: document.getElementById('vVencimento').value,
        plano: document.getElementById('vPlano').value
    };
    for (let key in campos) {
        if (!campos[key]) {
            alert(`Preencha o campo "${key.replace(/([A-Z])/g, ' $1').toLowerCase()}"`);
            return;
        }
    }
    const novaAtivacao = {
        id: Date.now(),
        nomeCliente: campos.nomeCompleto,
        produto: campos.plano,
        vendedor_id: sessao.id,
        vendedorNome: sessao.nome,
        status: "Pendente",
        data: new Date().toISOString().split('T')[0],
        finalizada: false,
        ...campos
    };
    DB.ativacoes.push(novaAtivacao);
    salvarDB();
    ['vNomeCompleto','vNomeMae','vDataNasc','vCpfCnpj','vRazaoSocial','vEmail','vCep','vUf','vEndereco','vBairro','vCidade','vNumeroComplemento','vReferencia','vTelefone','vWhatsapp','vValor','vVelocidade','vFormaPagamento','vVencimento','vPlano'].forEach(id => {
        document.getElementById(id).value = '';
    });
    alert('✅ Venda enviada com sucesso!');
}

function carregarControleVendas() {
    const minhasAtivacoes = DB.ativacoes.filter(a => a.vendedor_id === sessao.id).sort((a,b) => b.id - a.id);
    const tabela = document.getElementById('tabelaControleVendas');
    if (!tabela) return;
    tabela.innerHTML = minhasAtivacoes.length ? minhasAtivacoes.map(a => {
        const flag = DB.statusFlags.find(f => f.nome === a.status) || { cor: '#fff' };
        return `<tr>
            <td><strong>${a.nomeCliente}</strong></td>
            <td>${a.plano || a.produto}</td>
            <td>R$ ${parseFloat(a.valor).toFixed(2)}</td>
            <td><span style="color:${flag.cor};font-weight:600;">● ${a.status}</span></td>
            <td>${new Date(a.data+'T00:00:00').toLocaleDateString('pt-BR')}</td>
            <td><button onclick="abrirModalVisualizacao(${a.id})" class="btn-glass-sm"><i class="fas fa-eye"></i></button></td>
        </tr>`;
    }).join('') : '<tr><td colspan="6" style="text-align:center;padding:30px;">Nenhuma venda enviada</td></tr>';
}

function carregarInstalacoes() {
    const aprovadas = DB.ativacoes.filter(a => a.vendedor_id === sessao.id && a.status === 'Aprovado' && a.finalizada !== false).sort((a,b) => b.id - a.id);
    const tabela = document.getElementById('tabelaInstalacoes');
    if (!tabela) return;
    tabela.innerHTML = aprovadas.length ? aprovadas.map(a => {
        const statusInstalacao = a.instalacaoStatus || 'Aguardando';
        return `<tr>
            <td><strong>${a.nomeCliente}</strong></td>
            <td>${a.plano || a.produto}</td>
            <td><span style="color:#2ed573;font-weight:600;">● ${a.status}</span></td>
            <td>
                <select onchange="alterarStatusInstalacao(${a.id}, this.value)" style="background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2);padding:4px 8px;border-radius:6px;">
                    <option value="Aguardando" ${statusInstalacao === 'Aguardando' ? 'selected' : ''}>Aguardando</option>
                    <option value="Instalado" ${statusInstalacao === 'Instalado' ? 'selected' : ''}>Instalado</option>
                    <option value="Cancelado" ${statusInstalacao === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </td>
            <td><button onclick="abrirModalVisualizacao(${a.id})" class="btn-glass-sm"><i class="fas fa-eye"></i></button></td>
        </tr>`;
    }).join('') : '<tr><td colspan="5" style="text-align:center;padding:30px;">Nenhuma venda aprovada para instalação</td></tr>';
}
function alterarStatusInstalacao(id, novoStatus) {
    const a = DB.ativacoes.find(x => x.id === id);
    if (a) {
        a.instalacaoStatus = novoStatus;
        salvarDB();
    }
}

function abrirModalVisualizacao(id) {
    const a = DB.ativacoes.find(x => x.id === id);
    if (!a) return;
    const flag = DB.statusFlags.find(f => f.nome === a.status) || { cor: '#fff' };
    let html = `<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:15px;">`;
    html += `<span style="background:rgba(255,255,255,0.05);padding:5px 10px;border-radius:8px;"><strong>Status:</strong> <span style="color:${flag.cor}">${a.status}</span></span>`;
    html += `<span style="background:rgba(255,255,255,0.05);padding:5px 10px;border-radius:8px;"><strong>Plano:</strong> ${a.plano || a.produto}</span>`;
    html += `<span style="background:rgba(255,255,255,0.05);padding:5px 10px;border-radius:8px;"><strong>Valor:</strong> R$ ${parseFloat(a.valor).toFixed(2)}</span>`;
    html += `</div>`;
    html += `<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:8px;">`;
    const campos = [
        ['Nome Completo', a.nomeCompleto], ['Nome da Mãe', a.nomeMae], ['Data Nasc.', a.dataNasc],
        ['CPF/CNPJ', a.cpfCnpj], ['Razão Social', a.razaoSocial], ['Email', a.email],
        ['CEP', a.cep], ['UF', a.uf], ['Endereço', a.endereco], ['Bairro', a.bairro],
        ['Cidade', a.cidade], ['N°/Compl.', a.numeroComplemento], ['Referência', a.referencia],
        ['Telefone', a.telefone], ['WhatsApp', a.whatsapp], ['Velocidade', a.velocidade],
        ['Forma Pag.', a.formaPagamento], ['Vencimento', a.vencimento]
    ];
    campos.forEach(([label, valor]) => {
        html += `<div class="input-group"><label>${label}</label><input value="${valor||''}" readonly style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);"></div>`;
    });
    html += `</div>`;
    document.getElementById('conteudoModalVisualizacao').innerHTML = html;
    document.getElementById('modalVisualizacao').style.display = 'flex';
}
function fecharModalVisualizacao() {
    document.getElementById('modalVisualizacao').style.display = 'none';
}

function mostrarSecaoVendedor(e, secao) {
    document.querySelectorAll('#vendedorScreen .section-active, #vendedorScreen .section-hidden').forEach(s => { s.style.display = 'none'; s.className = 'section-hidden'; });
    const el = document.getElementById(`secao-${secao}`); if(el){ el.style.display = 'block'; el.className = 'section-active'; }
    document.querySelectorAll('#vendedorScreen .nav-item').forEach(a => a.classList.remove('active'));
    if (e && e.currentTarget) { e.currentTarget.classList.add('active'); }
    const titulos = { inicio: '🏠 Início', enviarVenda: '📨 Enviar Venda', controleVendas: '📋 Controle de Vendas', instalacoes: '🔧 Instalações' };
    document.getElementById('tituloSecaoVendedor').innerHTML = titulos[secao] || secao;
    if (secao === 'inicio') carregarInicioVendedor();
    if (secao === 'enviarVenda') { carregarOpcoesVenda(); carregarSelectProdutos(); }
    if (secao === 'controleVendas') carregarControleVendas();
    if (secao === 'instalacoes') carregarInstalacoes();
}

// ===== CHAT =====
let chatConversationAtual = null;
let chatIntervalo = null;

function carregarUsuariosChat() {
    const select = document.getElementById('privateUserSelect');
    if (!select) return;
    select.innerHTML = '<option value="">Nova conversa privada...</option>';
    DB.usuarios.filter(u => u.ativo && !u.deletedAt && u.id !== sessao.id).forEach(u => {
        select.innerHTML += `<option value="${u.id}">${u.nome} (${u.categoria})</option>`;
    });
}
function atualizarListaConversas() {
    const container = document.getElementById('conversationList');
    if (!container || !sessao) return;
    const naoLidasGrupo = DB.chatMessages.filter(m => m.conversationId === 'group' && (!m.readBy || !m.readBy.includes(sessao.id))).length;
    let html = `<div class="chat-conv-item" onclick="abrirConversaChat('group')"><i class="fas fa-users conv-icon"></i> Geral (todos) ${naoLidasGrupo > 0 ? `<span class="conv-badge">${naoLidasGrupo}</span>` : ''}</div>`;
    const privadas = new Set();
    DB.chatMessages.forEach(m => {
        if (m.conversationId && m.conversationId !== 'group' && m.conversationId.includes(String(sessao.id))) privadas.add(m.conversationId);
    });
    privadas.forEach(convId => {
        const ids = convId.split('-').map(Number);
        const outroId = ids.find(id => id !== sessao.id);
        const outroUser = DB.usuarios.find(u => u.id === outroId);
        const nome = outroUser ? outroUser.nome : 'Usuário';
        const naoLidas = DB.chatMessages.filter(m => m.conversationId === convId && (!m.readBy || !m.readBy.includes(sessao.id))).length;
        html += `<div class="chat-conv-item" onclick="abrirConversaChat('${convId}')"><i class="fas fa-user conv-icon"></i> ${nome} ${naoLidas > 0 ? `<span class="conv-badge">${naoLidas}</span>` : ''}</div>`;
    });
    container.innerHTML = html;
}
function abrirConversaChat(conversationId) {
    chatConversationAtual = conversationId;
    document.getElementById('chatSidebar').style.display = 'none';
    document.getElementById('chatMain').style.display = 'flex';
    const backBtn = document.getElementById('chatBackBtn');
    const title = document.getElementById('chatTitle');
    if (conversationId === 'group') {
        title.innerHTML = '<i class="fas fa-users"></i> Geral';
    } else {
        const ids = conversationId.split('-').map(Number);
        const outroId = ids.find(id => id !== sessao.id);
        const outroUser = DB.usuarios.find(u => u.id === outroId);
        title.innerHTML = `<i class="fas fa-user"></i> ${outroUser ? outroUser.nome : 'Privado'}`;
    }
    backBtn.style.display = 'inline-block';
    marcarMensagensComoLidas(conversationId);
    renderizarMensagensChat();
    atualizarBadge();
}
function voltarParaListaConversas() {
    chatConversationAtual = null;
    document.getElementById('chatMain').style.display = 'none';
    document.getElementById('chatSidebar').style.display = 'block';
    document.getElementById('chatBackBtn').style.display = 'none';
    document.getElementById('chatTitle').innerHTML = '<i class="fas fa-comment-dots"></i> Chat';
    atualizarListaConversas();
}
function marcarMensagensComoLidas(conversationId) {
    let mudanca = false;
    DB.chatMessages.forEach(m => {
        if (m.conversationId === conversationId) {
            if (!m.readBy) m.readBy = [];
            if (!m.readBy.includes(sessao.id)) { m.readBy.push(sessao.id); mudanca = true; }
        }
    });
    if (mudanca) salvarDB();
}
function renderizarMensagensChat() {
    const container = document.getElementById('chatMessages');
    if (!container || !chatConversationAtual) return;
    const mensagens = DB.chatMessages.filter(m => m.conversationId === chatConversationAtual).sort((a,b) => a.timestamp - b.timestamp);
    container.innerHTML = mensagens.map(m => {
        const isOwn = m.senderId === sessao.id;
        const hora = new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
        return `<div class="chat-msg ${isOwn ? 'own' : 'other'}">
            ${!isOwn ? `<span class="msg-sender">${m.senderName}</span>` : ''}
            <div class="msg-bubble">${m.text}</div>
            <span class="msg-time">${hora}</span>
        </div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
    atualizarListaConversas();
}
function enviarMensagemChat() {
    const input = document.getElementById('chatInput');
    const texto = input.value.trim();
    if (!texto || !chatConversationAtual) return;
    DB.chatMessages.push({ id: Date.now() + Math.random(), conversationId: chatConversationAtual, senderId: sessao.id, senderName: sessao.nome, text: texto, timestamp: Date.now(), readBy: [sessao.id] });
    salvarDB();
    input.value = '';
    renderizarMensagensChat();
}
function iniciarConversaPrivada() {
    const select = document.getElementById('privateUserSelect');
    const outroId = parseInt(select.value);
    if (!outroId) return;
    const ids = [sessao.id, outroId].sort((a,b) => a - b);
    const conversationId = ids.join('-');
    select.value = '';
    abrirConversaChat(conversationId);
    atualizarListaConversas();
}
function atualizarBadge() {
    const badge = document.getElementById('chatBadge');
    if (!badge || !sessao) return;
    const totalNaoLidas = DB.chatMessages.filter(m => (!m.readBy || !m.readBy.includes(sessao.id)) && (m.conversationId === 'group' || m.conversationId.includes(String(sessao.id)))).length;
    if (totalNaoLidas > 0) { badge.textContent = totalNaoLidas > 99 ? '99+' : totalNaoLidas; badge.style.display = 'flex'; }
    else { badge.style.display = 'none'; }
}
function iniciarPollingChat() {
    if (chatIntervalo) clearInterval(chatIntervalo);
    chatIntervalo = setInterval(() => {
        if (!sessao) return;
        atualizarBadge();
        if (document.getElementById('chatSidebar').style.display !== 'none') {
            atualizarListaConversas();
        }
        if (chatConversationAtual && document.getElementById('chatMain').style.display === 'flex') {
            renderizarMensagensChat();
        }
    }, 1000);
}
function toggleChat() {
    const widget = document.getElementById('chatWidget');
    if (widget.classList.contains('expanded')) {
        widget.classList.remove('expanded');
        widget.classList.add('minimized');
    } else {
        widget.classList.remove('minimized');
        widget.classList.add('expanded');
        carregarUsuariosChat();
        atualizarListaConversas();
        if (!chatConversationAtual) {
            document.getElementById('chatSidebar').style.display = 'block';
            document.getElementById('chatMain').style.display = 'none';
            document.getElementById('chatBackBtn').style.display = 'none';
            document.getElementById('chatTitle').innerHTML = '<i class="fas fa-comment-dots"></i> Chat';
        } else {
            abrirConversaChat(chatConversationAtual);
        }
    }
}
function iniciarChat() {
    if (!sessao) return;
    const chatWidget = document.getElementById('chatWidget');
    if (chatWidget) chatWidget.style.display = 'flex';
    carregarUsuariosChat();
    atualizarListaConversas();
    atualizarBadge();
    iniciarPollingChat();
}

// ===== LIMPEZA DE MENSAGENS ANTIGAS =====
function limparMensagensAntigas(dias = 90) {
    const agora = Date.now();
    const limite = agora - (dias * 24 * 60 * 60 * 1000);
    const antes = DB.chatMessages.length;
    DB.chatMessages = DB.chatMessages.filter(m => m.timestamp > limite);
    if (DB.chatMessages.length < antes) {
        salvarDB();
        console.log(`🧹 Chat limpo: ${antes - DB.chatMessages.length} mensagens removidas (mais de ${dias} dias).`);
    }
}
limparMensagensAntigas(90);

// ===== INICIAR =====
document.addEventListener('DOMContentLoaded',()=>{
    const lembrar = localStorage.getItem('stage_remember');
    if(lembrar){ document.getElementById('usuario').value=lembrar; document.getElementById('lembrar').checked=true; }
    if(sessao){ sessao.tipo==='admin'?mostrarAdmin():mostrarVendedor(); }
    document.addEventListener('keypress',e=>{ if(e.key==='Enter' && document.getElementById('loginScreen').style.display!=='none') fazerLogin(); });
});

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
            { id: 3, nome: "Cancelado", cor: "#ff4757" }
        ],
        ativacoes: [],
        metas: { diariaVendas: 10, quinzenalVendas: 75, mensalVendas: 150, produtos: [], instalacoes: [] },
        promocoes: [],
        notificacoes: [],
        chatMessages: []
    };
}

DB.promocoes = DB.promocoes || [];
DB.notificacoes = DB.notificacoes || [];
DB.ativacoes = DB.ativacoes || [];
DB.metas = DB.metas || { diariaVendas: 10, quinzenalVendas: 75, mensalVendas: 150, produtos: [], instalacoes: [] };
DB.metas.produtos = DB.metas.produtos || [];
DB.metas.instalacoes = DB.metas.instalacoes || [];
DB.chatMessages = DB.chatMessages || [];
DB.usuarios.forEach(u => { if (!u.categoria) u.categoria = u.tipo || 'vendedor'; if (!u.equipe) u.equipe = 'Geral'; });

function salvarDB() { localStorage.setItem('stage_db', JSON.stringify(DB)); }

let sessao = JSON.parse(localStorage.getItem('stage_session'));
let comparativoAtual = 'diario';
let graficoVendedoresInstance = null;
let vendaSendoVisualizada = null;
let novasVendas = true;

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
    verificarPromocoesAdmin();
    iniciarChat();
}
function mostrarVendedor() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'flex';
    document.getElementById('userInfoVendedor').innerHTML = `<div style="font-weight:700;font-size:15px;">${sessao.nome}</div><div style="font-size:11px;color:var(--primary-light);margin-top:3px;">💼 Vendedor</div><div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:3px;">${sessao.email}</div>`;
    carregarMeusClientes();
    verificarNotificacoesVendedor();
    iniciarChat();
}

// ===== DADOS DE VENDAS =====
function gerarDadosVendas() {
    const hoje = new Date(); const dataHoje = hoje.toISOString().split('T')[0];
    let vendas = JSON.parse(localStorage.getItem('vendas_diarias')) || [];
    if (!vendas.length || vendas[0]?.data !== dataHoje) {
        const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && u.ativo && !u.deletedAt);
        const planos = [{nome:'Básico',valor:299.9},{nome:'Empresarial',valor:499.9},{nome:'Premium',valor:899.9},{nome:'Ultra',valor:1499.9}];
        vendas = []; const num = Math.floor(Math.random()*8)+3;
        for (let i=0;i<num;i++) {
            const v = vendedores[Math.floor(Math.random()*vendedores.length)];
            const p = planos[Math.floor(Math.random()*planos.length)];
            vendas.push({id:Date.now()+i, vendedor_id:v.id, vendedor_nome:v.nome, plano:p.nome, valor:p.valor, data:dataHoje, hora:`${String(Math.floor(Math.random()*24)).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`});
        }
        localStorage.setItem('vendas_diarias', JSON.stringify(vendas));
    }
    return vendas;
}
function gerarVendasDiaPassado() {
    const hoje = new Date(); const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth()-1, hoje.getDate()); const data = mesPassado.toISOString().split('T')[0];
    let vendas = JSON.parse(localStorage.getItem('vendas_mes_passado_dia')) || [];
    if (!vendas.length || vendas[0]?.data !== data) {
        const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && u.ativo && !u.deletedAt);
        const planos = [{nome:'Básico',valor:299.9},{nome:'Empresarial',valor:499.9},{nome:'Premium',valor:899.9}];
        vendas = []; const num = Math.floor(Math.random()*6)+2;
        for (let i=0;i<num;i++) {
            const v = vendedores[Math.floor(Math.random()*vendedores.length)];
            const p = planos[Math.floor(Math.random()*planos.length)];
            vendas.push({id:Date.now()+i, vendedor_id:v.id, vendedor_nome:v.nome, plano:p.nome, valor:p.valor, data});
        }
        localStorage.setItem('vendas_mes_passado_dia', JSON.stringify(vendas));
    }
    return vendas;
}
function gerarVendasMesAtual() {
    const hoje = new Date(); const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
    let vendas = JSON.parse(localStorage.getItem('vendas_mes_atual')) || [];
    if (!vendas.length || !vendas[0]?.data.startsWith(mesAtual)) {
        const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && u.ativo && !u.deletedAt);
        const planos = [{nome:'Básico',valor:299.9},{nome:'Empresarial',valor:499.9},{nome:'Premium',valor:899.9}];
        vendas = []; const num = Math.floor(Math.random()*30)+15;
        for (let i=0;i<num;i++) {
            const v = vendedores[Math.floor(Math.random()*vendedores.length)];
            const p = planos[Math.floor(Math.random()*planos.length)];
            const dia = String(Math.floor(Math.random()*hoje.getDate())+1).padStart(2,'0');
            vendas.push({id:Date.now()+i, vendedor_id:v.id, vendedor_nome:v.nome, plano:p.nome, valor:p.valor, data:`${mesAtual}-${dia}`});
        }
        localStorage.setItem('vendas_mes_atual', JSON.stringify(vendas));
    }
    return vendas;
}
function gerarVendasMesAnterior() {
    const hoje = new Date(); const mesAnt = hoje.getMonth()===0?12:hoje.getMonth(); const anoAnt = hoje.getMonth()===0?hoje.getFullYear()-1:hoje.getFullYear();
    const mesKey = `${anoAnt}-${String(mesAnt).padStart(2,'0')}`;
    let vendas = JSON.parse(localStorage.getItem('vendas_mes_anterior')) || [];
    if (!vendas.length || !vendas[0]?.data.startsWith(mesKey)) {
        const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && u.ativo && !u.deletedAt);
        const planos = [{nome:'Básico',valor:299.9},{nome:'Empresarial',valor:499.9},{nome:'Premium',valor:899.9}];
        vendas = []; const num = Math.floor(Math.random()*25)+10;
        for (let i=0;i<num;i++) {
            const v = vendedores[Math.floor(Math.random()*vendedores.length)];
            const p = planos[Math.floor(Math.random()*planos.length)];
            const dia = String(Math.floor(Math.random()*28)+1).padStart(2,'0');
            vendas.push({id:Date.now()+i, vendedor_id:v.id, vendedor_nome:v.nome, plano:p.nome, valor:p.valor, data:`${mesKey}-${dia}`});
        }
        localStorage.setItem('vendas_mes_anterior', JSON.stringify(vendas));
    }
    return vendas;
}

// ===== DASHBOARD =====
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

// ===== CADASTRO DE USUÁRIOS =====
function mostrarFormCadastro(){document.getElementById('formCadastro').style.display='block';}
function cadastrarUsuario(){
    const n=document.getElementById('nomeUsuario').value.trim(), u=document.getElementById('usuarioUsuario').value.trim(), s=document.getElementById('senhaUsuario').value.trim(), e=document.getElementById('emailUsuario').value.trim(), cat=document.getElementById('categoriaUsuario').value;
    if(!n||!u||!s||!e) return alert('Preencha todos os campos!');
    if(DB.usuarios.find(x=>x.usuario===u && !x.deletedAt)) return alert('Usuário já existe!');
    DB.usuarios.push({id:DB.usuarios.length+1,usuario:u,senha:s,nome:n,email:e,tipo:cat,categoria:cat,ativo:true,deletedAt:null,equipe:cat==='admin'?'Gestão':'Geral'});
    salvarDB(); carregarUsuarios(); document.getElementById('formCadastro').style.display='none';
    ['nomeUsuario','usuarioUsuario','senhaUsuario','emailUsuario'].forEach(id=>document.getElementById(id).value='');
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
    if(!nome||!usuario||!email) return alert('Nome, usuário e email são obrigatórios.');
    const u=DB.usuarios.find(u=>u.id===id); if(!u) return;
    const conflito = DB.usuarios.find(u=>u.usuario===usuario && u.id!==id && !u.deletedAt);
    if(conflito) return alert('Usuário já existe.');
    u.nome=nome; u.usuario=usuario; u.email=email; u.categoria=categoria; u.tipo=categoria;
    if(novaSenha) u.senha=novaSenha;
    salvarDB(); carregarUsuarios(); fecharModalEditar();
}

// ===== LIXEIRA =====
function toggleLixeira(){ const l=document.getElementById('lixeiraUsuarios'); if(l.style.display==='none'||l.style.display===''){ carregarLixeira(); l.style.display='block'; } else l.style.display='none'; }
function carregarLixeira(){
    const agora = new Date();
    const lixeira = DB.usuarios.filter(u=>u.deletedAt);
    document.getElementById('contadorLixeira').textContent = lixeira.length;
    const tabela=document.getElementById('tabelaLixeira');
    if(!lixeira.length){ tabela.innerHTML='<tr><td colspan="6" style="text-align:center;padding:20px;">Lixeira vazia</td></tr>'; return; }
    tabela.innerHTML = lixeira.map(v=>{
        const dias = Math.ceil(15 - ((agora - new Date(v.deletedAt))/(1000*60*60*24)));
        return `<tr><td><strong>${v.nome}</strong></td><td>@${v.usuario}</td><td>${v.email}</td><td><span class="badge-cat">${v.categoria==='admin'?'👑 Admin':'💼 Vendedor'}</span></td><td><span style="color:#ffa502;">${dias} dia(s)</span></td><td><button onclick="recuperarUsuario(${v.id})" style="background:rgba(46,213,115,0.2);border:1px solid rgba(46,213,115,0.3);color:#2ed573;padding:6px 12px;border-radius:8px;cursor:pointer;"><i class="fas fa-undo"></i> Recuperar</button><button onclick="excluirPermanentemente(${v.id})" style="background:rgba(255,71,87,0.2);border:1px solid rgba(255,71,87,0.3);color:#ff4757;padding:6px 12px;border-radius:8px;cursor:pointer;margin-left:5px;"><i class="fas fa-times-circle"></i> Excluir definitivo</button></td></tr>`;
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
        return `<tr><td><strong>${a.nomeCliente}</strong></td><td>${a.produto}</td><td>${vendedor?vendedor.nome:'N/A'}</td><td><span style="color:${flag.cor};font-weight:600;">● ${a.status}</span></td><td><button onclick="abrirModalAtivacao(${a.id})" class="btn-glass-sm"><i class="fas fa-search"></i></button></td></tr>`;
    }).join('');
    if (DB.ativacoes.length > 0) {
        novasVendas = true;
        document.getElementById('balaoNovaVenda').style.display = 'flex';
    }
    filtrarAtivacoes();
}
function filtrarAtivacoes() {
    const termo = document.getElementById('buscaAtivacao').value.toLowerCase();
    const linhas = document.querySelectorAll('#tabelaAtivacoes tr');
    linhas.forEach(linha => { const texto = linha.textContent.toLowerCase(); linha.style.display = texto.includes(termo) ? '' : 'none'; });
}
function abrirModalAtivacao(id) {
    const a = DB.ativacoes.find(x => x.id === id);
    if (!a) return;
    vendaSendoVisualizada = id;
    document.getElementById('usuarioTratandoModal').textContent = sessao.nome;
    document.getElementById('balaoNovaVenda').style.display = 'none';
    novasVendas = false;
    const statusOptions = DB.statusFlags.map(f => `<option value="${f.nome}" ${a.status === f.nome ? 'selected' : ''}>${f.nome}</option>`).join('');
    document.getElementById('conteudoModalAtivacao').innerHTML = `...`; // (mantenha completo)
    document.getElementById('modalAtivacao').style.display = 'flex';
}
function fecharModalAtivacao() { document.getElementById('modalAtivacao').style.display = 'none'; vendaSendoVisualizada = null; }

// ===== GERENCIAR STATUS =====
function abrirGerenciadorStatus() { carregarListaStatusFlags(); document.getElementById('modalStatus').style.display = 'flex'; }
function fecharModalStatus() { document.getElementById('modalStatus').style.display = 'none'; }
function carregarListaStatusFlags() { /* ... */ }
function adicionarStatusFlag() { /* ... */ }
function removerStatusFlag(id) { /* ... */ }

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
function gerarVendasQuinzenaAtual() { /* ... */ }
function gerarVendasQuinzenaAnterior() { /* ... */ }
function carregarComparativoProdutos(atual, anterior, periodo) { /* ... */ }
function carregarVendasPorVendedor(atual, anterior) { /* ... */ }
function carregarVendasPorEquipe(atual, anterior) { /* ... */ }
function carregarRankingRelatorio(atual) { /* ... */ }

// ===== GERAR PDF =====
function gerarPDF() { /* ... */ }
function fecharModalPDF() { document.getElementById('modalPDF').style.display = 'none'; }

// ===== METAS =====
function carregarMetas() { /* ... */ }
function adicionarMetaProduto() { /* ... */ }
function removerMetaProduto(id) { /* ... */ }
function toggleMetaInstalacao() { /* ... */ }
function adicionarMetaInstalacao() { /* ... */ }
function carregarMetasInstalacoes() { /* ... */ }
function removerMetaInstalacao(id) { /* ... */ }
function salvarMetas() { /* ... */ }

// ===== PROMOÇÕES =====
function mostrarFormPromocao() { /* ... */ }
function cadastrarPromocao() { /* ... */ }
function carregarPromocoes() { /* ... */ }
function excluirPromocao(id) { /* ... */ }
function obterQuantidadePeriodo(vendedorId, tipo, inicio, fim) { /* ... */ }
function gerarVendasParaPeriodo(vendedorId, inicio, fim) { /* ... */ }
function gerarVendasParaData(data) { /* ... */ }
function verificarVencedoresPromocao(promocao) { /* ... */ }
function verificarPromocoesAdmin() { /* ... */ }
function mostrarModalParabens(mensagem) { /* ... */ }
function verificarNotificacoesVendedor() { /* ... */ }
setInterval(() => { if (sessao && sessao.tipo === 'admin') { const agora = new Date(); DB.promocoes.forEach(p => { if (p.ativa && new Date(p.fim) <= agora && !p.concluida) verificarVencedoresPromocao(p); }); } }, 30000);

// ===== NOTIFICAÇÃO TOAST =====
function mostrarNotificacao(mensagem) { /* ... */ }
function fecharToast() { /* ... */ }

// ===== SOM DE ALERTA =====
function tocarAlerta() { /* ... */ }

// ===== VENDEDOR SCREEN =====
function mostrarSecaoVendedor(e, secao) { /* ... */ }
function carregarMeusClientes(){ /* ... */ }
function carregarMinhasVendas(){ /* ... */ }
function cadastrarCliente(){ /* ... */ }

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
        if (chatConversationAtual && document.getElementById('chatMain').style.display === 'flex') {
            renderizarMensagensChat();
        } else {
            if (document.getElementById('chatSidebar').style.display !== 'none') atualizarListaConversas();
        }
    }, 5000);
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
    carregarUsuariosChat();
    atualizarListaConversas();
    atualizarBadge();
    iniciarPollingChat();
}

// ===== INICIAR =====
document.addEventListener('DOMContentLoaded',()=>{
    const lembrar = localStorage.getItem('stage_remember');
    if(lembrar){ document.getElementById('usuario').value=lembrar; document.getElementById('lembrar').checked=true; }
    if(sessao){ sessao.tipo==='admin'?mostrarAdmin():mostrarVendedor(); }
    document.addEventListener('keypress',e=>{ if(e.key==='Enter' && document.getElementById('loginScreen').style.display!=='none') fazerLogin(); });
});

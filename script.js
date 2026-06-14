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
        metas: {
            diariaVendas: 10, quinzenalVendas: 75, mensalVendas: 150,
            produtos: [],
            instalacoes: []
        },
        promocoes: [],
        notificacoes: []
    };
}

DB.promocoes = DB.promocoes || [];
DB.notificacoes = DB.notificacoes || [];
DB.ativacoes = DB.ativacoes || [];
DB.metas = DB.metas || { diariaVendas: 10, quinzenalVendas: 75, mensalVendas: 150, produtos: [], instalacoes: [] };
DB.metas.produtos = DB.metas.produtos || [];
DB.metas.instalacoes = DB.metas.instalacoes || [];
DB.usuarios.forEach(u => { if (!u.categoria) u.categoria = u.tipo || 'vendedor'; if (!u.equipe) u.equipe = 'Geral'; });

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
    verificarPromocoesAdmin();
}
function mostrarVendedor() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'flex';
    document.getElementById('userInfoVendedor').innerHTML = `<div style="font-weight:700;font-size:15px;">${sessao.nome}</div><div style="font-size:11px;color:var(--primary-light);margin-top:3px;">💼 Vendedor</div><div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:3px;">${sessao.email}</div>`;
    carregarMeusClientes();
    verificarNotificacoesVendedor();
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
    console.log('Mostrando seção:', secao);
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
    console.log('Carregando usuários...');
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
}
function abrirModalAtivacao(id) {
    const a = DB.ativacoes.find(x => x.id === id);
    if (!a) return;
    const statusOptions = DB.statusFlags.map(f => `<option value="${f.nome}" ${a.status === f.nome ? 'selected' : ''}>${f.nome}</option>`).join('');
    document.getElementById('conteudoModalAtivacao').innerHTML = `
        <div class="form-grid">
            <div class="input-group"><label>Observação</label><textarea id="editObservacao">${a.observacao||''}</textarea></div>
            <div class="input-group"><label>Status</label><select id="editStatus">${statusOptions}</select></div>
            <div class="input-group"><label>Ativado por</label><input value="${a.ativadoPor||''}" id="editAtivadoPor"></div>
            <div class="input-group"><label>Confirmado por</label><input value="${a.confirmadoPor||''}" id="editConfirmadoPor"></div>
            <div class="input-group"><label>Aquisição</label><input value="${a.aquisicao||''}" id="editAquisicao"></div>
            <div class="input-group"><label>Viabilidade</label><input value="${a.viabilidade||''}" id="editViabilidade"></div>
            <div class="input-group"><label>Data</label><input value="${a.data||''}" id="editData"></div>
            <div class="input-group"><label>Equipe</label><input value="${a.equipe||''}" id="editEquipe"></div>
            <div class="input-group"><label>Vendedor(a)</label><input value="${a.vendedorNome||''}" id="editVendedorNome"></div>
            <div class="input-group"><label>Nome Completo</label><input value="${a.nomeCompleto||''}" id="editNomeCompleto"></div>
            <div class="input-group"><label>Nome da Mãe</label><input value="${a.nomeMae||''}" id="editNomeMae"></div>
            <div class="input-group"><label>Data de Nascimento</label><input value="${a.dataNasc||''}" id="editDataNasc"></div>
            <div class="input-group"><label>CPF/CNPJ</label><input value="${a.cpfCnpj||''}" id="editCpfCnpj"></div>
            <div class="input-group"><label>Razão Social</label><input value="${a.razaoSocial||''}" id="editRazaoSocial"></div>
            <div class="input-group"><label>Email</label><input value="${a.email||''}" id="editEmail"></div>
            <div class="input-group"><label>CEP</label><input value="${a.cep||''}" id="editCep"></div>
            <div class="input-group"><label>UF</label><input value="${a.uf||''}" id="editUf"></div>
            <div class="input-group"><label>Endereço</label><input value="${a.endereco||''}" id="editEndereco"></div>
            <div class="input-group"><label>Bairro</label><input value="${a.bairro||''}" id="editBairro"></div>
            <div class="input-group"><label>Cidade</label><input value="${a.cidade||''}" id="editCidade"></div>
            <div class="input-group"><label>N° / Complemento</label><input value="${a.numeroComplemento||''}" id="editNumeroComplemento"></div>
            <div class="input-group"><label>Referência</label><input value="${a.referencia||''}" id="editReferencia"></div>
            <div class="input-group"><label>Telefone</label><input value="${a.telefone||''}" id="editTelefone"></div>
            <div class="input-group"><label>WhatsApp</label><input value="${a.whatsapp||''}" id="editWhatsapp"></div>
            <div class="input-group"><label>Valor</label><input value="${a.valor||''}" id="editValor"></div>
            <div class="input-group"><label>Velocidade</label><input value="${a.velocidade||''}" id="editVelocidade"></div>
            <div class="input-group"><label>Forma de Pagamento</label><input value="${a.formaPagamento||''}" id="editFormaPagamento"></div>
            <div class="input-group"><label>Vencimento</label><input value="${a.vencimento||''}" id="editVencimento"></div>
            <div class="input-group"><label>Data Instalação</label><input value="${a.dataInstalacao||''}" id="editDataInstalacao"></div>
            <div class="input-group"><label>Contrato</label><input value="${a.contrato||''}" id="editContrato"></div>
            <div class="input-group"><label>Tipo de Venda</label><input value="${a.tipoVenda||''}" id="editTipoVenda"></div>
            <div class="input-group"><label>Agendamento</label><input value="${a.agendamento||''}" id="editAgendamento"></div>
            <div class="input-group"><label>Plano</label><input value="${a.plano||''}" id="editPlano"></div>
            <div class="input-group"><label>Data Ag.</label><input value="${a.dataAg||''}" id="editDataAg"></div>
        </div>`;
    document.getElementById('modalAtivacao').style.display = 'flex';
}
function fecharModalAtivacao() { document.getElementById('modalAtivacao').style.display = 'none'; }

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
    console.log('Carregando relatórios...');
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
function gerarVendasQuinzenaAtual() { const hoje = new Date(); const dia = hoje.getDate(); const todas = gerarVendasMesAtual(); return dia <= 15 ? todas.filter(v => { const d = parseInt(v.data.split('-')[2]); return d >= 1 && d <= 15; }) : todas.filter(v => { const d = parseInt(v.data.split('-')[2]); return d >= 16; }); }
function gerarVendasQuinzenaAnterior() {
    const hoje = new Date(); const dia = hoje.getDate(); let vendas = [];
    if (dia <= 15) {
        const mesAnterior = hoje.getMonth() === 0 ? 12 : hoje.getMonth();
        const ano = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
        vendas = gerarVendasMesAnterior().filter(v => { const [y, m, d] = v.data.split('-').map(Number); return y === ano && m === mesAnterior && d >= 16; });
    } else { vendas = gerarVendasMesAtual().filter(v => { const d = parseInt(v.data.split('-')[2]); return d >= 1 && d <= 15; }); }
    if (vendas.length === 0) { const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && u.ativo && !u.deletedAt); const planos = [{nome:'Básico',valor:299.9},{nome:'Empresarial',valor:499.9},{nome:'Premium',valor:899.9}]; for (let i=0;i<Math.floor(Math.random()*12)+4;i++) { const v = vendedores[Math.floor(Math.random()*vendedores.length)]; const p = planos[Math.floor(Math.random()*planos.length)]; vendas.push({id:Date.now()+i, vendedor_id:v.id, vendedor_nome:v.nome, plano:p.nome, valor:p.valor, data:`2024-06-${String(Math.floor(Math.random()*15)+1).padStart(2,'0')}`}); } }
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
    if (periodo === 'diario') { dadosAtual = gerarDadosVendas(); dadosAnterior = gerarVendasDiaPassado(); }
    else if (periodo === 'quinzena') { dadosAtual = gerarVendasQuinzenaAtual(); dadosAnterior = gerarVendasQuinzenaAnterior(); }
    else { dadosAtual = gerarVendasMesAtual(); dadosAnterior = gerarVendasMesAnterior(); }
    let html = `<div class="relatorio-pdf"><h1>Relatório de Vendas - STAGE TELECOM</h1><p>Período: ${periodo} | Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>`;
    const produtos = ['Básico','Empresarial','Premium','Ultra'];
    html += `<h2>🏷️ Comparativo de Produtos</h2><table><tr><th>Produto</th><th>Período Atual</th><th>Período Anterior</th><th>Variação</th></tr>`;
    produtos.forEach(p => { const qtdAtual = dadosAtual.filter(v => v.plano === p).length; const qtdAnterior = dadosAnterior.filter(v => v.plano === p).length; const variacao = qtdAnterior > 0 ? (((qtdAtual - qtdAnterior) / qtdAnterior) * 100).toFixed(1) : (qtdAtual > 0 ? 100 : 0); html += `<tr><td><strong>${p}</strong></td><td>${qtdAtual}</td><td>${qtdAnterior}</td><td>${variacao >= 0 ? '+' + variacao : variacao}%</td></tr>`; });
    html += `</table>`;
    const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && !u.deletedAt);
    const dados = vendedores.map(v => ({ nome: v.nome, atual: dadosAtual.filter(vd => vd.vendedor_id === v.id).length, anterior: dadosAnterior.filter(vd => vd.vendedor_id === v.id).length })).sort((a,b) => b.atual - a.atual);
    html += `<h2>👥 Vendas por Vendedor</h2><table><tr><th>Vendedor</th><th>Atual</th><th>Anterior</th><th>% Variação</th></tr>`;
    dados.forEach(d => { const variacao = d.anterior > 0 ? (((d.atual - d.anterior) / d.anterior) * 100).toFixed(1) : (d.atual > 0 ? 100 : 0); html += `<tr><td>${d.nome}</td><td>${d.atual}</td><td>${d.anterior}</td><td>${variacao >= 0 ? '+' + variacao : variacao}%</td></tr>`; });
    html += `</table><div class="grafico-container"><canvas id="graficoPDF" width="500" height="250"></canvas></div>`;
    const equipes = {}; DB.usuarios.filter(u => u.tipo==='vendedor' && !u.deletedAt).forEach(u => { const eq = u.equipe || 'Sem equipe'; if (!equipes[eq]) equipes[eq] = { atual: 0, anterior: 0 }; });
    dadosAtual.forEach(v => { const user = DB.usuarios.find(u => u.id === v.vendedor_id); const eq = user?.equipe || 'Sem equipe'; if (equipes[eq]) equipes[eq].atual++; });
    dadosAnterior.forEach(v => { const user = DB.usuarios.find(u => u.id === v.vendedor_id); const eq = user?.equipe || 'Sem equipe'; if (equipes[eq]) equipes[eq].anterior++; });
    html += `<h2>🏢 Vendas por Equipe</h2><table><tr><th>Equipe</th><th>Atual</th><th>Anterior</th><th>% Variação</th></tr>`;
    Object.entries(equipes).forEach(([nome, valores]) => { const variacao = valores.anterior > 0 ? (((valores.atual - valores.anterior) / valores.anterior) * 100).toFixed(1) : (valores.atual > 0 ? 100 : 0); html += `<tr><td><strong>${nome}</strong></td><td>${valores.atual}</td><td>${valores.anterior}</td><td>${variacao >= 0 ? '+' + variacao : variacao}%</td></tr>`; });
    html += `</table>`;
    const ranking = dados.sort((a,b) => b.atual - a.atual);
    const maxVendas = ranking[0]?.atual || 1;
    html += `<h2>🏆 Ranking de Vendedores</h2>`;
    ranking.forEach((v, i) => { const pct = maxVendas > 0 ? (v.atual / maxVendas * 100).toFixed(0) : 0; html += `<div class="ranking-item-relatorio" style="display:flex; align-items:center; gap:10px; margin-bottom:5px;"><span style="font-size:20px;">${i+1}º</span><span style="flex:1;">${v.nome} - ${v.atual} vendas</span><div style="width:100px; height:8px; background:#eee; border-radius:4px; overflow:hidden;"><div style="width:${pct}%; height:100%; background:#e74c3c;"></div></div></div>`; });
    html += `</div>`;
    document.getElementById('conteudoPDF').innerHTML = html;
    document.getElementById('modalPDF').style.display = 'flex';
    setTimeout(() => {
        const ctx = document.getElementById('graficoPDF');
        if (ctx) { new Chart(ctx, { type: 'bar', data: { labels: dados.map(d => d.nome), datasets: [{ label: 'Vendas Atual', data: dados.map(d => d.atual), backgroundColor: '#e74c3c', borderRadius: 5 }, { label: 'Período Anterior', data: dados.map(d => d.anterior), backgroundColor: '#555', borderRadius: 5 }] }, options: { responsive: false, plugins: { legend: { labels: { color: '#000' } } }, scales: { y: { beginAtZero: true, ticks: { color: '#000' }, grid: { color: '#ccc' } }, x: { ticks: { color: '#000' }, grid: { display: false } } } } }); }
        setTimeout(() => { const elemento = document.getElementById('conteudoPDF'); html2pdf().set({ margin: 0.5, filename: `relatorio_${new Date().toISOString().slice(0,10)}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, backgroundColor: '#ffffff' }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } }).from(elemento).save(); }, 500);
    }, 100);
}
function fecharModalPDF() { document.getElementById('modalPDF').style.display = 'none'; }

// ===== METAS =====
function carregarMetas() {
    document.getElementById('metaDiariaVendas').value = DB.metas.diariaVendas || 10;
    document.getElementById('metaQuinzenalVendas').value = DB.metas.quinzenalVendas || 75;
    document.getElementById('metaMensalVendas').value = DB.metas.mensalVendas || 150;
    const tabelaProd = document.getElementById('tabelaMetasProdutos');
    tabelaProd.innerHTML = DB.metas.produtos.map(p => `<tr><td>${p.produto}</td><td>${p.diaria}</td><td>${p.quinzenal}</td><td>${p.mensal}</td><td><button onclick="removerMetaProduto(${p.id})" class="btn-glass-danger" style="padding:4px 10px; font-size:12px;"><i class="fas fa-trash"></i></button></td></tr>`).join('');
    carregarMetasInstalacoes();
    const selectVendedor = document.getElementById('vendedorMetaInstalacao');
    selectVendedor.innerHTML = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo && !u.deletedAt).map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
}
function adicionarMetaProduto() {
    const produto = document.getElementById('produtoMetaSelect').value;
    const diaria = parseInt(document.getElementById('produtoDiaria').value) || 0;
    const quinzenal = parseInt(document.getElementById('produtoQuinzenal').value) || 0;
    const mensal = parseInt(document.getElementById('produtoMensal').value) || 0;
    if (diaria <= 0 || quinzenal <= 0 || mensal <= 0) return alert('Valores inválidos');
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
    salvarDB();
    carregarPromocoes();
    document.getElementById('formPromocao').style.display = 'none';
    document.getElementById('premioPromocao').value = '';
    alert('✅ Promoção cadastrada!');
}
function carregarPromocoes() {
    console.log('Carregando promoções...');
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
    let vendas = JSON.parse(localStorage.getItem(`vendas_${data}`)) || [];
    if (!vendas.length) {
        const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && u.ativo && !u.deletedAt);
        const planos = [{nome:'Básico',valor:299.9},{nome:'Empresarial',valor:499.9},{nome:'Premium',valor:899.9},{nome:'Ultra',valor:1499.9}];
        const num = Math.floor(Math.random()*5)+1;
        for (let i=0;i<num;i++) { const v = vendedores[Math.floor(Math.random()*vendedores.length)]; const p = planos[Math.floor(Math.random()*planos.length)]; vendas.push({id:Date.now()+i, vendedor_id:v.id, vendedor_nome:v.nome, plano:p.nome, valor:p.valor, data}); }
        localStorage.setItem(`vendas_${data}`, JSON.stringify(vendas));
    }
    return vendas;
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

// ===== VENDEDOR SCREEN =====
function mostrarSecaoVendedor(secao){
    document.querySelectorAll('#vendedorScreen .section-active,#vendedorScreen .section-hidden').forEach(s=>{s.style.display='none';s.className='section-hidden';});
    const el=document.getElementById(`secao-${secao}`); if(el){el.style.display='block';el.className='section-active';}
    document.querySelectorAll('#vendedorScreen .nav-item').forEach(a=>a.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    document.getElementById('tituloSecaoVendedor').innerHTML = {meusClientes:'🏢 Meus Clientes',novoCliente:'➕ Novo Cliente',minhasVendas:'💰 Minhas Vendas'}[secao];
    if(secao==='meusClientes') carregarMeusClientes();
    if(secao==='minhasVendas') carregarMinhasVendas();
}
function carregarMeusClientes(){
    const meus=DB.clientes.filter(c=>c.vendedor_id===sessao.id);
    document.getElementById('totalMeusClientes').textContent=meus.length;
    document.getElementById('meusAtivos').textContent=meus.filter(c=>c.status==='ativo').length;
    document.getElementById('meusProspectos').textContent=meus.filter(c=>c.status==='prospecto').length;
    document.getElementById('tabelaMeusClientes').innerHTML = meus.length?meus.map(c=>`<tr><td><strong>${c.nome}</strong></td><td>${c.telefone}</td><td>${c.email}</td><td>${c.plano}</td><td>R$ ${c.valor.toFixed(2)}</td><td class="status-${c.status}">● ${c.status}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:30px;">Nenhum cliente</td></tr>';
}
function carregarMinhasVendas(){
    const minhas=DB.clientes.filter(c=>c.vendedor_id===sessao.id && c.status==='ativo');
    document.getElementById('tabelaMinhasVendas').innerHTML = minhas.length?minhas.map(c=>`<tr><td><strong>${c.nome}</strong></td><td>${c.plano}</td><td>R$ ${c.valor.toFixed(2)}</td><td>${new Date(c.data+'T00:00:00').toLocaleDateString('pt-BR')}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:30px;">Nenhuma venda</td></tr>';
}
function cadastrarCliente(){
    const n=document.getElementById('nomeCliente').value.trim(), cnpj=document.getElementById('cnpjCliente').value.trim(), tel=document.getElementById('telefoneCliente').value.trim(), email=document.getElementById('emailCliente').value.trim(), plano=document.getElementById('planoCliente').value;
    if(!n||!cnpj||!tel||!email||!plano) return alert('Preencha todos os campos!');
    const valores={Básico:299.9,Empresarial:499.9,Premium:899.9};
    DB.clientes.push({id:DB.clientes.length+1,nome:n,cnpj,telefone:tel,email,vendedor_id:sessao.id,status:'prospecto',plano,valor:valores[plano],data:new Date().toISOString().split('T')[0]});
    salvarDB(); ['nomeCliente','cnpjCliente','telefoneCliente','emailCliente'].forEach(id=>document.getElementById(id).value=''); document.getElementById('planoCliente').value='';
    alert('✅ Cliente cadastrado!'); mostrarSecaoVendedor('meusClientes');
}

// ===== INICIAR =====
document.addEventListener('DOMContentLoaded',()=>{
    const lembrar = localStorage.getItem('stage_remember');
    if(lembrar){ document.getElementById('usuario').value=lembrar; document.getElementById('lembrar').checked=true; }
    if(sessao){ sessao.tipo==='admin'?mostrarAdmin():mostrarVendedor(); }
    document.addEventListener('keypress',e=>{ if(e.key==='Enter' && document.getElementById('loginScreen').style.display!=='none') fazerLogin(); });
});

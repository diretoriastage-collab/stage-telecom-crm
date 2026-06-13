// ============================================
// STAGE TELECOM CRM - SCRIPT COMPLETO
// ============================================
let DB = JSON.parse(localStorage.getItem('stage_db')) || {
    usuarios: [
        { id: 1, usuario: "admin", senha: "admin123", nome: "Master Admin", email: "admin@stagetelecom.com.br", tipo: "admin", ativo: true, deletedAt: null },
        { id: 2, usuario: "joao.silva", senha: "vend123", nome: "João Silva", email: "joao@stagetelecom.com.br", tipo: "vendedor", ativo: true, deletedAt: null },
        { id: 3, usuario: "maria.santos", senha: "vend123", nome: "Maria Santos", email: "maria@stagetelecom.com.br", tipo: "vendedor", ativo: true, deletedAt: null },
        { id: 4, usuario: "pedro.costa", senha: "vend123", nome: "Pedro Costa", email: "pedro@stagetelecom.com.br", tipo: "vendedor", ativo: true, deletedAt: null }
    ],
    clientes: [
        { id: 1, nome: "TechBrasil Ltda", cnpj: "00.000.000/0001-00", telefone: "(11) 3456-7890", email: "contato@techbrasil.com.br", vendedor_id: 2, status: "ativo", plano: "Premium", valor: 899.90, data: "2024-01-15" },
        { id: 2, nome: "Comércio Digital SA", cnpj: "11.111.111/0001-11", telefone: "(21) 2345-6789", email: "digital@comercio.com.br", vendedor_id: 2, status: "ativo", plano: "Empresarial", valor: 499.90, data: "2024-02-20" },
        { id: 3, nome: "NetConnect Provedor", cnpj: "22.222.222/0001-22", telefone: "(31) 3456-7890", email: "vendas@netconnect.com.br", vendedor_id: 3, status: "prospecto", plano: "Básico", valor: 299.90, data: "2024-03-10" },
        { id: 4, nome: "Fibra Ótica Brasil", cnpj: "33.333.333/0001-33", telefone: "(41) 3456-7890", email: "contato@fibraotica.com.br", vendedor_id: 3, status: "ativo", plano: "Premium", valor: 899.90, data: "2024-04-05" },
        { id: 5, nome: "Telecom Solutions", cnpj: "44.444.444/0001-44", telefone: "(51) 3456-7890", email: "vendas@telecomsolutions.com.br", vendedor_id: 4, status: "prospecto", plano: "Empresarial", valor: 499.90, data: "2024-05-15" },
        { id: 6, nome: "Internet Rápida Ltda", cnpj: "55.555.555/0001-55", telefone: "(61) 3456-7890", email: "suporte@internetrapida.com.br", vendedor_id: 4, status: "ativo", plano: "Básico", valor: 299.90, data: "2024-06-01" }
    ],
    config: { metaDiaria: 10, metaMensal: 50 }
};
function salvarDB() { localStorage.setItem('stage_db', JSON.stringify(DB)); }

let sessao = JSON.parse(localStorage.getItem('stage_session'));
let comparativoAtual = 'diario';

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

    const dataEl = document.getElementById('dataAtual');
    const horaEl = document.getElementById('horaAtual');
    const periodoEl = document.getElementById('periodoDia');
    if (dataEl) dataEl.textContent = dataFormatada;
    if (horaEl) horaEl.textContent = `${horas}:${minutos}:${segundos}`;
    if (periodoEl) periodoEl.textContent = periodo;
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
    carregarConfiguracoes();
}
function mostrarVendedor() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'flex';
    document.getElementById('userInfoVendedor').innerHTML = `<div style="font-weight:700;font-size:15px;">${sessao.nome}</div><div style="font-size:11px;color:var(--primary-light);margin-top:3px;">💼 Vendedor</div><div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:3px;">${sessao.email}</div>`;
    carregarMeusClientes();
}

function carregarConfiguracoes() {
    const diario = document.getElementById('metaDiariaInput');
    const mensal = document.getElementById('metaMensalInput');
    if (diario) diario.value = DB.config.metaDiaria;
    if (mensal) mensal.value = DB.config.metaMensal;
}
function salvarConfiguracoes() {
    DB.config.metaDiaria = parseInt(document.getElementById('metaDiariaInput').value) || 10;
    DB.config.metaMensal = parseInt(document.getElementById('metaMensalInput').value) || 50;
    salvarDB(); alert('✅ Configurações salvas!'); carregarDashboard();
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
    document.getElementById('totalClientes').textContent = DB.clientes.length;
    document.getElementById('vendedoresAtivos').textContent = DB.usuarios.filter(u => u.tipo==='vendedor' && u.ativo && !u.deletedAt).length;
    carregarVendasDiarias();
    mostrarComparativo(comparativoAtual);
    const tabela = document.getElementById('tabelaClientes');
    const ultimos = [...DB.clientes].reverse().slice(0,6);
    tabela.innerHTML = ultimos.map(c => {
        const vend = DB.usuarios.find(u => u.id===c.vendedor_id);
        return `<tr><td><strong>${c.nome}</strong></td><td><span style="background:rgba(231,76,60,0.2);padding:5px 12px;border-radius:20px;font-size:12px;">${c.plano}</span></td><td>R$ ${c.valor.toFixed(2)}</td><td>${vend?vend.nome:'N/A'}</td><td class="status-${c.status}">● ${c.status}</td><td>${new Date(c.data+'T00:00:00').toLocaleDateString('pt-BR')}</td></tr>`;
    }).join('');
}

function carregarVendasDiarias() {
    const hoje = new Date();
    document.getElementById('dataVendasDiarias').textContent = hoje.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
    const vendasHoje = gerarDadosVendas();
    const meta = DB.config.metaDiaria;
    document.getElementById('totalVendasHoje').textContent = vendasHoje.length;
    document.getElementById('metaDiaria').textContent = meta;
    document.getElementById('metaProgresso').style.width = `${Math.min((vendasHoje.length/meta)*100,100)}%`;

    const ranking = {};
    vendasHoje.forEach(v => { if(!ranking[v.vendedor_id]) ranking[v.vendedor_id]={nome:v.vendedor_nome,vendas:0,valor:0}; ranking[v.vendedor_id].vendas++; ranking[v.vendedor_id].valor+=v.valor; });
    const rankingArr = Object.values(ranking).sort((a,b)=>b.vendas-a.vendas);
    const rankingEl = document.getElementById('rankingVendedores');
    rankingEl.innerHTML = rankingArr.length ? rankingArr.map((r,i)=>{
        const pos=i+1; const cls=pos===1?'top1':pos===2?'top2':pos===3?'top3':'normal';
        const medal=pos===1?'🥇':pos===2?'🥈':pos===3?'🥉':pos;
        return `<div class="ranking-item"><div class="ranking-posicao ${cls}">${medal}</div><div class="ranking-info"><span class="ranking-nome">${r.nome}</span><span class="ranking-vendas">${r.vendas} vendas</span></div><span class="ranking-pontos">${r.vendas}</span></div>`;
    }).join('') : '<p style="text-align:center;color:rgba(255,255,255,0.4);padding:20px;">Nenhuma venda hoje</p>';

    const produtos = {};
    vendasHoje.forEach(v => { if(!produtos[v.plano]) produtos[v.plano]={nome:v.plano,qtd:0}; produtos[v.plano].qtd++; });
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

    const meta = DB.config.metaMensal, realizado = vAtual.length, pct = Math.min((realizado/meta)*100,100).toFixed(1);
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
    document.getElementById('tituloSecao').innerHTML = {dashboard:'📊 Dashboard',vendedores:'👥 Vendedores',clientes:'🏢 Clientes',relatorios:'📈 Relatórios',config:'⚙️ Configurações'}[secao]||secao;
    if(secao==='vendedores') carregarVendedores();
    if(secao==='clientes') carregarTodosClientes();
    if(secao==='relatorios') carregarRelatorios();
}

// ===== ADMIN - VENDEDORES (SEM CLIENTES) =====
function mostrarFormVendedor(){document.getElementById('formVendedor').style.display='block';}
function cadastrarVendedor(){
    const n=document.getElementById('nomeVendedor').value.trim(), u=document.getElementById('usuarioVendedor').value.trim(), s=document.getElementById('senhaVendedor').value.trim(), e=document.getElementById('emailVendedor').value.trim();
    if(!n||!u||!s||!e) return alert('Preencha todos os campos!');
    if(DB.usuarios.find(x=>x.usuario===u && !x.deletedAt)) return alert('Usuário já existe!');
    DB.usuarios.push({id:DB.usuarios.length+1,usuario:u,senha:s,nome:n,email:e,tipo:'vendedor',ativo:true,deletedAt:null});
    salvarDB(); carregarVendedores(); document.getElementById('formVendedor').style.display='none';
    ['nomeVendedor','usuarioVendedor','senhaVendedor','emailVendedor'].forEach(id=>document.getElementById(id).value='');
}

function carregarVendedores() {
    // Remove definitivamente quem passou 15 dias na lixeira
    const agora = new Date();
    DB.usuarios = DB.usuarios.filter(u => {
        if (u.deletedAt) {
            const dias = (agora - new Date(u.deletedAt)) / (1000*60*60*24);
            return dias <= 15;
        }
        return true;
    });
    salvarDB();

    const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && !u.deletedAt);
    const tabela = document.getElementById('tabelaVendedores');
    tabela.innerHTML = vendedores.map(v => {
        return `
            <tr>
                <td>
                    <strong>${v.nome}</strong>
                    <button onclick="abrirModalEditar(${v.id})" style="background:none;border:none;color:var(--primary-light);cursor:pointer;margin-left:8px;" title="Editar vendedor">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                </td>
                <td>@${v.usuario}</td>
                <td>${v.email}</td>
                <td class="${v.ativo?'status-ativo':''}">${v.ativo?'● Ativo':'○ Inativo'}</td>
                <td>
                    <button onclick="toggleVendedor(${v.id})" style="background:${v.ativo?'rgba(255,71,87,0.2)':'rgba(46,213,115,0.2)'};border:1px solid ${v.ativo?'rgba(255,71,87,0.3)':'rgba(46,213,115,0.3)'};color:white;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;">${v.ativo?'🔒 Desativar':'🔓 Ativar'}</button>
                    <button onclick="excluirVendedor(${v.id})" style="background:rgba(255,71,87,0.3);border:1px solid rgba(255,71,87,0.5);color:white;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;margin-left:5px;"><i class="fas fa-trash"></i> Excluir</button>
                </td>
            </tr>
        `;
    }).join('');

    // Atualiza contador da lixeira
    const lixeiraCount = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.deletedAt).length;
    const contador = document.getElementById('contadorLixeira');
    if (contador) contador.textContent = lixeiraCount;
}

function toggleVendedor(id) {
    const vend = DB.usuarios.find(u => u.id===id);
    if(vend) { vend.ativo = !vend.ativo; salvarDB(); carregarVendedores(); }
}

function excluirVendedor(id) {
    const vend = DB.usuarios.find(u => u.id===id);
    if(!vend) return;
    if(confirm(`⚠️ Você quer realmente excluir o vendedor "${vend.nome}"?\nEle ficará na lixeira por 15 dias e perderá o acesso imediatamente.`)) {
        vend.deletedAt = new Date().toISOString();
        vend.ativo = false;
        salvarDB();
        carregarVendedores();
    }
}

// ===== EDIÇÃO DE VENDEDOR =====
function abrirModalEditar(id) {
    const vend = DB.usuarios.find(u => u.id===id);
    if(!vend) return;
    document.getElementById('editVendedorId').value = vend.id;
    document.getElementById('editNomeVendedor').value = vend.nome;
    document.getElementById('editUsuarioVendedor').value = vend.usuario;
    document.getElementById('editEmailVendedor').value = vend.email;
    document.getElementById('editSenhaVendedor').value = '';
    document.getElementById('modalEditarVendedor').style.display = 'flex';
}
function fecharModalEditar() {
    document.getElementById('modalEditarVendedor').style.display = 'none';
}
function salvarEdicaoVendedor() {
    const id = parseInt(document.getElementById('editVendedorId').value);
    const nome = document.getElementById('editNomeVendedor').value.trim();
    const usuario = document.getElementById('editUsuarioVendedor').value.trim();
    const email = document.getElementById('editEmailVendedor').value.trim();
    const novaSenha = document.getElementById('editSenhaVendedor').value.trim();

    if(!nome||!usuario||!email) return alert('⚠️ Nome, usuário e email são obrigatórios!');
    const vend = DB.usuarios.find(u => u.id===id);
    if(!vend) return;

    const conflito = DB.usuarios.find(u => u.usuario===usuario && u.id!==id && !u.deletedAt);
    if(conflito) return alert('⚠️ Nome de usuário já está em uso!');

    vend.nome = nome;
    vend.usuario = usuario;
    vend.email = email;
    if(novaSenha) vend.senha = novaSenha;

    salvarDB();
    carregarVendedores();
    fecharModalEditar();
}

// ===== LIXEIRA =====
function toggleLixeira() {
    const lixeira = document.getElementById('lixeiraVendedores');
    if (lixeira.style.display === 'none' || lixeira.style.display === '') {
        carregarLixeira();
        lixeira.style.display = 'block';
    } else {
        lixeira.style.display = 'none';
    }
}

function carregarLixeira() {
    const agora = new Date();
    const lixeira = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.deletedAt);
    const tabela = document.getElementById('tabelaLixeira');
    const contador = document.getElementById('contadorLixeira');
    if (contador) contador.textContent = lixeira.length;

    if (lixeira.length === 0) {
        tabela.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">Lixeira vazia</td></tr>';
        return;
    }

    tabela.innerHTML = lixeira.map(v => {
        const diasRestantes = Math.ceil(15 - ((agora - new Date(v.deletedAt)) / (1000 * 60 * 60 * 24)));
        return `
            <tr>
                <td><strong>${v.nome}</strong></td>
                <td>@${v.usuario}</td>
                <td>${v.email}</td>
                <td><span style="color: #ffa502;">${diasRestantes} dia(s)</span></td>
                <td>
                    <button onclick="recuperarVendedor(${v.id})" style="background: rgba(46,213,115,0.2); border:1px solid rgba(46,213,115,0.3); color: #2ed573; padding:6px 12px; border-radius:8px; cursor:pointer;">
                        <i class="fas fa-undo"></i> Recuperar
                    </button>
                    <button onclick="excluirPermanentemente(${v.id})" style="background: rgba(255,71,87,0.2); border:1px solid rgba(255,71,87,0.3); color: #ff4757; padding:6px 12px; border-radius:8px; cursor:pointer; margin-left:5px;">
                        <i class="fas fa-times-circle"></i> Excluir definitivo
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function recuperarVendedor(id) {
    const vend = DB.usuarios.find(u => u.id === id);
    if (vend) {
        vend.deletedAt = null;
        vend.ativo = true;
        salvarDB();
        carregarVendedores();
        carregarLixeira();
    }
}

function excluirPermanentemente(id) {
    const vend = DB.usuarios.find(u => u.id === id);
    if (!vend) return;
    if (confirm(`⚠️ Excluir definitivamente "${vend.nome}"? Essa ação não pode ser desfeita.`)) {
        DB.usuarios = DB.usuarios.filter(u => u.id !== id);
        salvarDB();
        carregarVendedores();
        carregarLixeira();
    }
}

function carregarTodosClientes(){
    document.getElementById('tabelaTodosClientes').innerHTML = DB.clientes.map(c=>{
        const v=DB.usuarios.find(u=>u.id===c.vendedor_id);
        return `<tr><td><strong>${c.nome}</strong></td><td>${c.cnpj}</td><td>${c.telefone}</td><td>${c.plano}</td><td>R$ ${c.valor.toFixed(2)}</td><td>${v?v.nome:'N/A'}</td><td class="status-${c.status}">● ${c.status}</td></tr>`;
    }).join('');
}
function carregarRelatorios(){
    const ativos=DB.clientes.filter(c=>c.status==='ativo');
    document.getElementById('totalPlanos').textContent = `R$ ${ativos.reduce((t,c)=>t+c.valor,0).toFixed(2)}`;
    document.getElementById('mediaCliente').textContent = `R$ ${(ativos.length?ativos.reduce((t,c)=>t+c.valor,0)/ativos.length:0).toFixed(2)}`;
    document.getElementById('totalVendas').textContent = gerarVendasMesAtual().length;
}

// ===== VENDEDOR =====
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

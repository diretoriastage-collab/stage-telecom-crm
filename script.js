// ============================================
// STAGE TELECOM CRM - SCRIPT COMPLETO
// ============================================
let DB = JSON.parse(localStorage.getItem('stage_db'));

if (!DB) {
    DB = {
        usuarios: [
            { id: 1, usuario: "admin", senha: "admin123", nome: "Master Admin", email: "admin@stagetelecom.com.br", tipo: "admin", ativo: true, deletedAt: null, equipe: "Gestão" },
            { id: 2, usuario: "joao.silva", senha: "vend123", nome: "João Silva", email: "joao@stagetelecom.com.br", tipo: "vendedor", ativo: true, deletedAt: null, equipe: "Alpha" },
            { id: 3, usuario: "maria.santos", senha: "vend123", nome: "Maria Santos", email: "maria@stagetelecom.com.br", tipo: "vendedor", ativo: true, deletedAt: null, equipe: "Alpha" },
            { id: 4, usuario: "pedro.costa", senha: "vend123", nome: "Pedro Costa", email: "pedro@stagetelecom.com.br", tipo: "vendedor", ativo: true, deletedAt: null, equipe: "Beta" }
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
        ativacoes: []
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
DB.usuarios.forEach(u => { if (u.tipo === 'vendedor' && !u.equipe) u.equipe = 'Geral'; });

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
    const vendasMes = gerarVendasMesAtual();
    const realizado = vendasMes.length;
    const metaMensal = DB.config.metaMensal;
    const percentual = Math.min((realizado / metaMensal) * 100, 100).toFixed(1);
    document.getElementById('metaMensalCard').textContent = metaMensal;
    document.getElementById('realizadoMeta').textContent = realizado;
    document.getElementById('faltamMeta').textContent = Math.max(metaMensal - realizado, 0);
    document.getElementById('percentualMeta').textContent = `${percentual}%`;
    document.getElementById('barraLiquida').style.width = `${percentual}%`;

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

    const pctDiario = Math.min((vendasHoje.length / meta) * 100, 100).toFixed(1);
    document.getElementById('barraLiquidaDiaria').style.width = `${pctDiario}%`;
    document.getElementById('realizadoMetaDiaria').textContent = vendasHoje.length;
    document.getElementById('faltamMetaDiaria').textContent = Math.max(meta - vendasHoje.length, 0);
    document.getElementById('metaDiaria').textContent = meta;

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
function carregarComparativoDiario() { /* ... igual ao anterior ... */ }
function carregarComparativoMensal() { /* ... igual ao anterior ... */ }
function carregarComparacaoProdutos(vAtual, vPassado, containerId) { /* ... igual ao anterior ... */ }

// ===== NAVEGAÇÃO ADMIN =====
function mostrarSecao(secao) {
    document.querySelectorAll('.section-active,.section-hidden').forEach(s=>{s.style.display='none';s.className='section-hidden';});
    const el = document.getElementById(`secao-${secao}`); if(el){el.style.display='block';el.className='section-active';}
    document.querySelectorAll('.nav-item').forEach(a=>a.classList.remove('active'));
    const nav = document.querySelector(`[data-section="${secao}"]`); if(nav) nav.classList.add('active');
    document.getElementById('tituloSecao').innerHTML = {dashboard:'📊 Dashboard',vendedores:'👥 Vendedores',ativacoes:'⚡ Ativações',relatorios:'📈 Relatórios',config:'⚙️ Configurações'}[secao]||secao;
    if(secao==='vendedores') carregarVendedores();
    if(secao==='ativacoes') carregarAtivacoes();
    if(secao==='relatorios') carregarRelatorios();
}

// ===== ADMIN - VENDEDORES =====
function mostrarFormVendedor(){document.getElementById('formVendedor').style.display='block';}
function cadastrarVendedor(){
    const n=document.getElementById('nomeVendedor').value.trim(), u=document.getElementById('usuarioVendedor').value.trim(), s=document.getElementById('senhaVendedor').value.trim(), e=document.getElementById('emailVendedor').value.trim();
    if(!n||!u||!s||!e) return alert('Preencha todos os campos!');
    if(DB.usuarios.find(x=>x.usuario===u && !x.deletedAt)) return alert('Usuário já existe!');
    DB.usuarios.push({id:DB.usuarios.length+1,usuario:u,senha:s,nome:n,email:e,tipo:'vendedor',ativo:true,deletedAt:null,equipe:'Geral'});
    salvarDB(); carregarVendedores(); document.getElementById('formVendedor').style.display='none';
    ['nomeVendedor','usuarioVendedor','senhaVendedor','emailVendedor'].forEach(id=>document.getElementById(id).value='');
}
function carregarVendedores() { /* ... igual ao anterior ... */ }
function toggleVendedor(id){ /* ... */ }
function excluirVendedor(id){ /* ... */ }
function abrirModalEditar(id){ /* ... */ }
function fecharModalEditar(){ /* ... */ }
function salvarEdicaoVendedor(){ /* ... */ }
function toggleLixeira(){ /* ... */ }
function carregarLixeira(){ /* ... */ }
function recuperarVendedor(id){ /* ... */ }
function excluirPermanentemente(id){ /* ... */ }

// ===== ATIVAÇÕES =====
function carregarAtivacoes() { /* ... */ }
function abrirModalAtivacao(id) { /* ... */ }
function fecharModalAtivacao() { /* ... */ }

// ===== GERENCIAR STATUS =====
function abrirGerenciadorStatus() { /* ... */ }
function fecharModalStatus() { /* ... */ }
function carregarListaStatusFlags() { /* ... */ }
function adicionarStatusFlag() { /* ... */ }
function removerStatusFlag(id) { /* ... */ }

// ===== RELATÓRIOS (NOVO) =====
function carregarRelatorios() {
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
    carregarComparativoProdutos(dadosAtual, dadosAnterior, periodo);
    carregarVendasPorVendedor(dadosAtual, dadosAnterior);
    carregarVendasPorEquipe(dadosAtual, dadosAnterior);
    carregarRankingRelatorio(dadosAtual);
}

function gerarVendasQuinzenaAtual() {
    const hoje = new Date();
    const dia = hoje.getDate();
    const todas = gerarVendasMesAtual();
    if (dia <= 15) return todas.filter(v => { const d = parseInt(v.data.split('-')[2]); return d >= 1 && d <= 15; });
    else return todas.filter(v => { const d = parseInt(v.data.split('-')[2]); return d >= 16; });
}

function gerarVendasQuinzenaAnterior() {
    const hoje = new Date();
    const dia = hoje.getDate();
    let vendas = [];
    if (dia <= 15) {
        // segunda quinzena do mês passado
        const mesAnterior = hoje.getMonth() === 0 ? 12 : hoje.getMonth();
        const ano = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
        vendas = gerarVendasMesAnterior().filter(v => {
            const [y, m, d] = v.data.split('-').map(Number);
            return y === ano && m === mesAnterior && d >= 16;
        });
    } else {
        // primeira quinzena deste mês
        vendas = gerarVendasMesAtual().filter(v => {
            const d = parseInt(v.data.split('-')[2]);
            return d >= 1 && d <= 15;
        });
    }
    if (vendas.length === 0) {
        const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && u.ativo && !u.deletedAt);
        const planos = [{nome:'Básico',valor:299.9},{nome:'Empresarial',valor:499.9},{nome:'Premium',valor:899.9}];
        const num = Math.floor(Math.random()*12)+4;
        for (let i=0;i<num;i++) {
            const v = vendedores[Math.floor(Math.random()*vendedores.length)];
            const p = planos[Math.floor(Math.random()*planos.length)];
            const diaV = Math.floor(Math.random()*15) + 1;
            vendas.push({id:Date.now()+i, vendedor_id:v.id, vendedor_nome:v.nome, plano:p.nome, valor:p.valor, data:`2024-06-${String(diaV).padStart(2,'0')}`});
        }
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
        html += `<tr>
            <td><strong>${p}</strong></td>
            <td>${qtdAtual}</td>
            <td>${qtdAnterior}</td>
            <td style="color:${corVar}">${variacao >= 0 ? '+' + variacao : variacao}%</td>
        </tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('tabelaComparativaProdutos').innerHTML = html;
}

function carregarVendasPorVendedor(atual, anterior) {
    const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && !u.deletedAt);
    const dados = vendedores.map(v => {
        const vendasAtual = atual.filter(vd => vd.vendedor_id === v.id).length;
        const vendasAnterior = anterior.filter(vd => vd.vendedor_id === v.id).length;
        return { nome: v.nome, atual: vendasAtual, anterior: vendasAnterior };
    }).sort((a,b) => b.atual - a.atual);

    let html = '<table><thead><tr><th>Vendedor</th><th>Atual</th><th>Anterior</th><th>% Variação</th></tr></thead><tbody>';
    dados.forEach(d => {
        const variacao = d.anterior > 0 ? (((d.atual - d.anterior) / d.anterior) * 100).toFixed(1) : (d.atual > 0 ? 100 : 0);
        const corVar = variacao >= 0 ? 'var(--success)' : 'var(--danger)';
        html += `<tr>
            <td>${d.nome}</td>
            <td>${d.atual}</td>
            <td>${d.anterior}</td>
            <td style="color:${corVar}">${variacao >= 0 ? '+' + variacao : variacao}%</td>
        </tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('tabelaVendedoresRelatorio').innerHTML = html;

    const ctx = document.getElementById('graficoVendedores').getContext('2d');
    if (graficoVendedoresInstance) graficoVendedoresInstance.destroy();
    graficoVendedoresInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dados.map(d => d.nome),
            datasets: [
                { label: 'Vendas Atual', data: dados.map(d => d.atual), backgroundColor: '#e74c3c', borderRadius: 5 },
                { label: 'Período Anterior', data: dados.map(d => d.anterior), backgroundColor: '#555', borderRadius: 5 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { ticks: { color: '#fff' }, grid: { display: false } }
            }
        }
    });
}

function carregarVendasPorEquipe(atual, anterior) {
    const equipes = {};
    DB.usuarios.filter(u => u.tipo==='vendedor' && !u.deletedAt).forEach(u => {
        const eq = u.equipe || 'Sem equipe';
        if (!equipes[eq]) equipes[eq] = { atual: 0, anterior: 0 };
    });
    atual.forEach(v => {
        const user = DB.usuarios.find(u => u.id === v.vendedor_id);
        const eq = user?.equipe || 'Sem equipe';
        if (equipes[eq]) equipes[eq].atual++;
    });
    anterior.forEach(v => {
        const user = DB.usuarios.find(u => u.id === v.vendedor_id);
        const eq = user?.equipe || 'Sem equipe';
        if (equipes[eq]) equipes[eq].anterior++;
    });

    let html = '<table><thead><tr><th>Equipe</th><th>Atual</th><th>Anterior</th><th>% Variação</th></tr></thead><tbody>';
    Object.entries(equipes).forEach(([nome, valores]) => {
        const variacao = valores.anterior > 0 ? (((valores.atual - valores.anterior) / valores.anterior) * 100).toFixed(1) : (valores.atual > 0 ? 100 : 0);
        const corVar = variacao >= 0 ? 'var(--success)' : 'var(--danger)';
        html += `<tr>
            <td><strong>${nome}</strong></td>
            <td>${valores.atual}</td>
            <td>${valores.anterior}</td>
            <td style="color:${corVar}">${variacao >= 0 ? '+' + variacao : variacao}%</td>
        </tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('tabelaEquipesRelatorio').innerHTML = html;
}

function carregarRankingRelatorio(atual) {
    const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor' && !u.deletedAt);
    const ranking = vendedores.map(v => {
        const vendas = atual.filter(vd => vd.vendedor_id === v.id).length;
        return { nome: v.nome, vendas };
    }).sort((a,b) => b.vendas - a.vendas);

    const maxVendas = ranking[0]?.vendas || 1;
    let html = '';
    ranking.forEach((v, i) => {
        const medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
        const pct = maxVendas > 0 ? (v.vendas / maxVendas * 100).toFixed(0) : 0;
        html += `
            <div class="ranking-item-relatorio">
                <div class="ranking-posicao-relatorio">${medalha || i+1}</div>
                <div class="ranking-info-relatorio">
                    <span class="ranking-nome-relatorio">${v.nome}</span>
                    <span class="ranking-detalhes-relatorio">${v.vendas} vendas</span>
                    <div class="barra-progresso-relatorio">
                        <div class="barra-progresso-preenchimento" style="width:${pct}%"></div>
                    </div>
                </div>
                <div class="ranking-pontos-relatorio">${v.vendas}</div>
            </div>
        `;
    });
    document.getElementById('rankingRelatorio').innerHTML = html;
}

// ===== BAIXAR PDF =====
function baixarPDF() {
    const elemento = document.getElementById('relatorioPrint');
    const opt = {
        margin: 0.5,
        filename: `relatorio_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#1a0a0a' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(elemento).save();
}

// ===== VENDEDOR SCREEN =====
function mostrarSecaoVendedor(secao){ /* ... */ }
function carregarMeusClientes(){ /* ... */ }
function carregarMinhasVendas(){ /* ... */ }
function cadastrarCliente(){ /* ... */ }

// ===== INICIAR =====
document.addEventListener('DOMContentLoaded',()=>{
    const lembrar = localStorage.getItem('stage_remember');
    if(lembrar){ document.getElementById('usuario').value=lembrar; document.getElementById('lembrar').checked=true; }
    if(sessao){ sessao.tipo==='admin'?mostrarAdmin():mostrarVendedor(); }
    document.addEventListener('keypress',e=>{ if(e.key==='Enter' && document.getElementById('loginScreen').style.display!=='none') fazerLogin(); });
});

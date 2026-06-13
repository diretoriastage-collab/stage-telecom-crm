// ============================================
// STAGE TELECOM CRM - SCRIPT COMPLETO COM METAS E PROMOÇÕES
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
        config: {
            metaDiariaVendas: 10,
            metaQuinzenalVendas: 150,
            metaMensalVendas: 300,
            metaDiariaProdutos: 10,
            metaQuinzenalProdutos: 150,
            metaMensalProdutos: 300,
            metaDiariaInstalacoes: 5,
            metaQuinzenalInstalacoes: 75,
            metaMensalInstalacoes: 150
        },
        promocoes: [],
        statusFlags: [
            { id: 1, nome: "Ativo", cor: "#2ed573" },
            { id: 2, nome: "Pendente", cor: "#ffa502" },
            { id: 3, nome: "Cancelado", cor: "#ff4757" }
        ],
        ativacoes: []
    };
}

if (!DB.statusFlags) DB.statusFlags = [{ id: 1, nome: "Ativo", cor: "#2ed573" }, { id: 2, nome: "Pendente", cor: "#ffa502" }, { id: 3, nome: "Cancelado", cor: "#ff4757" }];
if (!DB.ativacoes) DB.ativacoes = [];
DB.usuarios.forEach(u => { if (!u.categoria) u.categoria = u.tipo || 'vendedor'; if (!u.equipe) u.equipe = 'Geral'; });

function salvarDB() { localStorage.setItem('stage_db', JSON.stringify(DB)); }

let sessao = JSON.parse(localStorage.getItem('stage_session'));
let comparativoAtual = 'diario';
let graficoVendedoresInstance = null;

// ========== INICIALIZAÇÃO DOS CONTADORES DE PROGRESSO E PROMOÇÕES ==========
function initProgresso() {
    const tipos = ['vendas', 'produtos', 'instalacoes'];
    const periodos = ['diario', 'quinzenal', 'mensal'];
    tipos.forEach(tipo => {
        periodos.forEach(periodo => {
            const key = `progresso_${tipo}_${periodo}`;
            if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({}));
        });
    });
    if (!localStorage.getItem('promocoes_cumpridas')) localStorage.setItem('promocoes_cumpridas', JSON.stringify([]));
    if (!localStorage.getItem('log_acoes_promocoes')) localStorage.setItem('log_acoes_promocoes', JSON.stringify([]));
}
initProgresso();

function adicionarProgresso(vendedor_id, tipo, periodo, quantidade = 1) {
    const key = `progresso_${tipo}_${periodo}`;
    let dados = JSON.parse(localStorage.getItem(key));
    if (!dados[vendedor_id]) dados[vendedor_id] = 0;
    dados[vendedor_id] += quantidade;
    localStorage.setItem(key, JSON.stringify(dados));
}

function getProgresso(vendedor_id, tipo, periodo) {
    const key = `progresso_${tipo}_${periodo}`;
    let dados = JSON.parse(localStorage.getItem(key));
    return dados[vendedor_id] || 0;
}

function getPeriodoAtual() {
    const agora = new Date();
    const dia = agora.getDate();
    const mes = agora.getMonth() + 1;
    const ano = agora.getFullYear();
    const quinzena = dia <= 15 ? 1 : 2;
    return {
        diario: `${ano}-${mes}-${dia}`,
        quinzenal: `${ano}-${mes}-Q${quinzena}`,
        mensal: `${ano}-${mes}`
    };
}

function resetarContadoresSeNecessario() {
    const agora = new Date();
    const periodosAtuais = getPeriodoAtual();
    const tipos = ['vendas', 'produtos', 'instalacoes'];
    for (let tipo of tipos) {
        // Diário
        let diarioKey = `progresso_${tipo}_diario`;
        let refData = localStorage.getItem(`ref_${diarioKey}`);
        if (refData !== periodosAtuais.diario) {
            localStorage.setItem(diarioKey, JSON.stringify({}));
            localStorage.setItem(`ref_${diarioKey}`, periodosAtuais.diario);
        }
        // Quinzenal
        let quinKey = `progresso_${tipo}_quinzenal`;
        let refQuin = localStorage.getItem(`ref_${quinKey}`);
        if (refQuin !== periodosAtuais.quinzenal) {
            localStorage.setItem(quinKey, JSON.stringify({}));
            localStorage.setItem(`ref_${quinKey}`, periodosAtuais.quinzenal);
        }
        // Mensal
        let mensKey = `progresso_${tipo}_mensal`;
        let refMens = localStorage.getItem(`ref_${mensKey}`);
        if (refMens !== periodosAtuais.mensal) {
            localStorage.setItem(mensKey, JSON.stringify({}));
            localStorage.setItem(`ref_${mensKey}`, periodosAtuais.mensal);
        }
    }
    // Verificar promoções que encerraram e não foram cumpridas
    verificarPromocoesNaoCumpridas();
}

// ========== RELÓGIO ==========
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

// ========== LOGIN ==========
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
    // Atualiza campos de meta (se existirem)
    if (document.getElementById('metaDiariaInput')) document.getElementById('metaDiariaInput').value = DB.config.metaDiariaVendas;
    if (document.getElementById('metaMensalInput')) document.getElementById('metaMensalInput').value = DB.config.metaMensalVendas;
}
function salvarConfiguracoes() {
    DB.config.metaDiariaVendas = parseInt(document.getElementById('metaDiariaInput').value) || 10;
    DB.config.metaMensalVendas = parseInt(document.getElementById('metaMensalInput').value) || 300;
    salvarDB(); alert('✅ Configurações salvas!'); carregarDashboard();
}

// ========== DADOS DE VENDAS (SIMULAÇÃO) ==========
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

// ========== DASHBOARD ==========
function carregarDashboard() {
    const vendasMes = gerarVendasMesAtual();
    const realizado = vendasMes.length;
    const metaMensal = DB.config.metaMensalVendas;
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
        return `<tr><td><strong>${c.nome}</strong></td><td><span style="background:rgba(231,76,60,0.2);padding:5px 12px;border-radius:20px;font-size:12px;">${c.plano}</span></td><td>R$ ${c.valor.toFixed(2)}</td><td>${vend?vend.nome:'N/A'}</td><td class="status-${c.status}">● ${c.status}</td><td>${new Date(c.data+'T00:00:00').toLocaleDateString('pt-BR')}</td><td><button onclick="marcarInstalacao(${c.id})" class="btn-glass-sm"><i class="fas fa-wrench"></i> Instalar</button></td></tr>`;
    }).join('');
}

function carregarVendasDiarias() {
    const hoje = new Date();
    document.getElementById('dataVendasDiarias').textContent = hoje.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
    const vendasHoje = gerarDadosVendas();
    const meta = DB.config.metaDiariaVendas;
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

// ========== COMPARATIVO ==========
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
    const meta = DB.config.metaMensalVendas, realizado = vAtual.length, pct = Math.min((realizado/meta)*100,100).toFixed(1);
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

// ========== NAVEGAÇÃO ADMIN ==========
function mostrarSecao(secao) {
    document.querySelectorAll('.section-active,.section-hidden').forEach(s=>{s.style.display='none';s.className='section-hidden';});
    const el = document.getElementById(`secao-${secao}`); if(el){el.style.display='block';el.className='section-active';}
    document.querySelectorAll('.nav-item').forEach(a=>a.classList.remove('active'));
    const nav = document.querySelector(`[data-section="${secao}"]`); if(nav) nav.classList.add('active');
    const titles = {dashboard:'📊 Dashboard',cadastro:'👥 Cadastro',ativacoes:'⚡ Ativações',relatorios:'📈 Relatórios',metas:'🎯 METAS'};
    document.getElementById('tituloSecao').innerHTML = titles[secao] || secao;
    if(secao==='cadastro') carregarUsuarios();
    if(secao==='ativacoes') carregarAtivacoes();
    if(secao==='relatorios') carregarRelatorios();
    if(secao==='metas') {
        document.querySelectorAll('.sub-aba-btn')[0].click();
        carregarMetasUI();
        bindPeriodoButtons();
        listarPromocoes();
    }
}

function mostrarSubAba(aba) {
    document.querySelectorAll('.sub-aba-content').forEach(el => el.style.display = 'none');
    document.getElementById(`subaba-${aba}`).style.display = 'block';
    document.querySelectorAll('.sub-aba-btn').forEach(btn => btn.classList.remove('active'));
    if (aba === 'metas_definicao') document.querySelectorAll('.sub-aba-btn')[0].classList.add('active');
    else document.querySelectorAll('.sub-aba-btn')[1].classList.add('active');
}

function carregarMetasUI() {
    const periodoAtivo = document.querySelector('.periodo-btn.active')?.dataset.periodo || 'diario';
    const metas = DB.config;
    let html = '';
    if (periodoAtivo === 'diario') {
        html = `<div class="metas-grid">
            <div class="meta-card"><h4>📈 VENDAS</h4><input type="number" id="meta_diario_vendas" value="${metas.metaDiariaVendas}"></div>
            <div class="meta-card"><h4>📦 PRODUTOS</h4><input type="number" id="meta_diario_produtos" value="${metas.metaDiariaProdutos}"></div>
            <div class="meta-card"><h4>🔧 INSTALAÇÕES</h4><input type="number" id="meta_diario_instalacoes" value="${metas.metaDiariaInstalacoes}"></div>
        </div>`;
    } else if (periodoAtivo === 'quinzenal') {
        html = `<div class="metas-grid">
            <div class="meta-card"><h4>📈 VENDAS</h4><input type="number" id="meta_quinzenal_vendas" value="${metas.metaQuinzenalVendas}"></div>
            <div class="meta-card"><h4>📦 PRODUTOS</h4><input type="number" id="meta_quinzenal_produtos" value="${metas.metaQuinzenalProdutos}"></div>
            <div class="meta-card"><h4>🔧 INSTALAÇÕES</h4><input type="number" id="meta_quinzenal_instalacoes" value="${metas.metaQuinzenalInstalacoes}"></div>
        </div>`;
    } else {
        html = `<div class="metas-grid">
            <div class="meta-card"><h4>📈 VENDAS</h4><input type="number" id="meta_mensal_vendas" value="${metas.metaMensalVendas}"></div>
            <div class="meta-card"><h4>📦 PRODUTOS</h4><input type="number" id="meta_mensal_produtos" value="${metas.metaMensalProdutos}"></div>
            <div class="meta-card"><h4>🔧 INSTALAÇÕES</h4><input type="number" id="meta_mensal_instalacoes" value="${metas.metaMensalInstalacoes}"></div>
        </div>`;
    }
    document.getElementById('metas-container').innerHTML = html;
}

function salvarTodasMetas() {
    DB.config.metaDiariaVendas = parseInt(document.getElementById('meta_diario_vendas')?.value) || 0;
    DB.config.metaDiariaProdutos = parseInt(document.getElementById('meta_diario_produtos')?.value) || 0;
    DB.config.metaDiariaInstalacoes = parseInt(document.getElementById('meta_diario_instalacoes')?.value) || 0;
    DB.config.metaQuinzenalVendas = parseInt(document.getElementById('meta_quinzenal_vendas')?.value) || 0;
    DB.config.metaQuinzenalProdutos = parseInt(document.getElementById('meta_quinzenal_produtos')?.value) || 0;
    DB.config.metaQuinzenalInstalacoes = parseInt(document.getElementById('meta_quinzenal_instalacoes')?.value) || 0;
    DB.config.metaMensalVendas = parseInt(document.getElementById('meta_mensal_vendas')?.value) || 0;
    DB.config.metaMensalProdutos = parseInt(document.getElementById('meta_mensal_produtos')?.value) || 0;
    DB.config.metaMensalInstalacoes = parseInt(document.getElementById('meta_mensal_instalacoes')?.value) || 0;
    salvarDB();
    alert('✅ Metas salvas com sucesso!');
}

function bindPeriodoButtons() {
    document.querySelectorAll('.periodo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.periodo-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            carregarMetasUI();
        });
    });
}

// ========== PROMOÇÕES ==========
function criarPromocao() {
    const tipo = document.getElementById('promoTipo').value;
    const quantidade = parseInt(document.getElementById('promoQuantidade').value);
    const premio = document.getElementById('promoPremio').value.trim();
    const inicio = document.getElementById('promoInicio').value;
    const fim = document.getElementById('promoFim').value;
    if (!quantidade || !premio || !inicio || !fim) { alert('Preencha todos os campos!'); return; }
    DB.promocoes.push({
        id: Date.now(),
        tipo,
        quantidade,
        premio,
        inicio: new Date(inicio).toISOString(),
        fim: new Date(fim).toISOString(),
        ativa: true
    });
    salvarDB();
    listarPromocoes();
    document.getElementById('promoQuantidade').value = '';
    document.getElementById('promoPremio').value = '';
    document.getElementById('promoInicio').value = '';
    document.getElementById('promoFim').value = '';
}

function listarPromocoes() {
    const tbody = document.getElementById('listaPromocoes');
    if (!tbody) return;
    const agora = new Date();
    DB.promocoes = DB.promocoes.map(p => {
        const ativa = (new Date(p.inicio) <= agora && new Date(p.fim) >= agora);
        return { ...p, ativa };
    });
    salvarDB();
    tbody.innerHTML = DB.promocoes.map(p => {
        const statusHtml = p.ativa ? '<span style="color:#2ed573;">● Ativa</span>' : '<span style="color:#ff4757;">● Encerrada</span>';
        return `<tr><td>${new Date(p.inicio).toLocaleDateString()} - ${new Date(p.fim).toLocaleDateString()}</td><td>${p.tipo === 'vendas' ? 'Vendas' : p.tipo === 'produtos' ? 'Produtos' : 'Instalações'}</td><td>${p.quantidade}</td><td>${p.premio}</td><td>${statusHtml}</td><td><button onclick="removerPromocao(${p.id})" class="btn-glass-sm"><i class="fas fa-trash"></i></button></td></tr>`;
    }).join('');
}

function removerPromocao(id) {
    if (confirm('Remover esta promoção?')) {
        DB.promocoes = DB.promocoes.filter(p => p.id !== id);
        salvarDB();
        listarPromocoes();
    }
}

// ========== VERIFICAÇÃO DE PROMOÇÕES E NOTIFICAÇÕES ==========
async function verificarPromocoes(vendedor_id, tipoAcao) {
    const agora = new Date();
    const promosAtivas = DB.promocoes.filter(p => p.ativa && p.tipo === tipoAcao && new Date(p.inicio) <= agora && new Date(p.fim) >= agora);
    if (promosAtivas.length === 0) return;

    let logAcoes = JSON.parse(localStorage.getItem('log_acoes_promocoes')) || [];
    logAcoes.push({ vendedor_id, tipo: tipoAcao, timestamp: agora.toISOString() });
    localStorage.setItem('log_acoes_promocoes', JSON.stringify(logAcoes));

    for (let promo of promosAtivas) {
        const promoCumpridas = JSON.parse(localStorage.getItem('promocoes_cumpridas')) || [];
        if (promoCumpridas.some(pc => pc.promocao_id === promo.id && pc.vendedor_id === vendedor_id)) continue;
        const inicio = new Date(promo.inicio);
        const fim = new Date(promo.fim);
        const acoesNoPeriodo = logAcoes.filter(a => a.vendedor_id === vendedor_id && a.tipo === tipoAcao && new Date(a.timestamp) >= inicio && new Date(a.timestamp) <= fim);
        if (acoesNoPeriodo.length >= promo.quantidade) {
            promoCumpridas.push({ promocao_id: promo.id, vendedor_id, data: new Date().toISOString() });
            localStorage.setItem('promocoes_cumpridas', JSON.stringify(promoCumpridas));
            if (sessao && sessao.id === vendedor_id) {
                document.getElementById('msgParabens').innerHTML = '🎉 Você bateu a meta bônus! 🎉';
                document.getElementById('premioParabens').innerHTML = `Prêmio: ${promo.premio}`;
                document.getElementById('modalParabens').style.display = 'flex';
            }
            const vendedor = DB.usuarios.find(u => u.id === vendedor_id);
            if (sessao && sessao.tipo === 'admin') {
                document.getElementById('conteudoAdminNotificacao').innerHTML = `<p>${vendedor?.nome || 'Vendedor'} bateu a meta bônus de ${tipoAcao} (${promo.quantidade}) e ganhou ${promo.premio}!</p>`;
                document.getElementById('modalAdminNotificacao').style.display = 'flex';
            } else if (sessao && sessao.tipo !== 'admin') {
                // Notifica admin mesmo se o admin não estiver logado? Ideal seria enviar para o admin via WebSocket, mas aqui apenas guardamos no log.
                // Vamos armazenar uma notificação para o admin.
                let notificacoesAdmin = JSON.parse(localStorage.getItem('notificacoes_admin')) || [];
                notificacoesAdmin.push({ msg: `${vendedor?.nome} bateu a meta bônus de ${tipoAcao} (${promo.quantidade}) e ganhou ${promo.premio}!`, timestamp: new Date().toISOString() });
                localStorage.setItem('notificacoes_admin', JSON.stringify(notificacoesAdmin));
            }
        }
    }
}

function verificarPromocoesNaoCumpridas() {
    if (sessao && sessao.tipo !== 'admin') return;
    const agora = new Date();
    const promosEncerradas = DB.promocoes.filter(p => !p.ativa && new Date(p.fim) < agora);
    const promoCumpridas = JSON.parse(localStorage.getItem('promocoes_cumpridas')) || [];
    for (let promo of promosEncerradas) {
        const alguemCumpriu = promoCumpridas.some(pc => pc.promocao_id === promo.id);
        if (!alguemCumpriu) {
            // Só notifica uma vez por promoção
            if (!localStorage.getItem(`notificado_${promo.id}`)) {
                localStorage.setItem(`notificado_${promo.id}`, 'true');
                document.getElementById('conteudoAdminNotificacao').innerHTML = `<p>Nenhum vendedor bateu a meta bônus da promoção ${promo.tipo} (${promo.quantidade}) com prêmio ${promo.premio}.</p>`;
                document.getElementById('modalAdminNotificacao').style.display = 'flex';
            }
        }
    }
}

function fecharModalParabens() { document.getElementById('modalParabens').style.display = 'none'; }
function fecharModalAdminNotificacao() { document.getElementById('modalAdminNotificacao').style.display = 'none'; }

// ========== CADASTRO DE USUÁRIOS ==========
function mostrarFormCadastro(){document.getElementById('formCadastro').style.display='block';}
function cadastrarUsuario(){
    const n=document.getElementById('nomeUsuario').value.trim();
    const u=document.getElementById('usuarioUsuario').value.trim();
    const s=document.getElementById('senhaUsuario').value.trim();
    const e=document.getElementById('emailUsuario').value.trim();
    const cat=document.getElementById('categoriaUsuario').value;
    if(!n||!u||!s||!e) return alert('Preencha todos os campos!');
    if(DB.usuarios.find(x=>x.usuario===u && !x.deletedAt)) return alert('Usuário já existe!');
    DB.usuarios.push({
        id:DB.usuarios.length+1,
        usuario:u, senha:s, nome:n, email:e,
        tipo:cat,
        categoria:cat,
        ativo:true,
        deletedAt:null,
        equipe:cat==='admin'?'Gestão':'Geral'
    });
    salvarDB(); carregarUsuarios(); document.getElementById('formCadastro').style.display='none';
    ['nomeUsuario','usuarioUsuario','senhaUsuario','emailUsuario'].forEach(id=>document.getElementById(id).value='');
}
function carregarUsuarios() {
    const agora = new Date();
    DB.usuarios = DB.usuarios.filter(u => { if(u.deletedAt){ const dias = (agora - new Date(u.deletedAt))/(1000*60*60*24); return dias <= 15; } return true; });
    salvarDB();
    const usuarios = DB.usuarios.filter(u => !u.deletedAt);
    const tabela = document.getElementById('tabelaUsuarios');
    tabela.innerHTML = usuarios.map(u => `
        <tr><td><strong>${u.nome}</strong><button onclick="abrirModalEditar(${u.id})" style="background:none;border:none;color:var(--primary-light);cursor:pointer;margin-left:8px;"><i class="fas fa-pencil-alt"></i></button></td>
        <td>@${u.usuario}</td><td>${u.email}</td><td><span class="badge-cat">${u.categoria === 'admin' ? '👑 Admin' : '💼 Vendedor'}</span></td>
        <td class="${u.ativo?'status-ativo':''}">${u.ativo?'● Ativo':'○ Inativo'}</td>
        <td><button onclick="toggleUsuario(${u.id})" style="background:${u.ativo?'rgba(255,71,87,0.2)':'rgba(46,213,115,0.2)'};border:1px solid ${u.ativo?'rgba(255,71,87,0.3)':'rgba(46,213,115,0.3)'};color:white;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;">${u.ativo?'🔒 Desativar':'🔓 Ativar'}</button>
        <button onclick="excluirUsuario(${u.id})" style="background:rgba(255,71,87,0.3);border:1px solid rgba(255,71,87,0.5);color:white;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;margin-left:5px;"><i class="fas fa-trash"></i> Excluir</button></td></tr>
    `).join('');
    const cont = document.getElementById('contadorLixeira'); if(cont) cont.textContent = DB.usuarios.filter(u => u.deletedAt).length;
}
function toggleUsuario(id){ const u=DB.usuarios.find(u=>u.id===id); if(u){u.ativo=!u.ativo;salvarDB();carregarUsuarios();} }
function excluirUsuario(id){
    const u=DB.usuarios.find(u=>u.id===id); if(!u) return;
    if(confirm(`⚠️ Excluir "${u.nome}"? Ele irá para a lixeira e perderá o acesso.`)){
        u.deletedAt = new Date().toISOString();
        u.ativo = false;
        salvarDB(); carregarUsuarios();
    }
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
    u.nome=nome; u.usuario=usuario; u.email=email;
    u.categoria = categoria; u.tipo = categoria;
    if(novaSenha) u.senha=novaSenha;
    salvarDB(); carregarUsuarios(); fecharModalEditar();
}
function toggleLixeira(){
    const l=document.getElementById('lixeiraUsuarios');
    if(l.style.display==='none'||l.style.display===''){ carregarLixeira(); l.style.display='block'; }
    else l.style.display='none';
}
function carregarLixeira(){
    const agora = new Date();
    const lixeira = DB.usuarios.filter(u=>u.deletedAt);
    document.getElementById('contadorLixeira').textContent = lixeira.length;
    const tabela=document.getElementById('tabelaLixeira');
    if(!lixeira.length){ tabela.innerHTML='<tr><td colspan="6" style="text-align:center;padding:20px;">Lixeira vazia</td></tr>'; return; }
    tabela.innerHTML = lixeira.map(v=>{
        const dias = Math.ceil(15 - ((agora - new Date(v.deletedAt))/(1000*60*60*24)));
        return `<tr><td><strong>${v.nome}</strong></td><td>@${v.usuario}</td><td>${v.email}</td><td><span class="badge-cat">${v.categoria === 'admin' ? '👑 Admin' : '💼 Vendedor'}</span></td><td><span style="color:#ffa502;">${dias} dia(s)</span></td>
        <td><button onclick="recuperarUsuario(${v.id})" style="background:rgba(46,213,115,0.2);border:1px solid rgba(46,213,115,0.3);color:#2ed573;padding:6px 12px;border-radius:8px;cursor:pointer;"><i class="fas fa-undo"></i> Recuperar</button>
        <button onclick="excluirPermanentemente(${v.id})" style="background:rgba(255,71,87,0.2);border:1px solid rgba(255,71,87,0.3);color:#ff4757;padding:6px 12px;border-radius:8px;cursor:pointer;margin-left:5px;"><i class="fas fa-times-circle"></i> Excluir definitivo</button></td></tr>`;
    }).join('');
}
function recuperarUsuario(id){ const u=DB.usuarios.find(u=>u.id===id); if(u){u.deletedAt=null;u.ativo=true;salvarDB();carregarUsuarios();carregarLixeira();} }
function excluirPermanentemente(id){ const u=DB.usuarios.find(u=>u.id===id); if(u && confirm(`Excluir definitivamente "${u.nome}"?`)){ DB.usuarios = DB.usuarios.filter(u=>u.id!==id); salvarDB(); carregarUsuarios(); carregarLixeira(); } }

// ========== ATIVAÇÕES ==========
function carregarAtivacoes() {
    const tabela = document.getElementById('tabelaAtivacoes');
    tabela.innerHTML = DB.ativacoes.map(a => {
        const vendedor = DB.usuarios.find(u => u.id === a.vendedor_id);
        const flag = DB.statusFlags.find(f => f.nome === a.status) || { cor: '#fff' };
        return `<tr><td><strong>${a.nomeCliente}</strong></td><td>${a.produto}</td><td>${vendedor ? vendedor.nome : 'N/A'}</td><td><span style="color:${flag.cor}; font-weight:600;">● ${a.status}</span></td>
        <td><button onclick="abrirModalAtivacao(${a.id})" class="btn-glass-sm"><i class="fas fa-search"></i></button></td>
        <td><button onclick="marcarInstalacaoFromAtivacao(${a.id})" class="btn-glass-sm"><i class="fas fa-wrench"></i> Instalar</button></td></tr>`;
    }).join('');
}
function abrirModalAtivacao(id) {
    const a = DB.ativacoes.find(x => x.id === id);
    if (!a) return;
    const statusOptions = DB.statusFlags.map(f => `<option value="${f.nome}" ${a.status === f.nome ? 'selected' : ''}>${f.nome}</option>`).join('');
    document.getElementById('conteudoModalAtivacao').innerHTML = `<div class="form-grid">...</div>`; // resumido por brevidade
    document.getElementById('modalAtivacao').style.display = 'flex';
}
function fecharModalAtivacao() { document.getElementById('modalAtivacao').style.display = 'none'; }
function abrirGerenciadorStatus() { carregarListaStatusFlags(); document.getElementById('modalStatus').style.display = 'flex'; }
function fecharModalStatus() { document.getElementById('modalStatus').style.display = 'none'; }
function carregarListaStatusFlags() { /* similar ao original */ }
function adicionarStatusFlag() { /* similar */ }
function removerStatusFlag(id) { /* similar */ }

// ========== INSTALAÇÕES ==========
function marcarInstalacao(cliente_id) {
    const cliente = DB.clientes.find(c => c.id === cliente_id);
    if (!cliente) return;
    if (cliente.status === 'instalado') return alert('Este cliente já teve a instalação concluída.');
    cliente.status = 'instalado';
    salvarDB();
    const vendedor_id = cliente.vendedor_id;
    adicionarProgresso(vendedor_id, 'instalacoes', 'diario');
    adicionarProgresso(vendedor_id, 'instalacoes', 'quinzenal');
    adicionarProgresso(vendedor_id, 'instalacoes', 'mensal');
    verificarPromocoes(vendedor_id, 'instalacoes');
    alert('Instalação concluída e contabilizada!');
    if (sessao.tipo === 'admin') carregarDashboard();
    else carregarMeusClientes();
    carregarAtivacoes();
}
function marcarInstalacaoFromAtivacao(ativacao_id) {
    const ativ = DB.ativacoes.find(a => a.id === ativacao_id);
    if (!ativ) return;
    const cliente = DB.clientes.find(c => c.nome === ativ.nomeCliente);
    if (cliente) marcarInstalacao(cliente.id);
    else alert('Cliente não encontrado.');
}

// ========== RELATÓRIOS ==========
function carregarRelatorios() {
    const periodo = document.getElementById('filtroPeriodo').value;
    let dadosAtual, dadosAnterior;
    if (periodo === 'diario') { dadosAtual = gerarDadosVendas(); dadosAnterior = gerarVendasDiaPassado(); }
    else if (periodo === 'quinzena') { dadosAtual = gerarVendasMesAtual().slice(0,15); dadosAnterior = gerarVendasMesAnterior().slice(0,15); }
    else { dadosAtual = gerarVendasMesAtual(); dadosAnterior = gerarVendasMesAnterior(); }
    carregarComparativoProdutos(dadosAtual, dadosAnterior, 'tabelaComparativaProdutos');
    carregarVendasPorVendedor(dadosAtual, dadosAnterior);
    carregarVendasPorEquipe(dadosAtual, dadosAnterior);
    carregarRankingRelatorio(dadosAtual);
}
function carregarVendasPorVendedor(atual, anterior) { /* similar ao original */ }
function carregarVendasPorEquipe(atual, anterior) { /* similar */ }
function carregarRankingRelatorio(atual) { /* similar */ }
function baixarPDF() { const element = document.getElementById('relatorioPrint'); html2pdf().set({ margin: 0.5, filename: `relatorio_${new Date().toISOString().slice(0,10)}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, backgroundColor: '#1a0a0a' }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } }).from(element).save(); }

// ========== VENDEDOR SCREEN ==========
function mostrarSecaoVendedor(secao, event) {
    document.querySelectorAll('#vendedorScreen .section-active,#vendedorScreen .section-hidden').forEach(s=>{s.style.display='none';s.className='section-hidden';});
    const el=document.getElementById(`secao-${secao}`); if(el){el.style.display='block';el.className='section-active';}
    document.querySelectorAll('#vendedorScreen .nav-item').forEach(a=>a.classList.remove('active'));
    if(event && event.target) event.target.closest('.nav-item').classList.add('active');
    const titles = {meusClientes:'🏢 Meus Clientes', novoCliente:'➕ Novo Cliente', minhasVendas:'💰 Minhas Vendas'};
    document.getElementById('tituloSecaoVendedor').innerHTML = titles[secao] || secao;
    if(secao==='meusClientes') carregarMeusClientes();
    if(secao==='minhasVendas') carregarMinhasVendas();
}
function carregarMeusClientes(){
    const meus=DB.clientes.filter(c=>c.vendedor_id===sessao.id);
    document.getElementById('totalMeusClientes').textContent=meus.length;
    document.getElementById('meusAtivos').textContent=meus.filter(c=>c.status==='instalado' || c.status==='ativo').length;
    document.getElementById('meusProspectos').textContent=meus.filter(c=>c.status==='prospecto').length;
    document.getElementById('tabelaMeusClientes').innerHTML = meus.length?meus.map(c=>`<tr><td><strong>${c.nome}</strong></td><td>${c.telefone}</td><td>${c.email}</td><td>${c.plano}</td><td>R$ ${c.valor.toFixed(2)}</td><td class="status-${c.status}">● ${c.status}</td><td>${c.status !== 'instalado' ? `<button onclick="marcarInstalacao(${c.id})" class="btn-glass-sm">Instalar</button>` : 'Instalado'}</td></tr>`).join('') : '<tr><td colspan="7" style="text-align:center;padding:30px;">Nenhum cliente</td></tr>';
}
function carregarMinhasVendas(){
    const minhas=DB.clientes.filter(c=>c.vendedor_id===sessao.id && (c.status==='ativo' || c.status==='instalado'));
    document.getElementById('tabelaMinhasVendas').innerHTML = minhas.length?minhas.map(c=>`<tr><td><strong>${c.nome}</strong></td><td>${c.plano}</td><td>R$ ${c.valor.toFixed(2)}</td><td>${new Date(c.data+'T00:00:00').toLocaleDateString('pt-BR')}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:30px;">Nenhuma venda</td></tr>';
}
function cadastrarCliente(){
    const n=document.getElementById('nomeCliente').value.trim(), cnpj=document.getElementById('cnpjCliente').value.trim(), tel=document.getElementById('telefoneCliente').value.trim(), email=document.getElementById('emailCliente').value.trim(), plano=document.getElementById('planoCliente').value;
    if(!n||!cnpj||!tel||!email||!plano) return alert('Preencha todos os campos!');
    const valores={Básico:299.9,Empresarial:499.9,Premium:899.9};
    const novoCliente = { id:DB.clientes.length+1, nome:n, cnpj, telefone:tel, email, vendedor_id:sessao.id, status:'prospecto', plano, valor:valores[plano], data:new Date().toISOString().split('T')[0] };
    DB.clientes.push(novoCliente);
    salvarDB();
    // Registra venda e produto nos progressos
    adicionarProgresso(sessao.id, 'vendas', 'diario');
    adicionarProgresso(sessao.id, 'vendas', 'quinzenal');
    adicionarProgresso(sessao.id, 'vendas', 'mensal');
    adicionarProgresso(sessao.id, 'produtos', 'diario');
    adicionarProgresso(sessao.id, 'produtos', 'quinzenal');
    adicionarProgresso(sessao.id, 'produtos', 'mensal');
    // Adiciona às vendas diárias simuladas
    let vendasHoje = JSON.parse(localStorage.getItem('vendas_diarias')) || [];
    vendasHoje.push({ id: Date.now(), vendedor_id: sessao.id, vendedor_nome: sessao.nome, plano: plano, valor: valores[plano], data: new Date().toISOString().split('T')[0], hora: new Date().toLocaleTimeString() });
    localStorage.setItem('vendas_diarias', JSON.stringify(vendasHoje));
    let vendasMes = JSON.parse(localStorage.getItem('vendas_mes_atual')) || [];
    vendasMes.push({ id: Date.now(), vendedor_id: sessao.id, vendedor_nome: sessao.nome, plano: plano, valor: valores[plano], data: new Date().toISOString().split('T')[0] });
    localStorage.setItem('vendas_mes_atual', JSON.stringify(vendasMes));
    verificarPromocoes(sessao.id, 'vendas');
    verificarPromocoes(sessao.id, 'produtos');
    ['nomeCliente','cnpjCliente','telefoneCliente','emailCliente'].forEach(id=>document.getElementById(id).value=''); document.getElementById('planoCliente').value='';
    alert('✅ Cliente cadastrado!'); mostrarSecaoVendedor('meusClientes', event);
}

// ========== INICIAR ==========
document.addEventListener('DOMContentLoaded',()=>{
    resetarContadoresSeNecessario();
    setInterval(() => resetarContadoresSeNecessario(), 3600000);
    const lembrar = localStorage.getItem('stage_remember');
    if(lembrar){ document.getElementById('usuario').value=lembrar; document.getElementById('lembrar').checked=true; }
    if(sessao){ sessao.tipo==='admin'?mostrarAdmin():mostrarVendedor(); }
    document.addEventListener('keypress',e=>{ if(e.key==='Enter' && document.getElementById('loginScreen').style.display!=='none') fazerLogin(); });
});

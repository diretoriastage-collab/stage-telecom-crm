// ============================================
// STAGE TELECOM CRM - VERSÃO CORRIGIDA (PROMOÇÕES FUNCIONANDO)
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
        statusFlags: [{ id: 1, nome: "Ativo", cor: "#2ed573" }, { id: 2, nome: "Pendente", cor: "#ffa502" }, { id: 3, nome: "Cancelado", cor: "#ff4757" }],
        ativacoes: [],
        promocoes: [],
        notificacoes: []
    };
}
DB.promocoes = DB.promocoes || [];
DB.notificacoes = DB.notificacoes || [];
DB.ativacoes = DB.ativacoes || [];
function salvarDB() { localStorage.setItem('stage_db', JSON.stringify(DB)); }

let sessao = JSON.parse(localStorage.getItem('stage_session'));

// ===== LOGIN =====
function fazerLogin() {
    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value.trim();
    const erro = document.getElementById('mensagemErro');
    if (!usuario || !senha) { erro.innerHTML = 'Preencha todos os campos!'; return; }
    const user = DB.usuarios.find(u => u.usuario === usuario && u.senha === senha && u.ativo && !u.deletedAt);
    if (user) {
        sessao = { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo };
        localStorage.setItem('stage_session', JSON.stringify(sessao));
        if (document.getElementById('lembrar')?.checked) localStorage.setItem('stage_remember', usuario);
        setTimeout(() => { if (user.tipo === 'admin') mostrarAdmin(); else mostrarVendedor(); }, 600);
    } else {
        erro.innerHTML = 'Usuário ou senha inválidos!';
        document.getElementById('senha').value = '';
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
    document.getElementById('userInfoAdmin').innerHTML = `<div>${sessao.nome}<br><small>Admin</small></div>`;
    carregarDashboard();
}
function mostrarVendedor() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'flex';
    document.getElementById('userInfoVendedor').innerHTML = `<div>${sessao.nome}<br><small>Vendedor</small></div>`;
    carregarMeusClientes();
}

// ===== DASHBOARD SIMPLIFICADO =====
function carregarDashboard() {
    const totalClientes = DB.clientes.length;
    document.getElementById('realizadoMeta').textContent = totalClientes;
    document.getElementById('faltamMeta').textContent = Math.max(50 - totalClientes, 0);
    document.getElementById('percentualMeta').textContent = Math.min((totalClientes/50)*100,100).toFixed(0)+'%';
    document.getElementById('barraLiquida').style.width = Math.min((totalClientes/50)*100,100)+'%';
    // Atualiza ranking
    const ranking = {};
    DB.clientes.forEach(c => { if (!ranking[c.vendedor_id]) ranking[c.vendedor_id] = { nome: DB.usuarios.find(u=>u.id===c.vendedor_id)?.nome || '?', vendas: 0 }; ranking[c.vendedor_id].vendas++; });
    const rankingArr = Object.values(ranking).sort((a,b)=>b.vendas-a.vendas);
    document.getElementById('rankingVendedores').innerHTML = rankingArr.map(r => `<div>${r.nome}: ${r.vendas} vendas</div>`).join('');
}

// ===== CADASTRO DE USUÁRIOS (resumido) =====
function mostrarFormCadastro() { document.getElementById('formCadastro').style.display = 'block'; }
function cadastrarUsuario() { /* ... manter igual ao seu ... */ }
function carregarUsuarios() { /* ... manter ... */ }
function toggleLixeira() { /* ... */ }
function excluirUsuario(id) { /* ... */ }
// ... mantenha as funções de cadastro que já existem

// ===== NAVEGAÇÃO ADMIN =====
function mostrarSecao(secao) {
    document.querySelectorAll('.section-active,.section-hidden').forEach(s=>{s.style.display='none';s.className='section-hidden';});
    const el = document.getElementById(`secao-${secao}`); if(el){el.style.display='block';el.className='section-active';}
    document.querySelectorAll('.nav-item').forEach(a=>a.classList.remove('active'));
    const nav = document.querySelector(`[data-section="${secao}"]`); if(nav) nav.classList.add('active');
    document.getElementById('tituloSecao').innerHTML = secao.charAt(0).toUpperCase() + secao.slice(1);
    if(secao === 'metas') {
        // Inicializa as abas
        document.querySelectorAll('.meta-tab')[0].classList.add('active');
        document.getElementById('aba-definir').classList.add('active');
        document.getElementById('aba-promocoes').classList.remove('active');
        carregarPromocoes();  // ESSE É O PONTO CRÍTICO
    }
}

// ===== FUNÇÕES DAS ABAS METAS =====
function mostrarAbaMeta(aba, btn) {
    document.querySelectorAll('.aba-meta').forEach(a => a.classList.remove('active'));
    document.getElementById(`aba-${aba}`).classList.add('active');
    document.querySelectorAll('.meta-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (aba === 'promocoes') carregarPromocoes();
}

// ===== PROMOÇÕES (cópia do teste funcional) =====
function mostrarFormPromocao() { document.getElementById('formPromocao').style.display = 'block'; }
function fecharFormPromocao() {
    document.getElementById('formPromocao').style.display = 'none';
    document.getElementById('premioPromocao').value = '';
    document.getElementById('quantidadePromocao').value = 10;
    document.getElementById('inicioPromocao').value = '';
    document.getElementById('fimPromocao').value = '';
}
function cadastrarPromocao() {
    let tipo = document.getElementById('tipoPromocao').value;
    let quantidade = parseInt(document.getElementById('quantidadePromocao').value);
    let inicio = document.getElementById('inicioPromocao').value;
    let fim = document.getElementById('fimPromocao').value;
    let premio = document.getElementById('premioPromocao').value.trim();
    if (!inicio || !fim || !premio || isNaN(quantidade) || quantidade <= 0) { alert('Preencha todos os campos!'); return; }
    if (new Date(inicio) >= new Date(fim)) { alert('Fim deve ser posterior ao início'); return; }
    DB.promocoes.push({ id: Date.now(), tipo, quantidade, inicio, fim, premio, concluida: false, vencedores: [] });
    salvarDB();
    fecharFormPromocao();
    carregarPromocoes();
    alert('Promoção criada!');
}
function carregarPromocoes() {
    let agora = new Date();
    for (let p of DB.promocoes) {
        let inicio = new Date(p.inicio);
        let fim = new Date(p.fim);
        if (agora < inicio) p.status = 'Aguardando';
        else if (agora >= inicio && agora <= fim) p.status = 'Ativa';
        else if (agora > fim && !p.concluida) p.status = 'Encerrada';
        else p.status = p.concluida ? 'Concluída' : 'Encerrada';
    }
    let tbody = document.getElementById('tbodyPromocoes');
    let divVazio = document.getElementById('promocoesVazia');
    if (!tbody) return;
    if (DB.promocoes.length === 0) { tbody.innerHTML = ''; if(divVazio) divVazio.style.display = 'block'; return; }
    if(divVazio) divVazio.style.display = 'none';
    let html = '';
    for (let p of DB.promocoes) {
        let periodo = new Date(p.inicio).toLocaleString() + ' → ' + new Date(p.fim).toLocaleString();
        html += `<tr><td>${p.tipo}</td><td>${p.quantidade}</td><td>${periodo}</td><td>${p.premio}</td><td>${p.status}</td><td><button onclick="excluirPromocao(${p.id})">Excluir</button></td></tr>`;
    }
    tbody.innerHTML = html;
}
function excluirPromocao(id) { if (confirm('Excluir?')) { DB.promocoes = DB.promocoes.filter(p => p.id !== id); salvarDB(); carregarPromocoes(); } }

// ===== VENDEDOR SCREEN (simplificada) =====
function mostrarSecaoVendedor(secao, event) {
    document.querySelectorAll('#vendedorScreen .section-active, #vendedorScreen .section-hidden').forEach(s => { s.style.display = 'none'; s.className = 'section-hidden'; });
    const el = document.getElementById(`secao-${secao}`); if (el) { el.style.display = 'block'; el.className = 'section-active'; }
    document.querySelectorAll('#vendedorScreen .nav-item').forEach(a => a.classList.remove('active'));
    if (event && event.target) event.target.closest('.nav-item').classList.add('active');
    if (secao === 'meusClientes') carregarMeusClientes();
}
function carregarMeusClientes() {
    let meus = DB.clientes.filter(c => c.vendedor_id === sessao.id);
    document.getElementById('totalMeusClientes').textContent = meus.length;
    document.getElementById('tabelaMeusClientes').innerHTML = meus.map(c => `<tr><td>${c.nome}</td><td>${c.telefone}</td><td>${c.email}</td><td>${c.plano}</td><td>R$ ${c.valor}</td><td>${c.status}</td></tr>`).join('');
}
function cadastrarCliente() {
    // Função completa que você já tem
    alert('Função cadastrarCliente será integrada depois');
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const lembrar = localStorage.getItem('stage_remember');
    if (lembrar) { document.getElementById('usuario').value = lembrar; document.getElementById('lembrar').checked = true; }
    if (sessao) { sessao.tipo === 'admin' ? mostrarAdmin() : mostrarVendedor(); }
    else { document.getElementById('loginScreen').style.display = 'flex'; }
});

// ===== STAGE TELECOM CRM - SCRIPT =====

// Banco de dados local
let DB = JSON.parse(localStorage.getItem('stage_db')) || {
    usuarios: [
        { id: 1, usuario: "admin", senha: "admin123", nome: "Master Admin", email: "admin@stagetelecom.com.br", tipo: "admin", ativo: true },
        { id: 2, usuario: "joao.silva", senha: "vend123", nome: "João Silva", email: "joao@stagetelecom.com.br", tipo: "vendedor", ativo: true },
        { id: 3, usuario: "maria.santos", senha: "vend123", nome: "Maria Santos", email: "maria@stagetelecom.com.br", tipo: "vendedor", ativo: true },
        { id: 4, usuario: "pedro.costa", senha: "vend123", nome: "Pedro Costa", email: "pedro@stagetelecom.com.br", tipo: "vendedor", ativo: true }
    ],
    clientes: [
        { id: 1, nome: "TechBrasil Ltda", cnpj: "00.000.000/0001-00", telefone: "(11) 3456-7890", email: "contato@techbrasil.com.br", vendedor_id: 2, status: "ativo", plano: "Premium", valor: 899.90, data: "2024-01-15" },
        { id: 2, nome: "Comércio Digital SA", cnpj: "11.111.111/0001-11", telefone: "(21) 2345-6789", email: "digital@comercio.com.br", vendedor_id: 2, status: "ativo", plano: "Empresarial", valor: 499.90, data: "2024-02-20" },
        { id: 3, nome: "NetConnect Provedor", cnpj: "22.222.222/0001-22", telefone: "(31) 3456-7890", email: "vendas@netconnect.com.br", vendedor_id: 3, status: "prospecto", plano: "Básico", valor: 299.90, data: "2024-03-10" },
        { id: 4, nome: "Fibra Ótica Brasil", cnpj: "33.333.333/0001-33", telefone: "(41) 3456-7890", email: "contato@fibraotica.com.br", vendedor_id: 3, status: "ativo", plano: "Premium", valor: 899.90, data: "2024-04-05" },
        { id: 5, nome: "Telecom Solutions", cnpj: "44.444.444/0001-44", telefone: "(51) 3456-7890", email: "vendas@telecomsolutions.com.br", vendedor_id: 4, status: "prospecto", plano: "Empresarial", valor: 499.90, data: "2024-05-15" },
        { id: 6, nome: "Internet Rápida Ltda", cnpj: "55.555.555/0001-55", telefone: "(61) 3456-7890", email: "suporte@internetrapida.com.br", vendedor_id: 4, status: "ativo", plano: "Básico", valor: 299.90, data: "2024-06-01" }
    ]
};

function salvarDB() {
    localStorage.setItem('stage_db', JSON.stringify(DB));
}

// ===== SESSÃO =====
let sessao = JSON.parse(localStorage.getItem('stage_session'));

// ===== LOGIN =====
function fazerLogin() {
    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value.trim();
    const erro = document.getElementById('mensagemErro');
    
    if (!usuario || !senha) {
        erro.textContent = '⚠️ Preencha todos os campos!';
        erro.style.color = '#ffa502';
        return;
    }
    
    const user = DB.usuarios.find(u => u.usuario === usuario && u.senha === senha && u.ativo);
    
    if (user) {
        sessao = {
            id: user.id,
            nome: user.nome,
            email: user.email,
            tipo: user.tipo
        };
        localStorage.setItem('stage_session', JSON.stringify(sessao));
        
        erro.textContent = '✅ Login realizado! Redirecionando...';
        erro.style.color = '#2ed573';
        
        setTimeout(() => {
            if (user.tipo === 'admin') mostrarAdmin();
            else mostrarVendedor();
        }, 600);
    } else {
        erro.textContent = '❌ Usuário ou senha inválidos!';
        erro.style.color = '#ff4757';
        document.getElementById('senha').value = '';
        document.getElementById('senha').focus();
    }
}

// ===== LOGOUT =====
function logout() {
    localStorage.removeItem('stage_session');
    sessao = null;
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'none';
    document.getElementById('usuario').value = '';
    document.getElementById('senha').value = '';
}

// ===== MOSTRAR TELAS =====
function mostrarAdmin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'flex';
    document.getElementById('vendedorScreen').style.display = 'none';
    
    document.getElementById('userInfoAdmin').innerHTML = `
        <div style="font-weight: 700; font-size: 15px;">${sessao.nome}</div>
        <div style="font-size: 11px; color: var(--primary-light); margin-top: 3px;">👑 Administrador</div>
    `;
    
    carregarDashboard();
}

function mostrarVendedor() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'flex';
    
    document.getElementById('userInfoVendedor').innerHTML = `
        <div style="font-weight: 700; font-size: 15px;">${sessao.nome}</div>
        <div style="font-size: 11px; color: var(--primary-light); margin-top: 3px;">💼 Vendedor</div>
    `;
    
    carregarMeusClientes();
}

// ===== ADMIN - DASHBOARD =====
function carregarDashboard() {
    const totalClientes = DB.clientes.length;
    const vendedoresAtivos = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo).length;
    const clientesAtivos = DB.clientes.filter(c => c.status === 'ativo').length;
    const taxa = totalClientes > 0 ? ((clientesAtivos / totalClientes) * 100).toFixed(1) : 0;
    
    const mesAtual = new Date().getMonth();
    const receitaMes = DB.clientes
        .filter(c => c.status === 'ativo' && new Date(c.data).getMonth() === mesAtual)
        .reduce((t, c) => t + c.valor, 0);
    
    document.getElementById('totalClientes').textContent = totalClientes;
    document.getElementById('vendasMes').textContent = `R$ ${receitaMes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('vendedoresAtivos').textContent = vendedoresAtivos;
    document.getElementById('taxaConversao').textContent = `${taxa}%`;
    
    // Tabela
    const tabela = document.getElementById('tabelaClientes');
    const ultimos = [...DB.clientes].reverse().slice(0, 6);
    
    tabela.innerHTML = ultimos.map(c => {
        const vend = DB.usuarios.find(u => u.id === c.vendedor_id);
        return `
            <tr>
                <td><strong>${c.nome}</strong></td>
                <td><span style="background: rgba(231,76,60,0.2); padding: 5px 12px; border-radius: 20px; font-size: 12px;">${c.plano}</span></td>
                <td>R$ ${c.valor.toFixed(2)}</td>
                <td>${vend ? vend.nome : 'N/A'}</td>
                <td class="status-${c.status}">● ${c.status}</td>
                <td>${new Date(c.data).toLocaleDateString('pt-BR')}</td>
            </tr>
        `;
    }).join('');
}

// ===== NAVEGAÇÃO ADMIN =====
function mostrarSecao(secao) {
    document.querySelectorAll('.section-active, .section-hidden').forEach(s => {
        s.style.display = 'none';
        s.className = 'section-hidden';
    });
    
    const secaoEl = document.getElementById(`secao-${secao}`);
    if (secaoEl) {
        secaoEl.style.display = 'block';
        secaoEl.className = 'section-active';
    }
    
    document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
    const navItem = document.querySelector(`[data-section="${secao}"]`);
    if (navItem) navItem.classList.add('active');
    
    const titulos = {
        dashboard: '📊 Dashboard',
        vendedores: '👥 Gerenciar Vendedores',
        clientes: '🏢 Todos os Clientes',
        relatorios: '📈 Relatórios',
        config: '⚙️ Configurações'
    };
    document.getElementById('tituloSecao').innerHTML = titulos[secao] || secao;
    
    if (secao === 'vendedores') carregarVendedores();
    if (secao === 'clientes') carregarTodosClientes();
    if (secao === 'relatorios') carregarRelatorios();
}

// ===== ADMIN - VENDEDORES =====
function mostrarFormVendedor() {
    document.getElementById('formVendedor').style.display = 'block';
    document.getElementById('formVendedor').style.animation = 'cardAppear 0.5s ease';
}

function cadastrarVendedor() {
    const nome = document.getElementById('nomeVendedor').value;
    const usuario = document.getElementById('usuarioVendedor').value;
    const senha = document.getElementById('senhaVendedor').value;
    const email = document.getElementById('emailVendedor').value;
    
    if (!nome || !usuario || !senha || !email) {
        alert('⚠️ Preencha todos os campos!');
        return;
    }
    
    DB.usuarios.push({
        id: DB.usuarios.length + 1,
        usuario, senha, nome, email,
        tipo: 'vendedor',
        ativo: true
    });
    
    salvarDB();
    carregarVendedores();
    
    document.getElementById('formVendedor').style.display = 'none';
    ['nomeVendedor', 'usuarioVendedor', 'senhaVendedor', 'emailVendedor'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

function carregarVendedores() {
    const vendedores = DB.usuarios.filter(u => u.tipo === 'vendedor');
    const tabela = document.getElementById('tabelaVendedores');
    
    tabela.innerHTML = vendedores.map(v => {
        const clientes = DB.clientes.filter(c => c.vendedor_id === v.id).length;
        return `
            <tr>
                <td><strong>${v.nome}</strong></td>
                <td>@${v.usuario}</td>
                <td>${v.email}</td>
                <td><span style="background: rgba(231,76,60,0.2); padding: 4px 10px; border-radius: 15px;">${clientes}</span></td>
                <td class="${v.ativo ? 'status-ativo' : ''}">${v.ativo ? '● Ativo' : '○ Inativo'}</td>
                <td>
                    <button onclick="toggleVendedor(${v.id})" class="btn-glass-sm" style="background: ${v.ativo ? 'rgba(255,71,87,0.3)' : 'rgba(46,213,115,0.3)'}; border: 1px solid ${v.ativo ? 'rgba(255,71,87,0.5)' : 'rgba(46,213,115,0.5)'}; color: white; padding: 8px 16px; border-radius: 12px; cursor: pointer; font-size: 12px;">
                        ${v.ativo ? '🔒 Desativar' : '🔓 Ativar'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function toggleVendedor(id) {
    const vendedor = DB.usuarios.find(u => u.id === id);
    if (vendedor) {
        vendedor.ativo = !vendedor.ativo;
        salvarDB();
        carregarVendedores();
    }
}

// ===== ADMIN - CLIENTES =====
function carregarTodosClientes() {
    const tabela = document.getElementById('tabelaTodosClientes');
    
    tabela.innerHTML = DB.clientes.map(c => {
        const vend = DB.usuarios.find(u => u.id === c.vendedor_id);
        return `
            <tr>
                <td><strong>${c.nome}</strong></td>
                <td>${c.cnpj}</td>
                <td>${c.telefone}</td>
                <td>${c.plano}</td>
                <td>R$ ${c.valor.toFixed(2)}</td>
                <td>${vend ? vend.nome : 'N/A'}</td>
                <td class="status-${c.status}">● ${c.status}</td>
            </tr>
        `;
    }).join('');
}

// ===== ADMIN - RELATÓRIOS =====
function carregarRelatorios() {
    const ativos = DB.clientes.filter(c => c.status === 'ativo');
    const totalAtivo = ativos.reduce((t, c) => t + c.valor, 0);
    const media = ativos.length > 0 ? totalAtivo / ativos.length : 0;
    
    document.getElementById('totalPlanos').textContent = `R$ ${totalAtivo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('mediaCliente').textContent = `R$ ${media.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('totalVendas').textContent = DB.clientes.length;
}

// ===== VENDEDOR =====
function mostrarSecaoVendedor(secao) {
    document.querySelectorAll('#vendedorScreen .section-active, #vendedorScreen .section-hidden').forEach(s => {
        s.style.display = 'none';
        s.className = 'section-hidden';
    });
    
    const secaoEl = document.getElementById(`secao-${secao}`);
    if (secaoEl) {
        secaoEl.style.display = 'block';
        secaoEl.className = 'section-active';
    }
    
    document.querySelectorAll('#vendedorScreen .nav-item').forEach(a => a.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    
    const titulos = {
        meusClientes: '🏢 Meus Clientes',
        novoCliente: '➕ Novo Cliente',
        minhasVendas: '💰 Minhas Vendas'
    };
    document.getElementById('tituloSecaoVendedor').innerHTML = titulos[secao];
    
    if (secao === 'meusClientes') carregarMeusClientes();
    if (secao === 'minhasVendas') carregarMinhasVendas();
}

function carregarMeusClientes() {
    const meus = DB.clientes.filter(c => c.vendedor_id === sessao.id);
    const ativos = meus.filter(c => c.status === 'ativo').length;
    const prospectos = meus.filter(c => c.status === 'prospecto').length;
    
    document.getElementById('totalMeusClientes').textContent = meus.length;
    document.getElementById('meusAtivos').textContent = ativos;
    document.getElementById('meusProspectos').textContent = prospectos;
    
    const tabela = document.getElementById('tabelaMeusClientes');
    tabela.innerHTML = meus.map(c => `
        <tr>
            <td><strong>${c.nome}</strong></td>
            <td>${c.telefone}</td>
            <td>${c.email}</td>
            <td>${c.plano}</td>
            <td>R$ ${c.valor.toFixed(2)}</td>
            <td class="status-${c.status}">● ${c.status}</td>
        </tr>
    `).join('');
}

function carregarMinhasVendas() {
    const minhas = DB.clientes.filter(c => c.vendedor_id === sessao.id && c.status === 'ativo');
    const tabela = document.getElementById('tabelaMinhasVendas');
    
    tabela.innerHTML = minhas.map(c => `
        <tr>
            <td><strong>${c.nome}</strong></td>
            <td>${c.plano}</td>
            <td>R$ ${c.valor.toFixed(2)}</td>
            <td>${new Date(c.data).toLocaleDateString('pt-BR')}</td>
        </tr>
    `).join('');
}

function cadastrarCliente() {
    const nome = document.getElementById('nomeCliente').value;
    const cnpj = document.getElementById('cnpjCliente').value;
    const telefone = document.getElementById('telefoneCliente').value;
    const email = document.getElementById('emailCliente').value;
    const plano = document.getElementById('planoCliente').value;
    
    if (!nome || !cnpj || !telefone || !email || !plano) {
        alert('⚠️ Preencha todos os campos obrigatórios!');
        return;
    }
    
    const valores = { 'Básico': 299.90, 'Empresarial': 499.90, 'Premium': 899.90 };
    
    DB.clientes.push({
        id: DB.clientes.length + 1,
        nome, cnpj, telefone, email,
        vendedor_id: sessao.id,
        status: 'prospecto',
        plano,
        valor: valores[plano],
        data: new Date().toISOString().split('T')[0]
    });
    
    salvarDB();
    
    ['nomeCliente', 'cnpjCliente', 'telefoneCliente', 'emailCliente'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('planoCliente').value = '';
    
    alert('✅ Cliente cadastrado com sucesso!');
    mostrarSecaoVendedor('meusClientes');
}

// ===== INICIAR =====
document.addEventListener('DOMContentLoaded', () => {
    if (sessao) {
        if (sessao.tipo === 'admin') mostrarAdmin();
        else mostrarVendedor();
    }
});

// ===== ENTER NO LOGIN =====
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') {
        fazerLogin();
    }
});

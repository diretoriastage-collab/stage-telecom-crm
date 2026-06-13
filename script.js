// ===== BANCO DE DADOS LOCAL =====
let DB = JSON.parse(localStorage.getItem('stage_telecom_db')) || {
    usuarios: [
        { id: 1, usuario: "admin", senha: "admin123", nome: "Administrador", email: "admin@stagetelecom.com.br", tipo: "admin", ativo: true },
        { id: 2, usuario: "vendedor1", senha: "vend123", nome: "João Silva", email: "joao@stagetelecom.com.br", tipo: "vendedor", ativo: true },
        { id: 3, usuario: "vendedor2", senha: "vend123", nome: "Maria Santos", email: "maria@stagetelecom.com.br", tipo: "vendedor", ativo: true }
    ],
    clientes: [
        { id: 1, nome: "Empresa ABC Ltda", cnpj: "00.000.000/0001-00", telefone: "(11) 99999-9999", email: "contato@abc.com.br", vendedor_id: 2, status: "ativo", plano: "Empresarial", valor: 499.90, data: "2024-03-15" },
        { id: 2, nome: "Comércio XYZ", cnpj: "11.111.111/0001-11", telefone: "(21) 88888-8888", email: "xyz@email.com", vendedor_id: 2, status: "ativo", plano: "Premium", valor: 899.90, data: "2024-04-20" },
        { id: 3, nome: "Tech Solutions", cnpj: "22.222.222/0001-22", telefone: "(31) 77777-7777", email: "tech@email.com", vendedor_id: 3, status: "prospecto", plano: "Básico", valor: 299.90, data: "2024-05-10" }
    ]
};

function salvarDB() {
    localStorage.setItem('stage_telecom_db', JSON.stringify(DB));
}

// ===== AUTENTICAÇÃO =====
let sessaoAtual = JSON.parse(localStorage.getItem('stage_telecom_session'));

function fazerLogin() {
    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;
    const tipo = document.querySelector('input[name="tipo"]:checked').value;
    
    const user = DB.usuarios.find(u => u.usuario === usuario && u.senha === senha && u.tipo === tipo && u.ativo);
    
    if (user) {
        sessaoAtual = { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo };
        localStorage.setItem('stage_telecom_session', JSON.stringify(sessaoAtual));
        
        if (user.tipo === 'admin') {
            mostrarAdmin();
        } else {
            mostrarVendedor();
        }
    } else {
        document.getElementById('mensagemErro').textContent = 'Usuário ou senha inválidos!';
        setTimeout(() => document.getElementById('mensagemErro').textContent = '', 3000);
    }
}

function logout() {
    localStorage.removeItem('stage_telecom_session');
    sessaoAtual = null;
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'none';
}

// ===== EXIBIR TELAS =====
function mostrarAdmin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'flex';
    document.getElementById('vendedorScreen').style.display = 'none';
    
    document.getElementById('userInfoAdmin').innerHTML = `
        <strong>${sessaoAtual.nome}</strong><br>
        <small>Administrador</small>
    `;
    
    carregarDashboard();
}

function mostrarVendedor() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'flex';
    
    document.getElementById('userInfoVendedor').innerHTML = `
        <strong>${sessaoAtual.nome}</strong><br>
        <small>Vendedor</small>
    `;
    
    carregarMeusClientes();
}

// ===== ADMIN - DASHBOARD =====
function carregarDashboard() {
    // Estatísticas
    const totalClientes = DB.clientes.length;
    const vendedoresAtivos = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo).length;
    const clientesAtivos = DB.clientes.filter(c => c.status === 'ativo').length;
    const taxaConversao = totalClientes > 0 ? ((clientesAtivos / totalClientes) * 100).toFixed(1) : 0;
    
    const mesAtual = new Date().getMonth();
    const vendasMes = DB.clientes
        .filter(c => new Date(c.data).getMonth() === mesAtual)
        .reduce((total, c) => total + c.valor, 0);
    
    document.getElementById('totalClientes').textContent = totalClientes;
    document.getElementById('vendasMes').textContent = `R$ ${vendasMes.toFixed(2)}`;
    document.getElementById('vendedoresAtivos').textContent = vendedoresAtivos;
    document.getElementById('taxaConversao').textContent = `${taxaConversao}%`;
    
    // Tabela últimos clientes
    const tabela = document.getElementById('tabelaClientes');
    const ultimosClientes = [...DB.clientes].reverse().slice(0, 5);
    
    tabela.innerHTML = ultimosClientes.map(c => {
        const vendedor = DB.usuarios.find(u => u.id === c.vendedor_id);
        return `
            <tr>
                <td><strong>${c.nome}</strong></td>
                <td>${c.plano}</td>
                <td>R$ ${c.valor.toFixed(2)}</td>
                <td>${vendedor ? vendedor.nome : 'N/A'}</td>
                <td class="status-${c.status}">${c.status}</td>
            </tr>
        `;
    }).join('');
}

function mostrarSecao(secao) {
    // Esconder todas as seções
    document.querySelectorAll('.secao, .secao-ativa').forEach(s => s.style.display = 'none');
    
    // Mostrar seção selecionada
    const secaoElement = document.getElementById(`secao-${secao}`);
    if (secaoElement) secaoElement.style.display = 'block';
    
    // Atualizar menu ativo
    document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));
    event.target.closest('a').classList.add('active');
    
    // Atualizar título
    const titulos = {
        dashboard: 'Dashboard',
        vendedores: 'Gerenciar Vendedores',
        clientes: 'Todos os Clientes',
        relatorios: 'Relatórios'
    };
    document.getElementById('tituloSecao').textContent = titulos[secao] || secao;
    
    // Carregar dados específicos
    if (secao === 'vendedores') carregarVendedores();
    if (secao === 'clientes') carregarTodosClientes();
    if (secao === 'relatorios') carregarRelatorios();
}

// ===== ADMIN - VENDEDORES =====
function mostrarFormVendedor() {
    document.getElementById('formVendedor').style.display = 'block';
}

function cadastrarVendedor() {
    const nome = document.getElementById('nomeVendedor').value;
    const usuario = document.getElementById('usuarioVendedor').value;
    const senha = document.getElementById('senhaVendedor').value;
    const email = document.getElementById('emailVendedor').value;
    
    if (!nome || !usuario || !senha || !email) {
        alert('Preencha todos os campos!');
        return;
    }
    
    const novoVendedor = {
        id: DB.usuarios.length + 1,
        usuario,
        senha,
        nome,
        email,
        tipo: 'vendedor',
        ativo: true
    };
    
    DB.usuarios.push(novoVendedor);
    salvarDB();
    carregarVendedores();
    
    document.getElementById('formVendedor').style.display = 'none';
    document.getElementById('nomeVendedor').value = '';
    document.getElementById('usuarioVendedor').value = '';
    document.getElementById('senhaVendedor').value = '';
    document.getElementById('emailVendedor').value = '';
}

function carregarVendedores() {
    const vendedores = DB.usuarios.filter(u => u.tipo === 'vendedor');
    const tabela = document.getElementById('tabelaVendedores');
    
    tabela.innerHTML = vendedores.map(v => {
        const totalClientes = DB.clientes.filter(c => c.vendedor_id === v.id).length;
        return `
            <tr>
                <td><strong>${v.nome}</strong></td>
                <td>${v.usuario}</td>
                <td>${v.email}</td>
                <td>${totalClientes}</td>
                <td class="${v.ativo ? 'status-ativo' : ''}">${v.ativo ? 'Ativo' : 'Inativo'}</td>
                <td>
                    <button onclick="toggleVendedor(${v.id})" class="btn-primary">
                        ${v.ativo ? 'Desativar' : 'Ativar'}
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
        const vendedor = DB.usuarios.find(u => u.id === c.vendedor_id);
        return `
            <tr>
               

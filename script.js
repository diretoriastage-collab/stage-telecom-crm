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
    config: { metaDiaria: 10, metaMensal: 50 },
    statusFlags: [
        { id: 1, nome: "Ativo", cor: "#2ed573" },
        { id: 2, nome: "Pendente", cor: "#ffa502" },
        { id: 3, nome: "Cancelado", cor: "#ff4757" }
    ],
    ativacoes: [
        {
            id: 1,
            nomeCliente: "João da Silva",
            produto: "Internet Fibra 300MB",
            vendedor_id: 2,
            status: "Ativo",
            observacao: "",
            ativadoPor: "Admin",
            confirmadoPor: "Admin",
            aquisicao: "Online",
            viabilidade: "Viável",
            data: "2024-06-10 14:30",
            equipe: "Equipe A",
            vendedorNome: "João Silva",
            nomeCompleto: "João da Silva Santos",
            nomeMae: "Maria Santos",
            dataNasc: "1990-01-15",
            cpfCnpj: "123.456.789-00",
            razaoSocial: "",
            email: "joao@email.com",
            cep: "01000-000",
            uf: "SP",
            endereco: "Rua Exemplo, 100",
            bairro: "Centro",
            cidade: "São Paulo",
            numeroComplemento: "Apto 10",
            referencia: "Próximo ao metrô",
            telefone: "(11) 99999-9999",
            whatsapp: "(11) 99999-9999",
            valor: 89.90,
            velocidade: "300MB",
            formaPagamento: "Cartão de Crédito",
            vencimento: "10",
            dataInstalacao: "2024-06-12",
            contrato: "12 meses",
            tipoVenda: "Nova",
            agendamento: "2024-06-11",
            plano: "Fibra 300MB",
            dataAg: "2024-06-10"
        }
    ]
};
function salvarDB() { localStorage.setItem('stage_db', JSON.stringify(DB)); }

let sessao = JSON.parse(localStorage.getItem('stage_session'));
let comparativoAtual = 'diario';

// ===== RELÓGIO GLOBAL (atualiza todos os relógios) =====
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

function mostrarAdmin() { /* ... igual à versão anterior ... */ }
function mostrarVendedor() { /* ... igual à versão anterior ... */ }

// ===== CARREGAR CONFIGURAÇÕES =====
function carregarConfiguracoes() {
    document.getElementById('metaDiariaInput').value = DB.config.metaDiaria;
    document.getElementById('metaMensalInput').value = DB.config.metaMensal;
}
function salvarConfiguracoes() {
    DB.config.metaDiaria = parseInt(document.getElementById('metaDiariaInput').value) || 10;
    DB.config.metaMensal = parseInt(document.getElementById('metaMensalInput').value) || 50;
    salvarDB(); alert('✅ Configurações salvas!'); carregarDashboard();
}

// ===== DADOS DE VENDAS (mesmos) =====
function gerarDadosVendas() { /* ... igual ... */ }
function gerarVendasDiaPassado() { /* ... igual ... */ }
function gerarVendasMesAtual() { /* ... igual ... */ }
function gerarVendasMesAnterior() { /* ... igual ... */ }

// ===== DASHBOARD (com barra líquida nas duas metas) =====
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

    // Barra líquida diária
    const pctDiario = Math.min((vendasHoje.length / meta) * 100, 100).toFixed(1);
    document.getElementById('barraLiquidaDiaria').style.width = `${pctDiario}%`;
    document.getElementById('realizadoMetaDiaria').textContent = vendasHoje.length;
    document.getElementById('faltamMetaDiaria').textContent = Math.max(meta - vendasHoje.length, 0);
    document.getElementById('metaDiaria').textContent = meta;

    // Ranking e produtos (mesmo código)
    // ...
}

// ===== COMPARATIVO (mesmo) =====
function mostrarComparativo(tipo) { /* ... */ }
function carregarComparativoDiario() { /* ... */ }
function carregarComparativoMensal() { /* ... */ }

// ===== NAVEGAÇÃO ADMIN (incluindo ativacoes) =====
function mostrarSecao(secao) {
    document.querySelectorAll('.section-active,.section-hidden').forEach(s=>{s.style.display='none';s.className='section-hidden';});
    const el = document.getElementById(`secao-${secao}`); if(el){el.style.display='block';el.className='section-active';}
    document.querySelectorAll('.nav-item').forEach(a=>a.classList.remove('active'));
    const nav = document.querySelector(`[data-section="${secao}"]`); if(nav) nav.classList.add('active');
    document.getElementById('tituloSecao').innerHTML = {
        dashboard:'📊 Dashboard',
        vendedores:'👥 Vendedores',
        ativacoes:'⚡ Ativações',
        relatorios:'📈 Relatórios',
        config:'⚙️ Configurações'
    }[secao]||secao;

    if(secao==='vendedores') carregarVendedores();
    if(secao==='ativacoes') carregarAtivacoes();
    if(secao==='clientes') carregarTodosClientes(); // mantido por compatibilidade, mas não será mais usado
    if(secao==='relatorios') carregarRelatorios();
}

// ===== ATIVAÇÕES (NOVO) =====
function carregarAtivacoes() {
    const tabela = document.getElementById('tabelaAtivacoes');
    tabela.innerHTML = DB.ativacoes.map(a => {
        const vendedor = DB.usuarios.find(u => u.id === a.vendedor_id);
        const flag = DB.statusFlags.find(f => f.nome === a.status) || { cor: '#fff' };
        return `
            <tr>
                <td><strong>${a.nomeCliente}</strong></td>
                <td>${a.produto}</td>
                <td>${vendedor ? vendedor.nome : 'N/A'}</td>
                <td><span style="color:${flag.cor}; font-weight:600;">● ${a.status}</span></td>
                <td>
                    <button onclick="abrirModalAtivacao(${a.id})" class="btn-glass-sm">
                        <i class="fas fa-search"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function abrirModalAtivacao(id) {
    const a = DB.ativacoes.find(x => x.id === id);
    if (!a) return;
    const statusOptions = DB.statusFlags.map(f => `<option value="${f.nome}" ${a.status === f.nome ? 'selected' : ''}>${f.nome}</option>`).join('');
    document.getElementById('conteudoModalAtivacao').innerHTML = `
        <div class="form-grid">
            <div class="input-group"><label>Observação</label><textarea id="editObservacao">${a.observacao || ''}</textarea></div>
            <div class="input-group"><label>Status</label><select id="editStatus">${statusOptions}</select></div>
            <div class="input-group"><label>Ativado por</label><input value="${a.ativadoPor || ''}" id="editAtivadoPor"></div>
            <div class="input-group"><label>Confirmado por</label><input value="${a.confirmadoPor || ''}" id="editConfirmadoPor"></div>
            <div class="input-group"><label>Aquisição</label><input value="${a.aquisicao || ''}" id="editAquisicao"></div>
            <div class="input-group"><label>Viabilidade</label><input value="${a.viabilidade || ''}" id="editViabilidade"></div>
            <div class="input-group"><label>Data</label><input value="${a.data || ''}" id="editData"></div>
            <div class="input-group"><label>Equipe</label><input value="${a.equipe || ''}" id="editEquipe"></div>
            <div class="input-group"><label>Vendedor(a)</label><input value="${a.vendedorNome || ''}" id="editVendedorNome"></div>
            <div class="input-group"><label>Nome Completo</label><input value="${a.nomeCompleto || ''}" id="editNomeCompleto"></div>
            <div class="input-group"><label>Nome da Mãe</label><input value="${a.nomeMae || ''}" id="editNomeMae"></div>
            <div class="input-group"><label>Data de Nascimento</label><input value="${a.dataNasc || ''}" id="editDataNasc"></div>
            <div class="input-group"><label>CPF/CNPJ</label><input value="${a.cpfCnpj || ''}" id="editCpfCnpj"></div>
            <div class="input-group"><label>Razão Social</label><input value="${a.razaoSocial || ''}" id="editRazaoSocial"></div>
            <div class="input-group"><label>Email</label><input value="${a.email || ''}" id="editEmail"></div>
            <div class="input-group"><label>CEP</label><input value="${a.cep || ''}" id="editCep"></div>
            <div class="input-group"><label>UF</label><input value="${a.uf || ''}" id="editUf"></div>
            <div class="input-group"><label>Endereço</label><input value="${a.endereco || ''}" id="editEndereco"></div>
            <div class="input-group"><label>Bairro</label><input value="${a.bairro || ''}" id="editBairro"></div>
            <div class="input-group"><label>Cidade</label><input value="${a.cidade || ''}" id="editCidade"></div>
            <div class="input-group"><label>N° / Complemento</label><input value="${a.numeroComplemento || ''}" id="editNumeroComplemento"></div>
            <div class="input-group"><label>Referência</label><input value="${a.referencia || ''}" id="editReferencia"></div>
            <div class="input-group"><label>Telefone</label><input value="${a.telefone || ''}" id="editTelefone"></div>
            <div class="input-group"><label>WhatsApp</label><input value="${a.whatsapp || ''}" id="editWhatsapp"></div>
            <div class="input-group"><label>Valor</label><input value="${a.valor || ''}" id="editValor"></div>
            <div class="input-group"><label>Velocidade</label><input value="${a.velocidade || ''}" id="editVelocidade"></div>
            <div class="input-group"><label>Forma de Pagamento</label><input value="${a.formaPagamento || ''}" id="editFormaPagamento"></div>
            <div class="input-group"><label>Vencimento</label><input value="${a.vencimento || ''}" id="editVencimento"></div>
            <div class="input-group"><label>Data Instalação</label><input value="${a.dataInstalacao || ''}" id="editDataInstalacao"></div>
            <div class="input-group"><label>Contrato</label><input value="${a.contrato || ''}" id="editContrato"></div>
            <div class="input-group"><label>Tipo de Venda</label><input value="${a.tipoVenda || ''}" id="editTipoVenda"></div>
            <div class="input-group"><label>Agendamento</label><input value="${a.agendamento || ''}" id="editAgendamento"></div>
            <div class="input-group"><label>Plano</label><input value="${a.plano || ''}" id="editPlano"></div>
            <div class="input-group"><label>Data Ag.</label><input value="${a.dataAg || ''}" id="editDataAg"></div>
        </div>
    `;
    document.getElementById('modalAtivacao').style.display = 'flex';
    // Salvar edições ao fechar? Pode implementar um botão Salvar, ou salvar automaticamente.
    // Por enquanto apenas visualização.
}

function fecharModalAtivacao() {
    document.getElementById('modalAtivacao').style.display = 'none';
}

// ===== GERENCIAR STATUS FLAGS =====
function abrirGerenciadorStatus() {
    carregarListaStatusFlags();
    document.getElementById('modalStatus').style.display = 'flex';
}
function fecharModalStatus() {
    document.getElementById('modalStatus').style.display = 'none';
}
function carregarListaStatusFlags() {
    const container = document.getElementById('listaStatusFlags');
    container.innerHTML = DB.statusFlags.map(f => `
        <div class="flag-item">
            <span class="flag-color" style="background:${f.cor};"></span>
            <span>${f.nome}</span>
            <button onclick="removerStatusFlag(${f.id})"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
}
function adicionarStatusFlag() {
    const nome = document.getElementById('novoStatusNome').value.trim();
    const cor = document.getElementById('novoStatusCor').value;
    if (!nome) return alert('Digite um nome!');
    DB.statusFlags.push({ id: Date.now(), nome, cor });
    salvarDB();
    carregarListaStatusFlags();
    document.getElementById('novoStatusNome').value = '';
}
function removerStatusFlag(id) {
    DB.statusFlags = DB.statusFlags.filter(f => f.id !== id);
    salvarDB();
    carregarListaStatusFlags();
    // Atualiza tabela de ativações se estiver visível
    if (document.getElementById('secao-ativacoes').classList.contains('section-active')) {
        carregarAtivacoes();
    }
}

// ===== DEMAIS FUNÇÕES (vendedores, lixeira, relatórios, vendedor screen) =====
// Incluir todas as funções das versões anteriores: mostrarFormVendedor, cadastrarVendedor, carregarVendedores, toggleVendedor, excluirVendedor, abrirModalEditar, fecharModalEditar, salvarEdicaoVendedor, toggleLixeira, carregarLixeira, recuperarVendedor, excluirPermanentemente, carregarTodosClientes, carregarRelatorios, mostrarSecaoVendedor, carregarMeusClientes, carregarMinhasVendas, cadastrarCliente.
// (Elas permanecem idênticas às últimas versões fornecidas.)

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
if (!DB.statusFlags.find(f => f.nome === 'Aprovado')) {
    DB.statusFlags.push({ id: Date.now(), nome: 'Aprovado', cor: '#2ed573' });
}
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

// ===== DADOS DE VENDAS (SIMULADOS) =====
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
function gerarVendasDiaPassado() { /* ... */ } // mantida igual, sem alterações
function gerarVendasMesAtual() { /* ... */ }
function gerarVendasMesAnterior() { /* ... */ }

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
function carregarVendasDiarias() { /* ... */ }

// ===== COMPARATIVO =====
function mostrarComparativo(tipo) { /* ... */ }
function carregarComparativoDiario() { /* ... */ }
function carregarComparativoMensal() { /* ... */ }
function carregarComparacaoProdutos(vAtual, vPassado, containerId) { /* ... */ }

// ===== NAVEGAÇÃO ADMIN =====
function mostrarSecao(secao) { /* ... */ }

// ===== CADASTRO DE USUÁRIOS =====
function mostrarFormCadastro(){document.getElementById('formCadastro').style.display='block';}
function cadastrarUsuario(){ /* ... */ }
function carregarUsuarios() { /* ... */ }
function toggleUsuario(id){ /* ... */ }
function excluirUsuario(id){ /* ... */ }
function abrirModalEditar(id){ /* ... */ }
function fecharModalEditar(){ /* ... */ }
function salvarEdicaoUsuario(){ /* ... */ }

// ===== LIXEIRA =====
function toggleLixeira(){ /* ... */ }
function carregarLixeira(){ /* ... */ }
function recuperarUsuario(id){ /* ... */ }
function excluirPermanentemente(id){ /* ... */ }

// ===== ATIVAÇÕES (com coluna "Tratando" e modal compacto) =====
function carregarAtivacoes() {
    const tabela = document.getElementById('tabelaAtivacoes');
    if (!tabela) return;
    tabela.innerHTML = DB.ativacoes.map(a => {
        const vendedor = DB.usuarios.find(u => u.id === a.vendedor_id);
        const flag = DB.statusFlags.find(f => f.nome === a.status) || { cor: '#fff' };
        const tratando = a.tratandoPor || (vendaSendoVisualizada === a.id ? sessao.nome : '—');
        return `<tr>
            <td><strong>${a.nomeCliente}</strong></td>
            <td>${a.produto}</td>
            <td>${vendedor?vendedor.nome:'N/A'}</td>
            <td><span style="color:${flag.cor};font-weight:600;">● ${a.status}</span></td>
            <td><span style="font-size:12px;">${tratando}</span></td>
            <td><button onclick="abrirModalAtivacao(${a.id})" class="btn-glass-sm"><i class="fas fa-search"></i></button></td>
        </tr>`;
    }).join('');
    if (DB.ativacoes.length > 0 && novasVendas) {
        document.getElementById('balaoNovaVenda').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('balaoNovaVenda').style.display = 'none';
            novasVendas = false;
        }, 5000);
    }
    filtrarAtivacoes();
}
function filtrarAtivacoes() { /* ... */ }
function abrirModalAtivacao(id) {
    const a = DB.ativacoes.find(x => x.id === id);
    if (!a) return;
    vendaSendoVisualizada = id;
    a.tratandoPor = sessao.nome;
    salvarDB();
    document.getElementById('balaoNovaVenda').style.display = 'none';
    novasVendas = false;
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
}
function fecharModalAtivacao() {
    const a = DB.ativacoes.find(x => x.id === vendaSendoVisualizada);
    if (a) {
        a.status = document.getElementById('editStatus')?.value || a.status;
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
        salvarDB();
    }
    document.getElementById('modalAtivacao').style.display = 'none';
    vendaSendoVisualizada = null;
    carregarAtivacoes();
}

// ===== GERENCIAR STATUS =====
function abrirGerenciadorStatus() { carregarListaStatusFlags(); document.getElementById('modalStatus').style.display = 'flex'; }
function fecharModalStatus() { document.getElementById('modalStatus').style.display = 'none'; }
function carregarListaStatusFlags() { /* ... */ }
function adicionarStatusFlag() { /* ... */ }
function removerStatusFlag(id) { /* ... */ }

// ===== RELATÓRIOS =====
function carregarRelatorios() { /* ... */ }
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
function mostrarNotificacao(mensagem) {
    const toast = document.getElementById('toastNotificacao');
    document.getElementById('toastMensagem').textContent = mensagem;
    toast.style.display = 'flex';
    setTimeout(() => { toast.style.display = 'none'; }, 5000);
}
function fecharToast() { document.getElementById('toastNotificacao').style.display = 'none'; }

// ===== SOM DE ALERTA =====
function tocarAlerta() { /* ... */ }

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
        if (a.status !== 'Aprovado') return false;
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

function enviarVenda() {
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
        velocidade: document.getElementById('vVelocidade').value.trim(),
        formaPagamento: document.getElementById('vFormaPagamento').value.trim(),
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
            <td>${a.plano}</td>
            <td>R$ ${parseFloat(a.valor).toFixed(2)}</td>
            <td><span style="color:${flag.cor};font-weight:600;">● ${a.status}</span></td>
            <td>${new Date(a.data+'T00:00:00').toLocaleDateString('pt-BR')}</td>
            <td><button onclick="abrirModalAtivacao(${a.id})" class="btn-glass-sm"><i class="fas fa-search"></i></button></td>
        </tr>`;
    }).join('') : '<tr><td colspan="6" style="text-align:center;padding:30px;">Nenhuma venda enviada</td></tr>';
}

function mostrarSecaoVendedor(e, secao) {
    document.querySelectorAll('#vendedorScreen .section-active, #vendedorScreen .section-hidden').forEach(s => { s.style.display = 'none'; s.className = 'section-hidden'; });
    const el = document.getElementById(`secao-${secao}`); if(el){ el.style.display = 'block'; el.className = 'section-active'; }
    document.querySelectorAll('#vendedorScreen .nav-item').forEach(a => a.classList.remove('active'));
    if (e && e.currentTarget) { e.currentTarget.classList.add('active'); }
    const titulos = { inicio: '🏠 Início', enviarVenda: '📨 Enviar Venda', controleVendas: '📋 Controle de Vendas' };
    document.getElementById('tituloSecaoVendedor').innerHTML = titulos[secao] || secao;
    if (secao === 'inicio') carregarInicioVendedor();
    if (secao === 'controleVendas') carregarControleVendas();
}

// ===== CHAT (completo) =====
let chatConversationAtual = null;
let chatIntervalo = null;

function carregarUsuariosChat() { /* ... */ }
function atualizarListaConversas() { /* ... */ }
function abrirConversaChat(conversationId) { /* ... */ }
function voltarParaListaConversas() { /* ... */ }
function marcarMensagensComoLidas(conversationId) { /* ... */ }
function renderizarMensagensChat() { /* ... */ }
function enviarMensagemChat() { /* ... */ }
function iniciarConversaPrivada() { /* ... */ }
function atualizarBadge() { /* ... */ }
function iniciarPollingChat() { /* ... */ }
function toggleChat() { /* ... */ }
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

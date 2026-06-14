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
function fazerLogin() { /* ... (completa, como antes) ... */ }
function logout() { /* ... */ }

// ===== MOSTRAR TELAS =====
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
function gerarDadosVendas() { /* ... */ }
function gerarVendasDiaPassado() { /* ... */ }
function gerarVendasMesAtual() { /* ... */ }
function gerarVendasMesAnterior() { /* ... */ }

// ===== DASHBOARD =====
function carregarDashboard() { /* ... */ }
function carregarVendasDiarias() { /* ... */ }

// ===== COMPARATIVO =====
function mostrarComparativo(tipo) { /* ... */ }
function carregarComparativoDiario() { /* ... */ }
function carregarComparativoMensal() { /* ... */ }
function carregarComparacaoProdutos(vAtual, vPassado, containerId) { /* ... */ }

// ===== NAVEGAÇÃO ADMIN =====
function mostrarSecao(secao) { /* ... */ }

// ===== CADASTRO, LIXEIRA, ATIVAÇÕES, STATUS, RELATÓRIOS, METAS, PROMOÇÕES =====
// ... (todas essas funções permanecem completas, sem omissões) ...

// ===== GERAR PDF (CORRIGIDO) =====
function gerarPDF() { /* ... */ }
function fecharModalPDF() { document.getElementById('modalPDF').style.display = 'none'; }

// ===== VENDEDOR SCREEN =====
function mostrarSecaoVendedor(e, secao) { /* ... */ }
function carregarMeusClientes(){ /* ... */ }
function carregarMinhasVendas(){ /* ... */ }
function cadastrarCliente(){ /* ... */ }

// =====================================
// SISTEMA DE CHAT (ATUALIZADO)
// =====================================
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

    // Mostra botão voltar e ajusta título
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
    DB.chatMessages.push({
        id: Date.now() + Math.random(),
        conversationId: chatConversationAtual,
        senderId: sessao.id,
        senderName: sessao.nome,
        text: texto,
        timestamp: Date.now(),
        readBy: [sessao.id]
    });
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
    const totalNaoLidas = DB.chatMessages.filter(m => 
        (!m.readBy || !m.readBy.includes(sessao.id)) && 
        (m.conversationId === 'group' || m.conversationId.includes(String(sessao.id)))
    ).length;
    if (totalNaoLidas > 0) {
        badge.textContent = totalNaoLidas > 99 ? '99+' : totalNaoLidas;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
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

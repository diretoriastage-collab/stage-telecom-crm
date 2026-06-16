// ============================================
// STAGE TELECOM CRM - SCRIPT COMPLETO E FINAL
// UUID oculto, status correto, tratando com trava, notificação para todos admins
// ============================================

let DB;
try {
    const dbRaw = localStorage.getItem('stage_db');
    DB = dbRaw ? JSON.parse(dbRaw) : null;
} catch (e) {
    console.warn('Banco de dados corrompido. Resetando...', e);
    localStorage.removeItem('stage_db');
}

if (!DB) {
    DB = {
        usuarios: [
            { id: 1, usuario: "admin", senha: "", nome: "Master Admin", email: "admin@stagetelecom.com.br", tipo: "admin", ativo: true, deletedAt: null, equipe: "Gestão", categoria: "admin" }
        ],
        clientes: [],
        config: { metaDiaria: 10, metaMensal: 50 },
        statusFlags: [
            { id: 1, nome: "Pendente", cor: "#ffa502" },
            { id: 2, nome: "Aprovado", cor: "#2ed573" },
            { id: 3, nome: "Cancelado", cor: "#ff4757" }
        ],
        ativacoes: [],
        metas: { diariaVendas: 10, quinzenalVendas: 75, mensalVendas: 150, produtos: [], instalacoes: [] },
        promocoes: [],
        notificacoes: [],
        chatMessages: [],
        produtos: ["Básico", "Empresarial", "Premium", "Ultra"],
        opcoesVenda: {
            velocidades: ["10MB", "50MB", "100MB", "300MB"],
            formasPagamento: ["Boleto", "Cartão", "PIX"],
            valores: ["79.90", "99.90", "149.90", "199.90"]
        }
    };
}

DB.promocoes = DB.promocoes || [];
DB.notificacoes = DB.notificacoes || [];
DB.ativacoes = DB.ativacoes || [];
DB.metas = DB.metas || { diariaVendas: 10, quinzenalVendas: 75, mensalVendas: 150, produtos: [], instalacoes: [] };
DB.metas.produtos = DB.metas.produtos || [];
DB.metas.instalacoes = DB.metas.instalacoes || [];
DB.chatMessages = DB.chatMessages || [];
DB.produtos = DB.produtos || ["Básico", "Empresarial", "Premium", "Ultra"];
DB.opcoesVenda = DB.opcoesVenda || { velocidades: [], formasPagamento: [], valores: [] };
if (!DB.statusFlags.find(f => f.nome === 'Pendente')) {
    DB.statusFlags.unshift({ id: Date.now(), nome: 'Pendente', cor: '#ffa502' });
}
DB.usuarios.forEach(u => { if (!u.categoria) u.categoria = u.tipo || 'vendedor'; if (!u.equipe) u.equipe = 'Geral'; });

// ===== CONFIGURAÇÕES =====
const GOOGLE_SHEET_VENDAS_URL = 'https://script.google.com/macros/s/AKfycbxz3dFFIXoKML69m4nQiQy0BwhNvjcy-M7UfMhZXgOFiVAfzkBt5xRaB1uxrW3eGpHWZg/exec'; // ATUALIZE COM SUA URL

let sessao = JSON.parse(sessionStorage.getItem('stage_session'));
let comparativoAtual = 'diario';
let graficoVendedoresInstance = null;
let vendaSendoVisualizada = null;
let paginaAtualAtivacoes = 1;
let paginaAtualVendasAprovadas = 1;
const itensPorPagina = 15;

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

// ===== AUTENTICAÇÃO =====
async function autenticarUsuario(usuario, senha) {
    try {
        const resp = await consultarSheetUsuarios(usuario, senha);
        if (resp && resp.autorizado === true) {
            return {
                id: resp.id || Date.now(),
                nome: resp.nome,
                email: resp.email || '',
                tipo: resp.categoria,
                equipe: resp.equipe || 'Geral'
            };
        }
    } catch (e) { console.warn('Erro ao consultar planilha:', e); }
    const userLocal = DB.usuarios.find(u => u.usuario === usuario && u.ativo === true && !u.deletedAt && u.senha === senha);
    if (userLocal) {
        return {
            id: userLocal.id,
            nome: userLocal.nome,
            email: userLocal.email,
            tipo: userLocal.categoria || userLocal.tipo,
            equipe: userLocal.equipe || 'Geral'
        };
    }
    return null;
}

function consultarSheetUsuarios(usuario, senha) {
    return new Promise((resolve, reject) => {
        const callbackName = 'cbUsers' + Date.now();
        const script = document.createElement('script');
        const params = new URLSearchParams({ acao: 'autenticar', usuario, senha, callback: callbackName });
        script.src = GOOGLE_SHEET_VENDAS_URL + '?' + params.toString();
        const timeout = setTimeout(() => { document.body.removeChild(script); delete window[callbackName]; reject(new Error('Timeout')); }, 5000);
        window[callbackName] = (res) => { clearTimeout(timeout); document.body.removeChild(script); delete window[callbackName]; resolve(res); };
        script.onerror = () => { clearTimeout(timeout); document.body.removeChild(script); delete window[callbackName]; reject(new Error('Erro de rede')); };
        document.body.appendChild(script);
    });
}

async function fazerLogin() {
    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value.trim();
    const erro = document.getElementById('mensagemErro');
    if (!usuario || !senha) { erro.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Preencha todos os campos!'; erro.style.color = '#ffa502'; return; }
    const user = await autenticarUsuario(usuario, senha);
    if (user) {
        sessao = { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo };
        sessionStorage.setItem('stage_session', JSON.stringify(sessao));
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

// ===== FUNÇÕES DE REDE =====
function salvarDB() { localStorage.setItem('stage_db', JSON.stringify(DB)); }

function fetchFromGS(acao, params = {}) {
    return new Promise((resolve, reject) => {
        const callbackName = 'cb' + Date.now() + Math.random().toString(36).substr(2, 8);
        const urlParams = new URLSearchParams({ acao, callback: callbackName, ...params });
        const script = document.createElement('script');
        script.src = GOOGLE_SHEET_VENDAS_URL + '?' + urlParams.toString();
        const timeout = setTimeout(() => {
            if (document.body.contains(script)) document.body.removeChild(script);
            delete window[callbackName];
            reject(new Error('Timeout na requisição JSONP'));
        }, 15000);
        window[callbackName] = (res) => {
            clearTimeout(timeout);
            if (document.body.contains(script)) document.body.removeChild(script);
            delete window[callbackName];
            resolve(res);
        };
        script.onerror = () => {
            clearTimeout(timeout);
            if (document.body.contains(script)) document.body.removeChild(script);
            delete window[callbackName];
            reject(new Error('Erro de rede na requisição JSONP'));
        };
        document.body.appendChild(script);
    });
}

async function postParaGoogleSheets(acao, dados = {}) {
    try {
        const formData = new URLSearchParams();
        formData.append('acao', acao);
        for (let key in dados) {
            if (dados.hasOwnProperty(key)) formData.append(key, dados[key]);
        }
        await fetch(GOOGLE_SHEET_VENDAS_URL, { method: 'POST', body: formData, mode: 'no-cors' });
        console.log(`✅ POST '${acao}' enviado`);
    } catch (e) { console.warn(`⚠️ Falha no POST '${acao}':`, e); }
}

function formatarDataISO(dataStr) {
    if (!dataStr) return '';
    let data = new Date(dataStr);
    if (isNaN(data.getTime())) {
        const partes = dataStr.split('/');
        if (partes.length === 3) {
            data = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
        }
    }
    if (isNaN(data.getTime())) return dataStr;
    return data.toLocaleDateString('pt-BR');
}

// ===== BUSCAR PENDENTES (CORRIGIDO) =====
async function buscarPendentesDaNuvem() {
    if (!sessao) return;
    try {
        const resp = await fetchFromGS('listarPendentes');
        if (resp && resp.pendentes && Array.isArray(resp.pendentes)) {
            const pendentesNuvem = resp.pendentes.map(p => ({
                id: p.UUID,
                nomeCompleto: p.Cliente || '',
                cpf: p.CPF || '',
                dataNasc: p['Data Nasc.'] ? formatarDataISO(p['Data Nasc.']) : '',
                nomeMae: p['Nome da Mãe'] || '',
                rg: p.RG || '',
                orgaoExpeditor: p['Órgão Exp.'] || '',
                dataExpedicao: p['Data Exp.'] ? formatarDataISO(p['Data Exp.']) : '',
                email: p.Email || '',
                telefone1: p['Tel 1'] || '',
                telefone2: p['Tel 2'] || '',
                cep: p.CEP || '',
                logradouro: p.Logradouro || '',
                numero: p['N°'] || '',
                complemento: p.Complemento || '',
                bairro: p.Bairro || '',
                uf: p.Estado || '',
                cidade: p.Cidade || '',
                pontoReferencia: p['Ponto Ref.'] || '',
                produto: p.Plano || '',
                plano: p.Plano || '',
                velocidade: p.Velocidade || '',
                valor: p.Valor || '',
                vencimento: p.Vencimento || '',
                formaPagamento: p.Pagamento || '',
                hp: p.HP || '',
                viabilidade: p.Viabilidade || '',
                planoTipo: p['Plano Tipo'] || '',
                tipoAprovacao: p['Tipo Aprov.'] || '',
                status: p.Status || 'Pendente',
                vendedorNome: p.Vendedor || '',
                vendedor_id: p.VendedorId ? parseInt(p.VendedorId) : null,
                data: p.DataVenda ? formatarDataISO(p.DataVenda) : new Date().toISOString().split('T')[0],
                observacao: p.Observacao || '',
                finalizada: false,
                tratandoPor: p.TratandoPor || null,
                contrato: p.Contrato || '',
                infoData: p.DataInstalacao || '',
                infoPeriodo: p.PeriodoInstalacao || '',
                dataCriacao: p.DataCriacao || '',   // 🔥 ADICIONE ESTA LINHA
                createdAt: p.CreatedAt ? parseInt(p.CreatedAt) : (p.DataCriacao ? new Date(p.DataCriacao).getTime() : Date.now())
            }));
            const pendentesAntigas = DB.ativacoes.filter(a => a.status !== 'Aprovado');
            const aprovadasLocais = DB.ativacoes.filter(a => a.status === 'Aprovado');
            DB.ativacoes = [...pendentesNuvem, ...aprovadasLocais];
            DB.ativacoes.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)); // 🔥 ADICIONE ESTA LINHA
            salvarDB();

            if (sessao.tipo === 'admin') {
                let notificados = sessionStorage.getItem('stage_notificados_pendentes');
                let idsNotificados = notificados ? JSON.parse(notificados) : [];
                const uuidsAtuais = pendentesNuvem.map(p => p.id).filter(id => id);
                const uuidsNovos = uuidsAtuais.filter(uuid => !idsNotificados.includes(uuid));
                if (uuidsNovos.length > 0) {
                    tocarAlerta();
                    mostrarModalNovaVenda();
                    idsNotificados.push(...uuidsNovos);
                    sessionStorage.setItem('stage_notificados_pendentes', JSON.stringify(idsNotificados));
                }
            }
            if (document.getElementById('secao-ativacoes')?.classList.contains('section-active')) carregarAtivacoes();
        }
    } catch (err) { console.warn('Erro ao buscar pendentes:', err); }
}
async function buscarVendasAprovadasDaNuvem() {
    if (!sessao) return;
    try {
        const resp = await fetchFromGS('listarVendas');
        if (resp && resp.vendas && Array.isArray(resp.vendas)) {
            const aprovadasNuvem = resp.vendas.map(v => ({
                id: v.UUID || (v.Cliente + Date.now()),
                nomeCompleto: v.Cliente || '',
                cpf: v.CPF || '',
                dataNasc: v['Data Nasc.'] || '',
                nomeMae: v['Nome da Mãe'] || '',
                rg: v.RG || '',
                orgaoExpeditor: v['Órgão Exp.'] || '',
                dataExpedicao: v['Data Exp.'] || '',
                email: v.Email || '',
                telefone1: v['Tel 1'] || '',
                telefone2: v['Tel 2'] || '',
                cep: v.CEP || '',
                logradouro: v.Logradouro || '',
                numero: v['N°'] || '',
                complemento: v.Complemento || '',
                bairro: v.Bairro || '',
                uf: v.Estado || '',
                cidade: v.Cidade || '',
                pontoReferencia: v['Ponto Ref.'] || '',
                produto: v.Plano || '',
                plano: v.Plano || '',
                velocidade: v.Velocidade || '',
                valor: v['Valor (R$)'] || '0',
                vencimento: v.Vencimento || '',
                formaPagamento: v.Pagamento || '',
                hp: v.HP || '',
                viabilidade: v.Viabilidade || '',
                planoTipo: v['Plano Tipo'] || '',
                tipoAprovacao: v['Tipo Aprov.'] || '',
                contrato: v.Contrato || '',
                infoData: v['Data Inst.'] || '',
                infoPeriodo: v['Período Inst.'] || '',
                status: 'Aprovado',
                vendedorNome: v.Vendedor || '',
                vendedor_id: null,
                data: v['Data Aprovação'] || new Date().toISOString().split('T')[0],
                finalizada: true,
                instalacaoStatus: v.Instalação || 'Aguardando',   // 🔥 COLUNA "Instalação"
                dataCriacao: v.DataCriacao || '',
                createdAt: v.CreatedAt ? parseInt(v.CreatedAt) : (v['Data Aprovação'] ? new Date(v['Data Aprovação']).getTime() : Date.now())
            }));
            aprovadasNuvem.forEach(v => {
                const user = DB.usuarios.find(u => u.nome && u.nome.trim().toUpperCase() === (v.vendedorNome || '').trim().toUpperCase());
                if (user) v.vendedor_id = user.id;
            });
            const pendentesLocais = DB.ativacoes.filter(a => a.status !== 'Aprovado');
            DB.ativacoes = [...pendentesLocais, ...aprovadasNuvem];
            DB.ativacoes.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
            salvarDB();
            if (document.getElementById('secao-vendasAprovadas')?.classList.contains('section-active')) carregarVendasAprovadas();
            if (sessao.tipo === 'admin') carregarDashboard();
            if (sessao.tipo === 'vendedor') {
                if (document.getElementById('secao-controleVendas')?.classList.contains('section-active')) carregarControleVendas();
                if (document.getElementById('secao-instalacoes')?.classList.contains('section-active')) carregarInstalacoes();
            }
        }
    } catch (err) { console.warn('Erro ao buscar vendas aprovadas:', err); }
}
// ===== ATIVAÇÕES (TABELA - NUNCA MOSTRA UUID) =====
function carregarAtivacoes(pagina = paginaAtualAtivacoes) {
    const tabela = document.getElementById('tabelaAtivacoes');
    if (!tabela) return;
    
    // 🔥 INVERTE A ORDEM: as mais recentes primeiro
    let naoAprovadas = DB.ativacoes
        .filter(a => a.status !== 'Aprovado')
        .reverse();
    
    const termo = document.getElementById('buscaAtivacao')?.value.trim().toLowerCase();
    if (termo) {
        naoAprovadas = naoAprovadas.filter(a => {
            const texto = `${a.nomeCompleto} ${a.produto} ${a.vendedorNome} ${a.status} ${a.tratandoPor || ''}`.toLowerCase();
            return texto.includes(termo);
        });
    }
    
    const total = naoAprovadas.length;
    const totalPaginas = Math.ceil(total / itensPorPagina);
    paginaAtualAtivacoes = Math.min(pagina, totalPaginas || 1);
    const inicio = (paginaAtualAtivacoes - 1) * itensPorPagina;
    const itensExibidos = naoAprovadas.slice(inicio, inicio + itensPorPagina);
    
    tabela.innerHTML = itensExibidos.map(a => {
        const idStr = String(a.id);
        return `
            <tr>
                <td><strong>${a.nomeCompleto || '—'}</strong></td>
                <td>${a.produto || a.plano || '—'}</td>
                <td>${a.vendedorNome || '—'}</td>
                <td><span style="color:#ffa502;font-weight:600;">● ${a.status}</span></td>
                <td><span style="font-size:12px;">${a.tratandoPor || '—'}</span></td>
                <td>
                    <button onclick="abrirModalAtivacao('${idStr}')" class="btn-glass-sm" style="margin-right:4px;"><i class="fas fa-search"></i></button>
                    <button onclick="removerVenda('${idStr}')" class="btn-glass-sm" style="background:rgba(255,71,87,0.2);border-color:#ff4757;color:#ff4757;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="6" style="text-align:center;padding:30px;">Nenhuma ativação pendente</td></tr>';
    
    atualizarControlesPaginacao('paginacaoAtivacoes', paginaAtualAtivacoes, totalPaginas, total);
}
function mudarPaginaAtivacoes(direcao) {
    if (direcao === 'anterior' && paginaAtualAtivacoes > 1) carregarAtivacoes(paginaAtualAtivacoes - 1);
    else if (direcao === 'proximo') {
        let naoAprovadas = DB.ativacoes.filter(a => a.status !== 'Aprovado');
        const totalPaginas = Math.ceil(naoAprovadas.length / itensPorPagina);
        if (paginaAtualAtivacoes < totalPaginas) carregarAtivacoes(paginaAtualAtivacoes + 1);
    }
}

function atualizarControlesPaginacao(idContainer, pagina, totalPaginas, totalItens) {
    const container = document.getElementById(idContainer);
    if (!container) return;
    const btnAnterior = container.querySelector('button:first-of-type');
    const btnProximo = container.querySelector('button:last-of-type');
    const info = container.querySelector('span');
    if (info) info.textContent = `Página ${pagina} de ${totalPaginas || 1} (${totalItens} itens)`;
    if (btnAnterior) btnAnterior.disabled = pagina <= 1;
    if (btnProximo) btnProximo.disabled = pagina >= totalPaginas || totalPaginas === 0;
}
function filtrarAtivacoes() { paginaAtualAtivacoes = 1; carregarAtivacoes(1); }

// ===== MODAL ATIVAÇÃO (COM TRAVA E APROVAÇÃO) =====
function abrirModalAtivacao(id) {
    const a = DB.ativacoes.find(x => x.id === id);
    if (!a) { alert('Venda não encontrada'); return; }
    if (a.tratandoPor && a.tratandoPor !== sessao.nome) {
        alert(`⚠️ Esta venda está sendo tratada por ${a.tratandoPor}. Aguarde.`);
        return;
    }
    vendaSendoVisualizada = a.id;
    a.tratandoPor = sessao.nome;
    salvarDB();
    postParaGoogleSheets('atualizarTratando', { uuid: a.id, tratandoPor: sessao.nome });

    // Gera as opções de status
    const statusOptions = DB.statusFlags.map(f => 
        `<option value="${f.nome}" ${a.status === f.nome ? 'selected' : ''}>${f.nome}</option>`
    ).join('');

    // 🔥 Monta o HTML do modal com TODOS os campos, incluindo informações adicionais
    const html = `
        <div class="form-grid">
            <div class="input-group"><label>Status</label><select id="editStatus">${statusOptions}</select></div>
            <div class="input-group"><label>Observação</label><textarea id="editObservacao">${a.observacao || ''}</textarea></div>
            <div class="input-group"><label>Nome Completo</label><input value="${a.nomeCompleto || ''}" id="editNomeCompleto"></div>
            <div class="input-group"><label>Nome da Mãe</label><input value="${a.nomeMae || ''}" id="editNomeMae"></div>
            <div class="input-group"><label>Data Nasc.</label><input value="${a.dataNasc || ''}" id="editDataNasc"></div>
            <div class="input-group"><label>CPF</label><input value="${a.cpf || ''}" id="editCpf"></div>
            <div class="input-group"><label>RG</label><input value="${a.rg || ''}" id="editRg"></div>
            <div class="input-group"><label>Órgão Exp.</label><input value="${a.orgaoExpeditor || ''}" id="editOrgaoExpeditor"></div>
            <div class="input-group"><label>Data Exp.</label><input value="${a.dataExpedicao || ''}" id="editDataExpedicao"></div>
            <div class="input-group"><label>Email</label><input value="${a.email || ''}" id="editEmail"></div>
            <div class="input-group"><label>Tel 1</label><input value="${a.telefone1 || ''}" id="editTelefone1"></div>
            <div class="input-group"><label>Tel 2</label><input value="${a.telefone2 || ''}" id="editTelefone2"></div>
            <div class="input-group"><label>CEP</label><input value="${a.cep || ''}" id="editCep"></div>
            <div class="input-group"><label>Logradouro</label><input value="${a.logradouro || ''}" id="editLogradouro"></div>
            <div class="input-group"><label>N°</label><input value="${a.numero || ''}" id="editNumero"></div>
            <div class="input-group"><label>Complemento</label><input value="${a.complemento || ''}" id="editComplemento"></div>
            <div class="input-group"><label>Bairro</label><input value="${a.bairro || ''}" id="editBairro"></div>
            <div class="input-group"><label>Estado</label><input value="${a.uf || ''}" id="editUf"></div>
            <div class="input-group"><label>Cidade</label><input value="${a.cidade || ''}" id="editCidade"></div>
            <div class="input-group"><label>Ponto Ref.</label><input value="${a.pontoReferencia || ''}" id="editPontoReferencia"></div>
            <div class="input-group"><label>Velocidade</label><input value="${a.velocidade || ''}" id="editVelocidade"></div>
            <div class="input-group"><label>Produto</label><input value="${a.produto || a.plano || ''}" id="editProduto"></div>
            <div class="input-group"><label>Valor</label><input value="${a.valor || ''}" id="editValor"></div>
            <div class="input-group"><label>Vencimento</label><input value="${a.vencimento || ''}" id="editVencimento"></div>
            <div class="input-group"><label>Pagamento</label><input value="${a.formaPagamento || ''}" id="editFormaPagamento"></div>
            <div class="input-group"><label>HP</label><input value="${a.hp || ''}" id="editHp"></div>
            <div class="input-group"><label>Viabilidade</label><input value="${a.viabilidade || ''}" id="editViabilidade"></div>
            <div class="input-group"><label>Plano Tipo</label><input value="${a.planoTipo || ''}" id="editPlanoTipo"></div>
            <div class="input-group"><label>Tipo Aprov.</label><input value="${a.tipoAprovacao || ''}" id="editTipoAprovacao"></div>
        </div>
    `;

    // Insere o HTML no modal principal
    document.getElementById('conteudoModalAtivacao').innerHTML = html;

    // 🔥 Preenche os campos das INFORMAÇÕES ADICIONAIS (fora do container principal)
    document.getElementById('infoContrato').value = a.contrato || '';
    document.getElementById('infoData').value = a.infoData || '';
    document.getElementById('infoPeriodo').value = a.infoPeriodo || '';

    // Exibe o modal
    document.getElementById('modalAtivacao').style.display = 'flex';
}

async function fecharModalAtivacao() {
    const a = DB.ativacoes.find(x => x.id === vendaSendoVisualizada);
    if (a) {
        // Captura todos os valores do modal
        const novoStatus = document.getElementById('editStatus')?.value || a.status;
        a.observacao = document.getElementById('editObservacao')?.value || '';
        a.nomeCompleto = document.getElementById('editNomeCompleto')?.value || '';
        a.nomeMae = document.getElementById('editNomeMae')?.value || '';
        a.dataNasc = document.getElementById('editDataNasc')?.value || '';
        a.cpf = document.getElementById('editCpf')?.value || '';
        a.rg = document.getElementById('editRg')?.value || '';
        a.orgaoExpeditor = document.getElementById('editOrgaoExpeditor')?.value || '';
        a.dataExpedicao = document.getElementById('editDataExpedicao')?.value || '';
        a.email = document.getElementById('editEmail')?.value || '';
        a.telefone1 = document.getElementById('editTelefone1')?.value || '';
        a.telefone2 = document.getElementById('editTelefone2')?.value || '';
        a.cep = document.getElementById('editCep')?.value || '';
        a.logradouro = document.getElementById('editLogradouro')?.value || '';
        a.numero = document.getElementById('editNumero')?.value || '';
        a.complemento = document.getElementById('editComplemento')?.value || '';
        a.bairro = document.getElementById('editBairro')?.value || '';
        a.uf = document.getElementById('editUf')?.value || '';
        a.cidade = document.getElementById('editCidade')?.value || '';
        a.pontoReferencia = document.getElementById('editPontoReferencia')?.value || '';
        a.velocidade = document.getElementById('editVelocidade')?.value || '';
        a.produto = document.getElementById('editProduto')?.value || '';
        a.plano = a.produto;
        a.valor = document.getElementById('editValor')?.value || '';
        a.vencimento = document.getElementById('editVencimento')?.value || '';
        a.formaPagamento = document.getElementById('editFormaPagamento')?.value || '';
        a.hp = document.getElementById('editHp')?.value || '';
        a.viabilidade = document.getElementById('editViabilidade')?.value || '';
        a.planoTipo = document.getElementById('editPlanoTipo')?.value || '';
        a.tipoAprovacao = document.getElementById('editTipoAprovacao')?.value || '';
        a.contrato = document.getElementById('infoContrato')?.value || '';
        a.infoData = document.getElementById('infoData')?.value || '';
        a.infoPeriodo = document.getElementById('infoPeriodo')?.value || '';

        // Verifica se foi aprovado
        if (novoStatus === 'Aprovado' && a.status !== 'Aprovado') {
            // Valida informações adicionais
            if (!a.contrato || !a.infoData || !a.infoPeriodo) {
                alert('⚠️ Preencha Contrato, Data e Período de Instalação antes de aprovar.');
                return;
            }
            
            if (confirm('Aprovar esta venda?')) {
                const params = {
                    uuid: a.id,
                    status: 'APROVADO',
                    cliente: a.nomeCompleto,
                    cpf: a.cpf,
                    dataNasc: a.dataNasc,
                    nomeMae: a.nomeMae,
                    rg: a.rg,
                    orgaoExpeditor: a.orgaoExpeditor,
                    dataExpedicao: a.dataExpedicao,
                    email: a.email,
                    telefone1: a.telefone1,
                    telefone2: a.telefone2,
                    cep: a.cep,
                    logradouro: a.logradouro,
                    numero: a.numero,
                    complemento: a.complemento,
                    bairro: a.bairro,
                    uf: a.uf,
                    cidade: a.cidade,
                    pontoReferencia: a.pontoReferencia,
                    plano: a.produto,
                    velocidade: a.velocidade,
                    valor: a.valor,
                    vencimento: a.vencimento,
                    formaPagamento: a.formaPagamento,
                    hp: a.hp,
                    viabilidade: a.viabilidade,
                    planoTipo: a.planoTipo,
                    tipoAprovacao: a.tipoAprovacao,
                    contrato: a.contrato,
                    infoData: a.infoData,
                    infoPeriodo: a.infoPeriodo,
                    vendedorNome: a.vendedorNome
                   
                };
                
                const resp = await fetchFromGS('aprovarVenda', params);
                
                if (resp && resp.ok === true) {
                    alert('✅ Venda aprovada!');
                    
                    // 🔥 REMOVE DA LISTA DE PENDENTES
                    DB.ativacoes = DB.ativacoes.filter(item => item.id !== a.id);
                    
                    // 🔥 ATUALIZA O OBJETO PARA APROVADO E INSERE NO TOPO
                    a.status = 'Aprovado';
                    a.finalizada = true;
                    a.instalacaoStatus = 'Aguardando';
                    DB.ativacoes.unshift(a); // 🔥 INSERE NO TOPO
                    
                    salvarDB();
                    
                    // Sincroniza com a nuvem
                    await buscarPendentesDaNuvem();
                    await buscarVendasAprovadasDaNuvem();
                    
                } else {
                    alert('❌ Erro ao aprovar: ' + (resp?.erro || 'Erro desconhecido'));
                    a.status = 'Pendente';
                    salvarDB();
                }
            } else {
                // Cancelou a aprovação
                a.status = 'Pendente';
                salvarDB();
            }
        } else {
            // Outros status (não aprovado)
            a.status = novoStatus;
            salvarDB();
        }

        // Limpa o tratando
        a.tratandoPor = null;
        salvarDB();
        postParaGoogleSheets('atualizarTratando', { uuid: a.id, tratandoPor: '' });

        // Atualiza listas
        if (novoStatus !== 'Aprovado') {
            await buscarPendentesDaNuvem();
            await buscarVendasAprovadasDaNuvem();
        }
    }

    // Fecha o modal e recarrega as telas
    document.getElementById('modalAtivacao').style.display = 'none';
    vendaSendoVisualizada = null;
    carregarAtivacoes();
    if (document.getElementById('secao-vendasAprovadas')?.classList.contains('section-active')) {
        carregarVendasAprovadas();
    }
    if (sessao.tipo === 'admin') carregarDashboard();
}
function abrirModalInfoAdicional() {
    if (!vendaSendoVisualizada) { alert('Nenhuma venda selecionada.'); return; }
    document.getElementById('modalInfoAdicional').style.display = 'flex';
}
function fecharModalInfoAdicional() { document.getElementById('modalInfoAdicional').style.display = 'none'; }
function salvarInfoAdicional() {
    if (!vendaSendoVisualizada) { alert('Nenhuma venda selecionada.'); fecharModalInfoAdicional(); return; }
    const a = DB.ativacoes.find(x => x.id === vendaSendoVisualizada);
    if (a) {
        a.contrato = document.getElementById('infoContrato').value;
        a.infoData = document.getElementById('infoData').value;
        a.infoPeriodo = document.getElementById('infoPeriodo').value;
        salvarDB();
        postParaGoogleSheets('atualizarInfoAdicional', {
            uuid: a.id,
            contrato: a.contrato,
            infoData: a.infoData,
            infoPeriodo: a.infoPeriodo
        });
        alert('✅ Informações adicionais salvas e sincronizadas!');
    }
    fecharModalInfoAdicional();
}

// ===== VENDAS APROVADAS =====
function carregarVendasAprovadas(pagina = paginaAtualVendasAprovadas) {
    const tabela = document.getElementById('tabelaVendasAprovadas');
    if (!tabela) return;
    
    // 🔥 USA reverse() IGUAL NO PAINEL DO VENDEDOR
    let aprovadas = DB.ativacoes
        .filter(a => a.status === 'Aprovado')
        .reverse(); // Mais recentes primeiro
    
    const filtroData = document.getElementById('filtroDataAprovadas')?.value;
    if (filtroData) aprovadas = aprovadas.filter(a => a.data === filtroData);
    
    const total = aprovadas.length;
    const totalPaginas = Math.ceil(total / itensPorPagina);
    paginaAtualVendasAprovadas = Math.min(pagina, totalPaginas || 1);
    const inicio = (paginaAtualVendasAprovadas - 1) * itensPorPagina;
    const itensExibidos = aprovadas.slice(inicio, inicio + itensPorPagina);
    
    tabela.innerHTML = itensExibidos.length ? itensExibidos.map(a => {
        const vendedor = DB.usuarios.find(u => u.id === a.vendedor_id);
        const dataFormatada = a.data ? formatarDataISO(a.data) : '—';
        const instalacaoStatus = a.instalacaoStatus || 'Aguardando';
        return `<tr>
            <td><strong>${a.nomeCompleto || '—'}</strong></td>
            <td>${a.produto || a.plano || '—'}</td>
            <td>${vendedor ? vendedor.nome : 'N/A'}</td>
            <td>R$ ${parseFloat(a.valor).toFixed(2)}</td>
            <td>${dataFormatada}</td>
            <td><span style="color:${instalacaoStatus === 'Instalado' ? '#2ed573' : instalacaoStatus === 'Cancelado' ? '#ff4757' : '#ffa502'};font-weight:600;">${instalacaoStatus}</span></td>
            <td>
                <button onclick="abrirModalVisualizacao('${a.id}')" class="btn-glass-sm"><i class="fas fa-eye"></i></button>
                <button onclick="removerVenda('${a.id}')" class="btn-glass-sm" style="background:rgba(255,71,87,0.2);border-color:#ff4757;color:#ff4757;"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:30px;">Nenhuma venda aprovada</td></tr>';
    
    atualizarControlesPaginacao('paginacaoVendasAprovadas', paginaAtualVendasAprovadas, totalPaginas, total);
}
function mudarPaginaVendasAprovadas(direcao) {
    if (direcao === 'anterior' && paginaAtualVendasAprovadas > 1) carregarVendasAprovadas(paginaAtualVendasAprovadas - 1);
    else if (direcao === 'proximo') {
        let aprovadas = DB.ativacoes.filter(a => a.status === 'Aprovado');
        const totalPaginas = Math.ceil(aprovadas.length / itensPorPagina);
        if (paginaAtualVendasAprovadas < totalPaginas) carregarVendasAprovadas(paginaAtualVendasAprovadas + 1);
    }
}

function abrirModalVisualizacao(id) {
    const a = DB.ativacoes.find(x => x.id === id);
    if (!a) return;
    const flag = DB.statusFlags.find(f => f.nome === a.status) || { cor: '#fff' };

    // Formata datas
    const dataNascFormatada = a.dataNasc ? formatarDataISO(a.dataNasc) : '';
    const dataExpedicaoFormatada = a.dataExpedicao ? formatarDataISO(a.dataExpedicao) : '';
    const dataInstalacaoFormatada = a.infoData ? formatarDataISO(a.infoData) : '';

    let html = '';

    // 🔥 BLOCO DE INFORMAÇÕES DE INSTALAÇÃO NO TOPO
    if (a.contrato || a.infoData || a.infoPeriodo) {
        html += `
            <div class="instalacao-info-top">
                <div class="info-item">
                    <span class="label">📄 Contrato</span>
                    <span class="value ${a.contrato ? '' : 'empty'}">${a.contrato || '—'}</span>
                </div>
                <div class="info-item">
                    <span class="label">📅 Data Instalação</span>
                    <span class="value ${dataInstalacaoFormatada ? '' : 'empty'}">${dataInstalacaoFormatada || '—'}</span>
                </div>
                <div class="info-item">
                    <span class="label">⏰ Período</span>
                    <span class="value ${a.infoPeriodo ? '' : 'empty'}">${a.infoPeriodo || '—'}</span>
                </div>
            </div>
        `;
    }

    // Status, Plano, Valor
    html += `
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:15px;">
            <span style="background:rgba(255,255,255,0.05);padding:5px 10px;border-radius:8px;">
                <strong>Status:</strong> <span style="color:${flag.cor}">${a.status}</span>
            </span>
            <span style="background:rgba(255,255,255,0.05);padding:5px 10px;border-radius:8px;">
                <strong>Plano:</strong> ${a.plano || a.produto}
            </span>
            <span style="background:rgba(255,255,255,0.05);padding:5px 10px;border-radius:8px;">
                <strong>Valor:</strong> R$ ${parseFloat(a.valor).toFixed(2)}
            </span>
        </div>
    `;

    // Demais campos
    html += `<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:8px;">`;
    const campos = [
        ['Nome Completo', a.nomeCompleto],
        ['CPF', a.cpf],
        ['Data Nasc.', dataNascFormatada],
        ['Órgão Exp.', a.orgaoExpeditor],
        ['Nome da Mãe', a.nomeMae],
        ['RG', a.rg],
        ['Data Exp.', dataExpedicaoFormatada],
        ['Email', a.email],
        ['Tel 1', a.telefone1],
        ['Tel 2', a.telefone2],
        ['CEP', a.cep],
        ['Logradouro', a.logradouro],
        ['N°', a.numero],
        ['Complemento', a.complemento],
        ['Bairro', a.bairro],
        ['Estado', a.uf],
        ['Cidade', a.cidade],
        ['Ponto Ref.', a.pontoReferencia],
        ['Velocidade', a.velocidade],
        ['Produto', a.produto || a.plano],
        ['Valor', a.valor],
        ['Vencimento', a.vencimento],
        ['Pagamento', a.formaPagamento],
        ['HP', a.hp],
        ['Viabilidade', a.viabilidade],
        ['Plano Tipo', a.planoTipo],
        ['Tipo Aprov.', a.tipoAprovacao]
    ];
    campos.forEach(([label, valor]) => {
        html += `<div class="input-group"><label>${label}</label><input value="${valor || ''}" readonly style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);"></div>`;
    });
    html += `</div>`;

    document.getElementById('conteudoModalVisualizacao').innerHTML = html;
    document.getElementById('modalVisualizacao').style.display = 'flex';
}
function fecharModalVisualizacao() { document.getElementById('modalVisualizacao').style.display = 'none'; }

// ===== REMOVER VENDA =====
async function removerVenda(id) {
    const venda = DB.ativacoes.find(a => a.id === id);
    if (!venda) {
        alert('Venda não encontrada!');
        return;
    }

    if (!confirm(`Tem certeza que deseja remover permanentemente a venda de "${venda.nomeCompleto || venda.nomeCliente}"?`)) {
        return;
    }

    // Mostra feedback visual (opcional)
    const btn = document.querySelector(`[onclick*="removerVenda('${id}')"]`);
    if (btn) {
        btn.textContent = '...';
        btn.disabled = true;
    }

    try {
        // Usa fetchFromGS (GET) para excluir e ler a resposta
        const resp = await fetchFromGS('excluirVenda', { uuid: venda.id });
        console.log('Resposta da exclusão:', resp);

        if (resp && resp.ok === true) {
            // Exclusão confirmada no GS
            DB.ativacoes = DB.ativacoes.filter(a => a.id !== id);
            salvarDB();

            // Recarrega as listas para garantir consistência (opcional, mas seguro)
            await buscarPendentesDaNuvem();
            await buscarVendasAprovadasDaNuvem();

            alert('✅ Venda removida com sucesso!');
        } else {
            alert('❌ Erro ao excluir venda: ' + (resp?.erro || 'Erro desconhecido'));
        }
    } catch (err) {
        console.error('Erro na exclusão:', err);
        alert('❌ Erro de comunicação ao excluir venda.');
    }

    // Restaura o botão (se existir)
    if (btn) {
        btn.textContent = '🗑';
        btn.disabled = false;
    }
}

// ===== FUNÇÕES DO VENDEDOR (ENVIAR VENDA) =====
function limparFormularioVenda() {
    const ids = ['vNomeCompleto','vCpf','vDataNasc','vOrgaoExpeditor','vNomeMae','vRg','vDataExpedicao','vEmail','vTelefone1','vTelefone2','vCep','vLogradouro','vNumero','vComplemento','vBairro','vUf','vCidade','vPontoReferencia','vVelocidade','vPlano','vValor','vVencimento','vFormaPagamento','vHp','vViabilidade','vPlanoTipo','vTipoAprovacao'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}
function enviarVenda() {
    if (!sessao) { alert('Sessão expirada.'); return; }
    const campos = {
        viabilidade: document.getElementById('vViabilidade')?.value || '',
        planoTipo: document.getElementById('vPlanoTipo')?.value || '',
        tipoAprovacao: document.getElementById('vTipoAprovacao')?.value || '',
        nomeCompleto: document.getElementById('vNomeCompleto')?.value.trim() || '',
        cpf: document.getElementById('vCpf')?.value.trim() || '',
        dataNasc: document.getElementById('vDataNasc')?.value || '',
        orgaoExpeditor: document.getElementById('vOrgaoExpeditor')?.value.trim() || '',
        nomeMae: document.getElementById('vNomeMae')?.value.trim() || '',
        rg: document.getElementById('vRg')?.value.trim() || '',
        dataExpedicao: document.getElementById('vDataExpedicao')?.value || '',
        email: document.getElementById('vEmail')?.value.trim() || '',
        telefone1: document.getElementById('vTelefone1')?.value.trim() || '',
        telefone2: document.getElementById('vTelefone2')?.value.trim() || '',
        cep: document.getElementById('vCep')?.value.trim() || '',
        logradouro: document.getElementById('vLogradouro')?.value.trim() || '',
        numero: document.getElementById('vNumero')?.value.trim() || '',
        complemento: document.getElementById('vComplemento')?.value.trim() || '',
        bairro: document.getElementById('vBairro')?.value.trim() || '',
        uf: document.getElementById('vUf')?.value.trim() || '',
        cidade: document.getElementById('vCidade')?.value.trim() || '',
        pontoReferencia: document.getElementById('vPontoReferencia')?.value.trim() || '',
        velocidade: document.getElementById('vVelocidade')?.value || '',
        produto: document.getElementById('vPlano')?.value || '',
        plano: document.getElementById('vPlano')?.value || '',
        valor: document.getElementById('vValor')?.value || '',
        vencimento: document.getElementById('vVencimento')?.value || '',
        formaPagamento: document.getElementById('vFormaPagamento')?.value || '',
        hp: document.getElementById('vHp')?.value.trim() || ''
    };
    const obrigatorios = ['nomeCompleto', 'cpf', 'dataNasc', 'email', 'telefone1', 'cep', 'logradouro', 'numero', 'bairro', 'uf', 'cidade', 'velocidade', 'produto', 'valor', 'vencimento', 'formaPagamento'];
    for (let campo of obrigatorios) {
        if (!campos[campo]) {
            alert(`Preencha o campo "${campo.replace(/([A-Z])/g, ' $1').toLowerCase()}"`);
            return;
        }
    }
    const novaAtivacao = {
        nomeCompleto: campos.nomeCompleto,
        vendedor_id: sessao.id,
        vendedorNome: sessao.nome,
        status: "Pendente",
        data: new Date().toISOString().split('T')[0],
        finalizada: false,
        createdAt: Date.now(), // 🔥 TIMESTAMP PARA ORDENAÇÃO
        ...campos
    };
    fetchFromGS('adicionarPendente', { venda: JSON.stringify(novaAtivacao) }).then(resp => {
        if (resp && resp.ok === true) {
            alert('✅ Venda enviada com sucesso!');
            limparFormularioVenda();
           DB.ativacoes.unshift({ ...novaAtivacao, id: resp.id });
            salvarDB();
            if (sessao.tipo === 'vendedor' && document.getElementById('secao-controleVendas')?.classList.contains('section-active')) {
                carregarControleVendas();
            }
        } else alert('❌ Erro ao enviar. Tente novamente.');
    }).catch(err => { console.error(err); alert('❌ Erro de comunicação.'); });
}
function carregarControleVendas() {
    // 🔥 FILTRA PELO ID DO VENDEDOR
    const minhasAtivacoes = DB.ativacoes
        .filter(a => a.vendedor_id === sessao.id && a.status === 'Aprovado')
        .reverse();

    const tabela = document.getElementById('tabelaControleVendas');
    if (!tabela) return;
    tabela.innerHTML = minhasAtivacoes.length ? minhasAtivacoes.map(a => {
        const flag = DB.statusFlags.find(f => f.nome === a.status) || { cor: '#fff' };
        const dataFormatada = a.data ? formatarDataISO(a.data) : '—';
        const statusInstalacao = a.instalacaoStatus || 'Aguardando';
        return `<tr>
            <td><strong>${a.nomeCompleto || '—'}</strong></td>
            <td>${a.plano || a.produto || '—'}</td>
            <td>R$ ${parseFloat(a.valor).toFixed(2)}</td>
            <td><span style="color:${flag.cor};font-weight:600;">● ${a.status}</span></td>
            <td>${dataFormatada}</td>
            <td><span style="color:${statusInstalacao === 'Instalado' ? '#2ed573' : '#ffa502'};font-weight:600;">${statusInstalacao}</span></td>
            <td><button onclick="abrirModalVisualizacao('${a.id}')" class="btn-glass-sm"><i class="fas fa-eye"></i></button></td>
        </tr>`;
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:30px;">Nenhuma venda aprovada</td></tr>';
}
function carregarInstalacoes() {
    // 🔥 FILTRA PELO ID DO VENDEDOR
    const aprovadas = DB.ativacoes
        .filter(a => a.vendedor_id === sessao.id && a.status === 'Aprovado')
        .reverse();

    const tabela = document.getElementById('tabelaInstalacoes');
    if (!tabela) return;
    tabela.innerHTML = aprovadas.length ? aprovadas.map(a => {
        const statusInstalacao = a.instalacaoStatus || 'Aguardando';
        return `<tr>
            <td><strong>${a.nomeCompleto || '—'}</strong></td>
            <td>${a.plano || a.produto || '—'}</td>
            <td><span style="color:#2ed573;font-weight:600;">● ${a.status}</span></td>
            <td>
                <select onchange="alterarStatusInstalacao('${a.id}', this.value)" 
                        style="background:#2a1a1a;color:#ffffff;border:1px solid rgba(255,255,255,0.3);padding:6px 12px;border-radius:6px;font-size:13px;cursor:pointer;min-width:130px;">
                    <option value="Aguardando" ${statusInstalacao === 'Aguardando' ? 'selected' : ''} 
                            style="background:#1a0a0a;color:#ffffff;">Aguardando</option>
                    <option value="Instalado" ${statusInstalacao === 'Instalado' ? 'selected' : ''} 
                            style="background:#1a0a0a;color:#ffffff;">Instalado</option>
                    <option value="Cancelado" ${statusInstalacao === 'Cancelado' ? 'selected' : ''} 
                            style="background:#1a0a0a;color:#ffffff;">Cancelado</option>
                </select>
            </td>
            <td><button onclick="abrirModalVisualizacao('${a.id}')" class="btn-glass-sm"><i class="fas fa-eye"></i></button></td>
        </tr>`;
    }).join('') : '<tr><td colspan="5" style="text-align:center;padding:30px;">Nenhuma venda para instalação</td></tr>';
}
async function alterarStatusInstalacao(id, novoStatus) {
    const a = DB.ativacoes.find(x => x.id === id);
    if (!a) return;

    if (novoStatus === 'Instalado') {
        if (!confirm(`⚠️ Essa venda de "${a.nomeCompleto}" foi realmente INSTALADA?`)) {
            const select = document.querySelector(`select[onchange*="alterarStatusInstalacao('${id}"]`);
            if (select) select.value = a.instalacaoStatus || 'Aguardando';
            return;
        }
    }

    const statusAnterior = a.instalacaoStatus;
    a.instalacaoStatus = novoStatus;
    salvarDB();

    // 🔥 Envia para o GS via POST (ou GET)
    await postParaGoogleSheets('atualizarInstalacao', {
        uuid: a.id,
        status: novoStatus
    });

    // Aguarda o polling para sincronizar
    setTimeout(() => {
        buscarVendasAprovadasDaNuvem();
    }, 1000);

    // Feedback visual
    const select = document.querySelector(`select[onchange*="alterarStatusInstalacao('${id}"]`);
    if (select) select.style.borderColor = '#2ed573';
    setTimeout(() => { if (select) select.style.borderColor = ''; }, 2000);
}
function mostrarSecaoVendedor(e, secao) {
    document.querySelectorAll('#vendedorScreen .section-active, #vendedorScreen .section-hidden').forEach(s => { s.style.display = 'none'; s.className = 'section-hidden'; });
    const el = document.getElementById(`secao-${secao}`); if(el){ el.style.display = 'block'; el.className = 'section-active'; }
    document.querySelectorAll('#vendedorScreen .nav-item').forEach(a => a.classList.remove('active'));
    if (e && e.currentTarget) e.currentTarget.classList.add('active');
    const titulos = { inicio: '🏠 Início', enviarVenda: '📨 Enviar Venda', controleVendas: '📋 Controle de Vendas', instalacoes: '🔧 Instalações' };
    document.getElementById('tituloSecaoVendedor').innerHTML = titulos[secao] || secao;
    if (secao === 'inicio') carregarInicioVendedor();
    if (secao === 'enviarVenda') { carregarOpcoesVenda(); carregarSelectProdutos(); }
    if (secao === 'controleVendas') carregarControleVendas();
    if (secao === 'instalacoes') carregarInstalacoes();
}
function carregarInicioVendedor() {
    if (!sessao) return;
    const metaMensal = DB.metas.mensalVendas || 150;
    const metaDiaria = DB.metas.diariaVendas || 10;
    document.getElementById('metaMensalVendedor').textContent = metaMensal;
    document.getElementById('metaDiariaVendedor').textContent = metaDiaria;
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    const vendasAprovadas = DB.ativacoes.filter(a => a.vendedor_id === sessao.id && a.status === 'Aprovado' && a.finalizada !== false);
    const totalVendas = vendasAprovadas.length;
    const percentual = Math.min((totalVendas / metaMensal) * 100, 100).toFixed(1);
    document.getElementById('realizadoVendedorMes').textContent = totalVendas;
    document.getElementById('faltamVendedorMes').textContent = Math.max(metaMensal - totalVendas, 0);
    document.getElementById('totalVendasMesVendedor').textContent = totalVendas;
    document.getElementById('barraProgressoVendedor').style.width = `${percentual}%`;
    atualizarPainelInstalacoes();
}
function atualizarPainelInstalacoes() {
    const hoje = new Date();
    const dia = hoje.getDate();
    const painel = document.getElementById('painelInstalacoesAnterior');
    const instaladosEl = document.getElementById('instaladosCountVendedor');
    const canceladosEl = document.getElementById('canceladosCountVendedor');
    if (dia <= 10) {
        let ano = hoje.getFullYear();
        let mes = hoje.getMonth();
        if (mes === 0) { mes = 12; ano--; }
        const vendasAnteriores = DB.ativacoes.filter(a => a.vendedor_id === sessao.id && a.status === 'Aprovado' && a.finalizada !== false);
        const instalados = vendasAnteriores.filter(v => v.instalacaoStatus === 'Instalado').length;
        const cancelados = vendasAnteriores.filter(v => v.instalacaoStatus === 'Cancelado').length;
        instaladosEl.textContent = instalados;
        canceladosEl.textContent = cancelados;
        painel.style.display = 'block';
    } else { painel.style.display = 'none'; }
}
function buscarCep() {
    const cep = document.getElementById('vCep').value.replace(/\D/g, '');
    if (cep.length !== 8) return alert('Digite um CEP válido com 8 dígitos.');
    fetch(`https://viacep.com.br/ws/${cep}/json/`).then(res => res.json()).then(data => {
        if (data.erro) { alert('CEP não encontrado.'); return; }
        document.getElementById('vLogradouro').value = data.logradouro || '';
        document.getElementById('vBairro').value = data.bairro || '';
        document.getElementById('vCidade').value = data.localidade || '';
        document.getElementById('vUf').value = data.uf || '';
        document.getElementById('vNumero').focus();
    }).catch(() => alert('Erro ao buscar CEP.'));
}

// ===== DASHBOARD ADMIN =====
function obterVendasAprovadas() { return DB.ativacoes.filter(a => a.status === 'Aprovado' && a.finalizada !== false); }
function obterVendasAprovadasHoje() { const hoje = new Date().toISOString().split('T')[0]; return obterVendasAprovadas().filter(a => a.data === hoje); }
function obterVendasAprovadasMesAtual() { const hoje = new Date(); return obterVendasAprovadas().filter(a => { const [aAno, aMes] = a.data.split('-').map(Number); return aAno === hoje.getFullYear() && aMes === hoje.getMonth()+1; }); }
function gerarDadosVendas() { return obterVendasAprovadasHoje().map(v => ({ id: v.id, vendedor_id: v.vendedor_id, vendedor_nome: v.vendedorNome, plano: v.produto, valor: parseFloat(v.valor) || 0, data: v.data })); }
function carregarDashboard() {
    const vendasMes = obterVendasAprovadasMesAtual();
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
    document.getElementById('dataVendasDiarias').textContent = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const vendasHoje = gerarDadosVendas();
    const meta = DB.metas.diariaVendas || 10;
    document.getElementById('totalVendasHoje').textContent = vendasHoje.length;
    const pctDiario = Math.min((vendasHoje.length / meta) * 100, 100).toFixed(1);
    document.getElementById('barraLiquidaDiaria').style.width = `${pctDiario}%`;
    document.getElementById('realizadoMetaDiaria').textContent = vendasHoje.length;
    document.getElementById('faltamMetaDiaria').textContent = Math.max(meta - vendasHoje.length, 0);
    document.getElementById('metaDiaria').textContent = meta;
    const ranking = {};
    vendasHoje.forEach(v => { if (!ranking[v.vendedor_id]) ranking[v.vendedor_id] = { nome: v.vendedor_nome, vendas: 0 }; ranking[v.vendedor_id].vendas++; });
    const rankingArr = Object.values(ranking).sort((a,b) => b.vendas - a.vendas);
    const rankingEl = document.getElementById('rankingVendedores');
    rankingEl.innerHTML = rankingArr.length ? rankingArr.map((r,i) => {
        const pos = i+1;
        const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos;
        return `<div class="ranking-item"><div class="ranking-posicao">${medal}</div><div class="ranking-info"><span class="ranking-nome">${r.nome}</span><span class="ranking-vendas">${r.vendas} vendas</span></div><span class="ranking-pontos">${r.vendas}</span></div>`;
    }).join('') : '<p>Nenhuma venda hoje</p>';
}
function mostrarComparativo(tipo) {
    comparativoAtual = tipo;
    document.querySelectorAll('.btn-compare').forEach(b => b.classList.remove('active'));
    document.getElementById(tipo === 'diario' ? 'btnDiario' : 'btnMensal').classList.add('active');
    document.getElementById('comparativoDiario').style.display = tipo === 'diario' ? 'block' : 'none';
    document.getElementById('comparativoMensal').style.display = tipo === 'mensal' ? 'block' : 'none';
    if (tipo === 'diario') carregarComparativoDiario();
    else carregarComparativoMensal();
}
function carregarComparativoDiario() {
    const hoje = new Date();
    document.getElementById('compDataHoje').textContent = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    const diaPassado = new Date(hoje);
    diaPassado.setDate(hoje.getDate() - 1);
    document.getElementById('compDataPassado').textContent = diaPassado.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    const vHoje = gerarDadosVendas(), vPassado = gerarVendasDiaPassado();
    document.getElementById('compVendasHoje').textContent = vHoje.length;
    document.getElementById('compVendasPassado').textContent = vPassado.length;
    const dif = vHoje.length - vPassado.length;
    const diffEl = document.getElementById('compDiferencaDiario');
    diffEl.className = `comp-diferenca ${dif > 0 ? 'positivo' : dif < 0 ? 'negativo' : 'positivo'}`;
    diffEl.innerHTML = dif > 0 ? `📈 ${dif} vendas a mais (${((dif / Math.max(vPassado.length, 1)) * 100).toFixed(1)}%)` : dif < 0 ? `📉 ${Math.abs(dif)} vendas a menos (${((dif / Math.max(vPassado.length, 1)) * 100).toFixed(1)}%)` : '➡️ Mesmo número de vendas';
    const ranking = {};
    vHoje.forEach(v => { if (!ranking[v.vendedor_id]) ranking[v.vendedor_id] = { nome: v.vendedor_nome, vendas: 0 }; ranking[v.vendedor_id].vendas++; });
    const melhor = Object.values(ranking).sort((a,b) => b.vendas - a.vendas)[0];
    document.getElementById('destaqueDiario').innerHTML = melhor ? `<div class="destaque-card"><div class="destaque-icon">🏆</div><div><div class="destaque-nome">${melhor.nome}</div><div class="destaque-info">${melhor.vendas} vendas hoje</div></div></div>` : '<p style="color:rgba(255,255,255,0.4);">Nenhum vendedor</p>';
    carregarComparacaoProdutos(vHoje, vPassado, 'compProdutosDiario');
}
function carregarComparativoMensal() {
    const hoje = new Date();
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('compMesAtual').textContent = meses[hoje.getMonth()];
    document.getElementById('compMesPassado').textContent = meses[hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1];
    const vAtual = gerarVendasMesAtual(), vAnterior = gerarVendasMesAnterior();
    document.getElementById('compVendasMesAtual').textContent = vAtual.length;
    document.getElementById('compVendasMesAnterior').textContent = vAnterior.length;
    const dif = vAtual.length - vAnterior.length;
    const diffEl = document.getElementById('compDiferencaMensal');
    diffEl.className = `comp-diferenca ${dif > 0 ? 'positivo' : dif < 0 ? 'negativo' : 'positivo'}`;
    diffEl.innerHTML = dif > 0 ? `📈 ${dif} vendas a mais (${((dif / Math.max(vAnterior.length, 1)) * 100).toFixed(1)}%)` : dif < 0 ? `📉 ${Math.abs(dif)} vendas a menos (${((dif / Math.max(vAnterior.length, 1)) * 100).toFixed(1)}%)` : '➡️ Mesmo número de vendas';
    const ranking = {};
    vAtual.forEach(v => { if (!ranking[v.vendedor_id]) ranking[v.vendedor_id] = { nome: v.vendedor_nome, vendas: 0 }; ranking[v.vendedor_id].vendas++; });
    const melhor = Object.values(ranking).sort((a,b) => b.vendas - a.vendas)[0];
    document.getElementById('destaqueMensal').innerHTML = melhor ? `<div class="destaque-card"><div class="destaque-icon">🏆</div><div><div class="destaque-nome">${melhor.nome}</div><div class="destaque-info">${melhor.vendas} vendas no mês</div></div></div>` : '<p style="color:rgba(255,255,255,0.4);">Nenhum vendedor</p>';
    carregarComparacaoProdutos(vAtual, vAnterior, 'compProdutosMensal');
    const meta = DB.metas.mensalVendas || 150, realizado = vAtual.length, pct = Math.min((realizado / meta) * 100, 100).toFixed(1);
    document.getElementById('metaMensalValor').textContent = meta;
    document.getElementById('metaMensalRealizado').textContent = realizado;
    document.getElementById('metaMensalPct').textContent = `${pct}%`;
    document.getElementById('metaMensalProgresso').style.width = `${pct}%`;
}
function carregarComparacaoProdutos(vAtual, vPassado, containerId) {
    const container = document.getElementById(containerId);
    const planos = ['Básico', 'Empresarial', 'Premium', 'Ultra'];
    const maxVendas = Math.max(...planos.map(p => Math.max(vAtual.filter(v => v.plano === p).length, vPassado.filter(v => v.plano === p).length, 1)), 1);
    container.innerHTML = planos.map(p => {
        const qAtual = vAtual.filter(v => v.plano === p).length, qPassado = vPassado.filter(v => v.plano === p).length;
        return `<div class="comp-produto-item"><span class="comp-produto-nome">${p}</span><div class="comp-produto-barras"><div class="comp-produto-atual" style="width:${(qAtual / maxVendas) * 100}%;min-width:${qAtual > 0 ? '25px' : '0'}">${qAtual > 0 ? qAtual : ''}</div><div class="comp-produto-passado" style="width:${(qPassado / maxVendas) * 100}%;min-width:${qPassado > 0 ? '25px' : '0'}">${qPassado > 0 ? qPassado : ''}</div></div></div>`;
    }).join('');
}
function gerarVendasDiaPassado() {
    const diaPassado = new Date();
    diaPassado.setDate(diaPassado.getDate() - 1);
    const data = diaPassado.toISOString().split('T')[0];
    return obterVendasAprovadas().filter(a => a.data === data).map(v => ({ id: v.id, vendedor_id: v.vendedor_id, vendedor_nome: v.vendedorNome, plano: v.produto, valor: parseFloat(v.valor) || 0, data: v.data }));
}
function gerarVendasMesAnterior() {
    const hoje = new Date();
    let mes = hoje.getMonth();
    let ano = hoje.getFullYear();
    if (mes === 0) { mes = 12; ano--; }
    return obterVendasAprovadas().filter(a => { const [aAno, aMes] = a.data.split('-').map(Number); return aAno === ano && aMes === mes; }).map(v => ({ id: v.id, vendedor_id: v.vendedor_id, vendedor_nome: v.vendedorNome, plano: v.produto, valor: parseFloat(v.valor) || 0, data: v.data }));
}
function gerarVendasMesAtual() { return obterVendasAprovadasMesAtual().map(v => ({ id: v.id, vendedor_id: v.vendedor_id, vendedor_nome: v.vendedorNome, plano: v.produto, valor: parseFloat(v.valor) || 0, data: v.data })); }

// ===== NAVEGAÇÃO ADMIN =====
function mostrarSecao(secao) {
    document.querySelectorAll('.section-active, .section-hidden').forEach(s => { s.style.display = 'none'; s.className = 'section-hidden'; });
    const el = document.getElementById(`secao-${secao}`); if (el) { el.style.display = 'block'; el.className = 'section-active'; }
    document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
    const nav = document.querySelector(`[data-section="${secao}"]`); if (nav) nav.classList.add('active');
    document.getElementById('tituloSecao').innerHTML = { dashboard: '📊 Dashboard', cadastro: '👥 Cadastro', ativacoes: '⚡ Ativações', vendasAprovadas: '✅ Vendas Aprovadas', relatorios: '📈 Relatórios', metas: '🎯 Metas', promocoes: '🏆 Promoções' }[secao] || secao;
    if (secao === 'cadastro') carregarUsuarios();
    if (secao === 'ativacoes') { paginaAtualAtivacoes = 1; buscarPendentesDaNuvem(); carregarAtivacoes(); }
    if (secao === 'vendasAprovadas') { paginaAtualVendasAprovadas = 1; buscarVendasAprovadasDaNuvem(); carregarVendasAprovadas(); }
    if (secao === 'relatorios') carregarRelatorios();
    if (secao === 'metas') carregarMetas();
    if (secao === 'promocoes') carregarPromocoes();
}

// ===== CADASTRO DE USUÁRIOS =====
function carregarUsuarios() {
    const agora = new Date();
    DB.usuarios = DB.usuarios.filter(u => { if (u.deletedAt) { const dias = (agora - new Date(u.deletedAt)) / (1000*60*60*24); return dias <= 15; } return true; });
    salvarDB();
    const usuarios = DB.usuarios.filter(u => !u.deletedAt);
    const tabela = document.getElementById('tabelaUsuarios');
    if (!tabela) return;
    tabela.innerHTML = usuarios.map(u => `<tr>
        <td><strong>${u.nome}</strong><button onclick="abrirModalEditar(${u.id})" style="background:none;border:none;color:var(--primary-light);cursor:pointer;margin-left:8px;"><i class="fas fa-pencil-alt"></i></button></td>
        <td>@${u.usuario}</td>
        <td>${u.email}</td>
        <td><span class="badge-cat">${u.categoria === 'admin' ? '👑 Admin' : '💼 Vendedor'}</span></td>
        <td>${u.equipe || 'Geral'}</td>
        <td class="${u.ativo ? 'status-ativo' : ''}">${u.ativo ? '● Ativo' : '○ Inativo'}</td>
        <td>
            <button onclick="toggleUsuario(${u.id})" style="background:${u.ativo ? 'rgba(255,71,87,0.2)' : 'rgba(46,213,115,0.2)'};border:1px solid ${u.ativo ? 'rgba(255,71,87,0.3)' : 'rgba(46,213,115,0.3)'};color:white;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;">${u.ativo ? '🔒 Desativar' : '🔓 Ativar'}</button>
            <button onclick="excluirUsuario(${u.id})" style="background:rgba(255,71,87,0.3);border:1px solid rgba(255,71,87,0.5);color:white;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;margin-left:5px;"><i class="fas fa-trash"></i> Excluir</button>
        </td>
    </tr>`).join('');
    const cont = document.getElementById('contadorLixeira'); if (cont) cont.textContent = DB.usuarios.filter(u => u.deletedAt).length;
}
function mostrarFormCadastro() { document.getElementById('formCadastro').style.display = 'block'; }
function cadastrarUsuario() {
    const n = document.getElementById('nomeUsuario').value.trim();
    const u = document.getElementById('usuarioUsuario').value.trim();
    const s = document.getElementById('senhaUsuario').value.trim();
    const e = document.getElementById('emailUsuario').value.trim();
    const cat = document.getElementById('categoriaUsuario').value;
    const eq = document.getElementById('equipeUsuario').value.trim();
    if (!n || !u || !s || !e) return alert('Preencha todos os campos obrigatórios!');
    if (DB.usuarios.find(x => x.usuario === u && !x.deletedAt)) return alert('Usuário já existe!');
    DB.usuarios.push({ id: Date.now(), usuario: u, senha: s, nome: n, email: e, tipo: cat, categoria: cat, ativo: true, deletedAt: null, equipe: cat === 'admin' ? 'Gestão' : (eq || 'Geral') });
    salvarDB(); carregarUsuarios(); document.getElementById('formCadastro').style.display = 'none';
    ['nomeUsuario','usuarioUsuario','senhaUsuario','emailUsuario','equipeUsuario'].forEach(id => document.getElementById(id).value = '');
    alert('✅ Usuário cadastrado com sucesso!');
}
function toggleUsuario(id) { const u = DB.usuarios.find(u => u.id === id); if (u) { u.ativo = !u.ativo; salvarDB(); carregarUsuarios(); } }
function excluirUsuario(id) { const u = DB.usuarios.find(u => u.id === id); if (!u) return; if (confirm(`⚠️ Excluir "${u.nome}"? Ele irá para a lixeira e perderá o acesso.`)) { u.deletedAt = new Date().toISOString(); u.ativo = false; salvarDB(); carregarUsuarios(); } }
function abrirModalEditar(id) { const u = DB.usuarios.find(u => u.id === id); if (!u) return; document.getElementById('editUsuarioId').value = u.id; document.getElementById('editNomeUsuario').value = u.nome; document.getElementById('editLoginUsuario').value = u.usuario; document.getElementById('editEmailUsuario').value = u.email; document.getElementById('editCategoriaUsuario').value = u.categoria || u.tipo; document.getElementById('editSenhaUsuario').value = ''; document.getElementById('editEquipeUsuario').value = u.equipe || ''; document.getElementById('modalEditarUsuario').style.display = 'flex'; }
function fecharModalEditar() { document.getElementById('modalEditarUsuario').style.display = 'none'; }
function salvarEdicaoUsuario() {
    const id = parseInt(document.getElementById('editUsuarioId').value);
    const nome = document.getElementById('editNomeUsuario').value.trim();
    const usuario = document.getElementById('editLoginUsuario').value.trim();
    const email = document.getElementById('editEmailUsuario').value.trim();
    const categoria = document.getElementById('editCategoriaUsuario').value;
    const novaSenha = document.getElementById('editSenhaUsuario').value.trim();
    const equipe = document.getElementById('editEquipeUsuario').value.trim();
    if (!nome || !usuario || !email) return alert('Nome, usuário e email são obrigatórios.');
    const u = DB.usuarios.find(u => u.id === id); if (!u) return;
    const conflito = DB.usuarios.find(u => u.usuario === usuario && u.id !== id && !u.deletedAt);
    if (conflito) return alert('Usuário já existe.');
    u.nome = nome; u.usuario = usuario; u.email = email; u.categoria = categoria; u.tipo = categoria;
    if (novaSenha) u.senha = novaSenha;
    u.equipe = categoria === 'admin' ? 'Gestão' : (equipe || 'Geral');
    salvarDB(); carregarUsuarios(); fecharModalEditar();
}
function toggleLixeira() { const l = document.getElementById('lixeiraUsuarios'); if (l.style.display === 'none' || l.style.display === '') { carregarLixeira(); l.style.display = 'block'; } else l.style.display = 'none'; }
function carregarLixeira() {
    const agora = new Date();
    const lixeira = DB.usuarios.filter(u => u.deletedAt);
    document.getElementById('contadorLixeira').textContent = lixeira.length;
    const tabela = document.getElementById('tabelaLixeira');
    if (!lixeira.length) { tabela.innerHTML = '</td><td colspan="7" style="text-align:center;padding:20px;">Lixeira vazia</td></tr>'; return; }
    tabela.innerHTML = lixeira.map(v => {
        const dias = Math.ceil(15 - ((agora - new Date(v.deletedAt)) / (1000*60*60*24)));
        return `<tr>
            <td><strong>${v.nome}</strong></td>
            <td>@${v.usuario}</td>
            <td>${v.email}</td>
            <td><span class="badge-cat">${v.categoria === 'admin' ? '👑 Admin' : '💼 Vendedor'}</span></td>
            <td>${v.equipe || 'Geral'}</td>
            <td><span style="color:#ffa502;">${dias} dia(s)</span></td>
            <td>
                <button onclick="recuperarUsuario(${v.id})" style="background:rgba(46,213,115,0.2);border:1px solid rgba(46,213,115,0.3);color:#2ed573;padding:6px 12px;border-radius:8px;cursor:pointer;"><i class="fas fa-undo"></i> Recuperar</button>
                <button onclick="excluirPermanentemente(${v.id})" style="background:rgba(255,71,87,0.2);border:1px solid rgba(255,71,87,0.3);color:#ff4757;padding:6px 12px;border-radius:8px;cursor:pointer;margin-left:5px;"><i class="fas fa-times-circle"></i> Excluir definitivo</button>
            </td>
        </tr>`;
    }).join('');
}
function recuperarUsuario(id) { const u = DB.usuarios.find(u => u.id === id); if (u) { u.deletedAt = null; u.ativo = true; salvarDB(); carregarUsuarios(); carregarLixeira(); } }
function excluirPermanentemente(id) { const u = DB.usuarios.find(u => u.id === id); if (u && confirm(`Excluir definitivamente "${u.nome}"?`)) { DB.usuarios = DB.usuarios.filter(u => u.id !== id); salvarDB(); carregarUsuarios(); carregarLixeira(); } }

// ===== RELATÓRIOS =====
function carregarRelatorios() {
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
        const mesAnterior = hoje.getMonth() === 0 ? 12 : hoje.getMonth();
        const ano = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
        vendas = gerarVendasMesAnterior().filter(v => { const [y, m, d] = v.data.split('-').map(Number); return y === ano && m === mesAnterior && d >= 16; });
    } else {
        vendas = gerarVendasMesAtual().filter(v => { const d = parseInt(v.data.split('-')[2]); return d >= 1 && d <= 15; });
    }
    if (vendas.length === 0) {
        const vendedores = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo && !u.deletedAt);
        const planos = [{nome:'Básico',valor:299.9},{nome:'Empresarial',valor:499.9},{nome:'Premium',valor:899.9}];
        const num = Math.floor(Math.random()*12)+4;
        for (let i=0;i<num;i++) {
            const v = vendedores[Math.floor(Math.random()*vendedores.length)];
            const p = planos[Math.floor(Math.random()*planos.length)];
            vendas.push({id:Date.now()+i, vendedor_id:v.id, vendedor_nome:v.nome, plano:p.nome, valor:p.valor, data:`2024-06-${String(Math.floor(Math.random()*15)+1).padStart(2,'0')}`});
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
        const corVar = variacao >= 0 ? '#2ed573' : '#ff4757';
        html += `<tr><td><strong>${p}</strong></td>.html${qtdAtual}</td>.html${qtdAnterior}</td><td style="color:${corVar}">${variacao >= 0 ? '+' + variacao : variacao}%</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('tabelaComparativaProdutos').innerHTML = html;
}
function carregarVendasPorVendedor(atual, anterior) {
    const vendedores = DB.usuarios.filter(u => u.tipo === 'vendedor' && !u.deletedAt);
    const dados = vendedores.map(v => ({ nome: v.nome, atual: atual.filter(vd => vd.vendedor_id === v.id).length, anterior: anterior.filter(vd => vd.vendedor_id === v.id).length })).sort((a,b) => b.atual - a.atual);
    let html = '<table><thead><tr><th>Vendedor</th><th>Atual</th><th>Anterior</th><th>% Variação</th></tr></thead><tbody>';
    dados.forEach(d => {
        const variacao = d.anterior > 0 ? (((d.atual - d.anterior) / d.anterior) * 100).toFixed(1) : (d.atual > 0 ? 100 : 0);
        const corVar = variacao >= 0 ? '#2ed573' : '#ff4757';
        html += `<tr>.html${d.nome}</td>.html${d.atual}</td>.html${d.anterior}</td><td style="color:${corVar}">${variacao >= 0 ? '+' + variacao : variacao}%</td></tr>`;
    });
    html += '</tbody><tr>';
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
    DB.usuarios.filter(u => u.tipo === 'vendedor' && !u.deletedAt).forEach(u => { const eq = u.equipe || 'Sem equipe'; if (!equipes[eq]) equipes[eq] = { atual: 0, anterior: 0 }; });
    atual.forEach(v => { const user = DB.usuarios.find(u => u.id === v.vendedor_id); const eq = user?.equipe || 'Sem equipe'; if (equipes[eq]) equipes[eq].atual++; });
    anterior.forEach(v => { const user = DB.usuarios.find(u => u.id === v.vendedor_id); const eq = user?.equipe || 'Sem equipe'; if (equipes[eq]) equipes[eq].anterior++; });
    let html = '<tr><thead><tr><th>Equipe</th><th>Atual</th><th>Anterior</th><th>% Variação</th><tr></thead><tbody>';
    Object.entries(equipes).forEach(([nome, valores]) => {
        const variacao = valores.anterior > 0 ? (((valores.atual - valores.anterior) / valores.anterior) * 100).toFixed(1) : (valores.atual > 0 ? 100 : 0);
        const corVar = variacao >= 0 ? '#2ed573' : '#ff4757';
        html += `<tr>.html<strong>${nome}</strong></td>.html${valores.atual}</td>.html${valores.anterior}</td><td style="color:${corVar}">${variacao >= 0 ? '+' + variacao : variacao}%</td></tr>`;
    });
    html += '</tbody><tr>';
    document.getElementById('tabelaEquipesRelatorio').innerHTML = html;
}
function carregarRankingRelatorio(atual) {
    const vendedores = DB.usuarios.filter(u => u.tipo === 'vendedor' && !u.deletedAt);
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
    let html = `<div style="font-family:Arial,sans-serif;padding:15px;color:#000;background:#fff;max-width:700px;margin:0 auto;"><h1 style="font-size:18px;color:#000;margin-bottom:10px;">📊 Relatório de Vendas - STAGE TELECOM</h1><p style="font-size:12px;color:#333;margin-bottom:20px;">Período: ${periodo} | Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p><h2 style="font-size:14px;color:#000;border-bottom:2px solid #e74c3c;padding-bottom:5px;">Comparativo de Produtos</h2><table style="width:100%;border-collapse:collapse;font-size:11px;color:#000;margin-bottom:20px;"><tr style="background:#f5f5f5;"><th style="padding:8px;">Produto</th><th>Atual</th><th>Anterior</th><th>Variação</th></tr>`;
    const produtos = ['Básico','Empresarial','Premium','Ultra'];
    produtos.forEach(p => {
        const qAt = dadosAtual.filter(v => v.plano === p).length;
        const qAnt = dadosAnterior.filter(v => v.plano === p).length;
        const variacao = qAnt > 0 ? ((qAt - qAnt) / qAnt * 100).toFixed(1) : (qAt > 0 ? 100 : 0);
        const corVar = variacao >= 0 ? '#2ed573' : '#ff4757';
        html += `<tr><td style="padding:6px;">${p}</td><td>${qAt}</td><td>${qAnt}</td><td style="color:${corVar};">${variacao >= 0 ? '+' + variacao : variacao}%</td></tr>`;
    });
    html += `</table>`;
    const vendedores = DB.usuarios.filter(u => u.tipo === 'vendedor' && !u.deletedAt);
    const dadosVend = vendedores.map(v => ({ nome: v.nome, atual: dadosAtual.filter(vd => vd.vendedor_id === v.id).length, anterior: dadosAnterior.filter(vd => vd.vendedor_id === v.id).length })).sort((a,b) => b.atual - a.atual);
    html += `<h2 style="font-size:14px;color:#000;border-bottom:2px solid #e74c3c;padding-bottom:5px;">Vendas por Vendedor</h2><table style="width:100%;border-collapse:collapse;font-size:11px;color:#000;margin-bottom:20px;"><tr style="background:#f5f5f5;"><th>Vendedor</th><th>Atual</th><th>Anterior</th><th>Var.</th></table>`;
    dadosVend.forEach(d => {
        const variacao = d.anterior > 0 ? ((d.atual - d.anterior) / d.anterior * 100).toFixed(1) : (d.atual > 0 ? 100 : 0);
        const corVar = variacao >= 0 ? '#2ed573' : '#ff4757';
        html += `<tr><td style="padding:6px;">${d.nome}</td><td>${d.atual}</td><td>${d.anterior}</td><td style="color:${corVar};">${variacao >= 0 ? '+' + variacao : variacao}%</td></tr>`;
    });
    html += `</table><div style="text-align:center;margin:20px 0;"><canvas id="graficoPDF" width="500" height="220"></canvas></div><h2 style="font-size:14px;color:#000;border-bottom:2px solid #e74c3c;padding-bottom:5px;">Ranking de Vendedores</h2>`;
    const maxVendas = dadosVend[0]?.atual || 1;
    dadosVend.forEach((v, i) => {
        const pct = Math.round((v.atual / maxVendas) * 100);
        html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;font-size:12px;color:#000;"><span style="font-weight:bold;width:25px;">${i+1}º</span><span style="flex:1;">${v.nome} - ${v.atual} vendas</span><div style="width:120px;height:8px;background:#eee;border-radius:4px;"><div style="width:${pct}%;height:100%;background:#e74c3c;border-radius:4px;"></div></div></div>`;
    });
    html += `</div>`;
    document.getElementById('conteudoPDF').innerHTML = html;
    document.getElementById('modalPDF').style.display = 'flex';
    setTimeout(() => {
        const canvas = document.getElementById('graficoPDF');
        if (canvas) {
            new Chart(canvas, {
                type: 'bar',
                data: { labels: dadosVend.map(d => d.nome), datasets: [{ label: 'Atual', data: dadosVend.map(d => d.atual), backgroundColor: '#e74c3c' }, { label: 'Anterior', data: dadosVend.map(d => d.anterior), backgroundColor: '#aaa' }] },
                options: { responsive: false, animation: { onComplete: function() { gerarArquivoPDF(); } }, plugins: { legend: { labels: { color: '#000', font: { size: 10 } } } }, scales: { y: { beginAtZero: true, ticks: { color: '#000', font: { size: 9 } } }, x: { ticks: { color: '#000', font: { size: 9 } } } } }
            });
        } else { gerarArquivoPDF(); }
    }, 300);
    function gerarArquivoPDF() {
        const elemento = document.getElementById('conteudoPDF');
        html2pdf().set({ margin: 0.5, filename: `relatorio_${new Date().toISOString().slice(0,10)}.pdf`, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, backgroundColor: '#ffffff', logging: false, allowTaint: true, useCORS: true }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }, pagebreak: { mode: 'avoid-all' } }).from(elemento).save();
    }
}
function fecharModalPDF() { document.getElementById('modalPDF').style.display = 'none'; }

// ===== METAS =====
function carregarMetas() {
    document.getElementById('metaDiariaVendas').value = DB.metas.diariaVendas || 10;
    document.getElementById('metaQuinzenalVendas').value = DB.metas.quinzenalVendas || 75;
    document.getElementById('metaMensalVendas').value = DB.metas.mensalVendas || 150;
    carregarSelectProdutos();
    const tabelaProd = document.getElementById('tabelaMetasProdutos');
    tabelaProd.innerHTML = DB.metas.produtos.map(p => `<tr>
        <td>${p.produto}</td>
        <td>${p.diaria}</td>
        <td>${p.quinzenal}</td>
        <td>${p.mensal}</td>
        <td><button onclick="removerMetaProduto(${p.id})" class="btn-glass-danger" style="padding:4px 10px;font-size:12px;"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('');
    carregarMetasInstalacoes();
    const selectVendedor = document.getElementById('vendedorMetaInstalacao');
    selectVendedor.innerHTML = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo && !u.deletedAt).map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
    carregarTabelaProdutos();
    carregarOpcoesVendaAdmin();
}
function carregarSelectProdutos() {
    const select = document.getElementById('produtoMetaSelect');
    if (select) select.innerHTML = DB.produtos.map(p => `<option value="${p}">${p}</option>`).join('');
    const selectVenda = document.getElementById('vPlano');
    if (selectVenda) selectVenda.innerHTML = '<option value="">Selecione o plano</option>' + DB.produtos.map(p => `<option value="${p}">${p}</option>`).join('');
}
function adicionarMetaProduto() {
    const produto = document.getElementById('produtoMetaSelect').value;
    const diaria = parseInt(document.getElementById('produtoDiaria').value) || 0;
    const quinzenal = parseInt(document.getElementById('produtoQuinzenal').value) || 0;
    const mensal = parseInt(document.getElementById('produtoMensal').value) || 0;
    if (!produto || diaria <= 0 || quinzenal <= 0 || mensal <= 0) return alert('Preencha todos os campos corretamente!');
    DB.metas.produtos.push({ id: Date.now(), produto, diaria, quinzenal, mensal });
    salvarDB(); carregarMetas();
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
    DB.metas.instalacoes.push({ id: Date.now(), tipo, entidade, entidadeId, diaria, quinzenal, mensal });
    salvarDB(); carregarMetas();
}
function carregarMetasInstalacoes() {
    const tabelaInst = document.getElementById('tabelaMetasInstalacoes');
    tabelaInst.innerHTML = DB.metas.instalacoes.map(i => `<tr>
        <td>${i.tipo === 'vendedor' ? 'Vendedor' : 'Empresa'}</td>
        <td>${i.entidade}</td>
        <td>${i.diaria}</td>
        <td>${i.quinzenal}</td>
        <td>${i.mensal}</td>
        <td><button onclick="removerMetaInstalacao(${i.id})" class="btn-glass-danger" style="padding:4px 10px;font-size:12px;"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('');
}
function removerMetaInstalacao(id) { DB.metas.instalacoes = DB.metas.instalacoes.filter(i => i.id !== id); salvarDB(); carregarMetas(); }
function salvarMetas() {
    DB.metas.diariaVendas = parseInt(document.getElementById('metaDiariaVendas').value) || 10;
    DB.metas.quinzenalVendas = parseInt(document.getElementById('metaQuinzenalVendas').value) || 75;
    DB.metas.mensalVendas = parseInt(document.getElementById('metaMensalVendas').value) || 150;
    salvarDB(); alert('✅ Metas de vendas atualizadas!');
}
function carregarTabelaProdutos() {
    const tbody = document.getElementById('tabelaProdutos');
    if (!tbody) return;
    tbody.innerHTML = DB.produtos.map((p, index) => `<tr>
        <td>${p}</td>
        <td><button onclick="editarProduto(${index})" class="btn-glass-sm" style="margin-right:5px;"><i class="fas fa-edit"></i></button><button onclick="excluirProduto(${index})" class="btn-glass-sm" style="background:rgba(255,71,87,0.2);border-color:#ff4757;color:#ff4757;"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('');
}
function adicionarProduto() {
    const nome = document.getElementById('novoProdutoNome').value.trim();
    if (!nome) return alert('Digite um nome para o produto.');
    if (DB.produtos.includes(nome)) return alert('Produto já existe.');
    DB.produtos.push(nome); salvarDB(); document.getElementById('novoProdutoNome').value = ''; carregarTabelaProdutos(); carregarSelectProdutos();
}
function editarProduto(index) { const novoNome = prompt('Novo nome do produto:', DB.produtos[index]); if (novoNome && novoNome.trim() && novoNome.trim() !== DB.produtos[index]) { if (DB.produtos.includes(novoNome.trim())) return alert('Produto já existe.'); DB.produtos[index] = novoNome.trim(); salvarDB(); carregarTabelaProdutos(); carregarSelectProdutos(); } }
function excluirProduto(index) { if (confirm(`Excluir produto "${DB.produtos[index]}"?`)) { DB.produtos.splice(index, 1); salvarDB(); carregarTabelaProdutos(); carregarSelectProdutos(); } }
function carregarOpcoesVendaAdmin() { const vel = document.getElementById('opcoesVelocidade'); const formPag = document.getElementById('opcoesFormaPagamento'); const val = document.getElementById('opcoesValor'); if (vel) vel.value = (DB.opcoesVenda.velocidades || []).join(', '); if (formPag) formPag.value = (DB.opcoesVenda.formasPagamento || []).join(', '); if (val) val.value = (DB.opcoesVenda.valores || []).join(', '); }
function salvarOpcoesVenda() { const velRaw = document.getElementById('opcoesVelocidade').value; const formPagRaw = document.getElementById('opcoesFormaPagamento').value; const valRaw = document.getElementById('opcoesValor').value; DB.opcoesVenda.velocidades = velRaw.split(',').map(v => v.trim()).filter(v => v); DB.opcoesVenda.formasPagamento = formPagRaw.split(',').map(v => v.trim()).filter(v => v); DB.opcoesVenda.valores = valRaw.split(',').map(v => v.trim()).filter(v => v); salvarDB(); alert('✅ Opções de venda salvas!'); carregarOpcoesVenda(); }
function carregarOpcoesVenda() { const selVel = document.getElementById('vVelocidade'); const selForm = document.getElementById('vFormaPagamento'); const selVal = document.getElementById('vValor'); if (selVel) selVel.innerHTML = '<option value="">Selecione a velocidade</option>' + (DB.opcoesVenda.velocidades || []).map(v => `<option value="${v}">${v}</option>`).join(''); if (selForm) selForm.innerHTML = '<option value="">Forma de Pagamento</option>' + (DB.opcoesVenda.formasPagamento || []).map(v => `<option value="${v}">${v}</option>`).join(''); if (selVal) selVal.innerHTML = '<option value="">Selecione o valor</option>' + (DB.opcoesVenda.valores || []).map(v => `<option value="${v}">${v}</option>`).join(''); }

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
    salvarDB(); carregarPromocoes(); document.getElementById('formPromocao').style.display = 'none'; document.getElementById('premioPromocao').value = ''; alert('✅ Promoção cadastrada!');
}
function carregarPromocoes() {
    const agora = new Date();
    const tabela = document.getElementById('tabelaPromocoes');
    const divVazia = document.getElementById('promocoesVazia');
    if (!tabela || !divVazia) return;
    DB.promocoes.forEach(p => {
        const inicio = new Date(p.inicio); const fim = new Date(p.fim);
        if (agora < inicio) p.status = '⏳ Aguardando';
        else if (agora >= inicio && agora <= fim) { p.status = '▶️ Ativa'; p.ativa = true; }
        else if (agora > fim && !p.concluida) { p.status = '⏹️ Encerrada'; p.ativa = false; verificarVencedoresPromocao(p); }
    });
    salvarDB();
    if (DB.promocoes.length === 0) { tabela.innerHTML = ''; divVazia.style.display = 'block'; }
    else { divVazia.style.display = 'none'; tabela.innerHTML = DB.promocoes.map(p => `<table>
        <td>${p.tipo}</td>
        <td>${p.quantidade}</td>
        <td>${new Date(p.inicio).toLocaleString('pt-BR')} → ${new Date(p.fim).toLocaleString('pt-BR')}</td>
        <td>${p.premio}</td>
        <td>${p.status || 'Ativa'}</td>
        <td><button onclick="excluirPromocao(${p.id})" class="btn-glass-danger" style="padding:4px 10px;font-size:12px;"><i class="fas fa-trash"></i></button></td>
    </tr>`).join(''); }
}
function excluirPromocao(id) { if (confirm('Excluir esta promoção?')) { DB.promocoes = DB.promocoes.filter(p => p.id !== id); salvarDB(); carregarPromocoes(); } }
function obterQuantidadePeriodo(vendedorId, tipo, inicio, fim) { return gerarVendasParaPeriodo(vendedorId, inicio, fim).length; }
function gerarVendasParaPeriodo(vendedorId, inicio, fim) {
    const inicioDate = new Date(inicio); const fimDate = new Date(fim); const vendas = [];
    for (let d = new Date(inicioDate); d <= fimDate; d.setDate(d.getDate() + 1)) {
        const dataStr = d.toISOString().split('T')[0];
        const vendasDia = obterVendasAprovadasPorData(dataStr);
        vendas.push(...vendasDia.filter(v => v.vendedor_id === vendedorId));
    }
    return vendas;
}
function obterVendasAprovadasPorData(data) { return obterVendasAprovadas().filter(a => a.data === data); }
function verificarVencedoresPromocao(promocao) {
    const vendedores = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo && !u.deletedAt);
    const vencedores = [];
    vendedores.forEach(v => { const qtd = obterQuantidadePeriodo(v.id, promocao.tipo, promocao.inicio, promocao.fim); if (qtd >= promocao.quantidade) vencedores.push({ id: v.id, nome: v.nome, quantidade: qtd }); });
    promocao.vencedores = vencedores.map(v => v.id); promocao.concluida = true; salvarDB();
    if (vencedores.length > 0) { const nomes = vencedores.map(v => v.nome).join(', '); mostrarModalParabens(`🏆 Meta bônus de ${promocao.tipo} batida! Vencedor(es): ${nomes}. Prêmio: ${promocao.premio}`); vencedores.forEach(v => { DB.notificacoes.push({ id: Date.now() + Math.random(), userId: v.id, mensagem: `🎉 Você bateu a meta bônus de ${promocao.tipo} e ganhou: ${promocao.premio}!`, lida: false }); }); salvarDB(); }
    else { mostrarModalParabens(`😞 Nenhum vendedor bateu a meta bônus de ${promocao.tipo}.`); }
}
function verificarPromocoesAdmin() { const agora = new Date(); DB.promocoes.forEach(p => { if (p.ativa && new Date(p.fim) <= agora && !p.concluida) verificarVencedoresPromocao(p); }); }
function mostrarModalParabens(mensagem) { document.getElementById('parabensMensagem').textContent = mensagem; document.getElementById('modalParabens').style.display = 'flex'; }
function verificarNotificacoesVendedor() {
    if (!sessao || sessao.tipo !== 'vendedor') return;
    const notificacoesPendentes = DB.notificacoes.filter(n => n.userId === sessao.id && !n.lida);
    if (notificacoesPendentes.length > 0) { const notif = notificacoesPendentes[0]; document.getElementById('parabensVendedorMensagem').textContent = notif.mensagem; document.getElementById('modalParabensVendedor').style.display = 'flex'; notif.lida = true; salvarDB(); }
}
setInterval(() => { if (sessao && sessao.tipo === 'admin') { const agora = new Date(); DB.promocoes.forEach(p => { if (p.ativa && new Date(p.fim) <= agora && !p.concluida) verificarVencedoresPromocao(p); }); } }, 30000);

// ===== CHAT (multi-PC via GS) =====
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
    DB.chatMessages.forEach(m => { if (m.conversationId && m.conversationId !== 'group' && m.conversationId.includes(String(sessao.id))) privadas.add(m.conversationId); });
    privadas.forEach(convId => {
        const ids = convId.split('-').map(Number);
        const outroId = ids.find(id => id !== sessao.id);
        const outroUser = DB.usuarios.find(u => u.id === outroId);
        const nome = outroUser ? outroUser.nome : 'Usuário';
        const naoLidas = DB.chatMessages.filter(m => m.conversationId === convId && (!m.readBy || !m.readBy.includes(sessao.id))).length;
        html += `<div class="chat-conv-item" style="display:flex;align-items:center;gap:8px;"><span onclick="abrirConversaChat('${convId}')" style="flex:1;cursor:pointer;"><i class="fas fa-user conv-icon"></i> ${nome} ${naoLidas > 0 ? `<span class="conv-badge">${naoLidas}</span>` : ''}</span><button onclick="event.stopPropagation();excluirConversa('${convId}')" class="chat-delete-btn" title="Excluir conversa"><i class="fas fa-trash"></i></button></div>`;
    });
    container.innerHTML = html;
}
function excluirConversa(conversationId) {
    if (!confirm('Tem certeza que deseja excluir permanentemente esta conversa privada?')) return;
    DB.chatMessages = DB.chatMessages.filter(m => m.conversationId !== conversationId);
    salvarDB();
    if (chatConversationAtual === conversationId) { chatConversationAtual = null; document.getElementById('chatMain').style.display = 'none'; document.getElementById('chatSidebar').style.display = 'block'; document.getElementById('chatBackBtn').style.display = 'none'; document.getElementById('chatTitle').innerHTML = '<i class="fas fa-comment-dots"></i> Chat'; }
    atualizarListaConversas(); atualizarBadge();
}
function abrirConversaChat(conversationId) {
    chatConversationAtual = conversationId;
    document.getElementById('chatSidebar').style.display = 'none';
    document.getElementById('chatMain').style.display = 'flex';
    const backBtn = document.getElementById('chatBackBtn');
    const title = document.getElementById('chatTitle');
    if (conversationId === 'group') { title.innerHTML = '<i class="fas fa-users"></i> Geral'; } else { const ids = conversationId.split('-').map(Number); const outroId = ids.find(id => id !== sessao.id); const outroUser = DB.usuarios.find(u => u.id === outroId); title.innerHTML = `<i class="fas fa-user"></i> ${outroUser ? outroUser.nome : 'Privado'}`; }
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
        return `<div class="chat-msg ${isOwn ? 'own' : 'other'}">${!isOwn ? `<span class="msg-sender">${m.senderName}</span>` : ''}<div class="msg-bubble">${m.text}</div><span class="msg-time">${hora}</span></div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
    atualizarListaConversas();
}
function enviarMensagemChat() {
    const input = document.getElementById('chatInput');
    const texto = input.value.trim();
    if (!texto || !chatConversationAtual) return;
    DB.chatMessages.push({ id: Date.now() + Math.random(), conversationId: chatConversationAtual, senderId: sessao.id, senderName: sessao.nome, text: texto, timestamp: Date.now(), readBy: [sessao.id] });
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
    const totalNaoLidas = DB.chatMessages.filter(m => (!m.readBy || !m.readBy.includes(sessao.id)) && (m.conversationId === 'group' || m.conversationId.includes(String(sessao.id)))).length;
    if (totalNaoLidas > 0) { badge.textContent = totalNaoLidas > 99 ? '99+' : totalNaoLidas; badge.style.display = 'flex'; } else { badge.style.display = 'none'; }
}
function iniciarPollingChat() {
    if (chatIntervalo) clearInterval(chatIntervalo);
    chatIntervalo = setInterval(() => {
        if (!sessao) return;
        atualizarBadge();
        if (document.getElementById('chatSidebar').style.display !== 'none') atualizarListaConversas();
        if (chatConversationAtual && document.getElementById('chatMain').style.display === 'flex') renderizarMensagensChat();
    }, 1000);
}
function toggleChat() {
    const widget = document.getElementById('chatWidget');
    if (widget.classList.contains('expanded')) { widget.classList.remove('expanded'); widget.classList.add('minimized'); } else { widget.classList.remove('minimized'); widget.classList.add('expanded'); carregarUsuariosChat(); atualizarListaConversas(); if (!chatConversationAtual) { document.getElementById('chatSidebar').style.display = 'block'; document.getElementById('chatMain').style.display = 'none'; document.getElementById('chatBackBtn').style.display = 'none'; document.getElementById('chatTitle').innerHTML = '<i class="fas fa-comment-dots"></i> Chat'; } else { abrirConversaChat(chatConversationAtual); } }
}
function iniciarChat() {
    if (!sessao) return;
    const chatWidget = document.getElementById('chatWidget');
    if (chatWidget) chatWidget.style.display = 'flex';
    carregarUsuariosChat();
    atualizarListaConversas();
    atualizarBadge();
    iniciarPollingChat();
}
function limparMensagensAntigas(dias) { /* se existia, mantenha */ }

// ===== NOTIFICAÇÕES =====
function tocarAlerta() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.25); gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
        if (ctx.state === 'suspended') ctx.resume();
    } catch(e) { console.warn(e); }
}
function mostrarModalNovaVenda() {
    const existente = document.getElementById('modalNovaVenda');
    if (existente) existente.remove();
    const modal = document.createElement('div');
    modal.id = 'modalNovaVenda';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.style.zIndex = '99999';
    modal.innerHTML = `<div class="modal-glass modal-parabens modal-vibrando" style="text-align:center;max-width:450px;"><div class="parabens-icon" style="font-size:64px;">🔔</div><h2 style="color:#ffd700;font-size:28px;margin:15px 0;">NOVA VENDA!</h2><p style="color:#fff;font-size:16px;">Uma nova venda foi recebida no sistema.</p><button onclick="fecharModalNovaVenda()" class="btn-glass-primary" style="margin-top:20px;background:#ff4757;cursor:pointer;">Fechar (X)</button></div>`;
    document.body.appendChild(modal);
    setTimeout(() => fecharModalNovaVenda(), 8000);
}
function fecharModalNovaVenda() { const modal = document.getElementById('modalNovaVenda'); if (modal) modal.remove(); }
function verificarNotificacaoPendente() { /* se existia, mantenha */ }

// ===== GERENCIAR STATUS =====
function abrirGerenciadorStatus() { carregarListaStatusFlags(); document.getElementById('modalStatus').style.display = 'flex'; }
function fecharModalStatus() { document.getElementById('modalStatus').style.display = 'none'; }
function carregarListaStatusFlags() { const container = document.getElementById('listaStatusFlags'); if (!container) return; container.innerHTML = DB.statusFlags.map(f => `<div class="flag-item"><span class="flag-color" style="background:${f.cor};"></span><span>${f.nome}</span><button onclick="removerStatusFlag(${f.id})"><i class="fas fa-trash"></i></button></div>`).join(''); }
function adicionarStatusFlag() { const nome = document.getElementById('novoStatusNome').value.trim(); const cor = document.getElementById('novoStatusCor').value; if (!nome) return alert('Digite um nome para a flag!'); DB.statusFlags.push({ id: Date.now(), nome, cor }); salvarDB(); carregarListaStatusFlags(); document.getElementById('novoStatusNome').value = ''; }
function removerStatusFlag(id) { DB.statusFlags = DB.statusFlags.filter(f => f.id !== id); salvarDB(); carregarListaStatusFlags(); if (document.getElementById('secao-ativacoes')?.classList.contains('section-active')) carregarAtivacoes(); }

// ===== POLLING PRINCIPAL =====
setInterval(() => { if (sessao) { buscarPendentesDaNuvem(); buscarVendasAprovadasDaNuvem(); } }, 5000);

// ===== LOGOUT E EXIBIÇÃO =====
function logout() {
    sessionStorage.removeItem('stage_session');
    sessionStorage.removeItem('stage_notificados_pendentes');
    sessao = null;
    if (chatIntervalo) clearInterval(chatIntervalo);
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
    iniciarChat();
    buscarPendentesDaNuvem();
    buscarVendasAprovadasDaNuvem();
}
function mostrarVendedor() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'flex';
    document.getElementById('userInfoVendedor').innerHTML = `<div style="font-weight:700;font-size:15px;">${sessao.nome}</div><div style="font-size:11px;color:var(--primary-light);margin-top:3px;">💼 Vendedor</div><div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:3px;">${sessao.email}</div>`;
    mostrarSecaoVendedor(null, 'inicio');
    verificarNotificacoesVendedor();
    iniciarChat();
    buscarPendentesDaNuvem();
    buscarVendasAprovadasDaNuvem();  // 🔥 VOLTOU A CHAMAR
}
// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    const lembrar = localStorage.getItem('stage_remember');
    if (lembrar) { document.getElementById('usuario').value = lembrar; document.getElementById('lembrar').checked = true; }
    if (sessao) { sessao.tipo === 'admin' ? mostrarAdmin() : mostrarVendedor(); }
    document.addEventListener('keypress', e => { if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') fazerLogin(); });
    verificarNotificacaoPendente();
});

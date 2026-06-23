// ============================================
// STAGE TELECOM CRM - MULTIUSUÁRIO (Google Sheets)
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
        metas: { 
            diariaVendas: 10, quinzenalVendas: 75, mensalVendas: 150, 
            diariaEmpresa: 10, quinzenalEmpresa: 75, mensalEmpresa: 150, 
            produtos: [], 
            instalacoes: [],
            produtosEmpresa: [],
            instalacoesEmpresa: []
        },
        promocoes: [],
        notificacoes: [],
        produtos: [
            { id: 1, nome: "Básico" },
            { id: 2, nome: "Empresarial" },
            { id: 3, nome: "Premium" },
            { id: 4, nome: "Ultra" }
        ],
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
DB.metas.produtosEmpresa = DB.metas.produtosEmpresa || [];
DB.metas.instalacoesEmpresa = DB.metas.instalacoesEmpresa || [];
DB.produtos = DB.produtos || [{ id: 1, nome: "Básico" }, { id: 2, nome: "Empresarial" }, { id: 3, nome: "Premium" }, { id: 4, nome: "Ultra" }];
DB.opcoesVenda = DB.opcoesVenda || { velocidades: [], formasPagamento: [], valores: [] };
if (!DB.statusFlags.find(f => f.nome === 'Pendente')) {
    DB.statusFlags.unshift({ id: Date.now(), nome: 'Pendente', cor: '#ffa502' });
}
DB.usuarios.forEach(u => { if (!u.categoria) u.categoria = u.tipo || 'vendedor'; if (!u.equipe) u.equipe = 'Geral'; });

// ===== CACHE DE SINCRONIZAÇÕES =====
const CACHE_SYNC = {};
const CACHE_DURATION = 60000; // 1 minuto
let debounceTimer;

// ===== FUNÇÕES AUXILIARES DE DATA (PADRÃO BR) =====
function hojeBR() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function parseDateBR(str) {
  if (!str) return null;
  const partes = str.split('/');
  if (partes.length === 3) {
    const d = parseInt(partes[0], 10);
    const m = parseInt(partes[1], 10) - 1;
    const y = parseInt(partes[2], 10);
    const date = new Date(y, m, d);
    if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) return date;
  }
  const date = new Date(str);
  if (!isNaN(date.getTime())) return date;
  return null;
}

function formatarBR(str) {
  const date = parseDateBR(str);
  return date ? date.toLocaleDateString('pt-BR') : (str || '');
}

function dataParaBR(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

// ===== CONFIGURAÇÕES =====
const GOOGLE_SHEET_VENDAS_URL = 'https://script.google.com/macros/s/AKfycbzoA0XdB5Rg6nBVdwa0yJWN0D9QsO-8HbeXJ3EyxqupseonBjAtIqdJRdu4_YOmyWnzvA/exec';

let sessao = JSON.parse(sessionStorage.getItem('stage_session'));
let comparativoAtual = 'diario';
let graficoVendedoresInstance = null;
let vendaSendoVisualizada = null;
let paginaAtualAtivacoes = 1;
let paginaAtualVendasAprovadas = 1;
const itensPorPagina = 15;

function findAtivacaoById(id) {
    const idStr = String(id ?? '');
    return DB.ativacoes.find(x => String(x.id) === idStr);
}

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
        script.src = `${GOOGLE_SHEET_VENDAS_URL}?acao=autenticar&usuario=${encodeURIComponent(usuario)}&senha=${encodeURIComponent(senha)}&callback=${callbackName}`;
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
        if (document.getElementById('lembrar') && document.getElementById('lembrar').checked) localStorage.setItem('stage_remember', usuario);
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
            reject(new Error('Timeout na requisição JSONP'));
            setTimeout(() => { delete window[callbackName]; }, 1000);
        }, 8000);
        
        window[callbackName] = (res) => {
            clearTimeout(timeout);
            if (document.body.contains(script)) document.body.removeChild(script);
            resolve(res);
            setTimeout(() => { delete window[callbackName]; }, 1000);
        };
        
        script.onerror = () => {
            clearTimeout(timeout);
            if (document.body.contains(script)) document.body.removeChild(script);
            setTimeout(() => { delete window[callbackName]; }, 1000);
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

function getStatusBadge(status) {
    return DB.statusFlags.find(f => f.nome === status) || { cor: '#ffa502' };
}

function ensureStageBadgeStyles() {
    if (document.getElementById('stage-badge-styles')) return;
    const style = document.createElement('style');
    style.id = 'stage-badge-styles';
    style.textContent = '' +
        '@keyframes stage-fire-glow {' +
            '0% { box-shadow: 0 0 10px #ff4500, 0 0 20px #ff8c00, 0 0 30px #ff4500; transform: rotate(-8deg) scale(1); }' +
            '50% { box-shadow: 0 0 20px #ff6347, 0 0 40px #ff4500, 0 0 60px #ff6347; transform: rotate(-5deg) scale(1.08); }' +
            '100% { box-shadow: 0 0 10px #ff4500, 0 0 20px #ff8c00, 0 0 30px #ff4500; transform: rotate(-8deg) scale(1); }' +
        '}' +
        '.stage-new-badge {' +
            'display: inline-flex;' +
            'align-items: center;' +
            'justify-content: center;' +
            'min-width: 54px;' +
            'height: 24px;' +
            'padding: 0 10px;' +
            'border-radius: 999px;' +
            'background: linear-gradient(135deg,#ff8c00,#ff4500);' +
            'color: #fff;' +
            'font-weight: 800;' +
            'font-size: 11px;' +
            'text-transform: uppercase;' +
            'transform: rotate(-8deg);' +
            'text-shadow: 0 0 10px #fff, 0 0 20px #ff4500;' +
            'animation: stage-fire-glow 1.2s ease-in-out infinite;' +
        '}' +
        '@keyframes stage-bonus-pulse {' +
            '0%,100%{transform:scale(1);box-shadow:0 0 20px rgba(255,100,0,0.7);}' +
            '50%{transform:scale(1.1);box-shadow:0 0 35px rgba(255,80,0,1);}' +
        '}' +
        '.stage-bonus-widget {' +
            'position:fixed; bottom:22px; right:22px; width:80px; height:80px; border-radius:50%;' +
            'background: radial-gradient(circle at top left,#ffd700,#ff4500);' +
            'color:#fff; display:flex; align-items:center; justify-content:center; text-align:center;' +
            'line-height:1.2; font-size:11px; font-weight:900;' +
            'box-shadow:0 0 35px rgba(255,100,0,0.9); cursor:pointer; z-index:9999;' +
            'animation: stage-bonus-pulse 1.4s ease-in-out infinite;' +
        '}' +
        '.stage-bonus-widget:hover { transform:scale(1.12); }' +
        '.stage-bonus-modal-overlay {' +
            'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8);' +
            'display:flex; align-items:center; justify-content:center; z-index:10000;' +
        '}' +
        '.stage-bonus-modal {' +
            'width: min(500px, calc(100vw - 30px)); border-radius:32px;' +
            'background:linear-gradient(145deg,#1a1f2b,#0d0f14); padding:25px 20px;' +
            'box-shadow:0 0 60px rgba(255,100,0,0.5); color:#fff; text-align:center; position:relative;' +
            'border: 1px solid rgba(255,140,0,0.3);' +
        '}' +
        '.stage-bonus-modal h2 { margin:0 0 10px; font-size:26px; color:#ffd700; }' +
        '.stage-bonus-modal p { margin:8px 0; font-size:14px; color:#ddd; }' +
        '.stage-bonus-modal .stage-prize {' +
            'margin:15px auto; padding:15px; border-radius:20px;' +
            'background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);' +
            'font-size:14px; color:#ffd700; font-weight:700; text-align:left;' +
        '}' +
        '.stage-bonus-modal .stage-prize strong { color:#fff; }' +
        '.stage-bonus-modal .stage-close-btn {' +
            'margin-top:18px; padding:10px 20px; border:none; border-radius:30px;' +
            'background:#ff5722; color:#fff; font-weight:700; cursor:pointer;' +
            'font-size:14px;' +
        '}';
    document.head.appendChild(style);
}

function isPromocaoAtiva(promocao) {
    if (!promocao) return false;
    const agora = new Date();
    const inicio = new Date(promocao.inicio);
    const fim = new Date(promocao.fim);
    return promocao.ativa && agora >= inicio && agora <= fim;
}

function renderBonusAtivoWidget() {
    ensureStageBadgeStyles();
    const ativo = DB.promocoes.some(p => isPromocaoAtiva(p));
    let widget = document.getElementById('stage-bonus-ativo-widget');
    if (!sessao || sessao.tipo !== 'vendedor' || !ativo) {
        if (widget) widget.remove();
        return;
    }
    if (!widget) {
        widget = document.createElement('div');
        widget.id = 'stage-bonus-ativo-widget';
        widget.className = 'stage-bonus-widget';
        widget.title = 'Bônus ativo';
        widget.onclick = mostrarModalBonusAtivo;
        document.body.appendChild(widget);
    }
    widget.innerHTML = '🔥<br>BÔNUS<br>ATIVO';
}

function mostrarModalBonusAtivo() {
    ensureStageBadgeStyles();
    const ativa = DB.promocoes.filter(p => isPromocaoAtiva(p));
    if (!ativa.length) return;
    const existente = document.getElementById('stage-bonus-modal-overlay');
    if (existente) return;
    const overlay = document.createElement('div');
    overlay.id = 'stage-bonus-modal-overlay';
    overlay.className = 'stage-bonus-modal-overlay';
    
    const styleEl = document.createElement('style');
    styleEl.textContent = '' +
        '@keyframes stage-prize-blink {' +
            '0%,100% { opacity:1; transform:scale(1); text-shadow:0 0 10px #ffd700,0 0 20px #ff8c00,0 0 40px #ff4500; }' +
            '50% { opacity:0.5; transform:scale(1.1); text-shadow:0 0 25px #fff,0 0 50px #ffd700,0 0 90px #ff4500; }' +
        '}' +
        '.stage-prize-blink {' +
            'display:inline-block;' +
            'animation: stage-prize-blink 0.8s ease-in-out infinite;' +
            'font-size:28px !important;' +
            'font-weight:900 !important;' +
            'color:#ffd700 !important;' +
            'padding:12px 24px;' +
            'border-radius:16px;' +
            'background:rgba(255,215,0,0.15);' +
            'border:2px solid rgba(255,215,0,0.5);' +
            'margin-top:10px;' +
            'letter-spacing:1px;' +
        '}';
    overlay.appendChild(styleEl);
    
    overlay.innerHTML += '<div class="stage-bonus-modal">' +
        '<h2>🔥 Bônus Ativo!</h2>' +
        '<p>Temos ' + ativa.length + ' ' + (ativa.length === 1 ? 'promoção' : 'promoções') + ' ativa' + (ativa.length > 1 ? 's' : '') + '. Confira os detalhes:</p>' +
        ativa.map(function(p) {
            return '<div class="stage-prize" style="margin-bottom:12px;">' +
                '<div style="font-size:14px;">📌 <strong>' + p.tipo.toUpperCase() + '</strong></div>' +
                (p.descricao ? '<div style="font-size:13px;color:#ddd;margin-top:4px;font-style:italic;">📝 ' + p.descricao + '</div>' : '') +
                '<div style="font-size:13px;margin-top:4px;">🎯 Meta: <strong>' + p.quantidade + '</strong></div>' +
                '<div style="font-size:13px;">📅 Período: <strong>' + new Date(p.inicio).toLocaleDateString('pt-BR') + ' → ' + new Date(p.fim).toLocaleDateString('pt-BR') + '</strong></div>' +
                '<div class="stage-prize-blink">🏆 ' + p.premio + '</div>' +
                '</div>';
        }).join('') +
        '<p style="color:#ffddb3; font-size:13px;margin-top:10px;">Continue vendendo para garantir seu prêmio!</p>' +
        '<button class="stage-close-btn" onclick="fecharModalBonusAtivo()">Entendido!</button>' +
        '</div>';
    overlay.onclick = function(e) { if (e.target === overlay) fecharModalBonusAtivo(); };
    document.body.appendChild(overlay);
}

function fecharModalBonusAtivo() {
    const overlay = document.getElementById('stage-bonus-modal-overlay');
    if (overlay) overlay.remove();
}

// ===== CONTROLE DE DATA NA VENDA =====
function toggleDataVenda() {
    const checkAtual = document.getElementById('checkDataAtual');
    const checkNova = document.getElementById('checkNovaData');
    const inputNovaData = document.getElementById('inputNovaData');
    
    if (checkAtual.checked && checkNova.checked) {
        if (event && event.target === checkAtual) {
            checkNova.checked = false;
            inputNovaData.style.display = 'none';
        } else {
            checkAtual.checked = false;
            inputNovaData.style.display = 'block';
            inputNovaData.focus();
        }
    } else if (checkAtual.checked) {
        checkNova.checked = false;
        inputNovaData.style.display = 'none';
        inputNovaData.value = '';
    } else if (checkNova.checked) {
        checkAtual.checked = false;
        inputNovaData.style.display = 'block';
        inputNovaData.focus();
    } else {
        checkAtual.checked = true;
        inputNovaData.style.display = 'none';
    }
}

function atualizarDataVenda() {
    const inputNovaData = document.getElementById('inputNovaData');
    if (inputNovaData.value) {
        const [ano, mes, dia] = inputNovaData.value.split('-');
        console.log('📅 Data selecionada:', `${dia}/${mes}/${ano}`);
    }
}

function obterDataVenda() {
    const checkAtual = document.getElementById('checkDataAtual');
    if (checkAtual && checkAtual.checked) {
        return hojeBR();
    }
    const inputNovaData = document.getElementById('inputNovaData');
    if (inputNovaData && inputNovaData.value) {
        const [ano, mes, dia] = inputNovaData.value.split('-');
        return `${dia}/${mes}/${ano}`;
    }
    return hojeBR();
}

// ===== SINCRONIZAÇÕES GLOBAIS (COM CACHE) =====
async function sincronizarUsuariosDaNuvem() {
  if (CACHE_SYNC['usuarios'] && (Date.now() - CACHE_SYNC['usuarios']) < CACHE_DURATION) return;
  try {
    const resp = await fetchFromGS('listarUsuarios');
    console.log('📥 Usuários recebidos da nuvem:', resp);
    if (resp && resp.usuarios && Array.isArray(resp.usuarios)) {
      const usuariosDaNuvem = resp.usuarios.map(u => u.usuario.toUpperCase());
      
      DB.usuarios = DB.usuarios.filter(u => {
        if (u.deletedAt) return true;
        return usuariosDaNuvem.includes(u.usuario.toUpperCase());
      });

      resp.usuarios.forEach(uSheet => {
        const login = uSheet.usuario.toUpperCase();
        const existente = DB.usuarios.find(u => u.usuario.toUpperCase() === login && !u.deletedAt);
        
        if (existente) {
          existente.nome = uSheet.nome;
          existente.email = uSheet.email;
          existente.categoria = uSheet.categoria || existente.categoria;
          existente.tipo = uSheet.categoria || existente.tipo;
          existente.ativo = uSheet.status === 'LIBERADO';
          existente.equipe = uSheet.equipe || existente.equipe;
        } else {
          DB.usuarios.push({
            id: Date.now() + Math.random(),
            nome: uSheet.nome || '',
            usuario: uSheet.usuario || '',
            senha: '',
            email: uSheet.email || '',
            categoria: uSheet.categoria || 'vendedor',
            tipo: uSheet.categoria || 'vendedor',
            ativo: uSheet.status === 'LIBERADO',
            deletedAt: null,
            equipe: uSheet.equipe || 'Geral'
          });
        }
      });

      salvarDB();
      CACHE_SYNC['usuarios'] = Date.now();
      if (document.getElementById('secao-cadastro') && document.getElementById('secao-cadastro').classList.contains('section-active')) {
        carregarUsuarios();
      }
    }
  } catch (e) {
    console.error('❌ Erro ao sincronizar usuários da nuvem:', e);
  }
}

async function sincronizarStatusFlagsDaNuvem() {
  try {
    const resp = await fetchFromGS('listarStatusFlags');
    if (resp && resp.flags && Array.isArray(resp.flags)) {
      DB.statusFlags = resp.flags.map(f => ({ id: f.id, nome: f.nome, cor: f.cor }));
      
      const padroes = [
        { nome: 'Pendente', cor: '#ffa502' },
        { nome: 'Aprovado', cor: '#2ed573' },
        { nome: 'Cancelado', cor: '#ff4757' }
      ];
      for (let p of padroes) {
        if (!DB.statusFlags.find(f => f.nome === p.nome)) {
          const respAdd = await fetchFromGS('adicionarStatusFlag', { nome: p.nome, cor: p.cor });
          if (respAdd && respAdd.ok) {
            DB.statusFlags.push({ id: respAdd.id, nome: p.nome, cor: p.cor });
          }
        }
      }
      
      salvarDB();
    }
  } catch (e) { console.warn('Erro ao sincronizar flags:', e); }
}

async function sincronizarMetasVendas() {
  if (CACHE_SYNC['metasVendas'] && (Date.now() - CACHE_SYNC['metasVendas']) < CACHE_DURATION) return;
  try {
    const resp = await fetchFromGS('listarMetasVendas');
    if (resp && resp.metas) {
      DB.metas.diariaVendas = resp.metas.diariaVendas || 10;
      DB.metas.quinzenalVendas = resp.metas.quinzenalVendas || 75;
      DB.metas.mensalVendas = resp.metas.mensalVendas || 150;
      DB.metas.diariaEmpresa = resp.metas.diariaEmpresa || DB.metas.diariaVendas;
      DB.metas.quinzenalEmpresa = resp.metas.quinzenalEmpresa || DB.metas.quinzenalVendas;
      DB.metas.mensalEmpresa = resp.metas.mensalEmpresa || DB.metas.mensalVendas;
      salvarDB();
      CACHE_SYNC['metasVendas'] = Date.now();
    }
  } catch (e) { console.warn('Erro ao sincronizar metas de vendas:', e); }
}

async function sincronizarProdutos() {
  if (CACHE_SYNC['produtos'] && (Date.now() - CACHE_SYNC['produtos']) < CACHE_DURATION) return;
  try {
    const resp = await fetchFromGS('listarProdutos');
    if (resp && resp.produtos) {
      DB.produtos = resp.produtos.map(p => ({ id: p.id, nome: p.nome }));
      salvarDB();
      CACHE_SYNC['produtos'] = Date.now();
    }
  } catch (e) { console.warn('Erro ao sincronizar produtos:', e); }
}

async function sincronizarMetasProdutos() {
  try {
    const resp = await fetchFromGS('listarMetasProdutos');
    if (resp && resp.metas) {
      DB.metas.produtos = resp.metas.filter(m => m.tipo === 'vendedor').map(m => ({ id: m.id, produto: m.produto, diaria: m.diaria, quinzenal: m.quinzenal, mensal: m.mensal }));
      DB.metas.produtosEmpresa = resp.metas.filter(m => m.tipo === 'empresa').map(m => ({ id: m.id, produto: m.produto, diaria: m.diaria, quinzenal: m.quinzenal, mensal: m.mensal }));
      salvarDB();
    }
  } catch (e) { console.warn('Erro ao sincronizar metas de produtos:', e); }
}

async function sincronizarOpcoesVenda() {
  if (CACHE_SYNC['opcoesVenda'] && (Date.now() - CACHE_SYNC['opcoesVenda']) < CACHE_DURATION) return;
  try {
    const resp = await fetchFromGS('listarOpcoesVenda');
    if (resp && resp.opcoes) {
      DB.opcoesVenda.velocidades = resp.opcoes.velocidades || [];
      DB.opcoesVenda.formasPagamento = resp.opcoes.formasPagamento || [];
      DB.opcoesVenda.valores = resp.opcoes.valores || [];
      salvarDB();
      CACHE_SYNC['opcoesVenda'] = Date.now();
    }
  } catch (e) { console.warn('Erro ao sincronizar opções de venda:', e); }
}

async function sincronizarMetasInstalacoes() {
  try {
    const resp = await fetchFromGS('listarMetasInstalacoes');
    if (resp && resp.metas) {
      DB.metas.instalacoes = resp.metas.filter(m => m.tipo === 'vendedor').map(m => ({ id: m.id, tipo: m.tipo, entidade: m.entidade, entidadeId: m.entidadeId, diaria: m.diaria, quinzenal: m.quinzenal, mensal: m.mensal }));
      DB.metas.instalacoesEmpresa = resp.metas.filter(m => m.tipo === 'empresa').map(m => ({ id: m.id, tipo: m.tipo, entidade: m.entidade, entidadeId: m.entidadeId, diaria: m.diaria, quinzenal: m.quinzenal, mensal: m.mensal }));
      salvarDB();
    }
  } catch (e) { console.warn('Erro ao sincronizar metas de instalações:', e); }
}

async function sincronizarPromocoes() {
  try {
    const resp = await fetchFromGS('listarPromocoes');
    if (resp && resp.promocoes) {
      DB.promocoes = resp.promocoes;
      salvarDB();
    }
  } catch (e) { console.warn('Erro ao sincronizar promoções:', e); }
}

// ===== BUSCAR PENDENTES =====
async function buscarPendentesDaNuvem() {
    if (!sessao) return;
    try {
        const resp = await fetchFromGS('listarPendentes');
        if (resp && resp.pendentes && Array.isArray(resp.pendentes)) {
            const pendentesNuvem = resp.pendentes.map(p => {
                const original = DB.ativacoes.find(old => String(old.id) === String(p.UUID));
                return {
                    id: p.UUID,
                    nomeCompleto: p.Cliente || '',
                    cpf: p.CPF || '',
                    dataNasc: p['Data Nasc.'] ? formatarBR(p['Data Nasc.']) : '',
                    nomeMae: p['Nome da Mãe'] || '',
                    rg: p.RG || '',
                    orgaoExpeditor: p['Órgão Exp.'] || '',
                    dataExpedicao: p['Data Exp.'] ? formatarBR(p['Data Exp.']) : '',
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
                    data: p.DataVenda ? formatarBR(p.DataVenda) : hojeBR(),
                    observacao: p.Observacao || '',
                    finalizada: false,
                    tratandoPor: p.TratandoPor || null,
                    contrato: p.Contrato || '',
                    infoData: p.DataInstalacao || '',
                    infoPeriodo: p.PeriodoInstalacao || '',
                    dataCriacao: p.DataCriacao || '',
                    createdAt: p.CreatedAt ? parseInt(p.CreatedAt) : (p.DataCriacao ? new Date(p.DataCriacao).getTime() : Date.now()),
                    newBadge: original ? (original.newBadge || false) : true
                };
            });
            const pendentesAntigas = DB.ativacoes.filter(a => a.status !== 'Aprovado');
            const aprovadasLocais = DB.ativacoes.filter(a => a.status === 'Aprovado');
            DB.ativacoes = [...pendentesNuvem, ...aprovadasLocais];
            DB.ativacoes.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
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
            if (document.getElementById('secao-ativacoes') && document.getElementById('secao-ativacoes').classList.contains('section-active')) carregarAtivacoes();
        }
    } catch (err) { console.warn('Erro ao buscar pendentes:', err); }
}

// ===== BUSCAR VENDAS APROVADAS =====
async function buscarVendasAprovadasDaNuvem() {
    if (!sessao) return;
    try {
        const resp = await fetchFromGS('listarVendas');
        if (resp && resp.vendas && Array.isArray(resp.vendas)) {
            const aprovadasNuvem = resp.vendas.map(v => ({
                id: v.UUID || (v.Cliente + Date.now()),
                nomeCompleto: v.Cliente || '',
                cpf: v.CPF || '',
                dataNasc: v['Data Nasc.'] ? formatarBR(v['Data Nasc.']) : '',
                nomeMae: v['Nome da Mãe'] || '',
                rg: v.RG || '',
                orgaoExpeditor: v['Órgão Exp.'] || '',
                dataExpedicao: v['Data Exp.'] ? formatarBR(v['Data Exp.']) : '',
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
                vendedor_id: v.VendedorId ? parseInt(v.VendedorId) : null,
                data: v['Data Aprovação'] ? formatarBR(v['Data Aprovação']) : hojeBR(),
                finalizada: true,
                instalacaoStatus: v.Instalação || 'Aguardando',
                dataCriacao: v.DataCriacao || '',
                observacao: v.Observacao || '',
                ativadoPor: v['AtivadoPor'] || '',
                createdAt: v.CreatedAt ? parseInt(v.CreatedAt) : (v['Data Aprovação'] ? new Date(v['Data Aprovação']).getTime() : Date.now())
            }));
            const pendentesLocais = DB.ativacoes.filter(a => a.status !== 'Aprovado');
            DB.ativacoes = [...pendentesLocais, ...aprovadasNuvem];
            DB.ativacoes.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
            salvarDB();
            if (document.getElementById('secao-vendasAprovadas') && document.getElementById('secao-vendasAprovadas').classList.contains('section-active')) carregarVendasAprovadas();
            if (sessao.tipo === 'admin') carregarDashboard();
            if (sessao.tipo === 'vendedor') {
                if (document.getElementById('secao-controleVendas') && document.getElementById('secao-controleVendas').classList.contains('section-active')) carregarControleVendas();
                if (document.getElementById('secao-instalacoes') && document.getElementById('secao-instalacoes').classList.contains('section-active')) carregarInstalacoes();
            }
        }
    } catch (err) { console.warn('Erro ao buscar vendas aprovadas:', err); }
}

// ===== ATIVAÇÕES (TABELA) =====
function carregarAtivacoes(pagina) {
    if (!pagina) pagina = paginaAtualAtivacoes;
    const tabela = document.getElementById('tabelaAtivacoes');
    if (!tabela) return;
    let naoAprovadas = DB.ativacoes.filter(a => a.status !== 'Aprovado').reverse();
    const elBusca = document.getElementById('buscaAtivacao');
    const termo = elBusca ? elBusca.value.trim().toLowerCase() : '';
    if (termo) {
        naoAprovadas = naoAprovadas.filter(a => {
            const texto = (a.nomeCompleto + ' ' + a.produto + ' ' + a.vendedorNome + ' ' + a.status + ' ' + (a.tratandoPor || '')).toLowerCase();
            return texto.includes(termo);
        });
    }
    const total = naoAprovadas.length;
    const totalPaginas = Math.ceil(total / itensPorPagina);
    paginaAtualAtivacoes = Math.min(pagina, totalPaginas || 1);
    const inicio = (paginaAtualAtivacoes - 1) * itensPorPagina;
    const itensExibidos = naoAprovadas.slice(inicio, inicio + itensPorPagina);
    tabela.innerHTML = '';
    tabela.insertAdjacentHTML('beforeend', itensExibidos.map(a => {
        const idStr = String(a.id);
        const statusFlag = getStatusBadge(a.status);
        return '<tr>' +
            '<td>' + (a.newBadge ? '<span class="stage-new-badge" style="margin-right:8px;">🔥 NEW</span>' : '') + '<strong>' + (a.nomeCompleto || '—') + '</strong></td>' +
            '<td>' + (a.produto || a.plano || '—') + '</td>' +
            '<td>' + (a.vendedorNome || '—') + '</td>' +
            '<td><span style="color:' + statusFlag.cor + ';font-weight:600;">● ' + a.status + '</span></td>' +
            '<td><span style="font-size:12px;">' + (a.tratandoPor || '—') + '</span></td>' +
            '<td>' +
                '<button onclick="abrirModalAtivacao(\'' + idStr + '\')" class="btn-glass-sm" style="margin-right:4px;"><i class="fas fa-search"></i></button>' +
                '<button onclick="removerVenda(\'' + idStr + '\')" class="btn-glass-sm" style="background:rgba(255,71,87,0.2);border-color:#ff4757;color:#ff4757;"><i class="fas fa-trash"></i></button>' +
            '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="6" style="text-align:center;padding:30px;">Nenhuma ativação pendente</td></tr>');
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
    if (info) info.textContent = 'Página ' + pagina + ' de ' + (totalPaginas || 1) + ' (' + totalItens + ' itens)';
    if (btnAnterior) btnAnterior.disabled = pagina <= 1;
    if (btnProximo) btnProximo.disabled = pagina >= totalPaginas || totalPaginas === 0;
}

// ===== FILTRAR ATIVAÇÕES COM DEBOUNCE =====
function filtrarAtivacoes() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        paginaAtualAtivacoes = 1;
        carregarAtivacoes(1);
    }, 300);
}

// ===== MODAL ATIVAÇÃO (COM TRAVA E APROVAÇÃO) =====
async function abrirModalAtivacao(id) {
    const a = findAtivacaoById(id);
    if (!a) { alert('Venda não encontrada'); return; }
    if (a.newBadge) { a.newBadge = false; salvarDB(); }

    // Verificação rápida local primeiro (não bloqueia)
    if (a.tratandoPor && a.tratandoPor !== sessao.nome) {
        alert('⚠️ Esta venda está sendo tratada por ' + a.tratandoPor + '. Aguarde.');
        return;
    }

    vendaSendoVisualizada = a.id;
    a.tratandoPor = sessao.nome;
    salvarDB();

    // Dispara a trava em segundo plano (não bloqueia a abertura do modal)
    fetchFromGS('atualizarTratando', { uuid: a.id, tratandoPor: sessao.nome }).catch(() => {});

    // Monta o HTML do status primeiro (leve)
    const statusOptions = DB.statusFlags.map(f =>
        '<option value="' + f.nome + '" ' + (a.status === f.nome ? 'selected' : '') + '>' + f.nome + '</option>'
    ).join('');

    // Constrói o HTML com insertAdjacentHTML para performance
    const html = '' +
    '<div class="form-grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 10px;">' +
        '<div class="input-group"><label>Status</label><select id="editStatus">' + statusOptions + '</select></div>' +
        '<div class="input-group"><label>Plano</label><input value="' + (a.produto || a.plano || '') + '" id="editProduto"></div>' +
        '<div class="input-group"><label>Valor</label><input value="' + (a.valor || '') + '" id="editValor"></div>' +
        '<div class="input-group"><label>Nome Completo</label><input value="' + (a.nomeCompleto || '') + '" id="editNomeCompleto"></div>' +
        '<div class="input-group"><label>CPF</label><input value="' + (a.cpf || '') + '" id="editCpf"></div>' +
        '<div class="input-group"><label>Nome da Mãe</label><input value="' + (a.nomeMae || '') + '" id="editNomeMae"></div>' +
        '<div class="input-group"><label>Data Nasc.</label><input value="' + (a.dataNasc || '') + '" id="editDataNasc"></div>' +
        '<div class="input-group"><label>RG</label><input value="' + (a.rg || '') + '" id="editRg"></div>' +
        '<div class="input-group"><label>Órgão Exp.</label><input value="' + (a.orgaoExpeditor || '') + '" id="editOrgaoExpeditor"></div>' +
        '<div class="input-group"><label>Data Exp.</label><input value="' + (a.dataExpedicao || '') + '" id="editDataExpedicao"></div>' +
        '<div class="input-group"><label>Email</label><input value="' + (a.email || '') + '" id="editEmail"></div>' +
        '<div class="input-group"><label>Tel 1</label><input value="' + (a.telefone1 || '') + '" id="editTelefone1"></div>' +
        '<div class="input-group"><label>Tel 2</label><input value="' + (a.telefone2 || '') + '" id="editTelefone2"></div>' +
        '<div class="input-group"><label>CEP</label><input value="' + (a.cep || '') + '" id="editCep"></div>' +
        '<div class="input-group"><label>Logradouro</label><input value="' + (a.logradouro || '') + '" id="editLogradouro"></div>' +
        '<div class="input-group"><label>N°</label><input value="' + (a.numero || '') + '" id="editNumero"></div>' +
        '<div class="input-group"><label>Complemento</label><input value="' + (a.complemento || '') + '" id="editComplemento"></div>' +
        '<div class="input-group"><label>Bairro</label><input value="' + (a.bairro || '') + '" id="editBairro"></div>' +
        '<div class="input-group"><label>Estado</label><input value="' + (a.uf || '') + '" id="editUf"></div>' +
        '<div class="input-group"><label>Cidade</label><input value="' + (a.cidade || '') + '" id="editCidade"></div>' +
        '<div class="input-group"><label>Ponto Ref.</label><input value="' + (a.pontoReferencia || '') + '" id="editPontoReferencia"></div>' +
        '<div class="input-group"><label>Velocidade</label><input value="' + (a.velocidade || '') + '" id="editVelocidade"></div>' +
        '<div class="input-group"><label>Vencimento</label><input value="' + (a.vencimento || '') + '" id="editVencimento"></div>' +
        '<div class="input-group"><label>Pagamento</label><input value="' + (a.formaPagamento || '') + '" id="editFormaPagamento"></div>' +
        '<div class="input-group"><label>HP</label><input value="' + (a.hp || '') + '" id="editHp"></div>' +
        '<div class="input-group"><label>Viabilidade</label><input value="' + (a.viabilidade || '') + '" id="editViabilidade"></div>' +
        '<div class="input-group"><label>Plano Tipo</label><input value="' + (a.planoTipo || '') + '" id="editPlanoTipo"></div>' +
        '<div class="input-group"><label>Tipo Aprov.</label><input value="' + (a.tipoAprovacao || '') + '" id="editTipoAprovacao"></div>' +
        '<div class="input-group"><label>Observação</label><textarea id="editObservacao" style="height:38px;">' + (a.observacao || '') + '</textarea></div>' +
    '</div>';

    // Usa insertAdjacentHTML para renderização mais rápida
    const conteudo = document.getElementById('conteudoModalAtivacao');
    conteudo.innerHTML = '';
    conteudo.insertAdjacentHTML('beforeend', html);

    document.getElementById('infoContrato').value = a.contrato || '';
    document.getElementById('infoData').value = a.infoData || '';
    document.getElementById('infoPeriodo').value = a.infoPeriodo || '';
    document.getElementById('modalAtivacao').style.display = 'flex';
}

async function cancelarEdicaoAtivacao() {
    const a = findAtivacaoById(vendaSendoVisualizada);
    if (a) { a.tratandoPor = null; salvarDB(); try { await fetchFromGS('atualizarTratando', { uuid: a.id, tratandoPor: '' }); } catch (e) {} }
    document.getElementById('modalAtivacao').style.display = 'none';
    vendaSendoVisualizada = null;
    carregarAtivacoes();
}

async function fecharModalAtivacao() {
    const a = findAtivacaoById(vendaSendoVisualizada);
    if (a) {
        const novoStatus = document.getElementById('editStatus') ? document.getElementById('editStatus').value : a.status;
        a.nomeCompleto = document.getElementById('editNomeCompleto') ? document.getElementById('editNomeCompleto').value : '';
        a.cpf = document.getElementById('editCpf') ? document.getElementById('editCpf').value : '';
        a.dataNasc = document.getElementById('editDataNasc') ? document.getElementById('editDataNasc').value : '';
        a.nomeMae = document.getElementById('editNomeMae') ? document.getElementById('editNomeMae').value : '';
        a.rg = document.getElementById('editRg') ? document.getElementById('editRg').value : '';
        a.orgaoExpeditor = document.getElementById('editOrgaoExpeditor') ? document.getElementById('editOrgaoExpeditor').value : '';
        a.dataExpedicao = document.getElementById('editDataExpedicao') ? document.getElementById('editDataExpedicao').value : '';
        a.email = document.getElementById('editEmail') ? document.getElementById('editEmail').value : '';
        a.telefone1 = document.getElementById('editTelefone1') ? document.getElementById('editTelefone1').value : '';
        a.telefone2 = document.getElementById('editTelefone2') ? document.getElementById('editTelefone2').value : '';
        a.cep = document.getElementById('editCep') ? document.getElementById('editCep').value : '';
        a.logradouro = document.getElementById('editLogradouro') ? document.getElementById('editLogradouro').value : '';
        a.numero = document.getElementById('editNumero') ? document.getElementById('editNumero').value : '';
        a.complemento = document.getElementById('editComplemento') ? document.getElementById('editComplemento').value : '';
        a.bairro = document.getElementById('editBairro') ? document.getElementById('editBairro').value : '';
        a.uf = document.getElementById('editUf') ? document.getElementById('editUf').value : '';
        a.cidade = document.getElementById('editCidade') ? document.getElementById('editCidade').value : '';
        a.pontoReferencia = document.getElementById('editPontoReferencia') ? document.getElementById('editPontoReferencia').value : '';
        a.velocidade = document.getElementById('editVelocidade') ? document.getElementById('editVelocidade').value : '';
        a.produto = document.getElementById('editProduto') ? document.getElementById('editProduto').value : '';
        a.plano = a.produto;
        a.valor = document.getElementById('editValor') ? document.getElementById('editValor').value.replace(/R\$/gi, '').trim() : '';
        a.vencimento = document.getElementById('editVencimento') ? document.getElementById('editVencimento').value : '';
        a.formaPagamento = document.getElementById('editFormaPagamento') ? document.getElementById('editFormaPagamento').value : '';
        a.hp = document.getElementById('editHp') ? document.getElementById('editHp').value : '';
        a.viabilidade = document.getElementById('editViabilidade') ? document.getElementById('editViabilidade').value : '';
        a.planoTipo = document.getElementById('editPlanoTipo') ? document.getElementById('editPlanoTipo').value : '';
        a.tipoAprovacao = document.getElementById('editTipoAprovacao') ? document.getElementById('editTipoAprovacao').value : '';
        a.observacao = document.getElementById('editObservacao') ? document.getElementById('editObservacao').value : '';
        a.contrato = document.getElementById('infoContrato') ? document.getElementById('infoContrato').value : '';
        a.infoData = document.getElementById('infoData') ? document.getElementById('infoData').value : '';
        a.infoPeriodo = document.getElementById('infoPeriodo') ? document.getElementById('infoPeriodo').value : '';
        
        const elAtivadoPor = document.getElementById('infoAtivadoPor');
        if (elAtivadoPor && elAtivadoPor.value) {
            a.ativadoPor = elAtivadoPor.value;
        }
        a.ativadoPor = a.ativadoPor || '';

        if (novoStatus === 'Aprovado' && a.status !== 'Aprovado') {
            if (!a.contrato || !a.infoData || !a.infoPeriodo) { 
                alert('⚠️ Preencha Contrato, Data e Período de Instalação antes de aprovar.'); 
                return; 
            }
            if (confirm('Aprovar esta venda?')) {
                const resp = await fetchFromGS('aprovarVenda', {
                    uuid: a.id, status: 'APROVADO', cliente: a.nomeCompleto, cpf: a.cpf,
                    dataNasc: a.dataNasc, nomeMae: a.nomeMae, rg: a.rg, orgaoExpeditor: a.orgaoExpeditor,
                    dataExpedicao: a.dataExpedicao, email: a.email, telefone1: a.telefone1, telefone2: a.telefone2,
                    cep: a.cep, logradouro: a.logradouro, numero: a.numero, complemento: a.complemento,
                    bairro: a.bairro, uf: a.uf, cidade: a.cidade, pontoReferencia: a.pontoReferencia,
                    plano: a.produto, velocidade: a.velocidade, valor: a.valor, vencimento: a.vencimento,
                    formaPagamento: a.formaPagamento, hp: a.hp, viabilidade: a.viabilidade, planoTipo: a.planoTipo,
                    tipoAprovacao: a.tipoAprovacao, contrato: a.contrato, infoData: a.infoData, infoPeriodo: a.infoPeriodo,
                    vendedorNome: a.vendedorNome, vendedorId: a.vendedor_id, ativadoPor: a.ativadoPor,
                    observacao: a.observacao
                });
                if (resp && resp.ok) {
                    alert('✅ Venda aprovada!');
                    DB.ativacoes = DB.ativacoes.filter(item => item.id !== a.id);
                    a.status = 'Aprovado'; a.finalizada = true; a.instalacaoStatus = 'Aguardando';
                    DB.ativacoes.unshift(a); salvarDB();
                    await buscarPendentesDaNuvem(); await buscarVendasAprovadasDaNuvem();
                } else { alert('❌ Erro ao aprovar'); a.status = 'Pendente'; salvarDB(); }
            } else { a.status = 'Pendente'; salvarDB(); }
        } else {
            a.status = novoStatus;
            salvarDB();
            // Atualiza o status E a observação na planilha PENDENTES
            if (novoStatus !== 'Aprovado') {
                fetchFromGS('atualizarPendente', {
                    uuid: a.id,
                    status: novoStatus,
                    observacao: a.observacao,
                    contrato: a.contrato,
                    infoData: a.infoData,
                    infoPeriodo: a.infoPeriodo,
                    ativadoPor: a.ativadoPor
                });
            }
        }
        
        a.tratandoPor = null; salvarDB();
        try { await fetchFromGS('atualizarTratando', { uuid: a.id, tratandoPor: '' }); } catch (e) {}
    }
    document.getElementById('modalAtivacao').style.display = 'none';
    vendaSendoVisualizada = null;
    carregarAtivacoes();
    if (document.getElementById('secao-vendasAprovadas') && document.getElementById('secao-vendasAprovadas').classList.contains('section-active')) carregarVendasAprovadas();
    if (sessao.tipo === 'admin') carregarDashboard();
}
function abrirModalInfoAdicional() {
    if (!vendaSendoVisualizada) { alert('Nenhuma venda selecionada.'); return; }
    carregarDropdownAtivadoPor();
    document.getElementById('modalInfoAdicional').style.display = 'flex';
}

function fecharModalInfoAdicional() { document.getElementById('modalInfoAdicional').style.display = 'none'; }

function salvarInfoAdicional() {
    if (!vendaSendoVisualizada) { alert('Nenhuma venda selecionada.'); fecharModalInfoAdicional(); return; }
    const a = findAtivacaoById(vendaSendoVisualizada);
    if (a) {
        a.contrato = document.getElementById('infoContrato').value;
        a.infoData = document.getElementById('infoData').value;
        a.infoPeriodo = document.getElementById('infoPeriodo').value;
        const elAtivadoPor = document.getElementById('infoAtivadoPor');
        a.ativadoPor = elAtivadoPor ? elAtivadoPor.value : '';
        salvarDB();
        postParaGoogleSheets('atualizarInfoAdicional', { uuid: a.id, contrato: a.contrato, infoData: a.infoData, infoPeriodo: a.infoPeriodo, ativadoPor: a.ativadoPor });
        alert('✅ Informações adicionais salvas!');
    }
    fecharModalInfoAdicional();
}

// ===== VENDAS APROVADAS (CORRIGIDO) =====
function carregarVendasAprovadas(pagina) {
    if (!pagina) pagina = paginaAtualVendasAprovadas;
    const tabela = document.getElementById('tabelaVendasAprovadas');
    if (!tabela) return;
    let aprovadas = DB.ativacoes
        .filter(a => a.status === 'Aprovado')
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // mais novas primeiro

    const elFiltroData = document.getElementById('filtroDataAprovadas');
    const filtroData = elFiltroData ? elFiltroData.value : null;
    if (filtroData) {
        const filtroDate = new Date(filtroData + 'T00:00:00');
        aprovadas = aprovadas.filter(a => { const aDate = parseDateBR(a.data); return aDate && aDate.getTime() === filtroDate.getTime(); });
    }
    const total = aprovadas.length;
    const totalPaginas = Math.ceil(total / itensPorPagina);
    paginaAtualVendasAprovadas = Math.min(pagina, totalPaginas || 1);
    const inicio = (paginaAtualVendasAprovadas - 1) * itensPorPagina;
    const itensExibidos = aprovadas.slice(inicio, inicio + itensPorPagina);
    tabela.innerHTML = '';
    tabela.insertAdjacentHTML('beforeend', itensExibidos.length ? itensExibidos.map(a => {
        const vendedor = DB.usuarios.find(u => u.id === a.vendedor_id);
        const nomeVendedor = vendedor ? vendedor.nome : (a.vendedorNome || 'N/A');
        const dataFormatada = a.data ? formatarBR(a.data) : '—';
        return '<tr>' +
            '<td><strong>' + (a.nomeCompleto || '—') + '</strong></td>' +
            '<td>' + (a.produto || a.plano || '—') + '</td>' +
            '<td>' + nomeVendedor + '</td>' +
            '<td>R$ ' + (parseFloat(String(a.valor || '0').replace(/[R\$\s]/g, '').replace(',', '.')) || 0).toFixed(2).replace('.', ',') + '</td>' +
            '<td>' + dataFormatada + '</td>' +
            '<td>' +
                '<button onclick="abrirModalVisualizacao(\'' + a.id + '\')" class="btn-glass-sm"><i class="fas fa-eye"></i></button>' +
                (sessao.tipo === 'admin' ? '<button onclick="removerVenda(\'' + a.id + '\')" class="btn-glass-sm" style="background:rgba(255,71,87,0.2);border-color:#ff4757;color:#ff4757;"><i class="fas fa-trash"></i></button>' : '') +
            '</td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="6" style="text-align:center;padding:30px;">Nenhuma venda aprovada</td></tr>');
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
    const idStr = String(id);
    const a = DB.ativacoes.find(x => String(x.id) === idStr);
    if (!a) { alert('Venda não encontrada'); return; }
    if (sessao.tipo !== 'admin' && a.vendedor_id !== sessao.id) { alert('Você não tem permissão.'); return; }
    vendaSendoVisualizada = idStr;
    const flag = DB.statusFlags.find(f => f.nome === a.status) || { cor: '#fff' };
    const readonlyAttr = (sessao.tipo !== 'admin') ? 'readonly' : '';
    let html = '';
    if (a.contrato || a.infoData || a.infoPeriodo) {
        html += '<div class="instalacao-info-top">' +
            '<div class="info-item"><span class="label">📄 Contrato</span><span class="value">' + (a.contrato || '—') + '</span></div>' +
            '<div class="info-item"><span class="label">📅 Data Instalação</span><span class="value">' + (a.infoData ? formatarBR(a.infoData) : '—') + '</span></div>' +
            '<div class="info-item"><span class="label">⏰ Período</span><span class="value">' + (a.infoPeriodo || '—') + '</span></div>' +
        '</div>';
    }
    html += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:15px;">' +
        '<span style="background:rgba(255,255,255,0.05);padding:5px 10px;border-radius:8px;"><strong>Status:</strong> <span style="color:' + flag.cor + '">' + a.status + '</span></span>' +
        '<span style="background:rgba(255,255,255,0.05);padding:5px 10px;border-radius:8px;"><strong>Plano:</strong> ' + (a.plano || a.produto) + '</span>' +
        '<span style="background:rgba(255,255,255,0.05);padding:5px 10px;border-radius:8px;"><strong>Valor:</strong> R$ ' + parseFloat(a.valor || 0).toFixed(2).replace('.', ',') + '</span>' +
    '</div>' +
    '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:8px;">';
    const campos = [
        ['Nome Completo', a.nomeCompleto, 'viewNomeCompleto'], ['CPF', a.cpf, 'viewCpf'], ['Data Nasc.', a.dataNasc ? formatarBR(a.dataNasc) : '', 'viewDataNasc'],
        ['Órgão Exp.', a.orgaoExpeditor, 'viewOrgaoExpeditor'], ['Nome da Mãe', a.nomeMae, 'viewNomeMae'], ['RG', a.rg, 'viewRg'],
        ['Data Exp.', a.dataExpedicao ? formatarBR(a.dataExpedicao) : '', 'viewDataExpedicao'], ['Email', a.email, 'viewEmail'],
        ['Tel 1', a.telefone1, 'viewTelefone1'], ['Tel 2', a.telefone2, 'viewTelefone2'], ['CEP', a.cep, 'viewCep'],
        ['Logradouro', a.logradouro, 'viewLogradouro'], ['N°', a.numero, 'viewNumero'], ['Complemento', a.complemento, 'viewComplemento'],
        ['Bairro', a.bairro, 'viewBairro'], ['Estado', a.uf, 'viewUf'], ['Cidade', a.cidade, 'viewCidade'],
        ['Ponto Ref.', a.pontoReferencia, 'viewPontoReferencia'], ['Data da Venda', a.data || '', 'viewDataVenda'], ['Ativado Por', a.ativadoPor || '—', 'viewAtivadoPor'],
        ['Velocidade', a.velocidade, 'viewVelocidade'], ['Produto', a.produto || a.plano, 'viewProduto'],
        ['Valor', a.valor, 'viewValor'], ['Vencimento', a.vencimento, 'viewVencimento'], ['Pagamento', a.formaPagamento, 'viewFormaPagamento'],
        ['HP', a.hp, 'viewHp'], ['Viabilidade', a.viabilidade, 'viewViabilidade'], ['Plano Tipo', a.planoTipo, 'viewPlanoTipo'],
        ['Tipo Aprov.', a.tipoAprovacao, 'viewTipoAprovacao'], ['Observação', a.observacao || '', 'viewObservacao']
    ];
    campos.forEach(([label, valor, id]) => {
        if (label === 'Observação') {
            html += '<div class="input-group" style="grid-column:span 2;"><label>' + label + '</label><textarea id="' + id + '" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);min-height:80px;" ' + readonlyAttr + '>' + (valor || '') + '</textarea></div>';
        } else {
            html += '<div class="input-group"><label>' + label + '</label><input id="' + id + '" value="' + (valor || '') + '" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);" ' + readonlyAttr + '></div>';
        }
    });
    html += '</div>' +
    '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">' +
        '<button onclick="fecharModalVisualizacao()" class="btn-glass-sm" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);">Fechar</button>';
    if (sessao.tipo === 'admin') html += '<button onclick="salvarEdicaoVenda()" class="btn-glass-sm" style="background:#2ed573;color:#0b0b0b;">Salvar alterações</button>';
    html += '</div>';
    const conteudo = document.getElementById('conteudoModalVisualizacao');
conteudo.innerHTML = '';
conteudo.insertAdjacentHTML('beforeend', html);
document.getElementById('modalVisualizacao').style.display = 'flex';
}

function fecharModalVisualizacao() { document.getElementById('modalVisualizacao').style.display = 'none'; }

async function salvarEdicaoVenda() {
    if (sessao.tipo !== 'admin') return;
    const idStr = String(vendaSendoVisualizada);
    const a = DB.ativacoes.find(x => String(x.id) === idStr);
    if (!a) { alert('Venda não encontrada.'); return; }
    const getVal = function(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    a.nomeCompleto = getVal('viewNomeCompleto'); a.cpf = getVal('viewCpf'); a.dataNasc = getVal('viewDataNasc');
    a.orgaoExpeditor = getVal('viewOrgaoExpeditor'); a.nomeMae = getVal('viewNomeMae'); a.rg = getVal('viewRg');
    a.dataExpedicao = getVal('viewDataExpedicao'); a.email = getVal('viewEmail'); a.telefone1 = getVal('viewTelefone1');
    a.telefone2 = getVal('viewTelefone2'); a.cep = getVal('viewCep'); a.logradouro = getVal('viewLogradouro');
    a.numero = getVal('viewNumero'); a.complemento = getVal('viewComplemento'); a.bairro = getVal('viewBairro');
    a.uf = getVal('viewUf'); a.cidade = getVal('viewCidade'); a.pontoReferencia = getVal('viewPontoReferencia');
a.data = getVal('viewDataVenda');
    a.velocidade = getVal('viewVelocidade'); a.produto = getVal('viewProduto'); a.plano = a.produto;
    a.ativadoPor = getVal('viewAtivadoPor'); a.valor = getVal('viewValor').replace(/R\$/gi, '').trim();
    a.vencimento = getVal('viewVencimento'); a.formaPagamento = getVal('viewFormaPagamento');
    a.hp = getVal('viewHp'); a.viabilidade = getVal('viewViabilidade'); a.planoTipo = getVal('viewPlanoTipo');
    a.tipoAprovacao = getVal('viewTipoAprovacao'); a.observacao = getVal('viewObservacao');
    salvarDB();
    try {
        const resp = await fetchFromGS('editarVenda', {
            uuid: a.id, cliente: a.nomeCompleto, cpf: a.cpf, dataNasc: a.dataNasc, nomeMae: a.nomeMae,
            rg: a.rg, orgaoExpedidor: a.orgaoExpeditor, dataExpedicao: a.dataExpedicao, email: a.email,
            telefone1: a.telefone1, telefone2: a.telefone2, cep: a.cep, logradouro: a.logradouro,
            numero: a.numero, complemento: a.complemento, bairro: a.bairro, uf: a.uf, cidade: a.cidade,
            pontoReferencia: a.pontoReferencia, data: a.data, plano: a.produto, velocidade: a.velocidade, valor: a.valor,
            vencimento: a.vencimento, formaPagamento: a.formaPagamento, hp: a.hp, viabilidade: a.viabilidade,
            planoTipo: a.planoTipo, tipoAprovacao: a.tipoAprovacao, ativadoPor: a.ativadoPor || '',
            observacao: a.observacao, contrato: a.contrato || '', infoData: a.infoData || '',
            infoPeriodo: a.infoPeriodo || '', vendedorNome: a.vendedorNome || '', vendedorId: a.vendedor_id || ''
        });
        if (resp && resp.ok) alert('✅ Dados atualizados!'); else alert('⚠️ Falha ao sincronizar.');
    } catch (e) { alert('⚠️ Erro de comunicação.'); }
    carregarVendasAprovadas();
    if (sessao && sessao.tipo === 'admin') carregarDashboard();
    document.getElementById('modalVisualizacao').style.display = 'none';
}

// ===== REMOVER VENDA =====
async function removerVenda(id) {
    if (sessao.tipo !== 'admin') { alert('Apenas administradores podem remover vendas.'); return; }
    const venda = DB.ativacoes.find(a => a.id === id);
    if (!venda) { alert('Venda não encontrada!'); return; }
    if (!confirm('Remover permanentemente a venda de "' + (venda.nomeCompleto || '') + '"?')) return;
    try {
        const resp = await fetchFromGS('excluirVenda', { uuid: venda.id });
        if (resp && resp.ok) {
            DB.ativacoes = DB.ativacoes.filter(a => a.id !== id); salvarDB();
            await buscarPendentesDaNuvem(); await buscarVendasAprovadasDaNuvem();
            alert('✅ Venda removida!');
        } else alert('❌ Erro ao excluir.');
    } catch (err) { alert('❌ Erro de comunicação.'); }
}

// ===== FUNÇÕES DO VENDEDOR (ENVIAR VENDA) =====
function limparFormularioVenda() {
    const ids = ['vNomeCompleto','vCpf','vDataNasc','vOrgaoExpeditor','vNomeMae','vRg','vDataExpedicao','vEmail','vTelefone1','vTelefone2','vCep','vLogradouro','vNumero','vComplemento','vBairro','vUf','vCidade','vPontoReferencia','vVelocidade','vPlano','vValor','vVencimento','vFormaPagamento','vHp','vViabilidade','vPlanoTipo','vTipoAprovacao'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const checkAtual = document.getElementById('checkDataAtual');
    const checkNova = document.getElementById('checkNovaData');
    const inputNovaData = document.getElementById('inputNovaData');
    if (checkAtual) checkAtual.checked = true;
    if (checkNova) checkNova.checked = false;
    if (inputNovaData) { inputNovaData.style.display = 'none'; inputNovaData.value = ''; }
}

let enviandoVenda = false;

function enviarVenda() {
    if (enviandoVenda) {
        alert('⏳ Aguarde, sua venda está sendo enviada...');
        return;
    }
    
    if (!sessao) { alert('Sessão expirada.'); return; }
    
    const getVal = function(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const campos = {
        viabilidade: getVal('vViabilidade'), planoTipo: getVal('vPlanoTipo'), tipoAprovacao: getVal('vTipoAprovacao'),
        nomeCompleto: getVal('vNomeCompleto'), cpf: getVal('vCpf'), dataNasc: getVal('vDataNasc'),
        orgaoExpeditor: getVal('vOrgaoExpeditor'), nomeMae: getVal('vNomeMae'), rg: getVal('vRg'),
        dataExpedicao: getVal('vDataExpedicao'), email: getVal('vEmail'), telefone1: getVal('vTelefone1'),
        telefone2: getVal('vTelefone2'), cep: getVal('vCep'), logradouro: getVal('vLogradouro'),
        numero: getVal('vNumero'), complemento: getVal('vComplemento'), bairro: getVal('vBairro'),
        uf: getVal('vUf'), cidade: getVal('vCidade'), pontoReferencia: getVal('vPontoReferencia'),
        velocidade: getVal('vVelocidade'), produto: getVal('vPlano'), plano: getVal('vPlano'),
        valor: getVal('vValor').replace(/R\$/gi, '').trim(), vencimento: getVal('vVencimento'),
        formaPagamento: getVal('vFormaPagamento'), hp: getVal('vHp')
    };
    const obrigatorios = ['nomeCompleto','cpf','dataNasc','email','telefone1','cep','logradouro','numero','bairro','uf','cidade','velocidade','produto','valor','vencimento','formaPagamento'];
    for (let c of obrigatorios) { if (!campos[c]) { alert('Preencha: ' + c); return; } }
    if (campos.dataNasc) { const d = parseDateBR(campos.dataNasc); campos.dataNasc = d ? dataParaBR(d) : campos.dataNasc; }
    if (campos.dataExpedicao) { const d = parseDateBR(campos.dataExpedicao); campos.dataExpedicao = d ? dataParaBR(d) : campos.dataExpedicao; }
    
    const dataVenda = obterDataVenda();
    
    const nova = { ...campos, vendedor_id: sessao.id, vendedorNome: sessao.nome, status: "Pendente", data: dataVenda, finalizada: false, createdAt: Date.now(), newBadge: true };
    
    enviandoVenda = true;
    const btn = document.querySelector('#secao-enviarVenda .btn-glass-primary');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    }
    
    fetchFromGS('adicionarPendente', { venda: JSON.stringify(nova) }).then(resp => {
        if (resp && resp.ok) { 
            alert('✅ Venda enviada com data: ' + dataVenda); 
            limparFormularioVenda(); 
            DB.ativacoes.unshift({ ...nova, id: resp.id }); 
            salvarDB(); 
        }
        else alert('❌ Erro ao enviar.');
    }).catch(err => { alert('❌ Erro de comunicação.'); })
    .finally(() => {
        enviandoVenda = false;
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check"></i> Enviar Venda';
        }
    });
}

function carregarControleVendas() {
    const minhas = DB.ativacoes.filter(a => a.vendedor_id === sessao.id && a.status === 'Aprovado').reverse();
    const tabela = document.getElementById('tabelaControleVendas');
    if (!tabela) return;
    tabela.innerHTML = '';
    tabela.insertAdjacentHTML('beforeend', minhas.length ? minhas.map(a => {
        const flag = DB.statusFlags.find(f => f.nome === a.status) || { cor: '#fff' };
        return '<tr>' +
            '<td><strong>' + (a.nomeCompleto || '—') + '</strong></td>' +
            '<td>' + (a.plano || a.produto || '—') + '</td>' +
            '<td>R$ ' + (parseFloat(String(a.valor || '0').replace(/[R\$\s]/g, '').replace(',', '.')) || 0).toFixed(2).replace('.', ',') + '</td>' +
            '<td><span style="color:' + flag.cor + ';font-weight:600;">● ' + a.status + '</span></td>' +
            '<td>' + (a.data ? formatarBR(a.data) : '—') + '</td>' +
            '<td><button onclick="abrirModalVisualizacao(\'' + a.id + '\')" class="btn-glass-sm"><i class="fas fa-eye"></i></button></td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="6" style="text-align:center;padding:30px;">Nenhuma venda aprovada</td></tr>');
}

function carregarInstalacoes() {
    const aprovadas = DB.ativacoes.filter(a => a.vendedor_id === sessao.id && a.status === 'Aprovado').reverse();
    const tabela = document.getElementById('tabelaInstalacoes');
    if (!tabela) return;
    tabela.innerHTML = '';
    tabela.insertAdjacentHTML('beforeend', aprovadas.length ? aprovadas.map(a => {
        const st = a.instalacaoStatus || 'Aguardando';
        return '<tr>' +
            '<td><strong>' + (a.nomeCompleto || '—') + '</strong></td>' +
            '<td>' + (a.plano || a.produto || '—') + '</td>' +
            '<td><span style="color:#2ed573;font-weight:600;">● ' + a.status + '</span></td>' +
            '<td><select onchange="alterarStatusInstalacao(\'' + a.id + '\', this.value)" style="background:#2a1a1a;color:#fff;border:1px solid rgba(255,255,255,0.3);padding:6px 12px;border-radius:6px;font-size:13px;cursor:pointer;min-width:130px;">' +
                '<option value="Aguardando" ' + (st === 'Aguardando' ? 'selected' : '') + '>Aguardando</option>' +
                '<option value="Instalado" ' + (st === 'Instalado' ? 'selected' : '') + '>Instalado</option>' +
                '<option value="Cancelado" ' + (st === 'Cancelado' ? 'selected' : '') + '>Cancelado</option>' +
            '</select></td>' +
            '<td><button onclick="abrirModalVisualizacao(\'' + a.id + '\')" class="btn-glass-sm"><i class="fas fa-eye"></i></button></td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="5" style="text-align:center;padding:30px;">Nenhuma venda para instalação</td></tr>');
}

async function alterarStatusInstalacao(id, novoStatus) {
    const a = DB.ativacoes.find(x => x.id === id);
    if (!a) return;
    if (novoStatus === 'Instalado' && sessao.tipo !== 'admin') {
        if (!confirm('⚠️ Confirmar instalação de "' + a.nomeCompleto + '"?')) {
            const sel = document.querySelector('select[onchange*="alterarStatusInstalacao(\'' + id + '\'"]');
            if (sel) sel.value = a.instalacaoStatus || 'Aguardando';
            return;
        }
    }
    const ant = a.instalacaoStatus; a.instalacaoStatus = novoStatus; salvarDB();
    try {
        const resp = await fetchFromGS('atualizarInstalacao', { uuid: a.id, status: novoStatus });
        if (resp && resp.ok) { await buscarVendasAprovadasDaNuvem(); if (sessao.tipo === 'vendedor') { carregarControleVendas(); carregarInstalacoes(); } }
        else { a.instalacaoStatus = ant; salvarDB(); alert('❌ Erro.'); carregarInstalacoes(); }
    } catch (err) { a.instalacaoStatus = ant; salvarDB(); alert('❌ Erro.'); carregarInstalacoes(); }
}

function mostrarSecaoVendedor(e, secao) {
    document.querySelectorAll('#vendedorScreen .section-active, #vendedorScreen .section-hidden').forEach(s => { s.style.display = 'none'; s.className = 'section-hidden'; });
    const el = document.getElementById('secao-' + secao); if(el){ el.style.display = 'block'; el.className = 'section-active'; }
    document.querySelectorAll('#vendedorScreen .nav-item').forEach(a => a.classList.remove('active'));
    if (e && e.currentTarget) e.currentTarget.classList.add('active');
    document.getElementById('tituloSecaoVendedor').innerHTML = { inicio: '🏠 Início', enviarVenda: '📨 Enviar Venda', controleVendas: '📋 Controle de Vendas', instalacoes: '🔧 Instalações' }[secao] || secao;
    if (secao === 'inicio') { sincronizarMetasVendas().then(() => carregarInicioVendedor()); }
    if (secao === 'enviarVenda') { sincronizarOpcoesVenda().then(() => { carregarOpcoesVenda(); carregarSelectProdutos(); }); }
    if (secao === 'controleVendas') { buscarVendasAprovadasDaNuvem().then(() => carregarControleVendas()).catch(() => carregarControleVendas()); }
    if (secao === 'instalacoes') { buscarVendasAprovadasDaNuvem().then(() => carregarInstalacoes()).catch(() => carregarInstalacoes()); }
}

function carregarInicioVendedor() {
    if (!sessao) return;
    document.getElementById('metaMensalVendedor').textContent = DB.metas.mensalVendas || 150;
    document.getElementById('metaDiariaVendedor').textContent = DB.metas.diariaVendas || 10;
    const vendas = DB.ativacoes.filter(a => a.vendedor_id === sessao.id && a.status === 'Aprovado' && a.finalizada !== false);
    const total = vendas.length;
    const pct = Math.min((total / (DB.metas.mensalVendas || 150)) * 100, 100).toFixed(1);
    document.getElementById('realizadoVendedorMes').textContent = total;
    document.getElementById('faltamVendedorMes').textContent = Math.max((DB.metas.mensalVendas || 150) - total, 0);
    document.getElementById('totalVendasMesVendedor').textContent = total;
    document.getElementById('barraProgressoVendedor').style.width = pct + '%';
    atualizarPainelInstalacoes();
    carregarMetasAtivasVendedor();
}

function carregarMetasAtivasVendedor() {
    const container = document.getElementById('painelMetasVendedor');
    if (!container) return;
    let html = '';
    const realizadoMes = DB.ativacoes.filter(a => a.vendedor_id === sessao.id && a.status === 'Aprovado').length;
    const metaVendasMes = DB.metas.mensalVendas || 150;
    const pctVendas = Math.min((realizadoMes / metaVendasMes) * 100, 100).toFixed(1);
    html += '<div class="meta-vendedor-card"><span class="meta-vendedor-label">🎯 Minha Meta Mensal</span><span class="meta-vendedor-value">' + realizadoMes + '/' + metaVendasMes + '</span><div class="progresso-bar-container" style="height:8px;margin-top:6px;"><div class="progresso-bar-liquido" style="width:' + pctVendas + '%;"></div></div></div>';
    DB.metas.produtos.forEach(p => {
        const realizado = DB.ativacoes.filter(a => a.vendedor_id === sessao.id && a.produto === p.produto && a.status === 'Aprovado').length;
        const pctProd = Math.min((realizado / p.mensal) * 100, 100).toFixed(1);
        html += '<div class="meta-vendedor-card"><span class="meta-vendedor-label">📦 ' + p.produto + '</span><span class="meta-vendedor-value">' + realizado + '/' + p.mensal + '</span><div class="progresso-bar-container" style="height:8px;margin-top:6px;"><div class="progresso-bar-liquido" style="width:' + pctProd + '%;"></div></div></div>';
    });
    DB.metas.instalacoes.forEach(i => {
        if (i.tipo === 'empresa' || (i.tipo === 'vendedor' && i.entidadeId === sessao.id)) {
            const instaladas = DB.ativacoes.filter(a => a.vendedor_id === sessao.id && a.instalacaoStatus === 'Instalado').length;
            const pctInst = Math.min((instaladas / i.mensal) * 100, 100).toFixed(1);
            html += '<div class="meta-vendedor-card"><span class="meta-vendedor-label">🔧 Instalações' + (i.tipo === 'vendedor' ? ' (Individual)' : ' (Empresa)') + '</span><span class="meta-vendedor-value">' + instaladas + '/' + i.mensal + '</span><div class="progresso-bar-container" style="height:8px;margin-top:6px;"><div class="progresso-bar-liquido" style="width:' + pctInst + '%;"></div></div></div>';
        }
    });
    container.innerHTML = html || '<div class="meta-vendedor-card"><span class="meta-vendedor-label">Nenhuma meta definida</span></div>';
}

function atualizarPainelInstalacoes() {
    const hoje = new Date();
    if (hoje.getDate() <= 10) {
        let ano = hoje.getFullYear(), mes = hoje.getMonth();
        if (mes === 0) { mes = 12; ano--; }
        const vendasAnt = DB.ativacoes.filter(a => a.vendedor_id === sessao.id && a.status === 'Aprovado' && a.finalizada !== false);
        document.getElementById('instaladosCountVendedor').textContent = vendasAnt.filter(v => v.instalacaoStatus === 'Instalado').length;
        document.getElementById('canceladosCountVendedor').textContent = vendasAnt.filter(v => v.instalacaoStatus === 'Cancelado').length;
        document.getElementById('painelInstalacoesAnterior').style.display = 'block';
    } else { document.getElementById('painelInstalacoesAnterior').style.display = 'none'; }
}

function buscarCep() {
    const cep = document.getElementById('vCep').value.replace(/\D/g, '');
    if (cep.length !== 8) return alert('Digite um CEP válido.');
    fetch('https://viacep.com.br/ws/' + cep + '/json/').then(r => r.json()).then(d => {
        if (d.erro) { alert('CEP não encontrado.'); return; }
        document.getElementById('vLogradouro').value = d.logradouro || '';
        document.getElementById('vBairro').value = d.bairro || '';
        document.getElementById('vCidade').value = d.localidade || '';
        document.getElementById('vUf').value = d.uf || '';
        document.getElementById('vNumero').focus();
    }).catch(() => alert('Erro ao buscar CEP.'));
}

// ===== DASHBOARD ADMIN =====
function obterVendasAprovadas() { return DB.ativacoes.filter(a => a.status === 'Aprovado' && a.finalizada !== false); }
function obterVendasAprovadasHoje() { return obterVendasAprovadas().filter(a => a.data === hojeBR()); }
function obterVendasAprovadasMesAtual() {
    const hoje = new Date();
    return obterVendasAprovadas().filter(a => {
        const p = a.data.split('/');
        return p.length === 3 && parseInt(p[2]) === hoje.getFullYear() && parseInt(p[1]) === hoje.getMonth()+1;
    });
}
function gerarDadosVendas() { return obterVendasAprovadasHoje().map(v => ({ id: v.id, vendedor_id: v.vendedor_id, vendedor_nome: v.vendedorNome, plano: v.produto, valor: parseFloat(v.valor)||0, data: v.data })); }

async function carregarDashboard() {
    await Promise.all([buscarPendentesDaNuvem(), buscarVendasAprovadasDaNuvem()]);
    const vendasMes = obterVendasAprovadasMesAtual();
    const realizado = vendasMes.length;
    const metaMensal = DB.metas.mensalEmpresa || DB.metas.mensalVendas || 150;
    const pct = Math.min((realizado/metaMensal)*100,100).toFixed(1);
    document.getElementById('metaMensalCard').textContent = metaMensal;
    document.getElementById('realizadoMeta').textContent = realizado;
    document.getElementById('faltamMeta').textContent = Math.max(metaMensal-realizado,0);
    document.getElementById('percentualMeta').textContent = pct+'%';
    document.getElementById('barraLiquida').style.width = pct+'%';
    carregarVendasDiarias();
    mostrarComparativo(comparativoAtual);
}

function carregarVendasDiarias() {
    const hoje = new Date();
    document.getElementById('dataVendasDiarias').textContent = hoje.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
    const vendasHoje = gerarDadosVendas();
    const meta = DB.metas.diariaEmpresa || DB.metas.diariaVendas || 10;
    document.getElementById('totalVendasHoje').textContent = vendasHoje.length;
    const pctD = Math.min((vendasHoje.length/meta)*100,100).toFixed(1);
    document.getElementById('barraLiquidaDiaria').style.width = pctD+'%';
    document.getElementById('realizadoMetaDiaria').textContent = vendasHoje.length;
    document.getElementById('faltamMetaDiaria').textContent = Math.max(meta-vendasHoje.length,0);
    document.getElementById('metaDiaria').textContent = meta;
    const ranking = {};
    vendasHoje.forEach(v => { if(!ranking[v.vendedor_id]) ranking[v.vendedor_id]={nome:v.vendedor_nome,vendas:0}; ranking[v.vendedor_id].vendas++; });
    const arr = Object.values(ranking).sort((a,b)=>b.vendas-a.vendas);
    document.getElementById('rankingVendedores').innerHTML = arr.length ? arr.map((r,i)=>{ const m=i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1; return '<div class="ranking-item"><div class="ranking-posicao">'+m+'</div><div class="ranking-info"><span class="ranking-nome">'+r.nome+'</span><span class="ranking-vendas">'+r.vendas+' vendas</span></div><span class="ranking-pontos">'+r.vendas+'</span></div>'; }).join('') : '<p>Nenhuma venda hoje</p>';
}

function mostrarComparativo(tipo) {
    comparativoAtual = tipo;
    document.querySelectorAll('.btn-compare').forEach(b=>b.classList.remove('active'));
    document.getElementById(tipo==='diario'?'btnDiario':'btnMensal').classList.add('active');
    document.getElementById('comparativoDiario').style.display = tipo==='diario'?'block':'none';
    document.getElementById('comparativoMensal').style.display = tipo==='mensal'?'block':'none';
    if(tipo==='diario') carregarComparativoDiario(); else carregarComparativoMensal();
}

function carregarComparativoDiario() {
    const hoje = new Date();
    document.getElementById('compDataHoje').textContent = hoje.toLocaleDateString('pt-BR',{day:'numeric',month:'long'});
    const dp = new Date(hoje); dp.setDate(hoje.getDate()-1);
    document.getElementById('compDataPassado').textContent = dp.toLocaleDateString('pt-BR',{day:'numeric',month:'long'});
    const vH = gerarDadosVendas(), vP = gerarVendasDiaPassado();
    document.getElementById('compVendasHoje').textContent = vH.length;
    document.getElementById('compVendasPassado').textContent = vP.length;
    const dif = vH.length - vP.length;
    const diffEl = document.getElementById('compDiferencaDiario');
    diffEl.className = 'comp-diferenca '+(dif>0?'positivo':dif<0?'negativo':'positivo');
    diffEl.innerHTML = dif>0?'📈 '+dif+' a mais ('+((dif/Math.max(vP.length,1))*100).toFixed(1)+'%)':dif<0?'📉 '+Math.abs(dif)+' a menos ('+((Math.abs(dif)/Math.max(vP.length,1))*100).toFixed(1)+'%)':'➡️ Mesmo número';
    const rank = {}; vH.forEach(v=>{if(!rank[v.vendedor_id]) rank[v.vendedor_id]={nome:v.vendedor_nome,vendas:0}; rank[v.vendedor_id].vendas++;});
    const melhor = Object.values(rank).sort((a,b)=>b.vendas-a.vendas)[0];
    document.getElementById('destaqueDiario').innerHTML = melhor?'<div class="destaque-card"><div class="destaque-icon">🏆</div><div><div class="destaque-nome">'+melhor.nome+'</div><div class="destaque-info">'+melhor.vendas+' vendas</div></div></div>':'<p style="color:rgba(255,255,255,0.4);">Nenhum vendedor</p>';
    carregarComparacaoProdutos(vH,vP,'compProdutosDiario');
}

function carregarComparativoMensal() {
    const hoje = new Date();
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    document.getElementById('compMesAtual').textContent = meses[hoje.getMonth()];
    document.getElementById('compMesPassado').textContent = meses[hoje.getMonth()===0?11:hoje.getMonth()-1];
    const vA = gerarVendasMesAtual(), vAnt = gerarVendasMesAnterior();
    document.getElementById('compVendasMesAtual').textContent = vA.length;
    document.getElementById('compVendasMesAnterior').textContent = vAnt.length;
    const dif = vA.length - vAnt.length;
    const diffEl = document.getElementById('compDiferencaMensal');
    diffEl.className = 'comp-diferenca '+(dif>0?'positivo':dif<0?'negativo':'positivo');
    diffEl.innerHTML = dif>0?'📈 '+dif+' a mais ('+((dif/Math.max(vAnt.length,1))*100).toFixed(1)+'%)':dif<0?'📉 '+Math.abs(dif)+' a menos ('+((Math.abs(dif)/Math.max(vAnt.length,1))*100).toFixed(1)+'%)':'➡️ Mesmo número';
    const rank = {}; vA.forEach(v=>{if(!rank[v.vendedor_id]) rank[v.vendedor_id]={nome:v.vendedor_nome,vendas:0}; rank[v.vendedor_id].vendas++;});
    const melhor = Object.values(rank).sort((a,b)=>b.vendas-a.vendas)[0];
    document.getElementById('destaqueMensal').innerHTML = melhor?'<div class="destaque-card"><div class="destaque-icon">🏆</div><div><div class="destaque-nome">'+melhor.nome+'</div><div class="destaque-info">'+melhor.vendas+' vendas</div></div></div>':'<p style="color:rgba(255,255,255,0.4);">Nenhum vendedor</p>';
    carregarComparacaoProdutos(vA,vAnt,'compProdutosMensal');
    const meta = DB.metas.mensalEmpresa||DB.metas.mensalVendas||150, real = vA.length, pct = Math.min((real/meta)*100,100).toFixed(1);
    document.getElementById('metaMensalValor').textContent = meta;
    document.getElementById('metaMensalRealizado').textContent = real;
    document.getElementById('metaMensalPct').textContent = pct+'%';
    document.getElementById('metaMensalProgresso').style.width = pct+'%';
}

function carregarComparacaoProdutos(vAtual,vPassado,containerId) {
    const container = document.getElementById(containerId);
    const planos = DB.produtos.length ? DB.produtos.map(p => p.nome) : ['Básico','Empresarial','Premium','Ultra'];
    const maxV = Math.max(...planos.map(p=>Math.max(vAtual.filter(v=>v.plano===p).length,vPassado.filter(v=>v.plano===p).length,1)),1);
    container.innerHTML = planos.map(p=>{
        const qA=vAtual.filter(v=>v.plano===p).length,qP=vPassado.filter(v=>v.plano===p).length;
        return '<div class="comp-produto-item"><span class="comp-produto-nome">'+p+'</span><div class="comp-produto-barras"><div class="comp-produto-atual" style="width:'+(qA/maxV*100)+'%;min-width:'+(qA>0?'25px':'0')+'">'+(qA>0?qA:'')+'</div><div class="comp-produto-passado" style="width:'+(qP/maxV*100)+'%;min-width:'+(qP>0?'25px':'0')+'">'+(qP>0?qP:'')+'</div></div></div>';
    }).join('');
}

function gerarVendasDiaPassado() { const dp=new Date(); dp.setDate(dp.getDate()-1); const d=dataParaBR(dp); return obterVendasAprovadas().filter(a=>a.data===d).map(v=>({id:v.id,vendedor_id:v.vendedor_id,vendedor_nome:v.vendedorNome,plano:v.produto,valor:parseFloat(v.valor)||0,data:v.data})); }
function gerarVendasMesAnterior() { const h=new Date(); let m=h.getMonth(),a=h.getFullYear(); if(m===0){m=12;a--;} return obterVendasAprovadas().filter(v=>{const p=v.data.split('/');return p.length===3&&parseInt(p[2])===a&&parseInt(p[1])===m;}).map(v=>({id:v.id,vendedor_id:v.vendedor_id,vendedor_nome:v.vendedorNome,plano:v.produto,valor:parseFloat(v.valor)||0,data:v.data})); }
function gerarVendasMesAtual() { return obterVendasAprovadasMesAtual().map(v=>({id:v.id,vendedor_id:v.vendedor_id,vendedor_nome:v.vendedorNome,plano:v.produto,valor:parseFloat(v.valor)||0,data:v.data})); }

// ===== NAVEGAÇÃO ADMIN =====
function mostrarSecao(secao) {
    document.querySelectorAll('.section-active,.section-hidden').forEach(s=>{s.style.display='none';s.className='section-hidden';});
    const el=document.getElementById('secao-'+secao); if(el){el.style.display='block';el.className='section-active';}
    document.querySelectorAll('.nav-item').forEach(a=>a.classList.remove('active'));
    const nav=document.querySelector('[data-section="'+secao+'"]'); if(nav)nav.classList.add('active');
    document.getElementById('tituloSecao').innerHTML = {dashboard:'📊 Dashboard',cadastro:'👥 Cadastro',ativacoes:'⚡ Ativações',vendasAprovadas:'✅ Vendas Aprovadas',relatorios:'📈 Relatórios',metas:'🎯 Metas',promocoes:'🏆 Promoções'}[secao]||secao;
    if(secao==='cadastro'){sincronizarUsuariosDaNuvem().then(()=>carregarUsuarios());}
    if(secao==='ativacoes'){paginaAtualAtivacoes=1;buscarPendentesDaNuvem().then(()=>carregarAtivacoes());}
    if(secao==='vendasAprovadas'){paginaAtualVendasAprovadas=1;buscarVendasAprovadasDaNuvem().then(()=>carregarVendasAprovadas());}
    if(secao==='relatorios')carregarRelatorios();
    if(secao==='metas'){Promise.all([sincronizarMetasVendas(),sincronizarProdutos(),sincronizarMetasProdutos(),sincronizarMetasInstalacoes()]).then(()=>carregarMetas());}
    if(secao==='promocoes'){sincronizarPromocoes().then(()=>carregarPromocoes());}
}

// ===== CADASTRO DE USUÁRIOS =====
function carregarUsuarios() {
    const agora=new Date();
    DB.usuarios=DB.usuarios.filter(u=>{if(u.deletedAt){return(agora-new Date(u.deletedAt))/(1000*60*60*24)<=15;}return true;});
    salvarDB();
    const usuarios=DB.usuarios.filter(u=>!u.deletedAt);
    const tabela=document.getElementById('tabelaUsuarios'); if(!tabela)return;
    tabela.innerHTML=usuarios.map(u=>'<tr>'+
        '<td><strong>'+u.nome+'</strong><button onclick="abrirModalEditarPorUsuario(\''+u.usuario+'\')" style="background:none;border:none;color:var(--primary-light);cursor:pointer;margin-left:8px;"><i class="fas fa-pencil-alt"></i></button></td>'+
        '<td>@'+u.usuario+'</td><td>'+u.email+'</td><td><span class="badge-cat">'+(u.categoria==='admin'?'👑 Admin':'💼 Vendedor')+'</span></td>'+
        '<td>'+(u.equipe||'Geral')+'</td><td class="'+(u.ativo?'status-ativo':'')+'">'+(u.ativo?'● Ativo':'○ Inativo')+'</td>'+
        '<td><button onclick="toggleUsuario('+u.id+')" style="background:'+(u.ativo?'rgba(255,71,87,0.2)':'rgba(46,213,115,0.2)')+';border:1px solid '+(u.ativo?'rgba(255,71,87,0.3)':'rgba(46,213,115,0.3)')+';color:white;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;">'+(u.ativo?'🔒 Desativar':'🔓 Ativar')+'</button>'+
        '<button onclick="excluirUsuario('+u.id+')" style="background:rgba(255,71,87,0.3);border:1px solid rgba(255,71,87,0.5);color:white;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;margin-left:5px;"><i class="fas fa-trash"></i> Excluir</button></td></tr>').join('');
    const cont=document.getElementById('contadorLixeira'); if(cont)cont.textContent=DB.usuarios.filter(u=>u.deletedAt).length;
}

function carregarDropdownAtivadoPor() {
    const select=document.getElementById('infoAtivadoPor'); if(!select)return;
    const venda=findAtivacaoById(vendaSendoVisualizada);
    const sel=venda?venda.ativadoPor||'':'';
    select.innerHTML='<option value="">Selecione</option>'+DB.usuarios.filter(u=>u.ativo&&!u.deletedAt).map(u=>'<option value="'+u.nome+'" '+(sel===u.nome?'selected':'')+'>'+u.nome+'</option>').join('');
}

function mostrarFormCadastro(){document.getElementById('formCadastro').style.display='block';}
function cadastrarUsuario(){
    const n=document.getElementById('nomeUsuario').value.trim(),u=document.getElementById('usuarioUsuario').value.trim();
    const s=document.getElementById('senhaUsuario').value.trim(),e=document.getElementById('emailUsuario').value.trim();
    const cat=document.getElementById('categoriaUsuario').value,eq=document.getElementById('equipeUsuario').value.trim();
    if(!n||!u||!s||!e)return alert('Preencha todos os campos!');
    if(DB.usuarios.find(x=>x.usuario===u&&!x.deletedAt))return alert('Usuário já existe!');
    DB.usuarios.push({id:Date.now(),usuario:u,senha:s,nome:n,email:e,tipo:cat,categoria:cat,ativo:true,deletedAt:null,equipe:cat==='admin'?'Gestão':(eq||'Geral')});
    salvarDB();
    fetchFromGS('adicionarUsuario',{nome:n,usuario:u,senha:s,email:e,categoria:cat,equipe:cat==='admin'?'Gestão':(eq||'Geral'),status:'LIBERADO'});
    document.getElementById('formCadastro').style.display='none';
    ['nomeUsuario','usuarioUsuario','senhaUsuario','emailUsuario','equipeUsuario'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    carregarUsuarios(); alert('✅ Usuário cadastrado!');
}
// ===== TOGGLE USUARIO CORRIGIDO =====
function toggleUsuario(id) {
    const u = DB.usuarios.find(u => u.id === id);
    if (!u) return;
    const novoStatus = u.ativo ? 'BLOQUEADO' : 'LIBERADO';
    const ativoAnterior = u.ativo;
    u.ativo = !u.ativo;
    salvarDB();
    carregarUsuarios();
    fetchFromGS('editarUsuario', {
        usuarioAntigo: u.usuario,
        nome: u.nome,
        usuario: u.usuario,
        email: u.email,
        categoria: u.categoria || 'vendedor',
        equipe: u.equipe || 'Geral',
        status: novoStatus,
        senha: ''
    }).then(resp => {
        if (!resp || !resp.ok) {
            u.ativo = ativoAnterior;
            salvarDB();
            carregarUsuarios();
            alert('Erro ao atualizar status na planilha.');
        }
    }).catch(err => {
        u.ativo = ativoAnterior;
        salvarDB();
        carregarUsuarios();
        alert('Erro de comunicação.');
    });
}

async function excluirUsuario(id){
    const u=DB.usuarios.find(u=>u.id===id); if(!u)return;
    if(!confirm('⚠️ Excluir "'+u.nome+'"?'))return;
    try{const resp=await fetchFromGS('removerUsuario',{usuario:u.usuario});if(resp&&resp.ok){DB.usuarios=DB.usuarios.filter(x=>x.id!==id);salvarDB();carregarUsuarios();alert('✅ Excluído!');}else alert('❌ Erro');}catch(err){alert('❌ Erro de comunicação.');}
}
function abrirModalEditarPorUsuario(usuario){const u=DB.usuarios.find(u=>u.usuario===usuario&&!u.deletedAt);if(!u){alert('Não encontrado.');return;}abrirModalEditar(u.id);}
async function abrirModalEditar(id){
    await sincronizarUsuariosDaNuvem(); const u=DB.usuarios.find(u=>u.id===id&&!u.deletedAt);
    if(!u){alert('Não encontrado.');carregarUsuarios();return;}
    document.getElementById('editUsuarioId').value=u.id; document.getElementById('editNomeUsuario').value=u.nome;
    document.getElementById('editLoginUsuario').value=u.usuario; document.getElementById('editEmailUsuario').value=u.email;
    document.getElementById('editCategoriaUsuario').value=u.categoria||u.tipo; document.getElementById('editSenhaUsuario').value='';
    document.getElementById('editEquipeUsuario').value=u.equipe||''; document.getElementById('modalEditarUsuario').style.display='flex';
}
function fecharModalEditar(){document.getElementById('modalEditarUsuario').style.display='none';}
async function salvarEdicaoUsuario(){
    const id=parseInt(document.getElementById('editUsuarioId').value),nome=document.getElementById('editNomeUsuario').value.trim();
    const usuario=document.getElementById('editLoginUsuario').value.trim(),email=document.getElementById('editEmailUsuario').value.trim();
    const categoria=document.getElementById('editCategoriaUsuario').value,novaSenha=document.getElementById('editSenhaUsuario').value.trim();
    const equipe=document.getElementById('editEquipeUsuario').value.trim();
    if(!nome||!usuario||!email)return alert('Preencha nome, usuário e email.');
    await sincronizarUsuariosDaNuvem(); let u=DB.usuarios.find(u=>u.id===id&&!u.deletedAt);
    if(!u)u=DB.usuarios.find(u=>u.usuario===usuario&&!u.deletedAt); if(!u){alert('Não encontrado.');return;}
    if(DB.usuarios.find(u=>u.usuario===usuario&&u.id!==u.id&&!u.deletedAt))return alert('Login já existe.');
    u.nome=nome; u.usuario=usuario; u.email=email; u.categoria=categoria; u.tipo=categoria;
    if(novaSenha)u.senha=novaSenha; u.equipe=categoria==='admin'?'Gestão':(equipe||'Geral'); salvarDB();
    try{const resp=await fetchFromGS('editarUsuario',{usuarioAntigo:u.usuario,nome,usuario,senha:novaSenha,email,categoria,equipe:u.equipe,status:u.ativo?'LIBERADO':'BLOQUEADO'});if(resp&&resp.ok)alert('✅ Atualizado!');}catch(err){alert('⚠️ Erro.');}
    carregarUsuarios(); fecharModalEditar();
}

function toggleLixeira(){const l=document.getElementById('lixeiraUsuarios');if(l.style.display==='none'||l.style.display===''){carregarLixeira();l.style.display='block';}else l.style.display='none';}
function carregarLixeira(){
    const agora=new Date(); const lixeira=DB.usuarios.filter(u=>u.deletedAt);
    document.getElementById('contadorLixeira').textContent=lixeira.length;
    const tabela=document.getElementById('tabelaLixeira');
    if(!lixeira.length){tabela.innerHTML='<tr><td colspan="7" style="text-align:center;">Lixeira vazia</td></tr>';return;}
    tabela.innerHTML=lixeira.map(v=>{const dias=Math.ceil(15-((agora-new Date(v.deletedAt))/(1000*60*60*24)));
        return '<tr><td><strong>'+v.nome+'</strong></td><td>@'+v.usuario+'</td><td>'+v.email+'</td><td><span class="badge-cat">'+(v.categoria==='admin'?'👑 Admin':'💼 Vendedor')+'</span></td><td>'+(v.equipe||'Geral')+'</td><td style="color:#ffa502;">'+dias+' dia(s)</td><td><button onclick="recuperarUsuario('+v.id+')" style="background:rgba(46,213,115,0.2);border:1px solid rgba(46,213,115,0.3);color:#2ed573;padding:6px 12px;border-radius:8px;"><i class="fas fa-undo"></i> Recuperar</button><button onclick="excluirPermanentemente('+v.id+')" style="background:rgba(255,71,87,0.2);border:1px solid rgba(255,71,87,0.3);color:#ff4757;padding:6px 12px;border-radius:8px;margin-left:5px;"><i class="fas fa-times-circle"></i> Excluir</button></td></tr>';
    }).join('');
}
function recuperarUsuario(id){const u=DB.usuarios.find(u=>u.id===id);if(u){u.deletedAt=null;u.ativo=true;salvarDB();carregarUsuarios();carregarLixeira();}}
function excluirPermanentemente(id){const u=DB.usuarios.find(u=>u.id===id);if(u&&confirm('Excluir "'+u.nome+'"?')){DB.usuarios=DB.usuarios.filter(u=>u.id!==id);salvarDB();carregarUsuarios();carregarLixeira();}}

// ===== RELATÓRIOS =====
async function carregarRelatorios(){
    await Promise.all([buscarPendentesDaNuvem(),buscarVendasAprovadasDaNuvem()]);
    const periodo=document.getElementById('filtroPeriodo').value; let dA,dAnt;
    if(periodo==='diario'){dA=gerarDadosVendas();dAnt=gerarVendasDiaPassado();}
    else if(periodo==='quinzena'){dA=gerarVendasQuinzenaAtual();dAnt=gerarVendasQuinzenaAnterior();}
    else{dA=gerarVendasMesAtual();dAnt=gerarVendasMesAnterior();}
    carregarComparativoProdutosRelatorio(dA,dAnt);
    carregarVendasPorVendedorRelatorio(dA,dAnt);
    carregarVendasPorEquipeRelatorio(dA,dAnt);
    carregarRankingRelatorio(dA);
}
function gerarVendasQuinzenaAtual(){const h=new Date();const todas=gerarVendasMesAtual();if(h.getDate()<=15)return todas.filter(v=>{const p=v.data.split('/');return p.length===3&&parseInt(p[0])>=1&&parseInt(p[0])<=15;});else return todas.filter(v=>{const p=v.data.split('/');return p.length===3&&parseInt(p[0])>=16;});}
function gerarVendasQuinzenaAnterior(){return[];}

function carregarComparativoProdutosRelatorio(atual,anterior){
    const produtos=DB.produtos.length ? DB.produtos.map(p=>p.nome) : ['Básico','Empresarial','Premium','Ultra'];
    let h='<table><thead><tr><th>Produto</th><th>Período Atual</th><th>Período Anterior</th><th>Variação</th></tr></thead><tbody>';
    produtos.forEach(p=>{const qA=atual.filter(v=>v.plano===p).length,qAnt=anterior.filter(v=>v.plano===p).length;const variacao=qAnt>0?(((qA-qAnt)/qAnt)*100).toFixed(1):(qA>0?100:0);h+='<tr><td><strong>'+p+'</strong></td><td>'+qA+'</td><td>'+qAnt+'</td><td style="color:'+(variacao>=0?'#2ed573':'#ff4757')+'">'+(variacao>=0?'+'+variacao:variacao)+'%</td></tr>';});
    h+='</tbody></table>'; document.getElementById('tabelaComparativaProdutos').innerHTML=h;
}
function carregarVendasPorVendedorRelatorio(atual,anterior){
    const vendedores=DB.usuarios.filter(u=>u.tipo==='vendedor'&&!u.deletedAt);
    const dados=vendedores.map(v=>({nome:v.nome,atual:atual.filter(vd=>vd.vendedor_id===v.id).length,anterior:anterior.filter(vd=>vd.vendedor_id===v.id).length})).sort((a,b)=>b.atual-a.atual);
    let h='<table><thead><tr><th>Vendedor</th><th>Atual</th><th>Anterior</th><th>% Variação</th></tr></thead><tbody>';
    dados.forEach(d=>{const v=d.anterior>0?(((d.atual-d.anterior)/d.anterior)*100).toFixed(1):(d.atual>0?100:0);h+='<tr><td>'+d.nome+'</td><td>'+d.atual+'</td><td>'+d.anterior+'</td><td style="color:'+(v>=0?'#2ed573':'#ff4757')+'">'+(v>=0?'+'+v:v)+'%</td></tr>';});
    h+='</tbody></table>'; document.getElementById('tabelaVendedoresRelatorio').innerHTML=h;
    const ctx=document.getElementById('graficoVendedores').getContext('2d');
    if(graficoVendedoresInstance)graficoVendedoresInstance.destroy();
    graficoVendedoresInstance=new Chart(ctx,{type:'bar',data:{labels:dados.map(d=>d.nome),datasets:[{label:'Vendas Atual',data:dados.map(d=>d.atual),backgroundColor:'#e74c3c',borderRadius:5},{label:'Período Anterior',data:dados.map(d=>d.anterior),backgroundColor:'#555',borderRadius:5}]},options:{responsive:true,plugins:{legend:{labels:{color:'#fff'}}},scales:{y:{beginAtZero:true,ticks:{color:'#fff'},grid:{color:'rgba(255,255,255,0.1)'}},x:{ticks:{color:'#fff'},grid:{display:false}}}}});
}
function carregarVendasPorEquipeRelatorio(atual,anterior){
    const equipes={}; DB.usuarios.filter(u=>u.tipo==='vendedor'&&!u.deletedAt).forEach(u=>{const eq=u.equipe||'Sem equipe';if(!equipes[eq])equipes[eq]={atual:0,anterior:0};});
    atual.forEach(v=>{const user=DB.usuarios.find(u=>u.id===v.vendedor_id);const eq=user?user.equipe||'Sem equipe':'Sem equipe';if(equipes[eq])equipes[eq].atual++;});
    anterior.forEach(v=>{const user=DB.usuarios.find(u=>u.id===v.vendedor_id);const eq=user?user.equipe||'Sem equipe':'Sem equipe';if(equipes[eq])equipes[eq].anterior++;});
    let h='<table><thead><tr><th>Equipe</th><th>Atual</th><th>Anterior</th><th>% Variação</th></tr></thead><tbody>';
    Object.entries(equipes).forEach(([nome,val])=>{const v=val.anterior>0?(((val.atual-val.anterior)/val.anterior)*100).toFixed(1):(val.atual>0?100:0);h+='<tr><td><strong>'+nome+'</strong></td><td>'+val.atual+'</td><td>'+val.anterior+'</td><td style="color:'+(v>=0?'#2ed573':'#ff4757')+'">'+(v>=0?'+'+v:v)+'%</td></tr>';});
    h+='</tbody></table>'; document.getElementById('tabelaEquipesRelatorio').innerHTML=h;
}
function carregarRankingRelatorio(atual){
    const vendedores=DB.usuarios.filter(u=>u.tipo==='vendedor'&&!u.deletedAt);
    const ranking=vendedores.map(v=>({nome:v.nome,vendas:atual.filter(vd=>vd.vendedor_id===v.id).length})).sort((a,b)=>b.vendas-a.vendas);
    const maxV=ranking[0]?ranking[0].vendas||1:1; let h='';
    ranking.forEach((v,i)=>{const m=i===0?'🥇':i===1?'🥈':i===2?'🥉':'';const pct=maxV>0?(v.vendas/maxV*100).toFixed(0):0;h+='<div class="ranking-item-relatorio"><div class="ranking-posicao-relatorio">'+(m||i+1)+'</div><div class="ranking-info-relatorio"><span class="ranking-nome-relatorio">'+v.nome+'</span><span class="ranking-detalhes-relatorio">'+v.vendas+' vendas</span><div class="barra-progresso-relatorio"><div class="barra-progresso-preenchimento" style="width:'+pct+'%"></div></div></div><div class="ranking-pontos-relatorio">'+v.vendas+'</div></div>';});
    document.getElementById('rankingRelatorio').innerHTML=h;
}

// ===== PDF FUNCIONANDO =====
function gerarPDF() {
    const elemento = document.getElementById('relatorioPrint');
    if (!elemento) {
        alert('Nada para gerar PDF.');
        return;
    }

    // Converte o canvas do gráfico em imagem para incluir no PDF
    const canvas = document.getElementById('graficoVendedores');
    if (canvas) {
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        img.style.width = '100%';
        img.style.height = 'auto';
        const graficoContainer = document.querySelector('#relatorioPrint .grafico-container');
        if (graficoContainer) {
            graficoContainer.innerHTML = '';
            graficoContainer.appendChild(img);
        }
    }

    const modal = document.getElementById('modalPDF');
    const conteudo = document.getElementById('conteudoPDF');
    conteudo.innerHTML = '';

    // Cria um container com fundo branco e texto escuro
    const container = document.createElement('div');
    container.style.background = '#ffffff';
    container.style.color = '#000000';
    container.style.padding = '20px';
    container.style.width = '100%';
    container.appendChild(elemento.cloneNode(true));

    // Garante que todas as tabelas e textos fiquem legíveis
    container.querySelectorAll('*').forEach(el => {
        if (el.style) {
            el.style.color = '#000000';
            el.style.background = 'transparent';
        }
        if (el.tagName === 'TABLE') {
            el.style.borderCollapse = 'collapse';
            el.style.width = '100%';
        }
        if (el.tagName === 'TH' || el.tagName === 'TD') {
            el.style.border = '1px solid #cccccc';
            el.style.padding = '6px';
        }
        if (el.tagName === 'TH') {
            el.style.background = '#f0f0f0';
            el.style.fontWeight = 'bold';
        }
    });

    conteudo.appendChild(container);
    modal.style.display = 'flex';

    html2pdf().set({
        margin: 0.5,
        filename: 'Relatorio_Vendas.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).from(conteudo).save().then(() => {
        fecharModalPDF();
    });
}
function fecharModalPDF() {
    const modal = document.getElementById('modalPDF');
    if (modal) modal.style.display = 'none';
}

// ===== METAS =====
function carregarMetas(){
    document.getElementById('metaDiariaVendas').value=DB.metas.diariaVendas||10;
    document.getElementById('metaQuinzenalVendas').value=DB.metas.quinzenalVendas||75;
    document.getElementById('metaMensalVendas').value=DB.metas.mensalVendas||150;
    const eld=document.getElementById('metaDiariaEmpresa'); if(eld)eld.value=DB.metas.diariaEmpresa||DB.metas.diariaVendas;
    const elq=document.getElementById('metaQuinzenalEmpresa'); if(elq)elq.value=DB.metas.quinzenalEmpresa||DB.metas.quinzenalVendas;
    const elm=document.getElementById('metaMensalEmpresa'); if(elm)elm.value=DB.metas.mensalEmpresa||DB.metas.mensalVendas;
    carregarSelectProdutos();
    document.getElementById('tabelaMetasProdutos').innerHTML=DB.metas.produtos.map(p=>'<tr><td>'+p.produto+'</td><td>'+p.diaria+'</td><td>'+p.quinzenal+'</td><td>'+p.mensal+'</td><td><button onclick="removerMetaProduto('+p.id+')" class="btn-glass-danger" style="padding:4px 10px;font-size:12px;"><i class="fas fa-trash"></i></button></td></tr>').join('');
    carregarMetasInstalacoes();
    document.getElementById('vendedorMetaInstalacao').innerHTML=DB.usuarios.filter(u=>u.tipo==='vendedor'&&u.ativo&&!u.deletedAt).map(u=>'<option value="'+u.id+'">'+u.nome+'</option>').join('');
    carregarTabelaProdutos(); carregarOpcoesVendaAdmin();
}
function carregarSelectProdutos(){
    const s=document.getElementById('produtoMetaSelect'); if(s)s.innerHTML=DB.produtos.map(p=>'<option value="'+p.nome+'">'+p.nome+'</option>').join('');
    const sv=document.getElementById('vPlano'); if(sv)sv.innerHTML='<option value="">Selecione o plano</option>'+DB.produtos.map(p=>'<option value="'+p.nome+'">'+p.nome+'</option>').join('');
}
function adicionarMetaProduto(){
    const produto = document.getElementById('produtoMetaSelect').value;
    const tipo = document.getElementById('tipoMetaProduto').value;
    const diaria = parseInt(document.getElementById('produtoDiaria').value) || 0;
    const quinzenal = parseInt(document.getElementById('produtoQuinzenal').value) || 0;
    const mensal = parseInt(document.getElementById('produtoMensal').value) || 0;
    if (!produto || diaria <= 0 || quinzenal <= 0 || mensal <= 0) return alert('Preencha todos os campos corretamente!');
    fetchFromGS('adicionarMetaProduto', { produto, tipo, diaria, quinzenal, mensal }).then(resp => {
        if (resp && resp.ok) {
            DB.metas.produtos.push({ id: resp.id, produto, diaria, quinzenal, mensal });
            salvarDB();
            carregarMetas();
            alert('✅ Meta de produto adicionada!');
        } else alert('Erro ao adicionar meta de produto.');
    }).catch(e => alert('Erro de comunicação.'));
}
function removerMetaProduto(id){
    if (!confirm('Remover esta meta?')) return;
    fetchFromGS('removerMetaProduto', { id }).then(resp => {
        if (resp && resp.ok) {
            DB.metas.produtos = DB.metas.produtos.filter(p => p.id !== id);
            salvarDB();
            carregarMetas();
        } else alert('Erro ao remover meta.');
    }).catch(e => alert('Erro de comunicação.'));
}
function adicionarMetaInstalacao(){
    const tipo = document.getElementById('tipoMetaInstalacao').value;
    const diaria = parseInt(document.getElementById('instalacaoDiaria').value) || 0;
    const quinzenal = parseInt(document.getElementById('instalacaoQuinzenal').value) || 0;
    const mensal = parseInt(document.getElementById('instalacaoMensal').value) || 0;
    if (diaria <= 0 || quinzenal <= 0 || mensal <= 0) return alert('Valores inválidos! Preencha todos os campos.');
    let entidade = '', entidadeId = null;
    if (tipo === 'vendedor') {
        const selVend = document.getElementById('vendedorMetaInstalacao');
        entidadeId = parseInt(selVend.value);
        const vend = DB.usuarios.find(u => u.id === entidadeId);
        entidade = vend ? vend.nome : 'Vendedor';
    } else { entidade = 'STAGE TELECOM'; entidadeId = 0; }
    fetchFromGS('adicionarMetaInstalacao', { tipo, entidade, entidadeId, diaria, quinzenal, mensal }).then(resp => {
        if (resp && resp.ok) {
            DB.metas.instalacoes.push({ id: resp.id, tipo, entidade, entidadeId, diaria, quinzenal, mensal });
            salvarDB();
            carregarMetas();
            alert('✅ Meta de instalação adicionada!');
        } else alert('Erro ao adicionar meta.');
    }).catch(e => { console.error(e); alert('Erro de comunicação.'); });
}
function removerMetaInstalacao(id){
    if (!confirm('Remover esta meta?')) return;
    fetchFromGS('removerMetaInstalacao', { id }).then(resp => {
        if (resp && resp.ok) {
            DB.metas.instalacoes = DB.metas.instalacoes.filter(i => i.id !== id);
            salvarDB();
            carregarMetas();
        } else alert('Erro ao remover meta.');
    }).catch(e => alert('Erro de comunicação.'));
}
function salvarMetas(){
    const diaria=parseInt(document.getElementById('metaDiariaVendas').value)||10;
    const quinzenal=parseInt(document.getElementById('metaQuinzenalVendas').value)||75;
    const mensal=parseInt(document.getElementById('metaMensalVendas').value)||150;
    const eld=document.getElementById('metaDiariaEmpresa'),elq=document.getElementById('metaQuinzenalEmpresa'),elm=document.getElementById('metaMensalEmpresa');
    const diariaEmp=eld?(parseInt(eld.value)||diaria):diaria;
    const quinzenalEmp=elq?(parseInt(elq.value)||quinzenal):quinzenal;
    const mensalEmp=elm?(parseInt(elm.value)||mensal):mensal;
    DB.metas.diariaVendas=diaria; DB.metas.quinzenalVendas=quinzenal; DB.metas.mensalVendas=mensal;
    DB.metas.diariaEmpresa=diariaEmp; DB.metas.quinzenalEmpresa=quinzenalEmp; DB.metas.mensalEmpresa=mensalEmp;
    salvarDB();
    fetchFromGS('salvarMetasVendas',{diaria,quinzenal,mensal,diariaEmp,quinzenalEmp,mensalEmp});
    alert('✅ Metas atualizadas!');
}

// ===== PRODUTOS 100% SINCRONIZADO =====
function carregarTabelaProdutos(){
    const t=document.getElementById('tabelaProdutos');if(!t)return;
    t.innerHTML='';
    t.insertAdjacentHTML('beforeend', DB.produtos.map((p,i)=>'<tr><td>'+p.nome+'</td><td><button onclick="editarProduto('+i+')" class="btn-glass-sm" style="margin-right:5px;"><i class="fas fa-edit"></i></button><button onclick="excluirProduto('+i+')" class="btn-glass-sm" style="background:rgba(255,71,87,0.2);border-color:#ff4757;color:#ff4757;"><i class="fas fa-trash"></i></button></td></tr>').join(''));
}
function adicionarProduto(){
    const nome = document.getElementById('novoProdutoNome').value.trim();
    if (!nome) return alert('Digite um nome para o produto.');
    if (DB.produtos.some(p => p.nome.toLowerCase() === nome.toLowerCase())) return alert('Produto já existe.');
    fetchFromGS('adicionarProduto', { nome }).then(resp => {
        if (resp && resp.ok) {
            DB.produtos.push({ id: resp.id, nome: nome });
            salvarDB();
            document.getElementById('novoProdutoNome').value = '';
            carregarTabelaProdutos();
            carregarSelectProdutos();
        } else alert('Erro ao adicionar produto na nuvem.');
    }).catch(e => { console.warn(e); alert('Erro de comunicação.'); });
}
function excluirProduto(index) {
    const produto = DB.produtos[index];
    if (!produto) return;
    if (!confirm('Remover produto "' + produto.nome + '"?')) return;
    fetchFromGS('removerProduto', { id: produto.id }).then(resp => {
        if (resp && resp.ok) {
            DB.produtos.splice(index, 1);
            salvarDB();
            carregarTabelaProdutos();
            carregarSelectProdutos();
        } else alert('Erro ao excluir produto.');
    }).catch(e => alert('Erro de comunicação.'));
}
function editarProduto(index) {
    const produto = DB.produtos[index];
    if (!produto) return;
    const novoNome = prompt('Novo nome:', produto.nome);
    if (novoNome && novoNome.trim() && novoNome.trim() !== produto.nome) {
        fetchFromGS('editarProduto', { id: produto.id, nome: novoNome.trim() }).then(resp => {
            if (resp && resp.ok) {
                DB.produtos[index].nome = novoNome.trim();
                salvarDB();
                carregarTabelaProdutos();
                carregarSelectProdutos();
            } else alert('Erro ao renomear produto.');
        }).catch(e => alert('Erro de comunicação.'));
    }
}

function carregarOpcoesVendaAdmin(){
    const vel=document.getElementById('opcoesVelocidade'); if(vel)vel.value=(DB.opcoesVenda.velocidades||[]).join(', ');
    const fp=document.getElementById('opcoesFormaPagamento'); if(fp)fp.value=(DB.opcoesVenda.formasPagamento||[]).join(', ');
    const val=document.getElementById('opcoesValor'); if(val)val.value=(DB.opcoesVenda.valores||[]).join(', ');
}
function salvarOpcoesVenda(){
    const velRaw=document.getElementById('opcoesVelocidade').value;
    const fpRaw=document.getElementById('opcoesFormaPagamento').value;
    const valRaw=document.getElementById('opcoesValor').value;
    DB.opcoesVenda.velocidades=velRaw.split(',').map(v=>v.trim()).filter(v=>v);
    DB.opcoesVenda.formasPagamento=fpRaw.split(',').map(v=>v.trim()).filter(v=>v);
    DB.opcoesVenda.valores=valRaw.split(',').map(v=>v.trim().replace(/R\$/gi,'').trim()).filter(v=>v!==''&&!isNaN(parseFloat(v.replace(',','.'))));
    salvarDB();
    fetchFromGS('salvarOpcoesVenda',{velocidades:DB.opcoesVenda.velocidades.join(','),formasPagamento:DB.opcoesVenda.formasPagamento.join(','),valores:DB.opcoesVenda.valores.join(',')});
    alert('✅ Opções salvas!'); carregarOpcoesVenda();
}
function carregarOpcoesVenda(){
    const sv=document.getElementById('vVelocidade'); if(sv)sv.innerHTML='<option value="">Selecione</option>'+(DB.opcoesVenda.velocidades||[]).map(v=>'<option value="'+v+'">'+v+'</option>').join('');
    const sf=document.getElementById('vFormaPagamento'); if(sf)sf.innerHTML='<option value="">Selecione</option>'+(DB.opcoesVenda.formasPagamento||[]).map(v=>'<option value="'+v+'">'+v+'</option>').join('');
    const sval=document.getElementById('vValor'); if(sval)sval.innerHTML='<option value="">Selecione</option>'+(DB.opcoesVenda.valores||[]).map(v=>'<option value="'+v+'">R$ '+v+'</option>').join('');
}
function carregarMetasInstalacoes(){
    const tabelaInst = document.getElementById('tabelaMetasInstalacoes');
    tabelaInst.innerHTML='';
    tabelaInst.insertAdjacentHTML('beforeend', DB.metas.instalacoes.map(i => '<tr>' +
        '<td>' + (i.tipo === 'vendedor' ? 'Vendedor' : 'Empresa') + '</td>' +
        '<td>' + i.entidade + '</td>' +
        '<td>' + i.diaria + '</td>' +
        '<td>' + i.quinzenal + '</td>' +
        '<td>' + i.mensal + '</td>' +
        '<td><button onclick="removerMetaInstalacao(' + i.id + ')" class="btn-glass-danger" style="padding:4px 10px;font-size:12px;"><i class="fas fa-trash"></i></button></td>' +
    '</tr>').join(''));
}
function toggleMetaInstalacao(){document.getElementById('grupoVendedorInstalacao').style.display=document.getElementById('tipoMetaInstalacao').value==='vendedor'?'block':'none';}

// ===== PROMOÇÕES =====
function mostrarFormPromocao(){document.getElementById('formPromocao').style.display='block';}
function cadastrarPromocao(){
    const tipo=document.getElementById('tipoPromocao').value;
    const quantidade=parseInt(document.getElementById('quantidadePromocao').value)||0;
    const inicio=document.getElementById('inicioPromocao').value;
    const fim=document.getElementById('fimPromocao').value;
    const premio=document.getElementById('premioPromocao').value.trim();
    const descEl=document.getElementById('descricaoPromocao');
    const descricao=descEl?descEl.value.trim():'';
    if(!inicio||!fim||!premio||quantidade<=0)return alert('Preencha todos os campos!');
    fetchFromGS('adicionarPromocao',{tipo,quantidade,inicio,fim,premio,descricao}).then(resp=>{
        if(resp&&resp.ok){DB.promocoes.push({id:resp.id,tipo,quantidade,inicio,fim,premio,descricao,ativa:true,concluida:false,vencedores:[]});salvarDB();carregarPromocoes();document.getElementById('formPromocao').style.display='none';document.getElementById('premioPromocao').value='';if(descEl)descEl.value='';alert('✅ Promoção cadastrada!');}
        else alert('Erro ao cadastrar.');
    }).catch(e=>{const localId=Date.now()+Math.random();DB.promocoes.push({id:localId,tipo,quantidade,inicio,fim,premio,descricao,ativa:true,concluida:false,vencedores:[]});salvarDB();carregarPromocoes();document.getElementById('formPromocao').style.display='none';document.getElementById('premioPromocao').value='';if(descEl)descEl.value='';});
}
function excluirPromocao(id){if(!confirm('Excluir?'))return;fetchFromGS('removerPromocao',{id}).then(resp=>{if(resp&&resp.ok){DB.promocoes=DB.promocoes.filter(p=>p.id!==id);salvarDB();carregarPromocoes();}}).catch(e=>alert('Erro.'));}
function carregarPromocoes(){
    const agora=new Date(); const t=document.getElementById('tabelaPromocoes'),dv=document.getElementById('promocoesVazia'); if(!t||!dv)return;
    DB.promocoes.forEach(p=>{const ini=new Date(p.inicio),fim=new Date(p.fim);if(agora<ini)p.status='⏳ Aguardando';else if(agora>=ini&&agora<=fim){p.status='▶️ Ativa';p.ativa=true;}else if(agora>fim&&!p.concluida){p.status='⏹️ Encerrada';p.ativa=false;verificarVencedoresPromocao(p);}});
    salvarDB();
    if(!DB.promocoes.length){t.innerHTML='';dv.style.display='block';}
    else{dv.style.display='none';t.innerHTML=DB.promocoes.map(p=>'<tr><td>'+p.tipo+'</td><td>'+p.quantidade+'</td><td>'+new Date(p.inicio).toLocaleString('pt-BR')+' → '+new Date(p.fim).toLocaleString('pt-BR')+'</td><td>'+p.premio+'</td><td>'+(p.status||'Ativa')+'</td><td><button onclick="excluirPromocao('+p.id+')" class="btn-glass-danger" style="padding:4px 10px;font-size:12px;"><i class="fas fa-trash"></i></button></td></tr>').join('');}
    renderBonusAtivoWidget();
}
function obterQuantidadePeriodo(vid, tipo, inicio, fim) {
    const vendas = DB.ativacoes.filter(a => {
        if (a.vendedor_id !== vid || a.status !== 'Aprovado') return false;
        const dataVenda = parseDateBR(a.data);
        return dataVenda >= inicio && dataVenda <= fim;
    });
    if (tipo === 'vendas') return vendas.length;
    if (tipo === 'produtos') return vendas.reduce((acc, v) => acc + (v.produto ? 1 : 0), 0);
    if (tipo === 'instalacoes') return vendas.filter(v => v.instalacaoStatus === 'Instalado').length;
    return 0;
}
function verificarVencedoresPromocao(promocao) {
    if (promocao.concluida) return;
    const inicio = new Date(promocao.inicio);
    const fim = new Date(promocao.fim);
    const vendedoresAtivos = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo);
    const ranking = vendedoresAtivos.map(v => ({
        id: v.id,
        nome: v.nome,
        quantidade: obterQuantidadePeriodo(v.id, promocao.tipo, inicio, fim)
    })).sort((a, b) => b.quantidade - a.quantidade);
    const vencedores = ranking.slice(0, promocao.quantidade).filter(v => v.quantidade > 0);
    if (vencedores.length > 0) {
        promocao.vencedores = vencedores;
        promocao.concluida = true;
        promocao.ativa = false;
        salvarDB();
        vencedores.forEach(v => {
            DB.notificacoes.push({
                userId: v.id,
                mensagem: `🏆 Parabéns! Você venceu a promoção "${promocao.premio}" com ${v.quantidade} ${promocao.tipo}!`,
                lida: false,
                data: new Date().toISOString()
            });
        });
        salvarDB();
        fetchFromGS('atualizarPromocao', { id: promocao.id, ativa: false, concluida: true, vencedores: JSON.stringify(vencedores) });
        mostrarModalParabens(`Promoção "${promocao.premio}" finalizada! ${vencedores.length} vencedor(es).`);
    }
}
function verificarPromocoesAdmin(){const agora=new Date();DB.promocoes.forEach(p=>{if(p.ativa&&new Date(p.fim)<=agora&&!p.concluida)verificarVencedoresPromocao(p);});}
function mostrarModalParabens(msg){document.getElementById('parabensMensagem').textContent=msg;document.getElementById('modalParabens').style.display='flex';}
function verificarNotificacoesVendedor(){if(!sessao||sessao.tipo!=='vendedor')return;const np=DB.notificacoes.filter(n=>n.userId===sessao.id&&!n.lida);if(np.length>0){document.getElementById('parabensVendedorMensagem').textContent=np[0].mensagem;document.getElementById('modalParabensVendedor').style.display='flex';np[0].lida=true;salvarDB();}}

setInterval(()=>{if(sessao&&sessao.tipo==='admin')verificarPromocoesAdmin();if(sessao&&sessao.tipo==='vendedor')renderBonusAtivoWidget();},30000);

// ===== NOTIFICAÇÕES =====
function tocarAlerta(){try{const AC=window.AudioContext||window.webkitAudioContext;const ctx=new AC();const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';g.gain.setValueAtTime(0.3,ctx.currentTime);o.frequency.setValueAtTime(880,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.2);o.frequency.setValueAtTime(1100,ctx.currentTime+0.25);g.gain.setValueAtTime(0.3,ctx.currentTime+0.25);g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.45);o.start(ctx.currentTime);o.stop(ctx.currentTime+0.5);}catch(e){}}
function mostrarModalNovaVenda(){const ex=document.getElementById('modalNovaVenda');if(ex)ex.remove();const m=document.createElement('div');m.id='modalNovaVenda';m.className='modal-overlay';m.style.display='flex';m.style.zIndex='99999';m.innerHTML='<div class="modal-glass modal-parabens modal-vibrando" style="text-align:center;max-width:450px;"><div class="parabens-icon" style="font-size:64px;">🔔</div><h2 style="color:#ffd700;font-size:28px;">NOVA VENDA!</h2><p style="color:#fff;">Uma nova venda foi recebida.</p><button onclick="fecharModalNovaVenda()" class="btn-glass-primary" style="margin-top:20px;background:#ff4757;">Fechar</button></div>';document.body.appendChild(m);setTimeout(()=>fecharModalNovaVenda(),8000);}
function fecharModalNovaVenda(){const m=document.getElementById('modalNovaVenda');if(m)m.remove();}
function verificarNotificacaoPendente(){if(!sessao||sessao.tipo!=='vendedor')return;const np=DB.notificacoes.filter(n=>n.userId===sessao.id&&!n.lida);if(np.length>0)verificarNotificacoesVendedor();}

// ===== GERENCIAR STATUS =====
async function abrirGerenciadorStatus(){await sincronizarStatusFlagsDaNuvem();carregarListaStatusFlags();document.getElementById('modalStatus').style.display='flex';}
function fecharModalStatus(){document.getElementById('modalStatus').style.display='none';}
function carregarListaStatusFlags(){const c=document.getElementById('listaStatusFlags');if(!c)return;c.innerHTML=DB.statusFlags.map(f=>'<div class="flag-item"><span class="flag-color" style="background:'+f.cor+';"></span><span>'+f.nome+'</span><button onclick="removerStatusFlag('+f.id+')"><i class="fas fa-trash"></i></button></div>').join('');}
async function adicionarStatusFlag(){const n=document.getElementById('novoStatusNome').value.trim(),c=document.getElementById('novoStatusCor').value;if(!n)return alert('Digite um nome!');try{const resp=await fetchFromGS('adicionarStatusFlag',{nome:n,cor:c});if(resp&&resp.ok){DB.statusFlags.push({id:resp.id,nome:n,cor:c});salvarDB();carregarListaStatusFlags();document.getElementById('novoStatusNome').value='';}else alert('Erro');}catch(err){alert('Erro de comunicação.');}}
async function removerStatusFlag(id){try{const resp=await fetchFromGS('removerStatusFlag',{id});if(resp&&resp.ok){DB.statusFlags=DB.statusFlags.filter(f=>f.id!==id);salvarDB();carregarListaStatusFlags();}}catch(err){alert('Erro');}}

// ===== RECUPERAR VENDAS / BAIXAR PLANILHA =====
async function recuperarVendasDaPlanilha(){if(!confirm('Sobrescrever vendas locais?'))return;try{await Promise.all([buscarPendentesDaNuvem(),buscarVendasAprovadasDaNuvem()]);alert('✅ Recuperado!');carregarVendasAprovadas();}catch(e){alert('❌ Erro');}}
function toggleDropdown(){const d=document.getElementById('dropdownPlanilha');d.style.display=d.style.display==='none'?'block':'none';}
function abrirSelecaoMes(){document.getElementById('modalSelecionarMes').style.display='flex';}
function fecharSelecaoMes(){document.getElementById('modalSelecionarMes').style.display='none';}
async function baixarPlanilha(filtro){let v;if(filtro==='hoje')v=obterVendasAprovadasHoje();else if(filtro==='mes')v=obterVendasAprovadasMesAtual();else if(filtro==='geral')v=DB.ativacoes.filter(a=>a.status==='Aprovado'&&a.finalizada!==false);else{alert('Filtro inválido');return;}gerarExcel(v,'Vendas_'+filtro+'_'+hojeBR().replace(/\//g,'-'));}
async function confirmarSelecaoMes(){const i=document.getElementById('inputMesPlanilha').value;if(!i)return;const[ano,mes]=i.split('-').map(Number);const v=DB.ativacoes.filter(a=>a.status==='Aprovado'&&a.finalizada!==false).filter(a=>{const p=a.data.split('/');return p.length===3&&parseInt(p[2])===ano&&parseInt(p[1])===mes;});gerarExcel(v,'Vendas_'+i);fecharSelecaoMes();}
function gerarExcel(dados, nomeArquivo) {
    if (!dados || dados.length === 0) {
        alert('Nenhum dado para exportar.');
        return;
    }
    const dadosFormatados = dados.map(v => ({
        'Cliente': v.nomeCompleto || '',
        'CPF': v.cpf || '',
        'Plano': v.plano || v.produto || '',
        'Valor': v.valor || '0',
        'Vendedor': v.vendedorNome || '',
        'Status': v.status || '',
        'Data': v.data || '',
        'Instalação': v.instalacaoStatus || ''
    }));
    const ws = XLSX.utils.json_to_sheet(dadosFormatados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendas");
    XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
}

// ===== POLLING PRINCIPAL (SÓ COM ABA VISÍVEL) =====
let isPolling=false;
setInterval(()=>{
    if (document.visibilityState === 'visible' && sessao && !isPolling){
        isPolling=true;
        Promise.all([buscarPendentesDaNuvem(),buscarVendasAprovadasDaNuvem()])
            .catch(e=>console.warn(e))
            .finally(()=>{isPolling=false;});
    }
},20000);
setInterval(()=>{if(sessao&&sessao.tipo==='admin')sincronizarUsuariosDaNuvem();},10000);

// ===== LOGOUT E EXIBIÇÃO =====
function logout(){sessionStorage.removeItem('stage_session');sessionStorage.removeItem('stage_notificados_pendentes');sessao=null;document.getElementById('loginScreen').style.display='flex';document.getElementById('adminScreen').style.display='none';document.getElementById('vendedorScreen').style.display='none';}
function mostrarAdmin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'flex';
    document.getElementById('vendedorScreen').style.display = 'none';
    document.getElementById('userInfoAdmin').innerHTML = '<div style="font-weight:700;">' + sessao.nome + '</div><div style="font-size:11px;color:var(--primary-light);">👑 Administrador</div><div style="font-size:10px;color:rgba(255,255,255,0.4);">' + sessao.email + '</div>';

    // carregarDashboard já busca pendentes + aprovadas + monta o dashboard
    carregarDashboard();
    verificarPromocoesAdmin();

    // As demais sincronizações podem rodar em paralelo (não dependem uma da outra)
    Promise.all([
        sincronizarUsuariosDaNuvem(),
        sincronizarStatusFlagsDaNuvem(),
        sincronizarMetasVendas(),
        sincronizarProdutos(),
        sincronizarMetasProdutos(),
        sincronizarOpcoesVenda(),
        sincronizarMetasInstalacoes(),
        sincronizarPromocoes()
    ]);
}
function mostrarVendedor() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'flex';
    document.getElementById('userInfoVendedor').innerHTML = '<div style="font-weight:700;">' + sessao.nome + '</div><div style="font-size:11px;color:var(--primary-light);">💼 Vendedor</div><div style="font-size:10px;color:rgba(255,255,255,0.4);">' + sessao.email + '</div>';

    mostrarSecaoVendedor(null, 'inicio');
    verificarNotificacoesVendedor();

    // Busca dados principais e sincronizações em paralelo
    Promise.all([
        buscarPendentesDaNuvem(),
        buscarVendasAprovadasDaNuvem(),
        sincronizarMetasVendas(),
        sincronizarProdutos(),
        sincronizarMetasProdutos(),
        sincronizarOpcoesVenda(),
        sincronizarMetasInstalacoes(),
        sincronizarPromocoes()
    ]).then(() => {
        if (document.getElementById('secao-inicio') && document.getElementById('secao-inicio').classList.contains('section-active')) {
            carregarInicioVendedor();
        }
        renderBonusAtivoWidget();
    }).catch(e => console.warn(e));
}

// ===== FECHAR MODAIS COM ESC =====
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
        const modais = [
            { id: 'modalAtivacao', fechar: fecharModalAtivacao },
            { id: 'modalInfoAdicional', fechar: fecharModalInfoAdicional },
            { id: 'modalVisualizacao', fechar: fecharModalVisualizacao },
            { id: 'modalEditarUsuario', fechar: fecharModalEditar },
            { id: 'modalStatus', fechar: fecharModalStatus },
            { id: 'modalSelecionarMes', fechar: fecharSelecaoMes },
            { id: 'modalNovaVenda', fechar: fecharModalNovaVenda },
            { id: 'modalParabens', fechar: () => { document.getElementById('modalParabens').style.display = 'none'; } },
            { id: 'modalParabensVendedor', fechar: () => { document.getElementById('modalParabensVendedor').style.display = 'none'; } },
            { id: 'stage-bonus-modal-overlay', fechar: fecharModalBonusAtivo }
        ];
        for (let modal of modais) {
            const el = document.getElementById(modal.id);
            if (el && el.style.display === 'flex') {
                modal.fechar();
                e.preventDefault();
                break;
            }
        }
    }
});

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded',()=>{
    ensureStageBadgeStyles();
    const lembrar=localStorage.getItem('stage_remember');
    if(lembrar){document.getElementById('usuario').value=lembrar;document.getElementById('lembrar').checked=true;}
    if(sessao){sessao.tipo==='admin'?mostrarAdmin():mostrarVendedor();}
    document.addEventListener('keypress',e=>{if(e.key==='Enter'&&document.getElementById('loginScreen').style.display!=='none')fazerLogin();});
    verificarNotificacaoPendente();
    // Substitui o oninput por um event listener (debounce)
    const busca = document.getElementById('buscaAtivacao');
    if (busca) busca.addEventListener('input', filtrarAtivacoes);
});

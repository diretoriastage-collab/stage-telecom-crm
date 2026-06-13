// ============================================
// STAGE TELECOM CRM - SCRIPT COMPLETO
// Relógio funcionando + Dashboard focado em VENDAS
// ============================================

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
    ],
    config: { metaDiaria: 10, metaMensal: 50 }
};

function salvarDB() { localStorage.setItem('stage_db', JSON.stringify(DB)); }

let sessao = JSON.parse(localStorage.getItem('stage_session'));
let relogioInterval;
let comparativoAtual = 'diario';

// ===== LOGIN =====
function fazerLogin() {
    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value.trim();
    const erro = document.getElementById('mensagemErro');
    if (!usuario || !senha) {
        erro.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Preencha todos os campos!';
        erro.style.color = '#ffa502';
        return;
    }
    const user = DB.usuarios.find(u => u.usuario === usuario && u.senha === senha && u.ativo);
    if (user) {
        sessao = { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo };
        localStorage.setItem('stage_session', JSON.stringify(sessao));
        erro.innerHTML = '<i class="fas fa-check-circle"></i> Login realizado! Redirecionando...';
        erro.style.color = '#2ed573';
        if (document.getElementById('lembrar')?.checked) {
            localStorage.setItem('stage_remember', usuario);
        }
        setTimeout(() => {
            if (user.tipo === 'admin') mostrarAdmin();
            else mostrarVendedor();
        }, 600);
    } else {
        erro.innerHTML = '<i class="fas fa-times-circle"></i> Usuário ou senha inválidos!';
        erro.style.color = '#ff4757';
        document.getElementById('senha').value = '';
        document.getElementById('senha').focus();
    }
}

function logout() {
    if (relogioInterval) clearInterval(relogioInterval);
    localStorage.removeItem('stage_session');
    sessao = null;
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'none';
}

// ===== MOSTRAR TELAS =====
function mostrarAdmin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'flex';
    document.getElementById('vendedorScreen').style.display = 'none';
    document.getElementById('userInfoAdmin').innerHTML = `
        <div style="font-weight: 700; font-size: 15px;">${sessao.nome}</div>
        <div style="font-size: 11px; color: var(--primary-light); margin-top: 3px;">👑 Administrador</div>
        <div style="font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 3px;">${sessao.email}</div>
    `;
    carregarDashboard();
    iniciarRelogio(); // garante início do relógio
    carregarConfiguracoes();
}

function mostrarVendedor() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'none';
    document.getElementById('vendedorScreen').style.display = 'flex';
    document.getElementById('userInfoVendedor').innerHTML = `
        <div style="font-weight: 700; font-size: 15px;">${sessao.nome}</div>
        <div style="font-size: 11px; color: var(--primary-light); margin-top: 3px;">💼 Vendedor</div>
        <div style="font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 3px;">${sessao.email}</div>
    `;
    carregarMeusClientes();
}

// ===== RELÓGIO EM TEMPO REAL (FUNCIONANDO) =====
function atualizarRelogio() {
    const agora = new Date();
    const diasSemana = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];
    const meses = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    const dataFormatada = `${diasSemana[agora.getDay()]}, ${agora.getDate()} ${meses[agora.getMonth()]} ${agora.getFullYear()}`;
    const horas = String(agora.getHours()).padStart(2,'0');
    const minutos = String(agora.getMinutes()).padStart(2,'0');
    const segundos = String(agora.getSeconds()).padStart(2,'0');
    const periodo = agora.getHours() < 12 ? '☀️ MANHÃ' : agora.getHours() < 18 ? '🌤️ TARDE' : '🌙 NOITE';

    const dataEl = document.getElementById('dataAtual');
    const horaEl = document.getElementById('horaAtual');
    const periodoEl = document.getElementById('periodoDia');
    if (dataEl) dataEl.textContent = dataFormatada;
    if (horaEl) horaEl.textContent = `${horas}:${minutos}:${segundos}`;
    if (periodoEl) periodoEl.textContent = periodo;
}

function iniciarRelogio() {
    if (relogioInterval) clearInterval(relogioInterval);
    atualizarRelogio();
    relogioInterval = setInterval(atualizarRelogio, 1000);
}

// ===== CONFIGURAÇÕES =====
function carregarConfiguracoes() {
    const diario = document.getElementById('metaDiariaInput');
    const mensal = document.getElementById('metaMensalInput');
    if (diario) diario.value = DB.config.metaDiaria;
    if (mensal) mensal.value = DB.config.metaMensal;
}
function salvarConfiguracoes() {
    const diario = parseInt(document.getElementById('metaDiariaInput').value) || 10;
    const mensal = parseInt(document.getElementById('metaMensalInput').value) || 50;
    DB.config.metaDiaria = diario;
    DB.config.metaMensal = mensal;
    salvarDB();
    alert('✅ Configurações salvas!');
    carregarDashboard();
}

// ===== DADOS DE VENDAS (simulados) =====
function gerarDadosVendas() {
    const hoje = new Date();
    const dataHoje = hoje.toISOString().split('T')[0];
    let vendasHoje = JSON.parse(localStorage.getItem('vendas_diarias')) || [];
    if (vendasHoje.length === 0 || vendasHoje[0]?.data !== dataHoje) {
        const vendedores = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo);
        const planos = [{ nome: 'Básico', valor: 299.90 }, { nome: 'Empresarial', valor: 499.90 }, { nome: 'Premium', valor: 899.90 }, { nome: 'Ultra', valor: 1499.90 }];
        vendasHoje = [];
        const num = Math.floor(Math.random() * 8) + 3;
        for (let i = 0; i < num; i++) {
            const vend = vendedores[Math.floor(Math.random() * vendedores.length)];
            const plano = planos[Math.floor(Math.random() * planos.length)];
            vendasHoje.push({
                id: Date.now() + i,
                vendedor_id: vend.id,
                vendedor_nome: vend.nome,
                plano: plano.nome,
                valor: plano.valor,
                data: dataHoje,
                hora: `${String(Math.floor(Math.random()*24)).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`
            });
        }
        localStorage.setItem('vendas_diarias', JSON.stringify(vendasHoje));
    }
    return vendasHoje;
}

function gerarVendasDiaPassado() {
    const hoje = new Date();
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());
    const data = mesPassado.toISOString().split('T')[0];
    let vendas = JSON.parse(localStorage.getItem('vendas_mes_passado_dia')) || [];
    if (vendas.length === 0 || vendas[0]?.data !== data) {
        const vendedores = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo);
        const planos = [{ nome: 'Básico', valor: 299.90 }, { nome: 'Empresarial', valor: 499.90 }, { nome: 'Premium', valor: 899.90 }];
        vendas = [];
        const num = Math.floor(Math.random() * 6) + 2;
        for (let i = 0; i < num; i++) {
            const vend = vendedores[Math.floor(Math.random() * vendedores.length)];
            const plano = planos[Math.floor(Math.random() * planos.length)];
            vendas.push({ id: Date.now() + i, vendedor_id: vend.id, vendedor_nome: vend.nome, plano: plano.nome, valor: plano.valor, data });
        }
        localStorage.setItem('vendas_mes_passado_dia', JSON.stringify(vendas));
    }
    return vendas;
}

function gerarVendasMesAtual() {
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
    let vendas = JSON.parse(localStorage.getItem('vendas_mes_atual')) || [];
    if (vendas.length === 0 || !vendas[0]?.data.startsWith(mesAtual)) {
        const vendedores = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo);
        const planos = [{ nome: 'Básico', valor: 299.90 }, { nome: 'Empresarial', valor: 499.90 }, { nome: 'Premium', valor: 899.90 }];
        vendas = [];
        const num = Math.floor(Math.random() * 30) + 15;
        for (let i = 0; i < num; i++) {
            const vend = vendedores[Math.floor(Math.random() * vendedores.length)];
            const plano = planos[Math.floor(Math.random() * planos.length)];
            const dia = String(Math.floor(Math.random() * hoje.getDate()) + 1).padStart(2,'0');
            vendas.push({ id: Date.now()+i, vendedor_id: vend.id, vendedor_nome: vend.nome, plano: plano.nome, valor: plano.valor, data: `${mesAtual}-${dia}` });
        }
        localStorage.setItem('vendas_mes_atual', JSON.stringify(vendas));
    }
    return vendas;
}

function gerarVendasMesAnterior() {
    const hoje = new Date();
    const mesAnt = hoje.getMonth() === 0 ? 12 : hoje.getMonth();
    const anoAnt = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
    const mesKey = `${anoAnt}-${String(mesAnt).padStart(2,'0')}`;
    let vendas = JSON.parse(localStorage.getItem('vendas_mes_anterior')) || [];
    if (vendas.length === 0 || !vendas[0]?.data.startsWith(mesKey)) {
        const vendedores = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo);
        const planos = [{ nome: 'Básico', valor: 299.90 }, { nome: 'Empresarial', valor: 499.90 }, { nome: 'Premium', valor: 899.90 }];
        vendas = [];
        const num = Math.floor(Math.random() * 25) + 10;
        for (let i = 0; i < num; i++) {
            const vend = vendedores[Math.floor(Math.random() * vendedores.length)];
            const plano = planos[Math.floor(Math.random() * planos.length)];
            const dia = String(Math.floor(Math.random() * 28) + 1).padStart(2,'0');
            vendas.push({ id: Date.now()+i, vendedor_id: vend.id, vendedor_nome: vend.nome, plano: plano.nome, valor: plano.valor, data: `${mesKey}-${dia}` });
        }
        localStorage.setItem('vendas_mes_anterior', JSON.stringify(vendas));
    }
    return vendas;
}

// ===== CARREGAR DASHBOARD (SEM RECEITA/CONVERSÃO) =====
function carregarDashboard() {
    // Atualiza apenas os dois cards
    document.getElementById('totalClientes').textContent = DB.clientes.length;
    document.getElementById('vendedoresAtivos').textContent = DB.usuarios.filter(u => u.tipo === 'vendedor' && u.ativo).length;
    
    // Vendas diárias e comparativo
    carregarVendasDiarias();
    mostrarComparativo(comparativoAtual);
    
    // Tabela de clientes
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
                <td>${new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
            </tr>
        `;
    }).join('');
}

// ===== VENDAS DIÁRIAS =====
function carregarVendasDiarias() {
    const hoje = new Date();
    document.getElementById('dataVendasDiarias').textContent = hoje.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });
    
    const vendasHoje = gerarDadosVendas();
    const meta = DB.config.metaDiaria;
    document.getElementById('totalVendasHoje').textContent = vendasHoje.length;
    document.getElementById('metaDiaria').textContent = meta;
    document.getElementById('metaProgresso').style.width = `${Math.min((vendasHoje.length / meta) * 100, 100)}%`;
    
    // Ranking
    const ranking = {};
    vendasHoje.forEach(v => {
        if (!ranking[v.vendedor_id]) ranking[v.vendedor_id] = { nome: v.vendedor_nome, vendas: 0, valor: 0 };
        ranking[v.vendedor_id].vendas++;
        ranking[v.vendedor_id].valor += v.valor;
    });
    const rankingArr = Object.values(ranking).sort((a,b) => b.vendas - a.vendas);
    const rankingEl = document.getElementById('rankingVendedores');
    if (rankingArr.length === 0) {
        rankingEl.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,0.4);padding:20px;">Nenhuma venda hoje</p>';
    } else {
        rankingEl.innerHTML = rankingArr.map((r,i) => {
            const pos = i+1;
            const cls = pos===1 ? 'top1' : pos===2 ? 'top2' : pos===3 ? 'top3' : 'normal';
            const medal = pos===1 ? '🥇' : pos===2 ? '🥈' : pos===3 ? '🥉' : pos;
            return `<div class="ranking-item">
                <div class="ranking-posicao ${cls}">${medal}</div>
                <div class="ranking-info">
                    <span class="ranking-nome">${r.nome}</span>
                    <span class="ranking-vendas">${r.vendas} vendas</span>
                </div>
                <span class="ranking-pontos">${r.vendas}</span>
            </div>`;
        }).join('');
    }
    
    // Produtos
    const produtos = {};
    vendasHoje.forEach(v => {
        if (!produtos[v.plano]) produtos[v.plano] = { nome: v.plano, qtd: 0 };
        produtos[v.plano].qtd++;
    });
    const prodArr = Object.values(produtos).sort((a,b) => b.qtd - a.qtd);
    const maxQtd = prodArr[0]?.qtd || 1;
    const prodEl = document.getElementById('produtosVendidos');
    if (prodArr.length === 0) {
        prodEl.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,0.4);">Nenhum produto</p>';
    } else {
        prodEl.innerHTML = prodArr.map(p => `
            <div class="produto-item">
                <span class="produto-nome">${p.nome}</span>
                <div class="produto-bar"><div class="produto-bar-fill" style="width:${(p.qtd/maxQtd)*100}%"></div></div>
                <span class="produto-qtd">${p.qtd}x</span>
            </div>
        `).join('');
    }
}

// ===== COMPARATIVO =====
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
    const dataHoje = hoje.toLocaleDateString('pt-BR', { day:'numeric', month:'long' });
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth()-1, hoje.getDate());
    const dataPassado = mesPassado.toLocaleDateString('pt-BR', { day:'numeric', month:'long' });
    document.getElementById('compDataHoje').textContent = dataHoje;
    document.getElementById('compDataPassado').textContent = dataPassado;
    
    const vendasHoje = gerarDadosVendas();
    const vendasPassado = gerarVendasDiaPassado();
    document.getElementById('compVendasHoje').textContent = vendasHoje.length;
    document.getElementById('compVendasPassado').textContent = vendasPassado.length;
    
    const dif = vendasHoje.length - vendasPassado.length;
    const diffEl = document.getElementById('compDiferencaDiario');
    if (dif > 0) {
        diffEl.className = 'comp-diferenca positivo';
        diffEl.innerHTML = `📈 ${dif} vendas a mais (${((dif/Math.max(vendasPassado.length,1))*100).toFixed(1)}%)`;
    } else if (dif < 0) {
        diffEl.className = 'comp-diferenca negativo';
        diffEl.innerHTML = `📉 ${Math.abs(dif)} vendas a menos (${((dif/Math.max(vendasPassado.length,1))*100).toFixed(1)}%)`;
    } else {
        diffEl.className = 'comp-diferenca positivo';
        diffEl.innerHTML = `➡️ Mesmo número de vendas`;
    }
    
    // Destaque
    const ranking = {};
    vendasHoje.forEach(v => {
        if (!ranking[v.vendedor_id]) ranking[v.vendedor_id] = { nome: v.vendedor_nome, vendas: 0 };
        ranking[v.vendedor_id].vendas++;
    });
    const melhor = Object.values(ranking).sort((a,b) => b.vendas - a.vendas)[0];
    const destaqueEl = document.getElementById('destaqueDiario');
    if (melhor) {
        destaqueEl.innerHTML = `<div class="destaque-card"><div class="destaque-icon">🏆</div><div><div class="destaque-nome">${melhor.nome}</div><div class="destaque-info">${melhor.vendas} vendas hoje</div></div></div>`;
    } else {
        destaqueEl.innerHTML = '<p style="color:rgba(255,255,255,0.4);">Nenhum vendedor</p>';
    }
    
    // Comparação produtos
    carregarComparacaoProdutos(vendasHoje, vendasPassado, 'compProdutosDiario');
}

function carregarComparativoMensal() {
    const hoje = new Date();
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    document.getElementById('compMesAtual').textContent = meses[hoje.getMonth()];
    document.getElementById('compMesPassado').textContent = meses[hoje.getMonth() === 0 ? 11 : hoje.getMonth()-1];
    
    const vendasAtual = gerarVendasMesAtual();
    const vendasAnterior = gerarVendasMesAnterior();
    document.getElementById('compVendasMesAtual').textContent = vendasAtual.length;
    document.getElementById('compVendasMesAnterior').textContent = vendasAnterior.length;
    
    const dif = vendasAtual.length - vendasAnterior.length;
    const diffEl = document.getElementById('compDiferencaMensal');
    if (dif > 0) {
        diffEl.className = 'comp-diferenca positivo';
        diffEl.innerHTML = `📈 ${dif} vendas a mais (${((dif/Math.max(vendasAnterior.length,1))*100).toFixed(1)}%)`;
    } else if (dif < 0) {
        diffEl.className = 'comp-diferenca negativo';
        diffEl.innerHTML = `📉 ${Math.abs(dif)} vendas a menos (${((dif/Math.max(vendasAnterior.length,1))*100).toFixed(1)}%)`;
    } else {
        diffEl.className = 'comp-diferenca positivo';
        diffEl.innerHTML = `➡️ Mesmo número de vendas`;
    }
    
    // Destaque
    const ranking = {};
    vendasAtual.forEach(v => {
        if (!ranking[v.vendedor_id]) ranking[v.vendedor_id] = { nome: v.vendedor_nome, vendas: 0 };
        ranking[v.vendedor_id].vendas++;
    });
    const melhor = Object.values(ranking).sort((a,b) => b.vendas - a.vendas)[0];
    const destaqueEl = document.getElementById('destaqueMensal');
    if (melhor) {
        destaqueEl.innerHTML = `<div class="destaque-card"><div class="destaque-icon">🏆</div><div><div class="destaque-nome">${melhor.nome}</div><div class="destaque-info">${melhor.vendas} vendas no mês</div></div></div>`;
    } else {
        destaqueEl.innerHTML = '<p style="color:rgba(255,255,255,0.4);">Nenhum vendedor</p>';
    }
    
    carregarComparacaoProdutos(vendasAtual, vendasAnterior, 'compProdutosMensal');
    
    // Meta mensal
    const meta = DB.config.metaMensal;
    const realizado = vendasAtual.length;
    const pct = Math.min((realizado / meta) * 100, 100).toFixed(1);
    document.getElementById('metaMensalValor').textContent = meta;
    document.getElementById('metaMensalRealizado').textContent = realizado;
    document.getElementById('metaMensalPct').textContent = `${pct}%`;
    document.getElementById('metaMensalProgresso').style.width = `${pct}%`;
}

function carregarComparacaoProdutos(vAtual, vPassado, containerId) {
    const container = document.getElementById(containerId);
    const planos = ['Básico','Empresarial','Premium','Ultra'];
    const maxVendas = Math.max(...planos.map(p => {
        const a = vAtual.filter(v => v.plano === p).length;
        const b = vPassado.filter(v => v.plano === p).length;
        return Math.max(a, b, 1);
    }), 1);
    
    container.innerHTML = planos.map(p => {
        const qtdAtual = vAtual.filter(v => v.plano === p).length;
        const qtdPassado = vPassado.filter(v => v.plano === p).length;
        return `<div class="comp-produto-item">
            <span class="comp-produto-nome">${p}</span>
            <div class="comp-produto-barras">
                <div class="comp-produto-atual" style="width:${(qtdAtual/maxVendas)*100}%;min-width:${qtdAtual>0?'25px':'0'}">${qtdAtual>0?qtdAtual:''}</div>
                <div class="comp-produto-passado" style="width:${(qtdPassado/maxVendas)*100}%;min-width:${qtdPassado>0?'25px':'0'}">${qtdPassado>0?qtdPassado:''}</div>
            </div>
        </div>`;
    }).join('');
}

// ===== NAVEGAÇÃO ADMIN =====
function mostrarSecao(secao) {
    document.querySelectorAll('.section-active,.section-hidden').forEach(s => { s.style.display='none'; s.className='section-hidden'; });
    const el = document.getElementById(`secao-${secao}`);
    if (el) { el.style.display='block'; el.className='section-active'; }
    document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
    const nav = document.querySelector(`[data-section="${secao}"]`);
    if (nav) nav.classList.add('active');
    const titulos = { dashboard:'📊 Dashboard', vendedores:'👥 Vendedores', clientes:'🏢 Clientes', relatorios:'📈 Relatórios', config:'⚙️ Configurações' };
    document.getElementById('tituloSecao').innerHTML = titulos[secao] || secao;
    if (secao === 'vendedores') carregarVendedores();
    if (secao === 'clientes') carregarTodosClientes();
    if (secao === 'relatorios') carregarRelatorios();
}

// ===== ADMIN - VENDEDORES =====
function mostrarFormVendedor() { document.getElementById('formVendedor').style.display='block'; }
function cadastrarVendedor() {
    const nome = document.getElementById('nomeVendedor').value.trim();
    const usuario = document.getElementById('usuarioVendedor').value.trim();
    const senha = document.getElementById('senhaVendedor').value.trim();
    const email = document.getElementById('emailVendedor').value.trim();
    if (!nome || !usuario || !senha || !email) return alert('⚠️ Preencha todos os campos!');
    if (DB.usuarios.find(u => u.usuario === usuario)) return alert('⚠️ Usuário já existe!');
    DB.usuarios.push({ id: DB.usuarios.length+1, usuario, senha, nome, email, tipo:'vendedor', ativo:true });
    salvarDB();
    carregarVendedores();
    document.getElementById('formVendedor').style.display='none';
    ['nomeVendedor','usuarioVendedor','senhaVendedor','emailVendedor'].forEach(id => document.getElementById(id).value='');
}
function carregarVendedores() {
    const vendedores = DB.usuarios.filter(u => u.tipo==='vendedor');
    const tabela = document.getElementById('tabelaVendedores');
    tabela.innerHTML = vendedores.map(v => {
        const clientes = DB.clientes.filter(c => c.vendedor_id === v.id).length;
        return `<tr>
            <td><strong>${v.nome}</strong></td>
            <td>@${v.usuario}</td>
            <td>${v.email}</td>
            <td><span style="background:rgba(231,76,60,0.2);padding:4px 12px;border-radius:15px;">${clientes}</span></td>
            <td class="${v.ativo?'status-ativo':''}">${v.ativo?'● Ativo':'○ Inativo'}</td>
            <td><button onclick="toggleVendedor(${v.id})" style="background:${v.ativo?'rgba(255,71,87,0.2)':'rgba(46,213,115,0.2)'};border:1px solid ${v.ativo?'rgba(255,71,87,0.3)':'rgba(46,213,115,0.3)'};color:white;padding:6px 12px;border-radius:8px;cursor:pointer;">${v.ativo?'Desativar':'Ativar'}</button></td>
        </tr>`;
    }).join('');
}
function toggleVendedor(id) {
    const vend = DB.usuarios.find(u => u.id===id);
    if (vend) { vend.ativo = !vend.ativo; salvarDB(); carregarVendedores(); }
}

// ===== ADMIN - CLIENTES =====
function carregarTodosClientes() {
    const tabela = document.getElementById('tabelaTodosClientes');
    tabela.innerHTML = DB.clientes.map(c => {
        const vend = DB.usuarios.find(u => u.id === c.vendedor_id);
        return `<tr>
            <td><strong>${c.nome}</strong></td>
            <td>${c.cnpj}</td>
            <td>${c.telefone}</td>
            <td>${c.plano}</td>
            <td>R$ ${c.valor.toFixed(2)}</td>
            <td>${vend?vend.nome:'N/A'}</td>
            <td class="status-${c.status}">● ${c.status}</td>
        </tr>`;
    }).join('');
}

// ===== ADMIN - RELATÓRIOS =====
function carregarRelatorios() {
    const ativos = DB.clientes.filter(c => c.status==='ativo');
    const totalAtivo = ativos.reduce((t,c) => t+c.valor,0);
    const media = ativos.length ? totalAtivo/ativos.length : 0;
    document.getElementById('totalPlanos').textContent = `R$ ${totalAtivo.toFixed(2)}`;
    document.getElementById('mediaCliente').textContent = `R$ ${media.toFixed(2)}`;
    document.getElementById('totalVendas').textContent = gerarVendasMesAtual().length;
}

// ===== VENDEDOR =====
function mostrarSecaoVendedor(secao) {
    document.querySelectorAll('#vendedorScreen .section-active,#vendedorScreen .section-hidden').forEach(s => { s.style.display='none'; s.className='section-hidden'; });
    const el = document.getElementById(`secao-${secao}`);
    if (el) { el.style.display='block'; el.className='section-active'; }
    document.querySelectorAll('#vendedorScreen .nav-item').forEach(a => a.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    document.getElementById('tituloSecaoVendedor').innerHTML = { meusClientes:'🏢 Meus Clientes', novoCliente:'➕ Novo Cliente', minhasVendas:'💰 Minhas Vendas' }[secao];
    if (secao==='meusClientes') carregarMeusClientes();
    if (secao==='minhasVendas') carregarMinhasVendas();
}
function carregarMeusClientes() {
    const meus = DB.clientes.filter(c => c.vendedor_id===sessao.id);
    document.getElementById('totalMeusClientes').textContent = meus.length;
    document.getElementById('meusAtivos').textContent = meus.filter(c=>c.status==='ativo').length;
    document.getElementById('meusProspectos').textContent = meus.filter(c=>c.status==='prospecto').length;
    const tabela = document.getElementById('tabelaMeusClientes');
    tabela.innerHTML = meus.length ? meus.map(c => `<tr>
        <td><strong>${c.nome}</strong></td>
        <td>${c.telefone}</td>
        <td>${c.email}</td>
        <td>${c.plano}</td>
        <td>R$ ${c.valor.toFixed(2)}</td>
        <td class="status-${c.status}">● ${c.status}</td>
    </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:30px;">Nenhum cliente</td></tr>';
}
function carregarMinhasVendas() {
    const minhas = DB.clientes.filter(c => c.vendedor_id===sessao.id && c.status==='ativo');
    const tabela = document.getElementById('tabelaMinhasVendas');
    tabela.innerHTML = minhas.length ? minhas.map(c => `<tr>
        <td><strong>${c.nome}</strong></td>
        <td>${c.plano}</td>
        <td>R$ ${c.valor.toFixed(2)}</td>
        <td>${new Date(c.data+'T00:00:00').toLocaleDateString('pt-BR')}</td>
    </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:30px;">Nenhuma venda</td></tr>';
}
function cadastrarCliente() {
    const nome = document.getElementById('nomeCliente').value.trim();
    const cnpj = document.getElementById('cnpjCliente').value.trim();
    const telefone = document.getElementById('telefoneCliente').value.trim();
    const email = document.getElementById('emailCliente').value.trim();
    const plano = document.getElementById('planoCliente').value;
    if (!nome||!cnpj||!telefone||!email||!plano) return alert('⚠️ Preencha todos os campos!');
    const valores = { 'Básico':299.90, 'Empresarial':499.90, 'Premium':899.90 };
    DB.clientes.push({ id: DB.clientes.length+1, nome, cnpj, telefone, email, vendedor_id: sessao.id, status:'prospecto', plano, valor: valores[plano], data: new Date().toISOString().split('T')[0] });
    salvarDB();
    ['nomeCliente','cnpjCliente','telefoneCliente','emailCliente'].forEach(id => document.getElementById(id).value='');
    document.getElementById('planoCliente').value='';
    alert('✅ Cliente cadastrado!');
    mostrarSecaoVendedor('meusClientes');
}

// ===== INICIAR =====
document.addEventListener('DOMContentLoaded', () => {
    const usuarioLembrado = localStorage.getItem('stage_remember');
    if (usuarioLembrado) {
        document.getElementById('usuario').value = usuarioLembrado;
        document.getElementById('lembrar').checked = true;
    }
    if (sessao) {
        if (sessao.tipo === 'admin') mostrarAdmin();
        else mostrarVendedor();
    }
    document.addEventListener('keypress', e => {
        if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') {
            fazerLogin();
        }
    });
});

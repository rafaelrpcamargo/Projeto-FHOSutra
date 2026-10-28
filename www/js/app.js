/* ===== FHOSutra – lógica do app =====
   Dados editáveis ficam em data/positions.json e data/quiz.json. */

let POS = [], QUIZ = [];                       // carregados dos JSON
const $ = s => document.querySelector(s);
const porId = id => POS.find(p => p.id === id);
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();   // busca sem acento
const estado = { nome: '', i: 0, respostas: [] };
const filtro = { texto: '', dif: 0, flex: 0, obj: new Set() };   // filtros da aba Explorar
let detalhes = [], telaAtual = 'inicio', abaAtual = 'inicio';    // "detalhes" = pilha de posições abertas

/* ---------- Inicialização ---------- */
async function iniciar() {
  try {
    POS = await (await fetch('data/positions.json')).json();
    QUIZ = await (await fetch('data/quiz.json')).json();
  } catch (e) {
    document.body.innerHTML = '<p style="padding:20px">Abra com o Live Server (veja o README.md).</p>';
    return;
  }
  desenharChips(); filtrar(); desenharRoleta();
}

/* ---------- Navegação ---------- */
function mostrar(id) {
  telaAtual = id;
  document.querySelectorAll('.tela').forEach(t => t.classList.toggle('ativa', t.id === id));
  window.scrollTo(0, 0); atualizarVoltar();
}
function aba(nome) {
  abaAtual = nome;
  document.querySelectorAll('.aba').forEach(a => a.classList.toggle('ativa', a.id === 'aba-' + nome));
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('ativa', b.dataset.aba === nome));
  window.scrollTo(0, 0); atualizarVoltar();
}
function entrarNoApp() { desenharInicio(); detalhes = []; $('#detalhe').classList.remove('aberto'); mostrar('app'); aba('inicio'); }

// O botão ← Voltar só aparece quando existe um "passo anterior"
function atualizarVoltar() {
  $('#voltar').hidden = !(detalhes.length || ['nome', 'quiz', 'resultado'].includes(telaAtual) || (telaAtual === 'app' && abaAtual !== 'inicio'));
}
function voltar() {
  if (detalhes.length) {                                   // 1) fecha a posição aberta (ou volta para a anterior)
    detalhes.pop();
    detalhes.length ? renderDetalhe() : $('#detalhe').classList.remove('aberto');
  } else if (telaAtual === 'app') aba('inicio');           // 2) de qualquer aba volta ao Início
  else if (telaAtual === 'resultado') { mostrar('quiz'); pergunta(); }   // 3) volta à última pergunta
  else if (telaAtual === 'quiz') {                          // ...ou à pergunta anterior (a resposta continua marcada)
    if (estado.i === 0) mostrar('nome'); else { estado.i--; pergunta(); }
  } else if (telaAtual === 'nome') mostrar('inicio');
  atualizarVoltar();
}
$('#voltar').onclick = voltar;

// Um único "ouvinte" para os botões com data-ir, data-aba, data-pos, data-obj, data-chip e data-min
document.addEventListener('click', e => {
  const el = s => e.target.closest(s);
  let x;
  if ((x = el('[data-pos]'))) abrirDetalhe(x.dataset.pos);
  else if ((x = el('[data-obj]'))) {                       // tag "objetivo": abre o Explorar já filtrado
    detalhes = []; $('#detalhe').classList.remove('aberto');
    filtro.obj = new Set([x.dataset.obj]); desenharChips(); filtrar(); aba('explorar');
  }
  else if ((x = el('[data-chip]'))) {                      // liga/desliga um objetivo no filtro
    const o = x.dataset.chip; filtro.obj.has(o) ? filtro.obj.delete(o) : filtro.obj.add(o);
    desenharChips(); filtrar();
  }
  else if ((x = el('[data-ir]'))) x.dataset.ir === 'app' ? entrarNoApp() : mostrar(x.dataset.ir);
  else if ((x = el('[data-aba]'))) { detalhes = []; $('#detalhe').classList.remove('aberto'); aba(x.dataset.aba); }
  else if ((x = el('[data-min]'))) definirTimer(+x.dataset.min);
});

/* ---------- Montagem dos blocos de posição ---------- */
const NIVEL = ['', 'Fácil', 'Médio', 'Difícil'];
// Barrinha com 3 slots: nível 1 = verde, 2 = amarelo, 3 = vermelho (cores no CSS: .n1 .n2 .n3)
const medidor = (rotulo, n) => `<div class="medidor n${n}"><b>${rotulo}</b><span class="slots">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span><em>${NIVEL[n]}</em></div>`;
// Se "imagem" estiver preenchida no JSON usa a foto, senão usa o emoji
// "foto" (opcional) é a imagem grande mostrada abaixo de "Como executar" no detalhe
const icone = p => p.imagem ? `<img src="${p.imagem}" alt="${p.nome}">` : `<span>${p.icone}</span>`;

const cardHTML = p => `<button class="card" data-pos="${p.id}"><div class="icone">${icone(p)}</div>
  <div><h3>${p.nome}</h3>${medidor('Dificuldade', p.dificuldade)}${medidor('Flexibilidade', p.flexibilidade)}</div></button>`;

const detalheHTML = p => `<div class="det"><div class="icone grande">${icone(p)}</div><h2>${p.nome}</h2>
  ${medidor('Dificuldade', p.dificuldade)}${medidor('Flexibilidade', p.flexibilidade)}
  <p>${p.descricao}</p><h3>Como executar</h3><p>${p.como}</p>
  ${p.foto ? `<img class="foto" src="${p.foto}" alt="Posição ${p.nome}">` : ''}
  <h3>Dicas para facilitar</h3><ul>${p.dicas.map(d => `<li>${d}</li>`).join('')}</ul>
  <h3>Objetivos da posição</h3><div class="tags">${p.objetivos.map(o => `<button class="tag obj" data-obj="${o}">${o}</button>`).join('')}</div>
  <h3>Posições parecidas</h3><div class="tags">${p.parecidas.map(id => `<button class="tag" data-pos="${id}">${porId(id).nome}</button>`).join('')}</div></div>`;

function abrirDetalhe(id) { detalhes.push(id); renderDetalhe(); }
function renderDetalhe() {
  $('#detalheConteudo').innerHTML = detalheHTML(porId(detalhes[detalhes.length - 1]));
  $('#detalhe').classList.add('aberto'); $('#detalhe').scrollTop = 0; atualizarVoltar();
}

/* ---------- Aba Início: boas-vindas + 4 recomendações do dia ---------- */
function desenharInicio() {
  $('#saudacao').textContent = `Seja bem-vindo(a), ${estado.nome}!`;
  const hoje = new Date().toDateString(), h = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  // ordena as posições por um "sorteio" que muda a cada dia e pega as 4 primeiras (mude o 4 para 3 a 5)
  const dia = [...POS].sort((a, b) => h(a.id + hoje) - h(b.id + hoje)).slice(0, 4);
  $('#destaques').innerHTML = dia.map(cardHTML).join('');
}

/* ---------- Aba Explorar: busca + filtros ---------- */
function desenharChips() {   // um botão para cada objetivo existente no JSON
  const todos = [...new Set(POS.flatMap(p => p.objetivos))].sort();
  $('#chips').innerHTML = todos.map(o => `<button class="tag chip ${filtro.obj.has(o) ? 'on' : ''}" data-chip="${o}">${o}</button>`).join('');
}
function filtrar() {
  // nome, dificuldade e flexibilidade precisam bater; dos objetivos marcados, basta bater UM
  const r = POS.filter(p => norm(p.nome).includes(filtro.texto)
    && (!filtro.dif || p.dificuldade === filtro.dif) && (!filtro.flex || p.flexibilidade === filtro.flex)
    && (!filtro.obj.size || p.objetivos.some(o => filtro.obj.has(o))));
  $('#contagem').textContent = `${r.length} posição(ões) encontrada(s)`;
  $('#lista').innerHTML = r.length ? r.map(cardHTML).join('') : '<p>Nenhuma posição encontrada. Tente limpar os filtros.</p>';
}
$('#fNome').oninput = e => { filtro.texto = norm(e.target.value.trim()); filtrar(); };
$('#fDif').onchange = e => { filtro.dif = +e.target.value; filtrar(); };
$('#fFlex').onchange = e => { filtro.flex = +e.target.value; filtrar(); };
$('#limpar').onclick = () => {
  Object.assign(filtro, { texto: '', dif: 0, flex: 0, obj: new Set() });
  $('#fNome').value = ''; $('#fDif').value = 0; $('#fFlex').value = 0; desenharChips(); filtrar();
};

/* ---------- Nome e questionário ---------- */
// Mostra (ou esconde, se msg for '') uma mensagem de erro e faz o aviso tremer
function erro(el, msg) {
  el.textContent = msg; el.hidden = !msg;
  if (msg) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
}
const SO_LETRAS = /^\p{L}+( \p{L}+)*$/u;                    // só letras (com acento), palavras separadas por espaço

// Enquanto digita: tira números e símbolos e avisa
$('#inputNome').oninput = e => {
  const v = e.target.value, limpo = v.replace(/[^\p{L} ]/gu, '');
  e.target.classList.remove('invalido');
  if (limpo !== v) { e.target.value = limpo; erro($('#erroNome'), 'Erro: use apenas letras, sem números ou símbolos.'); }
  else erro($('#erroNome'), '');
};
$('#inputNome').onkeydown = e => { if (e.key === 'Enter') $('#btnNome').click(); };

$('#btnNome').onclick = () => {
  const campo = $('#inputNome'), n = campo.value.trim().replace(/\s+/g, ' ');
  if (!n) { campo.classList.add('invalido'); campo.focus(); return erro($('#erroNome'), 'Erro: digite seu nome para continuar.'); }
  if (!SO_LETRAS.test(n)) { campo.classList.add('invalido'); return erro($('#erroNome'), 'Erro: o nome deve ter apenas letras.'); }
  campo.classList.remove('invalido'); erro($('#erroNome'), '');
  estado.nome = n;
  tocar(SOM_NOME);
  estado.i = 0; estado.respostas = [];
  mostrar('quiz'); pergunta();
};

function pergunta() {
  const q = QUIZ[estado.i];
  $('#progresso').style.width = (estado.i / QUIZ.length * 100) + '%';
  $('#pergunta').textContent = q.texto;
  $('#opcoes').innerHTML = q.opcoes.map((o, k) => `<button class="opcao ${estado.respostas[estado.i] === k ? 'sel' : ''}" data-k="${k}">${o.texto}</button>`).join('');
  $('#btnProximo').textContent = estado.i === QUIZ.length - 1 ? 'Ver recomendações' : 'Próxima';
  erro($('#erroQuiz'), '');
}
$('#opcoes').onclick = e => {                              // só marca a opção; quem avança é o botão Próxima
  const b = e.target.closest('.opcao'); if (!b) return;
  estado.respostas[estado.i] = +b.dataset.k;
  document.querySelectorAll('.opcao').forEach(x => x.classList.toggle('sel', x === b));
  erro($('#erroQuiz'), '');
};
$('#btnProximo').onclick = () => {
  if (estado.respostas[estado.i] === undefined) return erro($('#erroQuiz'), 'Erro: escolha uma resposta para continuar.');
  if (estado.i < QUIZ.length - 1) { estado.i++; pergunta(); window.scrollTo(0, 0); } else resultado();
};

/* Recomendação: compara o perfil (média das respostas por eixo, 0 a 1) com cada posição.
   Quanto menor a distância, mais combina. A dificuldade pesa 2x para proteger iniciantes. */
function recomendar() {
  const media = a => a.reduce((x, y) => x + y, 0) / a.length;
  const n01 = n => (n - 1) / 2;                        // converte 1-3 em 0-1
  const grupos = {};                                   // junta as respostas por eixo
  QUIZ.forEach((q, i) => (grupos[q.eixo] = grupos[q.eixo] || []).push(q.opcoes[estado.respostas[i]].valor));
  return POS.map(p => {
    const alvo = { controle: p.controle, intensidade: p.intensidade, dificuldade: n01(p.dificuldade), flexibilidade: n01(p.flexibilidade) };
    let d = 0;
    for (const eixo in grupos) d += Math.abs(media(grupos[eixo]) - alvo[eixo]) * (eixo === 'dificuldade' ? 2 : 1);
    return { p, d };
  }).sort((a, b) => a.d - b.d).slice(0, 3).map(x => x.p);
}
function resultado() {
  $('#tituloResultado').textContent = `${estado.nome}, essas são 3 posições recomendáveis para você iniciar sua aventura no FHO Sutra`;
  $('#recomendadas').innerHTML = recomendar().map(cardHTML).join('');
  mostrar('resultado');
}
$('#btnRefazer').onclick = () => { estado.nome = ''; $('#inputNome').value = ''; detalhes = []; mostrar('inicio'); };   // volta ao começo

/* ---------- Roleta (canvas) ---------- */
const CORES = ['#7b1e4d', '#c8412b', '#b8731b', '#4a1a5c', '#8e2c3f'];
let giro = 0, girando = false, sorteada = null;

// Sons da roleta: um ao girar e um por dificuldade (1 fácil, 2 médio, 3 difícil)
const SOM_GIRO = new Audio('sons/roleta_prazer.mp3');
const SOM_NOME = new Audio('sons/nome.mp3');   // ao confirmar o nome
const SONS_DIF = { 1: new Audio('sons/facil.mp3'), 2: new Audio('sons/mediano.mp3'), 3: new Audio('sons/dificil.mp3') };
function tocar(som) {
  if (!som) return;
  som.currentTime = 0;
  som.play().catch(() => {});   // ignora bloqueio de autoplay do navegador
}

function desenharRoleta() {
  const c = $('#roda'), x = c.getContext('2d'), n = POS.length, a = 2 * Math.PI / n, R = c.width / 2;
  POS.forEach((p, i) => {
    x.beginPath(); x.moveTo(R, R);
    x.arc(R, R, R - 4, -Math.PI / 2 + i * a, -Math.PI / 2 + (i + 1) * a);   // fatia 0 começa no topo
    x.fillStyle = CORES[i % CORES.length]; x.fill(); x.strokeStyle = '#f0a030'; x.stroke();
    x.save(); x.translate(R, R); x.rotate(i * a + a / 2);
    x.font = '36px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(p.icone, 0, -R * 0.72); x.restore();
  });
}
$('#btnGirar').onclick = () => {
  if (girando) return;
  girando = true; zerarTimer(); $('#timerBox').hidden = true; $('#resultadoRoleta').innerHTML = '';
  tocar(SOM_GIRO);
  const n = POS.length, fatia = 360 / n, i = Math.floor(Math.random() * n);
  const alvo = 360 - (i + 0.5) * fatia;                // ângulo que leva a fatia i até o ponteiro (topo)
  giro += 360 * 5 + ((alvo - giro % 360) + 360) % 360; // 5 voltas + ajuste fino
  $('#roda').style.transform = `rotate(${giro}deg)`;
  $('#roda').addEventListener('transitionend', () => {
    girando = false; sorteada = POS[i];
    SOM_GIRO.pause(); tocar(SONS_DIF[sorteada.dificuldade]);
    $('#nomeSorteada').textContent = sorteada.nome; $('#timerBox').hidden = false;
    $('#resultadoRoleta').innerHTML = detalheHTML(sorteada);   // fica na tela até girar de novo
  }, { once: true });
};

/* ---------- Timer ---------- */
let tId = null, restante = 0, pausado = false;
function mostrarRelogio() {
  const m = Math.floor(restante / 60), s = restante % 60;
  $('#relogio').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
function definirTimer(min) {
  if (!min || min < 1) return;
  clearInterval(tId); restante = Math.round(min * 60); pausado = false; $('#btnPausar').textContent = 'Pausar'; mostrarRelogio();
  tId = setInterval(() => {
    if (pausado) return;
    restante--; mostrarRelogio();
    if (restante <= 0) { clearInterval(tId); fimDoTempo(); }
  }, 1000);
}
function zerarTimer() { clearInterval(tId); restante = 0; pausado = false; mostrarRelogio(); }
function fimDoTempo() {
  navigator.vibrate && navigator.vibrate([300, 150, 300]);              // vibra no celular
  try { const a = new AudioContext(), o = a.createOscillator(); o.connect(a.destination); o.frequency.value = 660; o.start(); o.stop(a.currentTime + 0.6); } catch (e) {}
  $('#relogio').textContent = 'Tempo!';
}
$('#btnCustom').onclick = () => definirTimer(parseFloat($('#minCustom').value));
$('#btnPausar').onclick = () => { pausado = !pausado; $('#btnPausar').textContent = pausado ? 'Continuar' : 'Pausar'; };
$('#btnZerar').onclick = zerarTimer;

iniciar();

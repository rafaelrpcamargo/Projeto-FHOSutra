/* ===== FHOSutra – lógica do app (versão React Native / Expo) =====
   Dados editáveis ficam em src/data/positions.json e src/data/quiz.json. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import POS from './data/positions.json';
import QUIZ from './data/quiz.json';
import { Btn, Card, Detalhe, Erro, H1, H2, H3, NIVEL, P, Tag } from './components';
import Roleta from './Roleta';
import { C } from './theme';

const porId = id => POS.find(p => p.id === id);
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();   // busca sem acento
const SO_LETRAS = /^\p{L}+( \p{L}+)*$/u;                     // só letras (com acento), palavras separadas por espaço
const OBJETIVOS = [...new Set(POS.flatMap(p => p.objetivos))].sort();
const ABAS = [['inicio', '🏠 Início'], ['explorar', '🔎 Explorar'], ['roleta', '🎡 Roleta'], ['sobre', '🪷 O que é?']];

/* Recomendação: compara o perfil (média das respostas por eixo, 0 a 1) com cada posição.
   Quanto menor a distância, mais combina. A dificuldade pesa 2x para proteger iniciantes. */
function recomendar(respostas) {
  const media = a => a.reduce((x, y) => x + y, 0) / a.length;
  const n01 = n => (n - 1) / 2;                                 // converte 1-3 em 0-1
  const grupos = {};
  QUIZ.forEach((q, i) => (grupos[q.eixo] = grupos[q.eixo] || []).push(q.opcoes[respostas[i]].valor));
  return POS.map(p => {
    const alvo = { controle: p.controle, intensidade: p.intensidade, dificuldade: n01(p.dificuldade), flexibilidade: n01(p.flexibilidade) };
    let d = 0;
    for (const eixo in grupos) d += Math.abs(media(grupos[eixo]) - alvo[eixo]) * (eixo === 'dificuldade' ? 2 : 1);
    return { p, d };
  }).sort((a, b) => a.d - b.d).slice(0, 3).map(x => x.p);
}

// 4 recomendações que mudam a cada dia (mude o 4 para 3 a 5)
function destaquesDoDia() {
  const hoje = new Date().toDateString(), h = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  return [...POS].sort((a, b) => h(a.id + hoje) - h(b.id + hoje)).slice(0, 4);
}

export default function Main() {
  const [tela, setTela] = useState('inicio');          // inicio | nome | quiz | resultado | app
  const [aba, setAba] = useState('inicio');
  const [nome, setNome] = useState('');
  const [inputNome, setInputNome] = useState('');
  const [erroNome, setErroNome] = useState({ msg: '', tick: 0 });
  const [nomeInvalido, setNomeInvalido] = useState(false);
  const [i, setI] = useState(0);                         // pergunta atual
  const [respostas, setRespostas] = useState([]);
  const [erroQuiz, setErroQuiz] = useState({ msg: '', tick: 0 });
  const [detalhes, setDetalhes] = useState([]);          // pilha de posições abertas
  const [filtro, setFiltro] = useState({ texto: '', dif: 0, flex: 0, obj: [] });
  const scroll = useRef(null);
  const scrollDet = useRef(null);

  const erro = (set, msg) => set(e => ({ msg, tick: e.tick + 1 }));
  const topo = () => scroll.current?.scrollTo({ y: 0, animated: false });
  const mostrar = t => { setTela(t); topo(); };
  const irAba = a => { setDetalhes([]); setAba(a); topo(); };

  /* ---------- Voltar (botão na tela e botão físico do Android) ---------- */
  const podeVoltar = detalhes.length > 0 || ['nome', 'quiz', 'resultado'].includes(tela) || (tela === 'app' && aba !== 'inicio');
  function voltar() {
    if (detalhes.length) setDetalhes(d => d.slice(0, -1));          // 1) fecha a posição aberta (ou volta para a anterior)
    else if (tela === 'app') irAba('inicio');                        // 2) de qualquer aba volta ao Início
    else if (tela === 'resultado') mostrar('quiz');                   // 3) volta à última pergunta
    else if (tela === 'quiz') { if (i === 0) mostrar('nome'); else setI(i - 1); }   // ...ou à anterior
    else if (tela === 'nome') mostrar('inicio');
  }
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (!podeVoltar) return false; voltar(); return true; });
    return () => sub.remove();
  });
  useEffect(() => { scrollDet.current?.scrollTo({ y: 0, animated: false }); }, [detalhes]);

  /* ---------- Posições ---------- */
  const abrirPos = id => setDetalhes(d => [...d, id]);
  const abrirObjetivo = o => { setFiltro(f => ({ ...f, obj: [o] })); irAba('explorar'); };
  const destaques = useMemo(destaquesDoDia, [tela]);
  const recomendadas = useMemo(() => (tela === 'resultado' ? recomendar(respostas) : []), [tela]);
  const lista = POS.filter(p => norm(p.nome).includes(norm(filtro.texto.trim()))
    && (!filtro.dif || p.dificuldade === filtro.dif) && (!filtro.flex || p.flexibilidade === filtro.flex)
    && (!filtro.obj.length || p.objetivos.some(o => filtro.obj.includes(o))));
  const alternarObj = o => setFiltro(f => ({ ...f, obj: f.obj.includes(o) ? f.obj.filter(x => x !== o) : [...f.obj, o] }));

  /* ---------- Nome ---------- */
  function digitarNome(v) {
    const limpo = v.replace(/[^\p{L} ]/gu, '');                       // tira números e símbolos e avisa
    setNomeInvalido(false); setInputNome(limpo);
    erro(setErroNome, limpo !== v ? 'Erro: use apenas letras, sem números ou símbolos.' : '');
  }
  function confirmarNome() {
    const n = inputNome.trim().replace(/\s+/g, ' ');
    if (!n) { setNomeInvalido(true); return erro(setErroNome, 'Erro: digite seu nome para continuar.'); }
    if (!SO_LETRAS.test(n)) { setNomeInvalido(true); return erro(setErroNome, 'Erro: o nome deve ter apenas letras.'); }
    erro(setErroNome, ''); setNome(n); setI(0); setRespostas([]); mostrar('quiz');
  }

  /* ---------- Questionário ---------- */
  function escolher(k) { const r = [...respostas]; r[i] = k; setRespostas(r); erro(setErroQuiz, ''); }
  function proxima() {
    if (respostas[i] === undefined) return erro(setErroQuiz, 'Erro: escolha uma resposta para continuar.');
    erro(setErroQuiz, '');
    if (i < QUIZ.length - 1) { setI(i + 1); topo(); } else mostrar('resultado');
  }
  function refazer() { setNome(''); setInputNome(''); setDetalhes([]); setAba('inicio'); mostrar('inicio'); }

  /* ---------- Telas ---------- */
  let conteudo;
  if (tela === 'inicio') conteudo = (
    <View style={st.centro}>
      <Text style={{ fontSize: 72 }}>🪷</Text>
      <H1>FHO<Text style={{ color: C.vermelho }}>Sutra</Text></H1>
      <P style={{ opacity: 0.8, marginTop: -6 }}>Descubra. Conecte-se. Explore.</P>
      <Btn titulo="Começar" onPress={() => mostrar('nome')} />
      <Text style={{ color: C.texto, fontSize: 13 }}>Conteúdo para maiores de 18 anos</Text>
    </View>
  );
  else if (tela === 'nome') conteudo = (
    <View style={st.centro}>
      <H2 style={{ textAlign: 'center' }}>Como podemos te chamar?</H2>
      <TextInput style={[st.input, nomeInvalido && { borderColor: C.perigo }]} value={inputNome} onChangeText={digitarNome}
        placeholder="Seu nome" placeholderTextColor={C.navInativo} maxLength={30} autoComplete="given-name"
        returnKeyType="done" onSubmitEditing={confirmarNome} />
      <Erro {...erroNome} />
      <Btn titulo="Continuar" onPress={confirmarNome} />
    </View>
  );
  else if (tela === 'quiz') {
    const q = QUIZ[i];
    conteudo = (
      <View>
        <View style={st.barra}><View style={[st.barraCheia, { width: `${(i / QUIZ.length) * 100}%` }]} /></View>
        <H2>{q.texto}</H2>
        {q.opcoes.map((o, k) => (
          <Pressable key={k} onPress={() => escolher(k)} style={[st.opcao, respostas[i] === k && st.opcaoSel]}>
            <Text style={{ color: C.texto, fontSize: 16 }}>{o.texto}</Text>
          </Pressable>
        ))}
        <Erro {...erroQuiz} />
        <Btn titulo={i === QUIZ.length - 1 ? 'Ver recomendações' : 'Próxima'} onPress={proxima} style={{ marginTop: 18 }} />
      </View>
    );
  }
  else if (tela === 'resultado') conteudo = (
    <View>
      <H2>{nome}, essas são 3 posições recomendáveis para você iniciar sua aventura no FHO Sutra</H2>
      {recomendadas.map(p => <Card key={p.id} p={p} onPress={abrirPos} />)}
      <Btn titulo="Entrar no app" onPress={() => { setDetalhes([]); setAba('inicio'); mostrar('app'); }} style={{ marginTop: 14 }} />
    </View>
  );
  else if (aba === 'inicio') conteudo = (
    <View>
      <H2>Seja bem-vindo(a), {nome}!</H2>
      <P style={{ opacity: 0.85, marginTop: -6 }}>O que acha das recomendações de hoje?</P>
      {destaques.map(p => <Card key={p.id} p={p} onPress={abrirPos} />)}
    </View>
  );
  else if (aba === 'explorar') conteudo = (
    <View>
      <H2>Explorar</H2>
      <TextInput style={[st.input, { textAlign: 'left', fontSize: 16 }]} value={filtro.texto} placeholder="Buscar pelo nome..."
        placeholderTextColor={C.navInativo} onChangeText={t => setFiltro(f => ({ ...f, texto: t }))} />
      <Seletor rotulo="Dificuldade" valor={filtro.dif} onChange={v => setFiltro(f => ({ ...f, dif: v }))} />
      <Seletor rotulo="Flexibilidade" valor={filtro.flex} onChange={v => setFiltro(f => ({ ...f, flex: v }))} />
      <H3>O que você procura em uma posição?</H3>
      <View style={st.tags}>{OBJETIVOS.map(o => <Tag key={o} titulo={o} cheia={filtro.obj.includes(o)} onPress={() => alternarObj(o)} />)}</View>
      <View style={st.linhaContagem}>
        <Text style={{ color: C.texto, opacity: 0.8 }}>{lista.length} posição(ões) encontrada(s)</Text>
        <Tag titulo="Limpar filtros" onPress={() => setFiltro({ texto: '', dif: 0, flex: 0, obj: [] })} />
      </View>
      {lista.length ? lista.map(p => <Card key={p.id} p={p} onPress={abrirPos} />)
        : <P>Nenhuma posição encontrada. Tente limpar os filtros.</P>}
    </View>
  );
  else if (aba === 'roleta') conteudo = <Roleta POS={POS} porId={porId} abrirPos={abrirPos} abrirObjetivo={abrirObjetivo} />;
  else conteudo = (
    <View>
      <H2>O que é o Kamasutra?</H2>
      <P>O Kama Sutra é um texto clássico indiano escrito em sânscrito, atribuído ao filósofo Vatsyayana (Mallanaga Vatsyayana). Foi compilado há cerca de 1.700 a 2.000 anos, e as datas exatas variam entre os estudiosos. O nome junta <Text style={st.em}>kama</Text> (desejo, prazer, afeto) e <Text style={st.em}>sutra</Text> (fio, ou conjunto de aforismos).</P>
      <P>Ao contrário da fama popular, ele não é só um guia sexual: as posições ocupam uma parte pequena da obra. O restante fala de como viver bem: relações, cortejo, convivência, etiqueta, comunicação e o cultivo de artes como música, poesia, dança e pintura. Em obras de arte indianas, como pinturas em miniatura e esculturas de templos, o tema do amor aparece como celebração da vida.</P>
      <P>No fundo, é um caminho de autoconhecimento: entender o que você sente, o que deseja e quais são seus limites. Esse descobrimento pessoal melhora a relação consigo mesmo e, em casal, a confiança, o diálogo e o consentimento, que são a base de qualquer experiência boa.</P>
      <P style={{ fontSize: 13 }}>O FHOSutra é um app educativo para adultos. Respeite sempre os limites do outro e os seus.</P>
      <Btn titulo="Refazer questionário" onPress={refazer} style={{ marginTop: 14 }} />
    </View>
  );

  const centralizada = tela === 'inicio' || tela === 'nome';
  const posAberta = detalhes.length ? porId(detalhes[detalhes.length - 1]) : null;

  return (
    <SafeAreaView style={st.raiz} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={[st.pagina, centralizada && { flexGrow: 1, justifyContent: 'center' }]}
          keyboardShouldPersistTaps="handled">
          {conteudo}
        </ScrollView>

        {/* Menu inferior: um botão por aba */}
        {tela === 'app' && (
          <View style={st.nav}>
            {ABAS.map(([id, rot]) => (
              <Pressable key={id} style={st.navBtn} onPress={() => irAba(id)}>
                <Text style={[st.navTxt, aba === id && { color: C.acento }]}>{rot}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Tela de detalhe de uma posição (abre por cima de tudo) */}
        {posAberta && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: C.fundo }]}>
            <ScrollView ref={scrollDet} contentContainerStyle={st.pagina}>
              <Detalhe p={posAberta} porId={porId} abrirPos={abrirPos} abrirObjetivo={abrirObjetivo} />
            </ScrollView>
          </View>
        )}

        {/* Botão ← Voltar: só aparece quando existe um "passo anterior" */}
        {podeVoltar && (
          <Pressable style={st.voltar} onPress={voltar}><Text style={{ color: C.acento, fontSize: 15 }}>← Voltar</Text></Pressable>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Substitui o <select>: Todas / Fácil / Médio / Difícil
function Seletor({ rotulo, valor, onChange }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ color: C.texto, marginBottom: 6 }}>{rotulo}:</Text>
      <View style={st.seletor}>
        {[0, 1, 2, 3].map(v => (
          <Pressable key={v} onPress={() => onChange(v)} style={[st.segmento, valor === v && { backgroundColor: C.acento }]}>
            <Text style={{ color: valor === v ? C.fundo : C.texto, fontWeight: valor === v ? '600' : '400', fontSize: 14 }}>
              {v ? NIVEL[v] : 'Todas'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: C.fundo },
  pagina: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 30, width: '100%', maxWidth: 480, alignSelf: 'center' },
  centro: { alignItems: 'center', gap: 18 },
  input: { width: '100%', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.acento, backgroundColor: C.card, color: C.texto, fontSize: 18, textAlign: 'center' },
  barra: { height: 6, backgroundColor: C.card, borderRadius: 3, marginBottom: 26 },
  barraCheia: { height: '100%', backgroundColor: C.acento, borderRadius: 3 },
  opcao: { padding: 16, marginVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: C.borda, backgroundColor: C.card },
  opcaoSel: { backgroundColor: C.vermelho, borderColor: C.acento },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  linhaContagem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 8, gap: 8 },
  seletor: { flexDirection: 'row', borderWidth: 1, borderColor: C.acento, borderRadius: 12, overflow: 'hidden' },
  segmento: { flex: 1, paddingVertical: 9, alignItems: 'center', backgroundColor: C.card },
  em: { fontStyle: 'italic' },
  nav: { flexDirection: 'row', backgroundColor: C.card },
  navBtn: { flex: 1, paddingVertical: 14, paddingHorizontal: 2, alignItems: 'center' },
  navTxt: { color: C.navInativo, fontSize: 12 },
  voltar: { position: 'absolute', top: 10, left: 10, zIndex: 20, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: C.acento, backgroundColor: C.card },
});

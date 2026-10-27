/* Componentes reutilizáveis: botões, tags, medidores, cartão e detalhe de posição. */
import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { C, SERIF } from './theme';
import IMAGENS from './imagens';

export const NIVEL = ['', 'Fácil', 'Médio', 'Difícil'];

export function Btn({ titulo, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.btn, pressed && { opacity: 0.8 }, style]}>
      <Text style={s.btnTxt}>{titulo}</Text>
    </Pressable>
  );
}

export function Tag({ titulo, onPress, cheia }) {
  return (
    <Pressable onPress={onPress} style={[s.tag, cheia && s.tagCheia]}>
      <Text style={[s.tagTxt, cheia && s.tagTxtCheia]}>{titulo}</Text>
    </Pressable>
  );
}

export const H1 = ({ children, style }) => <Text style={[s.h1, style]}>{children}</Text>;
export const H2 = ({ children, style }) => <Text style={[s.h2, style]}>{children}</Text>;
export const H3 = ({ children, style }) => <Text style={[s.h3, style]}>{children}</Text>;
export const P = ({ children, style }) => <Text style={[s.p, style]}>{children}</Text>;

// Mensagem de erro que "treme" sempre que "tick" muda
export function Erro({ msg, tick }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!msg) return;
    x.setValue(0);
    Animated.sequence([-6, 6, -6, 0].map(v => Animated.timing(x, { toValue: v, duration: 60, useNativeDriver: true }))).start();
  }, [tick]);
  if (!msg) return null;
  return (
    <Animated.View style={[s.erro, { transform: [{ translateX: x }] }]}>
      <Text style={s.erroTxt}>{msg}</Text>
    </Animated.View>
  );
}

// Barrinha com 3 slots: nível 1 = verde, 2 = amarelo, 3 = vermelho
const FUNDO_NIVEL = ['', '#d6f5df', '#fff1bd', '#ffd5d5'];
const COR_NIVEL = ['', C.verde, C.amarelo, C.perigo];
export function Medidor({ rotulo, n, compacto }) {
  return (
    <View style={[s.medidor, { backgroundColor: FUNDO_NIVEL[n] }]}>
      <Text style={[s.medRotulo, { width: compacto ? 84 : 92 }]}>{rotulo}</Text>
      <View style={s.slots}>
        {[1, 2, 3].map(i => <View key={i} style={[s.slot, i <= n && { backgroundColor: COR_NIVEL[n] }]} />)}
      </View>
      {!compacto && <Text style={s.medNivel}>{NIVEL[n]}</Text>}
    </View>
  );
}

// Se "imagem" estiver preenchida usa a foto, senão usa o emoji
export function Icone({ p, grande }) {
  const fonte = p.imagem ? (p.imagem.startsWith('http') ? { uri: p.imagem } : IMAGENS[p.imagem]) : null;
  return (
    <View style={[s.icone, grande && s.iconeGrande]}>
      {fonte ? <Image source={fonte} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        : <Text style={{ fontSize: grande ? 60 : 36 }}>{p.icone}</Text>}
    </View>
  );
}

export function Card({ p, onPress }) {
  return (
    <Pressable onPress={() => onPress(p.id)} style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}>
      <Icone p={p} />
      <View style={{ flex: 1 }}>
        <H3 style={{ marginBottom: 4, marginTop: 0 }}>{p.nome}</H3>
        <Medidor rotulo="Dificuldade" n={p.dificuldade} compacto />
        <Medidor rotulo="Flexibilidade" n={p.flexibilidade} compacto />
      </View>
    </Pressable>
  );
}

// Conteúdo completo de uma posição (usado na tela de detalhe e na roleta)
export function Detalhe({ p, porId, abrirPos, abrirObjetivo }) {
  return (
    <View>
      <Icone p={p} grande />
      <H2 style={{ textAlign: 'center' }}>{p.nome}</H2>
      <Medidor rotulo="Dificuldade" n={p.dificuldade} />
      <Medidor rotulo="Flexibilidade" n={p.flexibilidade} />
      <P>{p.descricao}</P>
      <H3>Como executar</H3>
      <P>{p.como}</P>
      <H3>Dicas para facilitar</H3>
      {p.dicas.map((d, k) => <P key={k}>•  {d}</P>)}
      <H3>Objetivos da posição</H3>
      <View style={s.tags}>{p.objetivos.map(o => <Tag key={o} titulo={o} cheia onPress={() => abrirObjetivo(o)} />)}</View>
      <H3>Posições parecidas</H3>
      <View style={s.tags}>
        {p.parecidas.map(id => porId(id) && <Tag key={id} titulo={porId(id).nome} onPress={() => abrirPos(id)} />)}
      </View>
    </View>
  );
}

export const s = StyleSheet.create({
  btn: { backgroundColor: C.vermelho, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 38, alignSelf: 'center' },
  btnTxt: { color: '#fff', fontSize: 18, textAlign: 'center' },
  tag: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: C.acento, backgroundColor: C.card },
  tagCheia: { backgroundColor: C.acento },
  tagTxt: { color: C.acento, fontSize: 15 },
  tagTxtCheia: { color: C.fundo, fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  h1: { fontFamily: SERIF, color: C.acento, fontWeight: '700', fontSize: 48, letterSpacing: 1 },
  h2: { fontFamily: SERIF, color: C.acento, fontWeight: '700', fontSize: 24, marginBottom: 14, lineHeight: 30 },
  h3: { fontFamily: SERIF, color: C.acento, fontWeight: '700', fontSize: 18, marginTop: 18 },
  p: { color: C.texto, fontSize: 16, lineHeight: 24, marginVertical: 6 },
  erro: { width: '100%', padding: 10, paddingHorizontal: 14, marginVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.perigo, backgroundColor: 'rgba(214,58,58,0.2)' },
  erroTxt: { color: '#ffb4a8', fontSize: 15 },
  medidor: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, paddingHorizontal: 10, marginVertical: 3, borderRadius: 10 },
  medRotulo: { color: '#222', fontSize: 13, fontWeight: '700' },
  medNivel: { color: '#222', fontSize: 13, marginLeft: 'auto' },
  slots: { flexDirection: 'row', gap: 4 },
  slot: { width: 22, height: 9, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.18)' },
  icone: { width: 60, height: 60, borderRadius: 14, backgroundColor: C.iconeFundo, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  iconeGrande: { width: 100, height: 100, alignSelf: 'center', marginBottom: 10 },
  card: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, marginVertical: 6, borderRadius: 16, backgroundColor: C.card },
});

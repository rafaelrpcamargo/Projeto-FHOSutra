/* Aba Roleta: roda desenhada com SVG + timer. */
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Platform, Pressable, StyleSheet, Text, TextInput, Vibration, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { Btn, Detalhe, H2, H3, P } from './components';
import { C, CORES_ROLETA } from './theme';

const TAM = Math.min(Dimensions.get('window').width * 0.8, 340);   // tamanho da roda
const R = TAM / 2;

// Caminho SVG de uma fatia (a fatia 0 começa no topo)
function fatiaPath(i, n) {
  const a = 2 * Math.PI / n, r = R - 4;
  const ini = -Math.PI / 2 + i * a, fim = ini + a;
  const x1 = R + r * Math.cos(ini), y1 = R + r * Math.sin(ini);
  const x2 = R + r * Math.cos(fim), y2 = R + r * Math.sin(fim);
  return `M ${R} ${R} L ${x1} ${y1} A ${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`;
}

// Toca do começo (o player guarda a posição onde parou)
function tocar(player) {
  if (!player) return;
  player.seekTo(0);
  player.play();
}

export default function Roleta({ POS, porId, abrirPos, abrirObjetivo }) {
  const rot = useRef(new Animated.Value(0)).current;

  // ----- Sons: um ao girar e um por dificuldade (1 fácil, 2 médio, 3 difícil) -----
  const somGiro = useAudioPlayer(require('../assets/sons/roleta_prazer.mp3'));
  const somFacil = useAudioPlayer(require('../assets/sons/facil.mp3'));
  const somMedio = useAudioPlayer(require('../assets/sons/mediano.mp3'));
  const somDificil = useAudioPlayer(require('../assets/sons/dificil.mp3'));
  const sonsDif = { 1: somFacil, 2: somMedio, 3: somDificil };
  useEffect(() => { setAudioModeAsync({ playsInSilentMode: true }).catch(() => {}); }, []);
  const giro = useRef(0);
  const [girando, setGirando] = useState(false);
  const [sorteada, setSorteada] = useState(null);

  // ----- Timer -----
  const [restante, setRestante] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [fim, setFim] = useState(false);
  const [minCustom, setMinCustom] = useState('');
  const tId = useRef(null);
  const pausadoRef = useRef(false);

  const pararIntervalo = () => { clearInterval(tId.current); tId.current = null; };
  useEffect(() => pararIntervalo, []);   // limpa ao sair da tela

  function definirTimer(min) {
    if (!min || min < 1) return;
    pararIntervalo();
    setRestante(Math.round(min * 60)); setPausado(false); pausadoRef.current = false; setFim(false);
    tId.current = setInterval(() => {
      if (pausadoRef.current) return;
      setRestante(r => {
        if (r <= 1) { pararIntervalo(); fimDoTempo(); return 0; }
        return r - 1;
      });
    }, 1000);
  }
  function zerarTimer() { pararIntervalo(); setRestante(0); setPausado(false); pausadoRef.current = false; setFim(false); }
  function fimDoTempo() { Vibration.vibrate([0, 300, 150, 300]); setFim(true); }
  function alternarPausa() { pausadoRef.current = !pausadoRef.current; setPausado(pausadoRef.current); }

  const relogio = fim ? 'Tempo!'
    : String(Math.floor(restante / 60)).padStart(2, '0') + ':' + String(restante % 60).padStart(2, '0');

  // ----- Giro -----
  function girar() {
    if (girando) return;
    setGirando(true); zerarTimer(); setSorteada(null);
    tocar(somGiro);
    const n = POS.length, fatia = 360 / n, i = Math.floor(Math.random() * n);
    const alvo = 360 - (i + 0.5) * fatia;                         // ângulo que leva a fatia i até o ponteiro (topo)
    giro.current += 360 * 5 + ((alvo - giro.current % 360) + 360) % 360;   // 5 voltas + ajuste fino
    Animated.timing(rot, {
      toValue: giro.current, duration: 5000, easing: Easing.bezier(0.17, 0.67, 0.12, 1), useNativeDriver: true,
    }).start(() => {
      setGirando(false); setSorteada(POS[i]);
      somGiro.pause(); tocar(sonsDif[POS[i].dificuldade]);
    });
  }

  const n = POS.length, fatiaGraus = 360 / n;
  const rotate = rot.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'], extrapolate: 'extend' });

  return (
    <View>
      <H2>Roleta da Sorte</H2>
      <View style={st.rodaBox}>
        <Text style={st.ponteiro}>▼</Text>
        <Animated.View style={[st.roda, { transform: [{ rotate }] }]}>
          <Svg width={TAM} height={TAM}>
            {POS.map((p, i) => (
              <Path key={p.id} d={fatiaPath(i, n)} fill={CORES_ROLETA[i % CORES_ROLETA.length]} stroke={C.acento} strokeWidth={1} />
            ))}
          </Svg>
          {POS.map((p, i) => {
            const ang = (i + 0.5) * fatiaGraus, rad = (ang - 90) * Math.PI / 180, d = R * 0.72;
            return (
              <Text key={p.id} style={[st.emoji, {
                left: R + d * Math.cos(rad) - 22, top: R + d * Math.sin(rad) - 22, transform: [{ rotate: `${ang}deg` }],
              }]}>{p.icone}</Text>
            );
          })}
        </Animated.View>
      </View>
      <Btn titulo={girando ? 'Girando...' : 'Girar!'} onPress={girar} />

      {sorteada && (
        <>
          <View style={st.timerBox}>
            <H3 style={{ marginTop: 0, textAlign: 'center' }}>Caiu: {sorteada.nome}</H3>
            <P style={{ textAlign: 'center' }}>Escolha o tempo:</P>
            <View style={st.presets}>
              {[5, 10, 15, 20].map(m => <Preset key={m} titulo={`${m} min`} onPress={() => definirTimer(m)} />)}
              <TextInput style={st.minInput} value={minCustom} onChangeText={setMinCustom} keyboardType="numeric"
                placeholder="min" placeholderTextColor={C.navInativo} maxLength={3} />
              <Preset titulo="OK" onPress={() => definirTimer(parseFloat(minCustom.replace(',', '.')))} />
            </View>
            <Text style={st.relogio}>{relogio}</Text>
            <View style={st.presets}>
              <Preset titulo={pausado ? 'Continuar' : 'Pausar'} onPress={alternarPausa} />
              <Preset titulo="Zerar" onPress={zerarTimer} />
            </View>
          </View>
          <Detalhe p={sorteada} porId={porId} abrirPos={abrirPos} abrirObjetivo={abrirObjetivo} />
        </>
      )}
    </View>
  );
}

const Preset = ({ titulo, onPress }) => (
  <Pressable onPress={onPress} style={st.preset}><Text style={st.presetTxt}>{titulo}</Text></Pressable>
);

const st = StyleSheet.create({
  rodaBox: { width: TAM + 12, height: TAM + 12, alignSelf: 'center', marginTop: 24, marginBottom: 16 },
  roda: { width: TAM + 12, height: TAM + 12, borderRadius: (TAM + 12) / 2, borderWidth: 6, borderColor: C.acento, overflow: 'hidden' },
  ponteiro: { position: 'absolute', top: -20, alignSelf: 'center', fontSize: 30, color: C.acento, zIndex: 2 },
  emoji: { position: 'absolute', width: 44, height: 44, fontSize: 30, textAlign: 'center', lineHeight: 44 },
  timerBox: { marginVertical: 20, padding: 14, borderRadius: 16, backgroundColor: C.card },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginVertical: 10 },
  preset: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: C.acento },
  presetTxt: { color: C.acento, fontSize: 15 },
  minInput: { width: 70, padding: 6, borderRadius: 10, borderWidth: 1, borderColor: C.acento, backgroundColor: C.fundo, color: C.texto, fontSize: 16, textAlign: 'center' },
  relogio: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontWeight: '700', fontSize: 52, color: C.acento, textAlign: 'center' },
});

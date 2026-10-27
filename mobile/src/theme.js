/* ===== FHOSutra – tema =====
   Paleta inspirada nas pinturas em miniatura indianas.
   Para mudar as cores do app inteiro, edite os valores abaixo. */
import { Platform } from 'react-native';

export const C = {
  fundo: '#2a1130',
  card: '#3b1b45',
  acento: '#f0a030',
  vermelho: '#c8412b',
  texto: '#fbf1e2',
  verde: '#2e9e57',
  amarelo: '#d9a400',
  perigo: '#d63a3a',
  iconeFundo: '#52245c',
  borda: '#5a2d66',
  navInativo: '#b79ac0',
};

// Fonte serifada para títulos (Georgia no iOS, serif no Android)
export const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

// Cores das fatias da roleta
export const CORES_ROLETA = ['#7b1e4d', '#c8412b', '#b8731b', '#4a1a5c', '#8e2c3f'];

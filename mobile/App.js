import { SafeAreaProvider } from 'react-native-safe-area-context';
import Main from './src/Main';

// Ponto de entrada: toda a lógica do app está em src/Main.js
export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

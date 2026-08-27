import { PaperProvider } from 'react-native-paper';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';
import { AuthGate } from './src/screens/AuthGate';

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

function AppInner() {
  const { paperTheme } = useAppTheme();
  return (
    <PaperProvider theme={paperTheme}>
      <AuthGate />
    </PaperProvider>
  );
}

import { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import type { ThemeMode } from '@octapush/types';
import { resolveTheme, LightTheme } from './theme';
import type { MD3Theme } from 'react-native-paper';

interface ThemeCtx {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  paperTheme: MD3Theme;
}

const Ctx = createContext<ThemeCtx>({ mode: 'auto', setMode: () => {}, paperTheme: LightTheme });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const sys = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('auto');
  const paperTheme = resolveTheme(mode, sys === 'dark');
  return <Ctx.Provider value={{ mode, setMode, paperTheme }}>{children}</Ctx.Provider>;
}

export function useAppTheme(): ThemeCtx {
  return useContext(Ctx);
}

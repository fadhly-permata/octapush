import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import type { ThemeMode } from '@octapush/types';
import { resolveTheme, LightTheme, type LightTheme as LT } from './theme';
import type { Theme } from 'react-native-paper';

interface ThemeCtx {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  paperTheme: Theme;
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

// avoid unused import lint while keeping LightTheme type import explicit
void (LightTheme as unknown as LT);

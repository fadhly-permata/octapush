import { MD3LightTheme, MD3DarkTheme, type MD3Theme } from 'react-native-paper';
import type { ThemeMode } from '@octapush/types';

export const LightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2F6FED',
    background: '#FFFFFF',
    surface: '#F5F7FB',
  },
};

export const DarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6DA0FF',
    background: '#0E1116',
    surface: '#1A1F29',
  },
};

export function resolveTheme(mode: ThemeMode, systemIsDark: boolean): MD3Theme {
  if (mode === 'light') return LightTheme;
  if (mode === 'dark') return DarkTheme;
  return systemIsDark ? DarkTheme : LightTheme;
}

export type ThemeMode = 'light' | 'dark' | 'auto';

export type Locale = 'id' | 'en';

export const SUPPORTED_LOCALES: Locale[] = ['id', 'en'];

export const DEFAULT_LOCALE: Locale = 'id';

export interface UserPreferences {
  user_id: string;
  theme_mode: ThemeMode;
  locale: Locale;
  updated_at: string;
}

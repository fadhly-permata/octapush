import type { Locale } from '@octapush/types';
import { DEFAULT_LOCALE } from '@octapush/types';

/**
 * Runtime locale resolution (FSD §3.10): resolve key for active locale, fallback
 * to default ('id'), then fallback to raw key. Translation store comes from
 * {prefix}_app_translations (logic schema) or generated-app i18n block.
 */
export type TranslationStore = Record<string, Partial<Record<Locale, string>>>;

export function resolveTranslation(
  store: TranslationStore,
  key: string,
  locale: Locale,
): string {
  const entry = store[key];
  if (entry) {
    if (entry[locale]) return entry[locale]!;
    if (entry[DEFAULT_LOCALE]) return entry[DEFAULT_LOCALE]!;
  }
  return key; // raw key fallback
}

export function buildTranslationStore(
  rows: { key: string; locale: Locale; value: string }[],
): TranslationStore {
  const store: TranslationStore = {};
  for (const r of rows) {
    store[r.key] = { ...store[r.key], [r.locale]: r.value };
  }
  return store;
}

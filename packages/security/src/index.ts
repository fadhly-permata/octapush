import { AppError } from '@octapush/types';

/**
 * Input sanitization & validation (FSD §3.9.2 / FR-SEC-06):
 * whitelist-based sanitizer — strip control chars + dangerous tags.
 * Values are rendered as data by the renderer (React escaping), never HTML.
 */
export function sanitizeString(value: string, maxLen = 2000): string {
  if (value.length > maxLen) {
    throw new AppError({ code: 'ERR_XSS_012', message: 'Input too long' });
  }
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/<\s*\/?\s*script[^>]*>/gi, '')
    .replace(/<\s*\/?\s*(iframe|object|embed|style|form)[^>]*>/gi, '')
    .trim();
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * URL scheme validation (FSD §3.9.3): allow http/https only; block javascript:, data:, etc.
 */
export function validateUrlScheme(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Normalize a user-supplied file name: keep base name, strip path traversal. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'file';
  return base.replace(/[^\w.\-]/g, '_');
}

export const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf', 'text/'];

export function isAllowedMime(mime: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p));
}

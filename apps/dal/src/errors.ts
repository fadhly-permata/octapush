import type { DalContext } from './client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError, type ErrorCode, type ApiError } from '@octapush/types';

/**
 * Standardized error reporting: every DAL error is wrapped as AppError (FSD §6,
 * §7.1) and forwarded to the centralized error_logs sink (FR-ERR-01).
 */
export async function reportError(
  sb: SupabaseClient,
  ctx: DalContext,
  err: unknown,
): Promise<void> {
  const appErr: AppError =
    err instanceof AppError
      ? err
      : new AppError({ code: 'ERR_DAL_002', message: String(err), cause: err });

  try {
    await sb.from('error_logs').insert({
      user_id: undefined,
      project_id: undefined,
      environment: ctx.env,
      source: 'DAL',
      severity: 'ERROR',
      error_code: (appErr as AppError).code,
      message: safeMessage((appErr as Error).message),
      stack_trace: safeMessage((appErr.cause as Error)?.stack ?? (appErr as Error).stack),
      fingerprint: fingerprint((appErr as Error).message),
      context_jsonb: ctx,
      status: 'OPEN',
    });
  } catch {
    // never let error reporting crash the request
  }
}

export function toApiError(err: unknown): ApiError {
  const code: ErrorCode = err instanceof AppError ? err.code : 'ERR_DAL_002';
  const message = err instanceof Error ? err.message : String(err);
  return { code, message };
}

function fingerprint(msg: string): string {
  let h = 0;
  for (let i = 0; i < msg.length; i++) h = (h * 31 + msg.charCodeAt(i)) | 0;
  return `fp_${(h >>> 0).toString(16)}`;
}

function safeMessage(s: string | undefined): string {
  if (!s) return '';
  return s.replace(/(api[_-]?key|token|password|secret)=["']?[^"'\s]+/gi, '$1=[REDACTED]').slice(0, 4000);
}

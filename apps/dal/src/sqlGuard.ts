import { belongsToPrefix, type DalContext } from './client';
import { AppError } from '@octapush/types';

const ALLOWED_VERBS = /^(\s*(SELECT|INSERT|UPDATE|DELETE)\b)/i;
const FORBIDDEN_TOKENS = [
  /\bDROP\b/i,
  /\bALTER\b/i,
  /\bCREATE\b/i,
  /\bTRUNCATE\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bCOMMENT\b/i,
];

export interface SqlGuardResult {
  ok: boolean;
  reason?: string;
}

/**
 * SqlGuardService (FSD §3.5.3):
 * 1. Only SELECT/INSERT/UPDATE/DELETE allowed (DDL/DCL rejected -> ERR_SQL_008)
 * 2. Single statement only (no ';' separator)
 * 3. Every referenced table/view/function MUST be prefixed with active prefix
 * 4. (param binding is enforced by the caller using bound params)
 * 5. (dry-run / EXPLAIN handled at execution layer)
 */
export function sqlGuard(sql: string, ctx: DalContext): SqlGuardResult {
  const trimmed = sql.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: 'empty statement' };
  }
  if (!ALLOWED_VERBS.test(trimmed)) {
    return { ok: false, reason: 'verb not whitelisted' };
  }
  if (FORBIDDEN_TOKENS.some((re) => re.test(trimmed))) {
    return { ok: false, reason: 'DDL/DCL verb present' };
  }
  if (trimmed.includes(';')) {
    return { ok: false, reason: 'multi-statement rejected' };
  }
  // Extract referenced identifiers: FROM <tbl>, JOIN <tbl>, INTO <tbl>, UPDATE <tbl>
  const refs = trimmed.match(/(?:FROM|JOIN|INTO|UPDATE)\s+("?[\w.]+"?)/gi) ?? [];
  for (const ref of refs) {
    const ident = ref.replace(/(?:FROM|JOIN|INTO|UPDATE)\s+/i, '').replace(/"/g, '');
    const bare = ident.includes('.') ? ident.split('.').pop()! : ident;
    if (bare.startsWith('pg_') || bare.startsWith('information_schema')) {
      return { ok: false, reason: `system schema reference: ${bare}` };
    }
    if (!belongsToPrefix(bare, ctx.objectPrefix)) {
      return { ok: false, reason: `object not owned by project prefix: ${bare}` };
    }
  }
  return { ok: true };
}

export function guardOrThrow(sql: string, ctx: DalContext): void {
  const r = sqlGuard(sql, ctx);
  if (!r.ok) {
    throw new AppError({ code: 'ERR_SQL_008', message: `SQL Guard: ${r.reason}` });
  }
}

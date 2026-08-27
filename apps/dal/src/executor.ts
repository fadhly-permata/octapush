import type { DalContext } from './client';
import { getSupabase, envFor } from './client';
import { queryBuilder } from './queryBuilder';
import { guardOrThrow } from './sqlGuard';
import { reportError, toApiError } from './errors';
import { AppError } from '@octapush/types';

/**
 * Executes a dynamic SQL workflow node (EXECUTE_SQL) through the DAL.
 * Enforces SQL Guard, then runs via a parameterized RPC/function.
 */
export async function executeSqlNode(
  ctx: DalContext,
  sql: string,
  params: Record<string, unknown> = {},
): Promise<{ rows?: unknown[]; error?: ReturnType<typeof toApiError> }> {
  const sb = getSupabase(ctx);
  try {
    guardOrThrow(sql, ctx);
    // Bind params server-side; never string-concatenate client values (FSD §3.9.2).
    const { data, error } = await sb.rpc('dal_exec_dynamic', {
      p_sql: sql,
      p_params: params,
    });
    if (error) throw new AppError({ code: 'ERR_DAL_002', message: error.message });
    return { rows: data ?? [] };
  } catch (err) {
    await reportError(sb, ctx, err);
    return { error: toApiError(err) };
  }
}

/**
 * DML operation through the QueryBuilder + RLS (owner_user_id = auth.uid()).
 */
export async function runDml(
  ctx: DalContext,
  build: (qb: ReturnType<typeof queryBuilder>) => string,
): Promise<{ error?: ReturnType<typeof toApiError> }> {
  const sb = getSupabase(ctx);
  try {
    const qb = queryBuilder(ctx);
    const sql = build(qb);
    guardOrThrow(sql, ctx);
    const { error } = await sb.rpc('dal_exec_dynamic', { p_sql: sql, p_params: {} });
    if (error) throw new AppError({ code: 'ERR_DAL_002', message: error.message });
    return {};
  } catch (err) {
    await reportError(sb, ctx, err);
    return { error: toApiError(err) };
  }
}

export { envFor };

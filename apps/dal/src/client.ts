import type { ObjectPrefix, EnvSchema, Env } from '@octapush/types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@octapush/types';

export interface DalContext {
  /** Active project object prefix `{usr8}_{prj8}_` */
  objectPrefix: ObjectPrefix;
  /** Target environment schema for the operation */
  envSchema: EnvSchema;
  /** Logical environment (DEV/PROD) */
  env: Env;
  /** JWT of the calling user (auth.uid() drives RLS) */
  userJwt?: string;
  /** Supabase service role key — server-side only, never exposed to clients */
  serviceKey?: string;
}

let cachedClient: SupabaseClient | null = null;

/**
 * The DAL is the ONLY sanctioned path to the database for generated apps.
 * DB credentials (service key / connection string) live here server-side and
 * are never bundled into client apps (FR-SEC-03 / FR-SEC-05 / NFR-SEC-05).
 */
export function getSupabase(ctx: DalContext): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = ctx.serviceKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new AppError({ code: 'ERR_DAL_002', message: 'Supabase env not configured' });
  }
  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}

export function envFor(env: Env): { logic: EnvSchema; data: EnvSchema } {
  return env === 'PROD'
    ? { logic: 'logic_prod', data: 'data_prod' }
    : { logic: 'logic_dev', data: 'data_dev' };
}

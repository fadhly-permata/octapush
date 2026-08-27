import type { DalContext } from './client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppDistributionMode } from '@octapush/types';
import { AppError } from '@octapush/types';

/** Create a public distribution record for a pushed-to-PROD project (FSD §3.7). */
export async function createDistribution(
  sb: SupabaseClient,
  ctx: DalContext,
  projectId: string,
  mode: AppDistributionMode,
): Promise<{ slug: string }> {
  const slug = `${Math.random().toString(36).slice(2, 10)}`;
  const { data, error } = await sb
    .from('app_distributions')
    .insert({ project_id: projectId, slug, mode })
    .select('slug')
    .single();
  if (error) throw new AppError({ code: 'ERR_DST_011', message: error.message });
  return { slug: data.slug };
}

/** Trigger Push to PROD (structure-only clone) via RPC (FSD §3.1.4). */
export async function pushToProd(
  sb: SupabaseClient,
  ctx: DalContext,
  projectId: string,
): Promise<{ cloned: number }> {
  const { data, error } = await sb.rpc('push_project_to_prod', { p_project_id: projectId });
  if (error) throw new AppError({ code: 'ERR_PRM_006', message: error.message });
  return { cloned: (data as { cloned: number }).cloned };
}

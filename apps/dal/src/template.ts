import type { DalContext } from './client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@octapush/types';

/** Export a project's Logic artifacts as a template (FSD §3.11.3). */
export async function exportTemplate(
  sb: SupabaseClient,
  projectId: string,
  name: string,
  visibility: 'public' | 'private',
): Promise<string> {
  const { data, error } = await sb.rpc('export_template', {
    p_project_id: projectId,
    p_name: name,
    p_visibility: visibility,
  });
  if (error) throw new AppError({ code: 'ERR_MKT_016', message: error.message });
  return data;
}

/** List public templates from the marketplace. */
export async function listTemplates(
  sb: SupabaseClient,
): Promise<{ id: string; name: string; version: number; schema_version: string }[]> {
  const { data, error } = await sb
    .from('templates')
    .select('id, name, version, schema_version')
    .eq('visibility', 'public')
    .is('revoked_at', null);
  if (error) throw new AppError({ code: 'ERR_MKT_016', message: error.message });
  return (data ?? []) as never;
}

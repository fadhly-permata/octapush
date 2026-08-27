import type { DalContext } from './client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProjectMember } from '@octapush/types';
import { AppError } from '@octapush/types';

/** Invite a registered user to a project with a role (owner-only). */
export async function inviteMember(
  sb: SupabaseClient,
  ctx: DalContext,
  projectId: string,
  email: string,
  role: ProjectMember['role'],
): Promise<boolean> {
  const { data, error } = await sb.rpc('invite_member', {
    p_project_id: projectId,
    p_email: email,
    p_role: role,
  });
  if (error) throw new AppError({ code: 'ERR_RLS_007', message: error.message });
  return data;
}

/** List members of a project (RLS-restricted). */
export async function listMembers(
  sb: SupabaseClient,
  projectId: string,
): Promise<ProjectMember[]> {
  const { data, error } = await sb.from('project_members').select('*').eq('project_id', projectId);
  if (error) throw new AppError({ code: 'ERR_RLS_007', message: error.message });
  return (data ?? []) as ProjectMember[];
}

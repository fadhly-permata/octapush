-- 0004_realtime_collab_templates.sql
-- F5: Realtime broadcast, collaboration roles, template marketplace (FSD §3.11)

-- Realtime: DB trigger -> realtime.broadcast_changes() (FSD §3.11.1, R3)
create or replace function public.broadcast_changes()
returns trigger
language plpgsql
as $$
begin
  perform pg_notify(
    'octapush_changes',
    json_build_object(
      'project_id', coalesce(new.project_id, old.project_id),
      'action', tg_op,
      'table_name', tg_table_name,
      'key', coalesce((new.id)::text, (old.id)::text)
    )::text
  );
  return coalesce(new, old);
end;
$$;

-- Attach to per-project data tables is done by the DAL at provisioning/publish time:
--   create trigger {prefix}_realtime AFTER INSERT OR UPDATE OR DELETE ON {tbl}
--     for each row execute function public.broadcast_changes();

-- Collaboration: project_members already exists (migration 0001).
-- Invite helper: owner can add a member (role validated).
create or replace function public.invite_member(p_project_id uuid, p_email text, p_role text default 'viewer')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member uuid;
begin
  -- only owner can invite
  if not exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.user_id = auth.uid()
  ) then
    raise exception 'ERR_RLS_007: not project owner';
  end if;
  select user_id into v_member from public.users where email = p_email;
  if v_member is null then
    raise exception 'ERR_PRJ_005: user not registered';
  end if;
  insert into public.project_members (project_id, user_id, role, invited_by)
  values (p_project_id, v_member, p_role, auth.uid())
  on conflict (project_id, user_id) do update set role = excluded.role;
  return true;
end;
$$;

-- Template export: snapshot a project's Logic artifacts into public.templates
create or replace function public.export_template(p_project_id uuid, p_name text, p_visibility text default 'private')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_author uuid;
  v_tpl uuid;
begin
  select object_prefix, user_id into v_prefix, v_author
    from public.projects where id = p_project_id;
  if v_prefix is null or v_author <> auth.uid() then
    raise exception 'ERR_RLS_007: not project owner';
  end if;

  insert into public.templates (author_user_id, name, schema_version, visibility)
  values (v_author, p_name, '0.1.0', p_visibility)
  returning id into v_tpl;

  -- copy generated_pages as PAGE items
  execute format(
    'insert into public.template_items (template_id, item_type, payload_json) ' ||
    'select $1, ''PAGE'', row_to_json(g)::jsonb from %I.%I g',
    'logic_dev',
    v_prefix || '_generated_pages'
  ) using v_tpl;

  return v_tpl;
end;
$$;

grant execute on function public.invite_member(uuid, text, text) to authenticated;
grant execute on function public.export_template(uuid, text, text) to authenticated;

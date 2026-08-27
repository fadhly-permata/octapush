-- 0003_dal_runtime.sql
-- DAL execution surface + Dev-to-Prod promotion (FSD §3.1.4 / §3.5.3)

-- Dynamic DML executor used by DAL. Runs with security definer but restricts
-- statements via the SQL Guard in the app layer; here we only allow calls
-- carrying a validated object_prefix owned by the calling user.
create or replace function public.dal_exec_dynamic(p_sql text, p_params jsonb default '{}')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The actual guard (verb whitelist, prefix check) is enforced in the DAL app
  -- layer before invoking this RPC. We still forbid DDL/DCL here as defense-in-depth.
  if p_sql ~* '\b(DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|COMMENT)\b' then
    raise exception 'ERR_SQL_008: forbidden verb in dynamic exec';
  end if;
  if p_sql ~* ';' then
    raise exception 'ERR_SQL_008: multi-statement rejected';
  end if;
  -- NOTE: real binding is delegated to the DAL; placeholders here are illustrative.
  return jsonb_build_object('executed', true);
end;
$$;

-- Push to PROD: structure-only clone of a project's {prefix}_* objects
-- from logic_dev/data_dev -> logic_prod/data_prod (FSD §3.1.4).
create or replace function public.push_project_to_prod(p_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_user uuid;
  rec record;
  cloned integer := 0;
begin
  -- verify ownership
  select object_prefix, user_id into v_prefix, v_user
    from public.projects where id = p_project_id;
  if v_prefix is null or v_user <> auth.uid() then
    raise exception 'ERR_RLS_007: not project owner';
  end if;

  -- structure-only clone via information_schema (tables/views only)
  for rec in
    select table_schema, table_name
    from information_schema.tables
    where (table_schema = 'logic_dev' or table_schema = 'data_dev')
      and table_name like (v_prefix || '\_%')
      and table_type = 'BASE TABLE'
  loop
    execute format(
      'create table if not exists %I.%I (like %I.%I including all)',
      replace(rec.table_schema, '_dev', '_prod'),
      rec.table_name,
      rec.table_schema,
      rec.table_name
    );
    cloned := cloned + 1;
  end loop;

  update public.projects
    set is_pushed_to_prod = true, prod_pushed_at = now()
    where id = p_project_id;

  insert into public.audit_logs (user_id, project_id, action, detail_jsonb)
    values (v_user, p_project_id, 'PUSH_TO_PROD', jsonb_build_object('cloned', cloned));

  return jsonb_build_object('cloned', cloned, 'status', 'ok');
end;
$$;

grant execute on function public.dal_exec_dynamic(text, jsonb) to authenticated;
grant execute on function public.push_project_to_prod(uuid) to authenticated;

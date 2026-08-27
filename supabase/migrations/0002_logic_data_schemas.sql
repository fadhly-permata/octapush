-- 0002_logic_data_schemas.sql
-- Per-project design + business schemas (FSD §4.2 / §4.3)
-- These are provisioned per project by the DAL at project creation time.
-- Template DDL below mirrors what the DAL runs with a concrete {prefix}.

-- Schemas
create schema if not exists logic_dev;
create schema if not exists data_dev;
create schema if not exists logic_prod;
create schema if not exists data_prod;

-- Provisioning function: creates the per-project internal tables in logic_dev/data_dev
-- and installs the owner-only RLS policy on every created object.
create or replace function public.provision_project(p_prefix text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  lg text := 'logic_dev';
  dt text := 'data_dev';
  pages text := format('%I.%I_generated_pages', lg, p_prefix);
  wf    text := format('%I.%I_workflows', lg, p_prefix);
  vs    text := format('%I.%I_page_schema_versions', lg, p_prefix);
  tr    text := format('%I.%I_app_translations', lg, p_prefix);
  sn    text := format('%I.%I_schema_snapshots', lg, p_prefix);
  mh    text := format('%I.%I_migration_history', lg, p_prefix);
  q     text := format('%I.%I_workflow_task_queue', dt, p_prefix);
  el    text := format('%I.%I_workflow_execution_logs', dt, p_prefix);
begin
  execute format($f$
    create table if not exists %s (
      id uuid primary key default gen_random_uuid(),
      page_title text not null,
      page_type text not null check (page_type in ('MASTER','TRANSACTION','REPORT')),
      target_table text not null,
      current_version integer default 1,
      is_published boolean default false,
      created_at timestamptz default now()
    );
  $f$, pages);

  execute format($f$
    create table if not exists %s (
      id uuid primary key default gen_random_uuid(),
      workflow_name text not null,
      trigger_type text not null check (trigger_type in ('FORM_EVENT','SCHEDULER','QUEUE','MANUAL')),
      trigger_config jsonb not null,
      workflow_json jsonb not null,
      created_at timestamptz default now()
    );
  $f$, wf);

  execute format($f$
    create table if not exists %s (
      id uuid primary key default gen_random_uuid(),
      page_id uuid not null references %s (id) on delete cascade,
      version integer not null,
      schema_json jsonb not null,
      created_at timestamptz default now()
    );
  $f$, vs, pages);

  execute format($f$
    create table if not exists %s (
      id uuid primary key default gen_random_uuid(),
      key text not null,
      locale text not null check (locale in ('id','en')),
      value text not null,
      updated_at timestamptz default now(),
      unique (key, locale)
    );
  $f$, tr);

  execute format($f$
    create table if not exists %s (
      id uuid primary key default gen_random_uuid(),
      environment text not null check (environment in ('DEV','PROD')),
      snapshot_json jsonb not null,
      created_at timestamptz default now()
    );
  $f$, sn);

  execute format($f$
    create table if not exists %s (
      id uuid primary key default gen_random_uuid(),
      diff_checksum text not null,
      operations_json jsonb not null,
      status text not null check (status in ('APPLIED','ROLLED_BACK','FAILED')),
      duration_ms integer,
      created_at timestamptz default now()
    );
  $f$, mh);

  execute format($f$
    create table if not exists %s (
      id uuid primary key default gen_random_uuid(),
      workflow_id uuid not null,
      payload_json jsonb not null,
      status text default 'PENDING' check (status in ('PENDING','PROCESSING','COMPLETED','FAILED')),
      retry_count integer default 0,
      created_at timestamptz default now()
    );
  $f$, q);

  execute format($f$
    create table if not exists %s (
      id uuid primary key default gen_random_uuid(),
      workflow_id uuid not null,
      status text not null check (status in ('SUCCESS','FAILED')),
      execution_time_ms integer not null,
      log_details jsonb,
      executed_at timestamptz default now()
    );
  $f$, el);
end;
$$;

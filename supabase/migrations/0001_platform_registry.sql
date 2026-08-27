-- 0001_platform_registry.sql
-- Platform registry schema (BRD §6.1 / FSD §4.1)

-- Extension for v4 uuids / crypto
create extension if not exists "pgcrypto";

-- Table: public.users
create table if not exists public.users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  user_short_uuid char(8) not null unique check (user_short_uuid ~ '^[0-9a-f]{8}$'),
  created_at timestamptz default now()
);

-- Table: public.projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (user_id) on delete cascade,
  project_name text not null,
  project_uuid char(8) not null check (project_uuid ~ '^[0-9a-f]{8}$'),
  object_prefix text not null unique,
  is_pushed_to_prod boolean default false,
  prod_pushed_at timestamptz,
  timezone text default 'Asia/Jakarta',
  promotion_lock timestamptz,
  is_deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, project_uuid)
);

-- Trigger: compute object_prefix = users.user_short_uuid || '_' || project_uuid
create or replace function public.set_object_prefix()
returns trigger
language plpgsql
as $$
declare
  short char(8);
begin
  select u.user_short_uuid into short from public.users u where u.user_id = new.user_id;
  new.object_prefix := short || '_' || new.project_uuid;
  return new;
end;
$$;

drop trigger if exists trg_set_object_prefix on public.projects;
create trigger trg_set_object_prefix
  before insert or update on public.projects
  for each row execute function public.set_object_prefix();

-- Table: public.ai_configs
create table if not exists public.ai_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider_name text not null,
  base_url text not null,
  api_key text not null,
  model_name text not null,
  is_active boolean default false,
  foreign key (user_id) references public.users (user_id) on delete cascade
);

-- Table: public.user_preferences
create table if not exists public.user_preferences (
  user_id uuid primary key,
  theme_mode text default 'auto' check (theme_mode in ('light','dark','auto')),
  locale text default 'id' check (locale in ('id','en')),
  updated_at timestamptz default now(),
  foreign key (user_id) references public.users (user_id) on delete cascade
);

-- Table: public.app_distributions
create table if not exists public.app_distributions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  slug text not null unique,
  mode text not null check (mode in ('PRIVATE','RESTRICTED','PUBLIC')),
  revoked_at timestamptz,
  created_at timestamptz default now()
);

-- Table: public.usage_counters
create table if not exists public.usage_counters (
  user_id uuid primary key references public.users (user_id) on delete cascade,
  projects_count integer default 0,
  db_size_bytes bigint default 0,
  objects_count bigint default 0,
  files_count bigint default 0,
  files_bytes bigint default 0,
  updated_at timestamptz default now()
);

-- Table: public.audit_logs (append-only)
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  project_id uuid,
  action text not null check (action in
    ('DDL_EXECUTE','PUSH_TO_PROD','MIGRATION_APPLY','MIGRATION_ROLLBACK',
     'HARD_DELETE','RLS_REJECT','SQL_GUARD_REJECT','QUOTA_EXCEED',
     'XSS_REJECT','ABUSE_REJECT')),
  detail_jsonb jsonb,
  created_at timestamptz default now()
);
revoke update, delete on public.audit_logs from public;

-- Table: public.project_members
create table if not exists public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (user_id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner','editor','viewer')),
  invited_by uuid references public.users (user_id),
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);

-- Table: public.error_logs
create table if not exists public.error_logs (
  id bigint generated always as identity primary key,
  user_id uuid,
  project_id uuid,
  environment text not null default 'DEV' check (environment in ('DEV','PROD','PLATFORM')),
  source text not null check (source in ('CLIENT','DAL','WORKFLOW','AI_PROVIDER','DB')),
  severity text not null default 'ERROR' check (severity in ('DEBUG','INFO','WARN','ERROR','FATAL')),
  error_code text,
  message text not null,
  stack_trace text,
  fingerprint text not null,
  session_id text,
  request_id text,
  context_jsonb jsonb,
  status text not null default 'OPEN' check (status in ('OPEN','INVESTIGATING','RESOLVED','IGNORED')),
  occurrence_count integer default 1,
  last_seen_at timestamptz default now(),
  resolution_note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_error_logs_fingerprint on public.error_logs (fingerprint, created_at);
create index if not exists idx_error_logs_user_project on public.error_logs (user_id, project_id, created_at);

-- Table: public.templates + template_items
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references public.users (user_id),
  name text not null,
  description text,
  version integer not null default 1,
  schema_version text not null,
  tags text[] default '{}',
  visibility text not null default 'private' check (visibility in ('public','private')),
  revoked_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates (id) on delete cascade,
  item_type text not null check (item_type in ('PAGE','WORKFLOW','SCHEMA_VERSION','TRANSLATION')),
  payload_json jsonb not null
);

-- Table: public.starter_use_cases
create table if not exists public.starter_use_cases (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null,
  description jsonb,
  category text,
  icon text,
  prompt_text jsonb not null,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Enable RLS on registry tables (owner-only access)
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.ai_configs enable row level security;
alter table public.user_preferences enable row level security;
alter table public.app_distributions enable row level security;
alter table public.usage_counters enable row level security;
alter table public.project_members enable row level security;
alter table public.templates enable row level security;
alter table public.template_items enable row level security;
alter table public.starter_use_cases enable row level security;
alter table public.error_logs enable row level security;
alter table public.audit_logs enable row level security;

-- RLS policies: users can only access their own rows
create policy users_owner on public.users for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy projects_owner on public.projects for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ai_configs_owner on public.ai_configs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy user_preferences_owner on public.user_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy usage_counters_owner on public.usage_counters for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy app_distributions_owner on public.app_distributions for all using (project_id in (select id from public.projects where user_id = auth.uid())) with check (project_id in (select id from public.projects where user_id = auth.uid()));
create policy project_members_owner on public.project_members for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy templates_owner on public.templates for all using (author_user_id = auth.uid() or visibility = 'public');
create policy template_items_read on public.template_items for select using (true);
create policy starter_use_cases_read on public.starter_use_cases for select using (is_active = true);
create policy error_logs_owner on public.error_logs for select using (user_id = auth.uid());
create policy audit_logs_owner on public.audit_logs for select using (user_id = auth.uid());

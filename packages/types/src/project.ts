import type { ObjectPrefix, IsoTimestamp, Nullable } from './core';

export interface PlatformUser {
  user_id: string;
  email: string;
  display_name: Nullable<string>;
  user_short_uuid: string;
  created_at: IsoTimestamp;
}

export interface Project {
  id: string;
  user_id: string;
  project_name: string;
  project_uuid: string;
  object_prefix: ObjectPrefix;
  is_pushed_to_prod: boolean;
  prod_pushed_at: Nullable<IsoTimestamp>;
  timezone: string;
  promotion_lock: Nullable<IsoTimestamp>;
  is_deleted: boolean;
  deleted_at: Nullable<IsoTimestamp>;
  created_at: IsoTimestamp;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_by: Nullable<string>;
  created_at: IsoTimestamp;
}

export type AppDistributionMode = 'PRIVATE' | 'RESTRICTED' | 'PUBLIC';

export interface AppDistribution {
  id: string;
  project_id: string;
  slug: string;
  mode: AppDistributionMode;
  revoked_at: Nullable<IsoTimestamp>;
  created_at: IsoTimestamp;
}

export interface AIConfig {
  id: string;
  user_id: string;
  provider_name: string;
  base_url: string;
  api_key: string;
  model_name: string;
  is_active: boolean;
}

export interface ErrorLogEntry {
  id: number;
  user_id: Nullable<string>;
  project_id: Nullable<string>;
  environment: 'DEV' | 'PROD' | 'PLATFORM';
  source: 'CLIENT' | 'DAL' | 'WORKFLOW' | 'AI_PROVIDER' | 'DB';
  severity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  error_code: Nullable<string>;
  message: string;
  stack_trace: Nullable<string>;
  fingerprint: string;
  session_id: Nullable<string>;
  request_id: Nullable<string>;
  context_jsonb: Record<string, unknown>;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'IGNORED';
  occurrence_count: number;
  last_seen_at: IsoTimestamp;
  resolution_note: Nullable<string>;
  created_at: IsoTimestamp;
}

import type { Nullable } from './core';

export type PageType = 'MASTER' | 'TRANSACTION' | 'REPORT';

export type FieldComponent =
  | 'TextInput'
  | 'NumberInput'
  | 'SelectInput'
  | 'DatePicker'
  | 'SwitchInput'
  | 'FileInput';

export interface FieldDef {
  name: string;
  label: string;
  component: FieldComponent;
  required: boolean;
  default_value?: Nullable<string | number | boolean>;
}

export interface Section {
  title: string;
  fields: FieldDef[];
}

export interface Layout {
  sections: Section[];
}

export interface I18nStrings {
  default_locale: 'id' | 'en';
  strings: Record<string, { id: string; en: string }>;
}

export interface GenerationSchema {
  page_title: string;
  page_type: PageType;
  target_table: string;
  layout: Layout;
  workflows: Workflow[];
  i18n?: I18nStrings;
}

export interface Workflow {
  workflow_name: string;
  trigger: WorkflowTrigger;
  nodes: WorkflowNode[];
}

export interface WorkflowTrigger {
  type: 'FORM_EVENT' | 'SCHEDULER' | 'QUEUE' | 'MANUAL';
  event?: string;
  target_page?: string;
}

export interface WorkflowNode {
  id: string;
  type: 'CONDITION' | 'EXECUTE_SQL' | 'CALCULATION' | 'LOCAL_NOTIFICATION';
  expression?: string;
  sql?: string;
  message?: string;
  message_key?: string;
  on_true?: Nullable<string>;
  on_false?: Nullable<string>;
  next?: Nullable<string>;
}

export interface GeneratedPage {
  id: string;
  page_title: string;
  page_type: PageType;
  target_table: string;
  current_version: number;
  is_published: boolean;
  created_at: string;
}

export interface WorkflowDef {
  id: string;
  workflow_name: string;
  trigger_type: WorkflowTrigger['type'];
  trigger_config: Record<string, unknown>;
  workflow_json: Workflow;
  created_at: string;
}
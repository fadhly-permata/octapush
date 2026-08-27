import { z } from 'zod';

export const fieldComponentSchema = z.enum([
  'TextInput',
  'NumberInput',
  'SelectInput',
  'DatePicker',
  'SwitchInput',
  'FileInput',
]);

export const fieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  component: fieldComponentSchema,
  required: z.boolean(),
  default_value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
});

export const sectionSchema = z.object({
  title: z.string(),
  fields: z.array(fieldSchema).min(1),
});

export const layoutSchema = z.object({
  sections: z.array(sectionSchema).min(1),
});

export const workflowTriggerSchema = z.object({
  type: z.enum(['FORM_EVENT', 'SCHEDULER', 'QUEUE', 'MANUAL']),
  event: z.string().optional(),
  target_page: z.string().optional(),
});

export const workflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['CONDITION', 'EXECUTE_SQL', 'CALCULATION', 'LOCAL_NOTIFICATION']),
  expression: z.string().optional(),
  sql: z.string().optional(),
  message: z.string().optional(),
  message_key: z.string().optional(),
  on_true: z.string().nullable().optional(),
  on_false: z.string().nullable().optional(),
  next: z.string().nullable().optional(),
});

export const workflowSchema = z.object({
  workflow_name: z.string().min(1),
  trigger: workflowTriggerSchema,
  nodes: z.array(workflowNodeSchema).min(1),
});

export const i18nStringsSchema = z.object({
  default_locale: z.enum(['id', 'en']),
  strings: z.record(z.object({ id: z.string(), en: z.string() })),
});

export const generationSchema = z.object({
  page_title: z.string().min(1),
  page_type: z.enum(['MASTER', 'TRANSACTION', 'REPORT']),
  target_table: z.string().min(1),
  layout: layoutSchema,
  workflows: z.array(workflowSchema).min(1),
  i18n: i18nStringsSchema.optional(),
});

export type GenerationSchemaParsed = z.infer<typeof generationSchema>;

import { generationSchema } from '@octapush/schemas';
import type { GenerationSchemaParsed } from '@octapush/schemas';

export const SYSTEM_PROMPT = `You are OctaPush Studio, an AI that turns natural language into a STRICT JSON schema for a cross-platform business app.
Output ONLY valid JSON matching this contract:
{
  "page_title": string,
  "page_type": "MASTER" | "TRANSACTION" | "REPORT",
  "target_table": string (logical table name, lowercase, <=46 chars, no prefix),
  "layout": { "sections": [ { "title": string, "fields": [ { "name", "label", "component": "TextInput"|"NumberInput"|"SelectInput"|"DatePicker"|"SwitchInput"|"FileInput", "required": boolean, "default_value" } ] } ] },
  "workflows": [ { "workflow_name", "trigger": {"type":"FORM_EVENT"|"SCHEDULER"|"QUEUE"|"MANUAL","event"?,"target_page"?}, "nodes": [ {"id","type":"CONDITION"|"EXECUTE_SQL"|"CALCULATION"|"LOCAL_NOTIFICATION","expression"?,"sql"?,"message"?,"next"?} ] } ],
  "i18n"?: { "default_locale":"id"|"en", "strings": { "key": {"id","en"} } }
}
Rules: EXECUTE_SQL statements MUST reference only tables prefixed by the project (the DAL enforces this). No DDL. Use :payload.field for bound params. Respond with JSON only.`;

export interface RepairResult {
  ok: boolean;
  schema?: GenerationSchemaParsed;
  issues?: string[];
}

/**
 * Validate AI output against the OctaPush generation JSON schema (FSD §5.1).
 * On failure, produce a repair prompt describing the validation errors so the
 * caller can retry with the original + repair instruction (ai-engineer: retry loop).
 */
export function validateGeneration(raw: unknown): RepairResult {
  const parsed = generationSchema.safeParse(raw);
  if (parsed.success) {
    return { ok: true, schema: parsed.data };
  }
  const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  return { ok: false, issues };
}

export function buildRepairPrompt(original: string, issues: string[]): string {
  return `Your previous output failed validation:\n${issues.join('\n')}\n\nFix it and return ONLY valid JSON:\n\n${original}`;
}

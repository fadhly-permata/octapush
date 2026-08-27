import { AIProviderClient, SYSTEM_PROMPT, validateGeneration, buildRepairPrompt } from '@octapush/ai';
import type { AIConfig, GenerationSchemaParsed } from '@octapush/types';

/**
 * Iterative generation pipeline (FSD §3.4, ai-engineer retry loop):
 * 1. send system + user prompt to configured provider
 * 2. validate JSON against generation schema
 * 3. on failure: repair prompt (max 3 retries) then re-validate
 * 4. return parsed schema or last error
 */
export interface GenerateOutcome {
  ok: boolean;
  schema?: GenerationSchemaParsed;
  error?: string;
}

export async function generateSchema(
  cfg: AIConfig,
  userPrompt: string,
  maxRetries = 3,
): Promise<GenerateOutcome> {
  const client = new AIProviderClient(cfg);
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: userPrompt },
  ];

  let lastRaw = '';
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await client.generate(messages);
    lastRaw = res.raw;
    const valid = validateGeneration(res.json ?? res.raw);
    if (valid.ok && valid.schema) {
      return { ok: true, schema: valid.schema };
    }
    if (attempt < maxRetries) {
      messages.push({ role: 'assistant', content: res.raw });
      messages.push({ role: 'user', content: buildRepairPrompt(res.raw, valid.issues ?? ['invalid json']) });
    }
  }
  return { ok: false, error: `Generation failed after ${maxRetries} retries. Last raw:\n${lastRaw.slice(0, 500)}` };
}

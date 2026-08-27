import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import type { DalContext } from './client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AIProviderClient } from '@octapush/ai';
import type { AIConfig } from '@octapush/types';
import { AppError } from '@octapush/types';

const ALGO = 'aes-256-cbc';
const KEY = () => {
  const k = process.env.AI_KEY_ENCRYPTION_KEY;
  if (!k) throw new AppError({ code: 'ERR_AIC_003', message: 'AI encryption key not set' });
  return Buffer.from(k, 'hex');
};

/** AES-256 encryption of AI API keys at rest (FR-AIC-02 / NFR-SEC-02). */
export function encryptApiKey(plain: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGO, KEY(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptApiKey(stored: string): string {
  const [ivHex, dataHex] = stored.split(':');
  const decipher = createDecipheriv(ALGO, KEY(), Buffer.from(ivHex, 'hex'));
  const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return dec.toString('utf8');
}

/** Save (upsert) an AI config for the current user with encrypted key. */
export async function saveAiConfig(
  sb: SupabaseClient,
  _ctx: DalContext,
  input: { provider_name: string; base_url: string; api_key: string; model_name: string },
): Promise<void> {
  const { error } = await sb.from('ai_configs').upsert({
    user_id: undefined,
    provider_name: input.provider_name,
    base_url: input.base_url,
    api_key: encryptApiKey(input.api_key),
    model_name: input.model_name,
    is_active: true,
  });
  if (error) throw new AppError({ code: 'ERR_AIC_003', message: error.message });
}

/** Test connection using a plaintext key (FR-AIC-03). */
export async function testAiConfig(input: {
  provider_name: string;
  base_url: string;
  api_key: string;
  model_name: string;
}): Promise<{ ok: boolean; message: string }> {
  const client = new AIProviderClient(input as AIConfig);
  return client.testConnection();
}

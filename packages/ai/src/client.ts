import type { AIConfig } from '@octapush/types';

export type AIModelProvider =
  | 'openrouter'
  | 'openai'
  | 'huggingface'
  | 'ollama'
  | 'litellm';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateResult {
  raw: string;
  json: unknown | null;
}

/**
 * Minimal OpenAI-compatible chat completion client (works for OpenRouter,
 * OpenAI, LiteLLM, Ollama proxy — all share the /chat/completions shape).
 * HuggingFace inference API mapped separately if needed.
 */
export class AIProviderClient {
  constructor(private cfg: AIConfig) {}

  private get endpoint(): string {
    const base = this.cfg.base_url.replace(/\/$/, '');
    if (this.cfg.provider_name.toLowerCase() === 'huggingface') {
      return `${base}/${this.cfg.model_name}`;
    }
    return `${base}/chat/completions`;
  }

  async generate(messages: ChatMessage[], temperature = 0.2): Promise<GenerateResult> {
    const body =
      this.cfg.provider_name.toLowerCase() === 'huggingface'
        ? { inputs: messages[messages.length - 1]?.content ?? '', parameters: { temperature } }
        : {
            model: this.cfg.model_name,
            messages,
            temperature,
            response_format: { type: 'json_object' },
          };

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.cfg.api_key}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI provider ${res.status}: ${txt.slice(0, 200)}`);
    }

    const data = await res.json();
    const raw =
      this.cfg.provider_name.toLowerCase() === 'huggingface'
        ? data.generated_text ?? JSON.stringify(data)
        : data.choices?.[0]?.message?.content ?? '';

    let json: unknown = null;
    try {
      json = JSON.parse(raw);
    } catch {
      json = null;
    }
    return { raw, json };
  }

  /** Connectivity test (FR-AIC-03). Returns true on 2xx with a usable response. */
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const probe =
        this.cfg.provider_name.toLowerCase() === 'huggingface'
          ? { inputs: 'ping' }
          : { model: this.cfg.model_name, messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 };
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.cfg.api_key}`,
        },
        body: JSON.stringify(probe),
      });
      return res.ok
        ? { ok: true, message: `Success (${res.status} OK)` }
        : { ok: false, message: `Failed (HTTP ${res.status})` };
    } catch (e) {
      return { ok: false, message: `Failed (${(e as Error).message})` };
    }
  }
}

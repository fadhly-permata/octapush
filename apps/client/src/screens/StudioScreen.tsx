import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Divider } from 'react-native-paper';
import { DynamicForm } from '../studio/DynamicForm';
import { GenerationSchemaParsed } from '@octapush/schemas';
import { generateSchema } from '../services/generate';
import { publishToDev } from '../services/publish';
import type { DalContext } from '@octapush/dal';

interface Msg { role: 'user' | 'assistant'; text: string }

/**
 * Studio dual-pane (FSD §3.4.2): Pane A chat refinement, Pane B live preview.
 */
export function StudioScreen({ ctx }: { ctx: DalContext }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<GenerationSchemaParsed | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  // TODO(F2): load active AIConfig from DAL (public.ai_configs, decrypted server-side)
  const cfg = undefined as Parameters<typeof generateSchema>[0] | undefined;

  const send = async () => {
    if (!input.trim() || !cfg) {
      setStatus(cfg ? '' : 'AI provider not configured');
      return;
    }
    setBusy(true);
    setMessages((m) => [...m, { role: 'user', text: input }]);
    const out = await generateSchema(cfg, input);
    setBusy(false);
    if (out.ok && out.schema) {
      setPreview(out.schema);
      setMessages((m) => [...m, { role: 'assistant', text: `Generated: ${out.schema.page_title}` }]);
      const pub = await publishToDev(ctx, out.schema);
      setStatus(pub.ok ? 'Published to DEV' : `Publish failed: ${pub.error?.message}`);
    } else {
      setStatus(out.error ?? 'Generation failed');
    }
    setInput('');
  };

  const fields = preview ? preview.layout.sections.flatMap((s) => s.fields) : [];

  return (
    <View style={styles.container}>
      <View style={styles.pane}>
        <Text variant="titleMedium">Chat Refinement</Text>
        {messages.map((m, i) => (
          <Text key={i} style={styles.msg}>
            {m.role}: {m.text}
          </Text>
        ))}
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Describe the app you want..."
          style={styles.input}
        />
        <Button mode="contained" onPress={send} disabled={busy}>
          {busy ? 'Generating...' : 'Generate & Publish'}
        </Button>
        <Text variant="labelSmall">{status}</Text>
      </View>
      <Divider />
      <View style={styles.pane}>
        <Text variant="titleMedium">Live Preview</Text>
        {preview ? <DynamicForm fields={fields} /> : <Text>Preview will render here after generation.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  pane: { flex: 1, padding: 8, gap: 8 },
  msg: { fontSize: 13, opacity: 0.8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6 },
});

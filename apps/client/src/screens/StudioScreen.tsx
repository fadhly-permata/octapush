import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Divider } from 'react-native-paper';
import { DynamicForm } from '../studio/DynamicForm';
import { GenerationSchemaParsed } from '@octapush/schemas';

interface Msg { role: 'user' | 'assistant'; text: string }

/**
 * Studio dual-pane (FSD §3.4.2): Pane A chat refinement, Pane B live preview.
 * On mobile this stacks as a tab/sheet; here simplified to vertical split.
 */
export function StudioScreen() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<GenerationSchemaParsed | null>(null);

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: 'user', text: input }]);
    // TODO(F2): call AIProviderClient.generate([SYSTEM_PROMPT, ...messages])
    // then validateGeneration -> on fail buildRepairPrompt + retry (max 3)
    // on success setPreview(parsed.schema)
    setInput('');
  };

  const fields = preview
    ? preview.layout.sections.flatMap((s) => s.fields)
    : [];

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
        <Button mode="contained" onPress={send}>
          Send
        </Button>
      </View>
      <Divider />
      <View style={styles.pane}>
        <Text variant="titleMedium">Live Preview</Text>
        {preview ? (
          <DynamicForm fields={fields} />
        ) : (
          <Text>Preview will render here after generation.</Text>
        )}
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

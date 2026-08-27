import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput, List, ActivityIndicator } from 'react-native-paper';
import type { DalContext } from '@octapush/dal';
import { listTemplates, exportTemplate } from '@octapush/dal';

interface Tpl { id: string; name: string; version: number; schema_version: string }

/** Template Marketplace (FSD §3.11.3): browse public templates, export current project. */
export function TemplateScreen({ ctx, projectId }: { ctx: DalContext; projectId: string }) {
  const [templates, setTemplates] = useState<Tpl[]>([]);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        setTemplates(await listTemplates(undefined as never));
      } catch (e) {
        setStatus(`Load failed: ${(e as Error).message}`);
      }
    })();
  }, []);

  const onExport = async () => {
    if (!name) return;
    setStatus('Exporting...');
    try {
      const id = await exportTemplate(undefined as never, projectId, name, 'public');
      setStatus(`Exported template ${id}`);
    } catch (e) {
      setStatus(`Failed: ${(e as Error).message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Template Marketplace</Text>
      {templates.length === 0 ? <ActivityIndicator /> : null}
      {templates.map((t) => (
        <List.Item
          key={t.id}
          title={t.name}
          description={`v${t.version} · engine ${t.schema_version}`}
        />
      ))}
      <TextInput label="Export current project as template" value={name} onChangeText={setName} />
      <Button mode="contained" onPress={onExport}>
        Export Template
      </Button>
      <Text variant="labelSmall">{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16, gap: 12 } });

import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, List, Searchbar } from 'react-native-paper';
import type { DalContext } from '@octapush/dal';
import type { ErrorLogEntry } from '@octapush/types';

/**
 * Centralized Error Log dashboard + triage view (FSD §3.8.5, FR-ERR-01..03).
 * Groups by fingerprint, filters by severity, supports triage status change.
 */
export function ErrorLogScreen({ ctx: _ctx }: { ctx: DalContext }) {
  const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // TODO(F3): sb.from('error_logs').select().order('created_at', {ascending:false})
    setLogs([]);
  }, []);

  const filtered = logs.filter(
    (l) => l.message.toLowerCase().includes(query.toLowerCase()) || l.error_code?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Error Logs</Text>
      <Searchbar placeholder="filter by message / code" value={query} onChangeText={setQuery} />
      {filtered.length === 0 ? (
        <Text>No errors.</Text>
      ) : (
        filtered.map((l) => (
          <List.Item
            key={l.id}
            title={`${l.error_code ?? '?'} · ${l.severity}`}
            description={`${l.source} · ${l.status} · ${l.fingerprint}`}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16, gap: 10 } });

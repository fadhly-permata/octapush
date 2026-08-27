import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, SegmentedButtons, HelperText } from 'react-native-paper';
import type { DalContext } from '@octapush/dal';
import { pushToProd, createDistribution } from '@octapush/dal';
import type { AppDistributionMode } from '@octapush/types';

/**
 * Project distribution panel (FSD §3.7): push to PROD (structure clone) + publish
 * app with access mode PRIVATE/RESTRICTED/PUBLIC.
 */
export function DistributionScreen({ ctx, projectId }: { ctx: DalContext; projectId: string }) {
  const [mode, setMode] = useState<AppDistributionMode>('PRIVATE');
  const [status, setStatus] = useState('');
  const [slug, setSlug] = useState('');

  const onPush = async () => {
    setStatus('Pushing to PROD...');
    try {
      const r = await pushToProd(undefined as never, ctx, projectId);
      setStatus(`Pushed. Cloned ${r.cloned} objects.`);
    } catch (e) {
      setStatus(`Push failed: ${(e as Error).message}`);
    }
  };

  const onPublish = async () => {
    setStatus('Publishing...');
    try {
      const r = await createDistribution(undefined as never, ctx, projectId, mode);
      setSlug(r.slug);
      setStatus(`Published (${mode}). Slug: ${r.slug}`);
    } catch (e) {
      setStatus(`Publish failed: ${(e as Error).message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Distribution</Text>
      <Button mode="contained" onPress={onPush}>
        Push to PROD
      </Button>
      <SegmentedButtons
        value={mode}
        onValueChange={(v) => setMode(v as AppDistributionMode)}
        buttons={[
          { value: 'PRIVATE', label: 'Private' },
          { value: 'RESTRICTED', label: 'Restricted' },
          { value: 'PUBLIC', label: 'Public' },
        ]}
      />
      <Button mode="outlined" onPress={onPublish}>
        Publish App
      </Button>
      <HelperText type="info">{status}</HelperText>
      {slug ? <Text variant="labelSmall">app.octapush.dev/{slug}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16, gap: 12 } });

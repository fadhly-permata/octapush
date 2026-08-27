import { View, StyleSheet } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { useState } from 'react';
import type { ThemeMode } from '@octapush/types';
import { useAppTheme } from '../theme/ThemeProvider';

/**
 * F1 scope: Google OAuth via Supabase Auth (FR-AUT-01).
 * Real signInWithOAuth wiring is added once the Supabase project is linked.
 */
export function AuthGate() {
  const { mode, setMode } = useAppTheme();
  const [busy, setBusy] = useState(false);

  const signIn = () => {
    setBusy(true);
    // TODO(F1): supabase.auth.signInWithOAuth({ provider: 'google' })
    // then ensureRegistered() -> upsert public.users with user_short_uuid
    setTimeout(() => setBusy(false), 600);
  };

  const cycleTheme = () => {
    const order: ThemeMode[] = ['auto', 'light', 'dark'];
    setMode(order[(order.indexOf(mode) + 1) % order.length]);
  };

  return (
    <View style={styles.center}>
      <Text variant="headlineMedium">OctaPush</Text>
      <Text variant="bodyMedium">AI-Driven Dynamic UI & Workflow Engine</Text>
      <Button mode="contained" onPress={signIn} disabled={busy} style={styles.btn}>
        {busy ? <ActivityIndicator /> : 'Sign in with Google'}
      </Button>
      <Button mode="text" onPress={cycleTheme}>
        Theme: {mode}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  btn: { marginTop: 16 },
});

import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';

/**
 * AI Provider Configurator (FSD §3.3): input config, test connection,
 * save with encrypted key (FR-AIC-01/02/03).
 * Calls DAL endpoints; key is never persisted in client state beyond the form.
 */
export function SettingsAIScreen() {
  const [provider, setProvider] = useState('OpenRouter');
  const [baseUrl, setBaseUrl] = useState('https://openrouter.ai/api/v1');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('meta-llama/llama-3.1-70b-instruct');
  const [status, setStatus] = useState<string>('');

  const test = async () => {
    setStatus('Testing...');
    // TODO(F2): call DAL testAiConfig -> returns {ok, message}
    setStatus('TODO: wire to DAL testAiConfig');
  };

  const save = async () => {
    setStatus('Saving (encrypted)...');
    // TODO(F2): call DAL saveAiConfig -> encrypts key server-side
    setStatus('TODO: wire to DAL saveAiConfig');
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">AI Provider</Text>
      <TextInput label="Provider" value={provider} onChangeText={setProvider} />
      <TextInput label="Base URL" value={baseUrl} onChangeText={setBaseUrl} />
      <TextInput label="API Key" value={apiKey} onChangeText={setApiKey} secureTextEntry />
      <TextInput label="Model Name" value={model} onChangeText={setModel} />
      <Button mode="outlined" onPress={test}>
        Test Connection
      </Button>
      <Button mode="contained" onPress={save}>
        Save (Encrypted)
      </Button>
      <HelperText type="info">{status}</HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
});

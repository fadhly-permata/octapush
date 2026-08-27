import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  return (
    <View style={styles.center}>
      <Text variant="headlineMedium">OctaPush</Text>
      <Button mode="contained" onPress={() => router.push('/studio')}>
        Open Studio
      </Button>
      <Button mode="text" onPress={() => router.push('/settings')}>
        AI Settings
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});

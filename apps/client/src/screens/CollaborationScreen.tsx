import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, List, SegmentedButtons } from 'react-native-paper';
import type { DalContext } from '@octapush/dal';
import { inviteMember } from '@octapush/dal';
import type { ProjectMember } from '@octapush/types';

/** Collaboration panel (FSD §3.11.2): invite members with role, list members. */
export function CollaborationScreen({ ctx, projectId }: { ctx: DalContext; projectId: string }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectMember['role']>('viewer');
  const [members] = useState<ProjectMember[]>([]);
  const [status, setStatus] = useState('');

  const onInvite = async () => {
    if (!email) return;
    setStatus('Inviting...');
    try {
      await inviteMember(undefined as never, ctx, projectId, email, role);
      setStatus(`Invited ${email} as ${role}`);
      setEmail('');
    } catch (e) {
      setStatus(`Failed: ${(e as Error).message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Collaboration</Text>
      <TextInput label="Invite by email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <SegmentedButtons
        value={role}
        onValueChange={(v) => setRole(v as ProjectMember['role'])}
        buttons={[
          { value: 'owner', label: 'Owner' },
          { value: 'editor', label: 'Editor' },
          { value: 'viewer', label: 'Viewer' },
        ]}
      />
      <Button mode="contained" onPress={onInvite}>
        Invite
      </Button>
      <Text variant="labelSmall">{status}</Text>
      {members.length === 0 ? (
        <Text>No members.</Text>
      ) : (
        members.map((m) => (
          <List.Item key={m.user_id} title={m.user_id} description={m.role} />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16, gap: 12 } });

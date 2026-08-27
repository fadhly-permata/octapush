import { View, Text, TextInput, Switch, ScrollView } from 'react-native';
import type { FieldDef } from '@octapush/types';

/**
 * Dynamic renderer for AI-generated fields (FSD §3.4.2 Pane B).
 * All content rendered as data (React escaping) — never raw HTML (FSD §3.9.3).
 */
export function FieldRenderer({ field }: { field: FieldDef }) {
  switch (field.component) {
    case 'TextInput':
    case 'NumberInput':
      return (
        <View style={{ marginVertical: 6 }}>
          <Text>{field.label}{field.required ? ' *' : ''}</Text>
          <TextInput
            keyboardType={field.component === 'NumberInput' ? 'numeric' : 'default'}
            placeholder={field.label}
            style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6 }}
          />
        </View>
      );
    case 'SwitchInput':
      return (
        <View style={{ marginVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text>{field.label}</Text>
          <Switch />
        </View>
      );
    case 'SelectInput':
    case 'DatePicker':
    case 'FileInput':
      return (
        <View style={{ marginVertical: 6 }}>
          <Text>{field.label} ({field.component})</Text>
        </View>
      );
    default:
      return <Text>Unknown field: {field.component}</Text>;
  }
}

export function DynamicForm({ fields }: { fields: FieldDef[] }) {
  return (
    <ScrollView style={{ padding: 12 }}>
      {fields.map((f) => (
        <FieldRenderer key={f.name} field={f} />
      ))}
    </ScrollView>
  );
}

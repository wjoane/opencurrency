/** Edits an amount as raw text and formats it when editing ends. */

import { StyleSheet, type StyleProp, type TextStyle, TextInput } from 'react-native';

export interface AmountFieldProps {
  readonly value: string;
  readonly placeholder?: string;
  readonly placeholderTextColor?: string;
  readonly onChangeText: (value: string) => void;
  readonly onEndEditing?: () => void;
  readonly accessibilityLabel: string;
  readonly style: StyleProp<TextStyle>;
}

export function AmountField({
  value,
  placeholder,
  placeholderTextColor,
  onChangeText,
  onEndEditing,
  accessibilityLabel,
  style,
}: AmountFieldProps) {
  return (
    <TextInput
      value={value}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      onChangeText={onChangeText}
      onEndEditing={onEndEditing}
      accessibilityLabel={accessibilityLabel}
      keyboardType="decimal-pad"
      inputMode="decimal"
      autoCorrect={false}
      autoFocus
      style={[styles.field, style]}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    flexShrink: 1,
    minWidth: 80,
    padding: 0,
    textAlign: 'right',

    outlineStyle: 'solid',
    outlineWidth: 0,
  },
});

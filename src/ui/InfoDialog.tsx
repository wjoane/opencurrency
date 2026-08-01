/** Renders a sheet containing a title, message, and acknowledgement action. */

import { type ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type ThemeTokens } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';

import { Sheet } from './Sheet';

export interface InfoDialogProps {
  readonly visible: boolean;
  readonly onClose: () => void;

  readonly title: string;

  readonly closeLabel: string;

  readonly confirmLabel: string;
  readonly children: ReactNode;
}

export function InfoDialog({
  visible,
  onClose,
  title,
  closeLabel,
  confirmLabel,
  children,
}: InfoDialogProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Sheet visible={visible} onClose={onClose} title={title} closeLabel={closeLabel}>
      <View style={styles.body}>{children}</View>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={confirmLabel}
        style={styles.confirmButton}
      >
        <Text style={styles.confirmLabel}>{confirmLabel}</Text>
      </Pressable>
    </Sheet>
  );
}

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    body: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
    confirmButton: {
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.primary,
    },
    confirmLabel: {
      ...theme.typography.body,
      color: theme.colors.onEmphasis,
      fontWeight: '600',
    },
  });
}

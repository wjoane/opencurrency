/** Renders a modal bottom sheet with a scrim and close control. */

import { type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { type ThemeTokens } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { useThemedStyles } from '../theme/useThemedStyles';

import { CloseIcon } from './icons';

const CLOSE_ICON_SIZE = 22;

export interface SheetProps {
  /** Whether the sheet is visible. */
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly closeLabel: string;
  readonly children: ReactNode;
}

export function Sheet({ visible, onClose, title, closeLabel, children }: SheetProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable
        style={styles.scrim}
        onPress={onClose}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            hitSlop={theme.spacing.md}
            style={styles.closeButton}
          >
            <CloseIcon color={theme.colors.textSecondary} size={CLOSE_ICON_SIZE} />
          </Pressable>
        </View>
        <View style={styles.body}>{children}</View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    scrim: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      start: 0,
      end: 0,
      backgroundColor: theme.colors.scrim,
    },
    sheet: {
      marginTop: 'auto',
      backgroundColor: theme.colors.surface,
      borderTopStartRadius: theme.radii.lg,
      borderTopEndRadius: theme.radii.lg,
      paddingBottom: theme.spacing.xl,
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    title: {
      ...theme.typography.title,
      color: theme.colors.textPrimary,
      flexShrink: 1,
    },
    closeButton: {
      paddingStart: theme.spacing.md,
    },

    body: {
      flexShrink: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
    },
  });
}

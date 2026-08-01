/** Renders the application title and settings action. */

import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../../i18n/I18nContext';
import { useTheme } from '../../theme/ThemeContext';
import { type ThemeTokens } from '../../theme/tokens';
import { BrandMark } from '../../ui/BrandMark';
import { SettingsIcon } from '../../ui/icons';

const WORDMARK_PREFIX = 'Open';
const WORDMARK_SUFFIX = 'Currency';

const MARK_SIZE = 64;

const WORDMARK_FONT_SIZE = 24;
const WORDMARK_LINE_HEIGHT = 30;

const SETTINGS_ICON_SIZE = 24;

export interface AppHeaderProps {
  readonly onOpenSettings: () => void;
}

export function AppHeader({ onOpenSettings }: AppHeaderProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.header}>
      <BrandMark size={MARK_SIZE} />
      <Text
        style={styles.wordmark}
        accessibilityRole="header"
        accessibilityLabel={`${WORDMARK_PREFIX}${WORDMARK_SUFFIX}`}
      >
        {WORDMARK_PREFIX}
        <Text style={styles.wordmarkAccent}>{WORDMARK_SUFFIX}</Text>
      </Text>
      <View style={styles.spacer} />
      <Pressable
        onPress={onOpenSettings}
        accessibilityRole="button"
        accessibilityLabel={t('settings.open')}
        hitSlop={theme.spacing.md}
      >
        <SettingsIcon color={theme.colors.textSecondary} size={SETTINGS_ICON_SIZE} />
      </Pressable>
    </View>
  );
}

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      backgroundColor: theme.colors.background,
    },
    wordmark: {
      ...theme.typography.title,
      fontSize: WORDMARK_FONT_SIZE,
      lineHeight: WORDMARK_LINE_HEIGHT,
      color: theme.colors.textPrimary,
    },
    wordmarkAccent: {
      color: theme.colors.primary,
    },
    spacer: {
      flex: 1,
    },
  });
}

/** Renders actions for adding currencies and selecting a date. */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../../i18n/I18nContext';
import { useTheme } from '../../theme/ThemeContext';
import { type ThemeTokens } from '../../theme/tokens';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { InfoIcon, PlusIcon } from '../../ui/icons';

const ACTION_ICON_SIZE = 18;

export interface ConverterToolbarProps {
  readonly onAddCurrency: () => void;
  readonly onOpenRateInfo: () => void;
}

export function ConverterToolbar({ onAddCurrency, onOpenRateInfo }: ConverterToolbarProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.toolbar}>
      <Pressable
        onPress={onAddCurrency}
        accessibilityRole="button"
        accessibilityLabel={t('addCurrency.open')}
        hitSlop={theme.spacing.sm}
        style={styles.addButton}
      >
        <PlusIcon color={theme.colors.primary} size={ACTION_ICON_SIZE} />
        <Text style={styles.addLabel}>{t('addCurrency.open')}</Text>
      </Pressable>
      <View style={styles.spacer} />
      <Text style={styles.rateBasis}>{t('rates.midMarket')}</Text>
      <Pressable
        onPress={onOpenRateInfo}
        accessibilityRole="button"
        accessibilityLabel={t('rates.info.title')}
        hitSlop={theme.spacing.md}
      >
        <InfoIcon color={theme.colors.textSecondary} size={ACTION_ICON_SIZE} />
      </Pressable>
    </View>
  );
}

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    addLabel: {
      ...theme.typography.label,
      color: theme.colors.primary,
    },
    spacer: {
      flex: 1,
    },
    rateBasis: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
  });
}

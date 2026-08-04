/** Explains the source and meaning of the displayed rates. */

import { StyleSheet, Text } from 'react-native';

import { useI18n } from '../../i18n/I18nContext';
import { type ThemeTokens } from '../../theme/tokens';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { InfoDialog } from '../../ui/InfoDialog';

export interface RateInfoDialogProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function RateInfoDialog({ visible, onClose }: RateInfoDialogProps) {
  const { t } = useI18n();
  const styles = useThemedStyles(createStyles);

  return (
    <InfoDialog
      visible={visible}
      onClose={onClose}
      title={t('rates.info.title')}
      closeLabel={t('sheet.close')}
      confirmLabel={t('dialog.gotIt')}
    >
      <Text style={styles.paragraph}>{t('rates.info.basis')}</Text>
      <Text style={styles.paragraph}>{t('rates.info.source')}</Text>
      <Text style={styles.disclaimer}>{t('rates.info.disclaimer')}</Text>
    </InfoDialog>
  );
}

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    paragraph: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
    },
    disclaimer: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
  });
}

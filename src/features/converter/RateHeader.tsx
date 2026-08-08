import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { type RateFetchFailure } from '../../data/ratesApi';
import { useI18n } from '../../i18n/I18nContext';
import { type TranslationKey } from '../../i18n';
import { type RatesStatus, useRates } from '../../state/RatesContext';
import { useTheme } from '../../theme/ThemeContext';
import { type ThemeTokens } from '../../theme/tokens';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { CalendarIcon } from '../../ui/icons';
import { Sheet } from '../../ui/Sheet';

import { DatePicker } from './DatePicker';

const NOTICE_MESSAGE_KEYS: Readonly<
  Record<'stale' | 'error', Readonly<Record<RateFetchFailure, TranslationKey>>>
> = {
  stale: {
    notFound: 'header.staleNotFound',
    networkError: 'header.staleNetwork',
    invalid: 'header.staleInvalid',
  },
  error: {
    notFound: 'header.errorNotFound',
    networkError: 'header.errorNetwork',
    invalid: 'header.errorInvalid',
  },
};

const CALENDAR_ICON_SIZE = 20;

export function RateHeader() {
  const { status, snapshot, failure, reload, selectedDate, selectDate, latestKnownDate } =
    useRates();
  const { theme } = useTheme();
  const { t } = useI18n();
  const styles = useThemedStyles(createStyles);
  const canChangeDate = status !== 'stale';

  const dateText =
    status === 'loading' ? t('header.loading') : t('header.ratesFrom', { date: snapshot.date });

  const noticeKey = noticeKeyFor(status, failure);

  return (
    <View style={styles.header}>
      <View style={styles.dateLine}>
        {canChangeDate && (
          <RateDateControl
            selectedDate={selectedDate}
            latestKnownDate={latestKnownDate}
            onSelect={selectDate}
          />
        )}
        <Text style={styles.date}>{dateText}</Text>
        {selectedDate !== null && (
          <Pressable
            onPress={() => selectDate(null)}
            accessibilityRole="button"
            accessibilityLabel={t('date.latest')}
            hitSlop={theme.spacing.sm}
          >
            <Text style={styles.action}>{t('date.latest')}</Text>
          </Pressable>
        )}
      </View>
      {noticeKey !== null && (
        <View style={styles.notice}>
          <Text style={[styles.noticeText, status === 'error' && styles.noticeError]}>
            {t(noticeKey)}
          </Text>
          <Pressable onPress={reload} accessibilityRole="button" hitSlop={theme.spacing.sm}>
            <Text style={styles.retry}>{t('header.retry')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

interface RateDateControlProps {
  readonly selectedDate: string | null;
  readonly latestKnownDate: string;
  readonly onSelect: (rateDate: string | null) => void;
}

function RateDateControl({ selectedDate, latestKnownDate, onSelect }: RateDateControlProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [pickerVisible, setPickerVisible] = useState(false);

  const close = () => setPickerVisible(false);

  const picker = (
    <DatePicker
      value={selectedDate ?? latestKnownDate}
      maximumDate={latestKnownDate}
      accessibilityLabel={t('date.label')}
      onChange={(rateDate) => {
        close();

        onSelect(rateDate === latestKnownDate ? null : rateDate);
      }}
      onDismiss={close}
    />
  );

  return (
    <>
      <Pressable
        onPress={() => setPickerVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t('date.change')}
        hitSlop={theme.spacing.md}
      >
        <CalendarIcon color={theme.colors.primary} size={CALENDAR_ICON_SIZE} />
      </Pressable>
      {pickerVisible &&
        (Platform.OS === 'android' ? (
          picker
        ) : (
          <Sheet visible onClose={close} title={t('date.label')} closeLabel={t('sheet.close')}>
            {picker}
          </Sheet>
        ))}
    </>
  );
}

function noticeKeyFor(
  status: RatesStatus,
  failure: RateFetchFailure | null,
): TranslationKey | null {
  if (failure === null || (status !== 'stale' && status !== 'error')) {
    return null;
  }

  return NOTICE_MESSAGE_KEYS[status][failure];
}

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.background,
    },
    dateLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
    },
    date: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    notice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
    },

    noticeText: {
      ...theme.typography.caption,
      color: theme.colors.warning,
      flexShrink: 1,
    },
    noticeError: {
      color: theme.colors.danger,
    },
    retry: {
      ...theme.typography.caption,
      color: theme.colors.primary,
    },
    action: {
      ...theme.typography.caption,
      color: theme.colors.primary,
    },
  });
}

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

import { currentRateDate, latestSelectableRateDate } from './dateBounds';
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
  const { status, snapshot, failure, reload, selectedDate, selectDate } = useRates();
  const { theme } = useTheme();
  const { t } = useI18n();
  const styles = useThemedStyles(createStyles);
  const [pickerVisible, setPickerVisible] = useState(false);

  const today = currentRateDate();

  const pickerDate = selectedDate ?? today;

  const maximumDate = latestSelectableRateDate(today, pickerDate);

  const dateText =
    status === 'loading' ? t('header.loading') : t('header.ratesFrom', { date: snapshot.date });

  const noticeKey = noticeKeyFor(status, failure);

  return (
    <View style={styles.header}>
      <View style={styles.dateLine}>
        <Pressable
          onPress={() => setPickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('date.change')}
          hitSlop={theme.spacing.md}
        >
          <CalendarIcon color={theme.colors.primary} size={CALENDAR_ICON_SIZE} />
        </Pressable>
        <Text style={styles.date}>{dateText}</Text>
        {(selectedDate !== null || snapshot.date !== today) && (
          <Pressable
            onPress={() => selectDate(null)}
            accessibilityRole="button"
            accessibilityLabel={t('date.today')}
            hitSlop={theme.spacing.sm}
          >
            <Text style={styles.action}>{t('date.today')}</Text>
          </Pressable>
        )}
      </View>
      {pickerVisible && (
        <RateDatePicker
          value={pickerDate}
          maximumDate={maximumDate}
          label={t('date.label')}
          closeLabel={t('sheet.close')}
          onDismiss={() => setPickerVisible(false)}
          onChange={(rateDate) => {
            setPickerVisible(false);

            selectDate(rateDate === today ? null : rateDate);
          }}
        />
      )}
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

interface RateDatePickerProps {
  readonly value: string;
  readonly maximumDate: string;
  readonly label: string;
  readonly closeLabel: string;
  readonly onChange: (rateDate: string) => void;
  readonly onDismiss: () => void;
}

function RateDatePicker({
  value,
  maximumDate,
  label,
  closeLabel,
  onChange,
  onDismiss,
}: RateDatePickerProps) {
  const picker = (
    <DatePicker
      value={value}
      maximumDate={maximumDate}
      accessibilityLabel={label}
      onChange={onChange}
      onDismiss={onDismiss}
    />
  );

  if (Platform.OS === 'android') {
    return picker;
  }

  return (
    <Sheet visible onClose={onDismiss} title={label} closeLabel={closeLabel}>
      {picker}
    </Sheet>
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

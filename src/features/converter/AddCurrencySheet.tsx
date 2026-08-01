/** Renders the searchable currency selection sheet. */

import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { type RateTable } from '../../domain/conversion';
import { useI18n } from '../../i18n/I18nContext';
import { type Translate } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';
import { type ThemeTokens } from '../../theme/tokens';
import { CurrencyIcon } from '../../ui/CurrencyIcon';
import { Sheet } from '../../ui/Sheet';

import {
  buildCurrencyOptions,
  type CurrencyOption,
  filterCurrencyOptions,
  type SelectableCurrencyOption,
} from './currencyOptions';

const NO_OPTIONS: readonly CurrencyOption[] = [];

function useHasBeenVisible(visible: boolean): boolean {
  const [hasBeenVisible, setHasBeenVisible] = useState(visible);

  if (visible && !hasBeenVisible) {
    setHasBeenVisible(true);
  }

  return hasBeenVisible;
}

export interface AddCurrencySheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;

  readonly currencyCodes: readonly string[];

  readonly rates: RateTable;
  readonly onAdd: (currencyCode: string) => void;
}

export function AddCurrencySheet({
  visible,
  onClose,
  currencyCodes,
  rates,
  onAdd,
}: AddCurrencySheetProps) {
  const { theme } = useTheme();
  const { locale, t } = useI18n();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');

  const hasBeenVisible = useHasBeenVisible(visible);

  const options = useMemo(
    () => (hasBeenVisible ? buildCurrencyOptions({ rates, locale }) : NO_OPTIONS),
    [hasBeenVisible, rates, locale],
  );

  const matches = useMemo(
    () => filterCurrencyOptions(options, query, currencyCodes),
    [options, query, currencyCodes],
  );

  const close = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  const add = useCallback(
    (currencyCode: string) => {
      onAdd(currencyCode);
      close();
    },
    [onAdd, close],
  );

  const renderOption = useCallback(
    ({ item }: { item: SelectableCurrencyOption }) => (
      <CurrencyOptionRow option={item} onSelect={add} t={t} />
    ),
    [add, t],
  );

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={t('addCurrency.title')}
      closeLabel={t('sheet.close')}
    >
      <TextInput
        value={query}
        onChangeText={setQuery}
        accessibilityLabel={t('addCurrency.searchLabel')}
        placeholder={t('addCurrency.searchPlaceholder')}
        placeholderTextColor={theme.colors.textSecondary}
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.search}
      />
      <FlatList
        data={matches}
        keyExtractor={keyExtractor}
        renderItem={renderOption}
        accessibilityLabel={t('addCurrency.listLabel')}
        keyboardShouldPersistTaps="handled"

        keyboardDismissMode="on-drag"
        ListEmptyComponent={<Text style={styles.empty}>{t('addCurrency.noMatches')}</Text>}
        style={styles.list}
      />
    </Sheet>
  );
}

function keyExtractor(option: SelectableCurrencyOption): string {
  return option.currencyCode;
}

interface CurrencyOptionRowProps {
  readonly option: SelectableCurrencyOption;
  readonly onSelect: (currencyCode: string) => void;
  readonly t: Translate;
}

const CurrencyOptionRow = memo(function CurrencyOptionRow({
  option,
  onSelect,
  t,
}: CurrencyOptionRowProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      onPress={() => onSelect(option.currencyCode)}

      disabled={option.isAlreadyAdded}
      accessibilityRole="button"
      accessibilityState={{ disabled: option.isAlreadyAdded }}
      accessibilityLabel={t('addCurrency.optionLabel', {
        currency: option.currencyName,
        code: option.currencyCode.toUpperCase(),
      })}
      style={[styles.option, option.isAlreadyAdded && styles.optionAdded]}
    >
      <CurrencyIcon
        currencyCode={option.currencyCode}
        countryCode={option.countryCode}
        badgeLabel={option.badgeLabel}
      />
      <View style={styles.optionIdentity}>
        <Text style={styles.optionCode}>{option.currencyCode.toUpperCase()}</Text>
        <Text style={styles.optionName} numberOfLines={1}>
          {option.currencyName}
        </Text>
      </View>
      {option.isAlreadyAdded && <Text style={styles.addedTag}>{t('addCurrency.added')}</Text>}
    </Pressable>
  );
});

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    search: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },

    list: {
      flexShrink: 1,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },

    optionAdded: {
      opacity: 0.5,
    },
    optionIdentity: {
      flex: 1,
    },
    optionCode: {
      ...theme.typography.code,
      color: theme.colors.textPrimary,
    },
    optionName: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    addedTag: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    empty: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      paddingVertical: theme.spacing.lg,
    },
  });
}

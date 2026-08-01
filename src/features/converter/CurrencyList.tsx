/**
 * The converter itself: the rows, and what happens when one is touched.
 *
 * It reads preferences and rates, builds the row models, and renders the
 * currency list. It also handles activating and removing rows.
 */

import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import ReorderableList, {
  reorderItems,
  type ReorderableListReorderEvent,
  useReorderableDrag,
} from 'react-native-reorderable-list';

import { type RateTable } from '../../domain/conversion';
import { useI18n } from '../../i18n/I18nContext';
import { type Translate } from '../../i18n';
import { getLayoutDirection } from '../../i18n/locales';
import { usePreferences } from '../../state/PreferencesContext';
import { useRates } from '../../state/RatesContext';
import { useTheme } from '../../theme/ThemeContext';
import { type ThemeTokens } from '../../theme/tokens';

import { CurrencyRow, type CurrencyRowMoveAction } from './CurrencyRow';
import { REORDER_LONG_PRESS_DURATION } from './interactionConstants';
import { buildCurrencyRows, type CurrencyRowModel } from './rowModels';

const NO_RATES: RateTable = {};

const MINIMUM_CURRENCY_ROWS = 2;
const REORDER_PAN_ACTIVATION_DURATION = REORDER_LONG_PRESS_DURATION + 20;

export interface CurrencyListProps {
  /** Content rendered below the currency rows. */
  readonly footer: ReactElement;
}

/** Renders the converter list. */
export function CurrencyList({ footer }: CurrencyListProps) {
  const { preferences, updatePreferences } = usePreferences();
  const { snapshot } = useRates();
  const { locale, t } = useI18n();
  const { theme } = useTheme();
  const { activeCurrencyCode, currencyCodes } = preferences;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const reorderPanGesture = useMemo(
    () => Gesture.Pan().activateAfterLongPress(REORDER_PAN_ACTIVATION_DURATION),
    [],
  );

  const [formatActiveAmount, setFormatActiveAmount] = useState(true);

  const rows = useMemo(
    () => [
      ...buildCurrencyRows({
        currencyCodes,
        activeCurrencyCode,
        amountText: preferences.amountText,
        formatActiveAmount,
        rates: snapshot?.rates ?? NO_RATES,
        locale,
        t,
      }),
    ],
    [
      currencyCodes,
      activeCurrencyCode,
      preferences.amountText,
      formatActiveAmount,
      snapshot,
      locale,
      t,
    ],
  );
  const rowsRef = useRef(rows);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const activate = useCallback(
    (currencyCode: string, editableAmountText: string) => {
      if (currencyCode === activeCurrencyCode) {
        return;
      }

      setFormatActiveAmount(true);
      updatePreferences({ activeCurrencyCode: currencyCode, amountText: editableAmountText });
    },
    [activeCurrencyCode, updatePreferences],
  );

  const changeAmount = useCallback(
    (amountText: string) => {
      setFormatActiveAmount(false);
      updatePreferences({ amountText });
    },
    [updatePreferences],
  );

  const finishAmountEditing = useCallback(() => setFormatActiveAmount(true), []);

  const remove = useCallback(
    (currencyCode: string) => {
      const remainingCurrencyCodes = currencyCodes.filter((code) => code !== currencyCode);

      if (currencyCode !== activeCurrencyCode) {
        updatePreferences({ currencyCodes: remainingCurrencyCodes });

        return;
      }

      const newActiveCurrencyCode = remainingCurrencyCodes[0];
      const newActiveRow = rowsRef.current.find(
        (row) => row.currencyCode === newActiveCurrencyCode,
      );

      updatePreferences({
        currencyCodes: remainingCurrencyCodes,
        activeCurrencyCode: newActiveCurrencyCode,
        amountText: newActiveRow?.editableAmountText ?? '',
      });
    },
    [activeCurrencyCode, currencyCodes, updatePreferences],
  );

  const moveCurrency = useCallback(
    ({ from, to }: ReorderableListReorderEvent) => {
      if (!isValidReorder({ from, to }, currencyCodes.length)) {
        return;
      }

      updatePreferences({ currencyCodes: reorderItems([...currencyCodes], from, to) });
    },
    [currencyCodes, updatePreferences],
  );

  const canRemove = currencyCodes.length > MINIMUM_CURRENCY_ROWS;

  const renderRow = useCallback(
    ({ item, index }: { item: CurrencyRowModel; index: number }) => (
      <CurrencyListRow
        row={item}
        index={index}
        rowCount={rows.length}
        canRemove={canRemove}
        onActivate={activate}
        onAmountChange={changeAmount}
        onAmountEditingEnd={finishAmountEditing}
        onRemove={remove}
        onMove={moveCurrency}
        layoutDirection={getLayoutDirection(locale)}
        t={t}
      />
    ),
    [
      rows.length,
      canRemove,
      activate,
      changeAmount,
      finishAmountEditing,
      remove,
      moveCurrency,
      locale,
      t,
    ],
  );

  return (
    <ReorderableList
      ListFooterComponent={footer}
      data={rows}
      keyExtractor={keyExtractor}
      renderItem={renderRow}
      onReorder={moveCurrency}
      panGesture={reorderPanGesture}
      accessibilityLabel={t('converter.listLabel')}

      keyboardShouldPersistTaps="handled"
      style={styles.list}
      contentContainerStyle={styles.content}
    />
  );
}

interface CurrencyListRowProps {
  readonly row: CurrencyRowModel;
  readonly index: number;
  readonly rowCount: number;
  readonly canRemove: boolean;
  readonly onActivate: (currencyCode: string, editableAmountText: string) => void;
  readonly onAmountChange: (value: string) => void;
  readonly onAmountEditingEnd: () => void;
  readonly onRemove: (currencyCode: string) => void;
  readonly onMove: (event: ReorderableListReorderEvent) => void;
  readonly layoutDirection: 'ltr' | 'rtl';
  readonly t: Translate;
}

function CurrencyListRow({
  row,
  index,
  rowCount,
  canRemove,
  onActivate,
  onAmountChange,
  onAmountEditingEnd,
  onRemove,
  onMove,
  layoutDirection,
  t,
}: CurrencyListRowProps) {
  const drag = useReorderableDrag();
  const moveUp = useCallback(() => onMove({ from: index, to: index - 1 }), [index, onMove]);
  const moveDown = useCallback(() => onMove({ from: index, to: index + 1 }), [index, onMove]);
  const moveUpAction = useMemo<CurrencyRowMoveAction | null>(
    () =>
      index > 0
        ? { label: t('converter.moveUpLabel', { currency: row.currencyName }), run: moveUp }
        : null,
    [index, moveUp, row.currencyName, t],
  );
  const moveDownAction = useMemo<CurrencyRowMoveAction | null>(
    () =>
      index < rowCount - 1
        ? { label: t('converter.moveDownLabel', { currency: row.currencyName }), run: moveDown }
        : null,
    [index, moveDown, row.currencyName, rowCount, t],
  );

  return (
    <CurrencyRow
      currencyCode={row.currencyCode}
      countryCode={row.countryCode}
      badgeLabel={row.badgeLabel}
      amountText={row.amountText}
      placeholderAmountText={row.placeholderAmountText}
      isAmountFormatted={row.isAmountFormatted}
      rateText={row.rateText}
      isActive={row.isActive}
      accessibilityLabel={row.accessibilityLabel}
      amountAccessibilityLabel={row.amountAccessibilityLabel}
      editableAmountText={row.editableAmountText}
      onActivate={onActivate}
      onAmountChange={onAmountChange}
      onAmountEditingEnd={onAmountEditingEnd}
      canRemove={canRemove}
      onRemove={onRemove}
      removeLabel={t('converter.removeLabel', { currency: row.currencyName })}
      onReorderLongPress={drag}
      moveUpAction={moveUpAction}
      moveDownAction={moveDownAction}
      layoutDirection={layoutDirection}
    />
  );
}

function keyExtractor(row: CurrencyRowModel | undefined, index: number): string {
  return row?.currencyCode ?? String(index);
}

function isValidReorder({ from, to }: ReorderableListReorderEvent, itemCount: number): boolean {
  return (
    Number.isInteger(from) &&
    Number.isInteger(to) &&
    from >= 0 &&
    to >= 0 &&
    from < itemCount &&
    to < itemCount
  );
}

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    list: {
      flex: 1,
    },

    content: {
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.xs,
    },
  });
}

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
import { getLayoutDirection, type LayoutDirection } from '../../i18n/locales';
import { usePreferences } from '../../state/PreferencesContext';
import { MINIMUM_CURRENCY_ROWS } from '../../state/preferences';
import { type ThemeTokens } from '../../theme/tokens';
import { useThemedStyles } from '../../theme/useThemedStyles';

import { CurrencyRow, type CurrencyRowMoveAction } from './CurrencyRow';
import { REORDER_LONG_PRESS_DURATION } from './interactionConstants';
import { buildCurrencyRows, type CurrencyRowModel } from './rowModels';
import { type SwipeRemovalLifecycle } from './SwipeToDeleteRow';

const REORDER_PAN_ACTIVATION_DURATION = REORDER_LONG_PRESS_DURATION + 20;

export interface CurrencyListProps {
  /** Content rendered below the currency rows. */
  readonly footer: ReactElement;
  readonly rates: RateTable;
}

/** Renders the converter list. */
export function CurrencyList({ footer, rates }: CurrencyListProps) {
  const { preferences, updatePreferences } = usePreferences();
  const { locale, t } = useI18n();
  const { activeCurrencyCode, currencyCodes } = preferences;
  const styles = useThemedStyles(createStyles);
  const reorderPanGesture = useMemo(
    () => Gesture.Pan().activateAfterLongPress(REORDER_PAN_ACTIVATION_DURATION),
    [],
  );

  const [formatActiveAmount, setFormatActiveAmount] = useState(true);

  const rows = useMemo(
    () =>
      buildCurrencyRows({
        currencyCodes,
        activeCurrencyCode,
        amountText: preferences.amountText,
        formatActiveAmount,
        rates,
        locale,
        t,
      }),
    [
      currencyCodes,
      activeCurrencyCode,
      preferences.amountText,
      formatActiveAmount,
      rates,
      locale,
      t,
    ],
  );
  const rowsRef = useRef(rows);
  const selectionRef = useRef({ activeCurrencyCode, currencyCodes });
  const pendingRemovalCodesRef = useRef(new Set<string>());

  useEffect(() => {
    rowsRef.current = rows;
    selectionRef.current = { activeCurrencyCode, currencyCodes };
  }, [activeCurrencyCode, currencyCodes, rows]);

  const activate = useCallback(
    (currencyCode: string, editableAmountText: string) => {
      if (currencyCode === selectionRef.current.activeCurrencyCode) {
        return;
      }

      selectionRef.current = { ...selectionRef.current, activeCurrencyCode: currencyCode };
      setFormatActiveAmount(true);
      updatePreferences({ activeCurrencyCode: currencyCode, amountText: editableAmountText });
    },
    [updatePreferences],
  );

  const changeAmount = useCallback(
    (amountText: string) => {
      setFormatActiveAmount(false);
      updatePreferences({ amountText });
    },
    [updatePreferences],
  );

  const finishAmountEditing = useCallback(() => setFormatActiveAmount(true), []);

  const startRemove = useCallback((currencyCode: string) => {
    const pendingRemovalCodes = pendingRemovalCodesRef.current;
    const remainingCurrencyCodes = selectionRef.current.currencyCodes.filter(
      (code) => code !== currencyCode && !pendingRemovalCodes.has(code),
    );

    if (
      pendingRemovalCodes.has(currencyCode) ||
      remainingCurrencyCodes.length < MINIMUM_CURRENCY_ROWS
    ) {
      return false;
    }

    pendingRemovalCodes.add(currencyCode);
    return true;
  }, []);

  const remove = useCallback(
    (currencyCode: string) => {
      const { activeCurrencyCode: currentActiveCurrencyCode, currencyCodes: currentCurrencyCodes } =
        selectionRef.current;
      const remainingCurrencyCodes = currentCurrencyCodes.filter((code) => code !== currencyCode);

      if (currencyCode !== currentActiveCurrencyCode) {
        selectionRef.current = {
          activeCurrencyCode: currentActiveCurrencyCode,
          currencyCodes: remainingCurrencyCodes,
        };
        updatePreferences({ currencyCodes: remainingCurrencyCodes });

        return;
      }

      const newActiveCurrencyCode = remainingCurrencyCodes[0];
      const newActiveRow = rowsRef.current.find(
        (row) => row.currencyCode === newActiveCurrencyCode,
      );

      selectionRef.current = {
        activeCurrencyCode: newActiveCurrencyCode,
        currencyCodes: remainingCurrencyCodes,
      };
      updatePreferences({
        currencyCodes: remainingCurrencyCodes,
        activeCurrencyCode: newActiveCurrencyCode,
        amountText: newActiveRow?.editableAmountText ?? '',
      });
    },
    [updatePreferences],
  );

  const finishRemove = useCallback(
    (currencyCode: string, completed: boolean) => {
      pendingRemovalCodesRef.current.delete(currencyCode);

      if (completed) {
        remove(currencyCode);
      }
    },
    [remove],
  );
  const removalLifecycle = useMemo<CurrencyRemovalLifecycle>(
    () => ({ start: startRemove, finish: finishRemove }),
    [finishRemove, startRemove],
  );

  const moveCurrency = useCallback(
    ({ from, to }: ReorderableListReorderEvent) => {
      const reorderedCurrencyCodes = reorderItems(
        [...selectionRef.current.currencyCodes],
        from,
        to,
      );
      selectionRef.current = { ...selectionRef.current, currencyCodes: reorderedCurrencyCodes };
      updatePreferences({ currencyCodes: reorderedCurrencyCodes });
    },
    [updatePreferences],
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
        removalLifecycle={removalLifecycle}
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
      removalLifecycle,
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
  readonly removalLifecycle: CurrencyRemovalLifecycle;
  readonly onMove: (event: ReorderableListReorderEvent) => void;
  readonly layoutDirection: LayoutDirection;
  readonly t: Translate;
}

interface CurrencyRemovalLifecycle {
  readonly start: (currencyCode: string) => boolean;
  readonly finish: (currencyCode: string, completed: boolean) => void;
}

function CurrencyListRow({
  row,
  index,
  rowCount,
  canRemove,
  onActivate,
  onAmountChange,
  onAmountEditingEnd,
  removalLifecycle,
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
  const removal = useMemo<SwipeRemovalLifecycle>(
    () => ({
      start: () => removalLifecycle.start(row.currencyCode),
      finish: (completed) => removalLifecycle.finish(row.currencyCode, completed),
    }),
    [removalLifecycle, row.currencyCode],
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
      removal={removal}
      removeLabel={t('converter.removeLabel', { currency: row.currencyName })}
      onReorderLongPress={drag}
      moveUpAction={moveUpAction}
      moveDownAction={moveDownAction}
      layoutDirection={layoutDirection}
    />
  );
}

function keyExtractor(row: CurrencyRowModel): string {
  return row.currencyCode;
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

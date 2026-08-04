/** Renders one editable and removable currency row. */

import { memo, useCallback, useMemo } from 'react';
import {
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { type LayoutDirection } from '../../i18n/locales';
import { type ThemeTokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { CurrencyIcon } from '../../ui/CurrencyIcon';

import { AmountField } from './AmountField';
import { REORDER_LONG_PRESS_DURATION } from './interactionConstants';
import { SwipeToDeleteRow, type SwipeRemovalLifecycle } from './SwipeToDeleteRow';

export interface CurrencyRowProps {
  /** Currency code displayed by the row. */
  readonly currencyCode: string;
  readonly countryCode: string | null;
  readonly badgeLabel: string;
  readonly amountText: string;
  readonly placeholderAmountText: string;
  readonly isAmountFormatted: boolean;
  readonly rateText: string | null;
  readonly isActive: boolean;
  readonly accessibilityLabel: string;
  readonly amountAccessibilityLabel: string;
  readonly editableAmountText: string;
  readonly onActivate: (currencyCode: string, editableAmountText: string) => void;
  readonly onAmountChange: (value: string) => void;
  readonly onAmountEditingEnd: () => void;
  readonly canRemove: boolean;
  readonly removal: SwipeRemovalLifecycle;
  readonly removeLabel: string;
  /** Starts dragging this row after its 500 ms long press is recognized. */
  readonly onReorderLongPress: () => void;
  /** Accessibility action for moving toward the start, or null at the first row. */
  readonly moveUpAction: CurrencyRowMoveAction | null;
  /** Accessibility action for moving toward the end, or null at the final row. */
  readonly moveDownAction: CurrencyRowMoveAction | null;
  readonly layoutDirection: LayoutDirection;
}

/** Describes one localized row move exposed to assistive technology. */
export interface CurrencyRowMoveAction {
  /** User-facing action name announced by the platform. */
  readonly label: string;
  /** Applies the move to the persisted currency order. */
  readonly run: () => void;
}

function CurrencyRowComponent({
  currencyCode,
  countryCode,
  badgeLabel,
  amountText,
  placeholderAmountText,
  isAmountFormatted,
  rateText,
  isActive,
  accessibilityLabel,
  amountAccessibilityLabel,
  editableAmountText,
  onActivate,
  onAmountChange,
  onAmountEditingEnd,
  canRemove,
  removal,
  removeLabel,
  onReorderLongPress,
  moveUpAction,
  moveDownAction,
  layoutDirection,
}: CurrencyRowProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const hasRateText = rateText !== null;
  const activeAmountStyle = useMemo(
    () =>
      createActiveAmountStyle(
        isAmountFormatted ? placeholderAmountText : amountText,
        theme.typography.amount,
      ),
    [amountText, isAmountFormatted, placeholderAmountText, theme.typography.amount],
  );
  const rowAccessibilityActions = useMemo<AccessibilityActionInfo[]>(
    () => [
      ...(moveUpAction === null ? [] : [{ name: 'moveUp', label: moveUpAction.label }]),
      ...(moveDownAction === null ? [] : [{ name: 'moveDown', label: moveDownAction.label }]),
    ],
    [moveDownAction, moveUpAction],
  );

  const activate = useCallback(
    () => onActivate(currencyCode, editableAmountText),
    [onActivate, currencyCode, editableAmountText],
  );

  const move = useCallback(
    ({ nativeEvent }: AccessibilityActionEvent) => {
      if (nativeEvent.actionName === 'moveUp') {
        moveUpAction?.run();
      }

      if (nativeEvent.actionName === 'moveDown') {
        moveDownAction?.run();
      }
    },
    [moveDownAction, moveUpAction],
  );

  const rowAccessibilityProps = {
    accessibilityRole: 'button' as const,
    accessibilityLabel,
    accessibilityState: { selected: isActive },
    accessibilityActions: rowAccessibilityActions,
    onAccessibilityAction: move,
  };

  const values = (
    <View style={styles.values}>
      {isActive ? (
        <AmountField
          value={isAmountFormatted ? '' : amountText}
          placeholder={isAmountFormatted ? placeholderAmountText : undefined}
          placeholderTextColor={theme.colors.textMuted}
          onChangeText={onAmountChange}
          onEndEditing={onAmountEditingEnd}
          accessibilityLabel={amountAccessibilityLabel}
          style={[styles.amount, activeAmountStyle, !hasRateText && styles.amountWithoutRate]}
        />
      ) : (
        <Text
          style={styles.amount}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={MINIMUM_AMOUNT_FONT_SCALE}
        >
          {amountText}
        </Text>
      )}
      {hasRateText && (
        <Text style={styles.rate} numberOfLines={1}>
          {rateText}
        </Text>
      )}
    </View>
  );

  return (
    <SwipeToDeleteRow
      canRemove={canRemove}
      removal={removal}
      removeLabel={removeLabel}
      layoutDirection={layoutDirection}
    >
      <Pressable
        onPress={activate}
        onLongPress={onReorderLongPress}
        delayLongPress={REORDER_LONG_PRESS_DURATION}
        accessible={!isActive}
        {...(!isActive ? rowAccessibilityProps : {})}
        style={[styles.body, isActive && styles.bodyActive]}
      >
        <View
          style={styles.identityGroup}
          accessible={isActive}
          {...(isActive ? rowAccessibilityProps : {})}
        >
          <CurrencyIcon
            currencyCode={currencyCode}
            countryCode={countryCode}
            badgeLabel={badgeLabel}
          />
          <Text style={styles.code}>{currencyCode.toUpperCase()}</Text>
        </View>
        {values}
      </Pressable>
    </SwipeToDeleteRow>
  );
}

export const CurrencyRow = memo(CurrencyRowComponent);

const CARD_BORDER_WIDTH = 2;
const CARD_HEIGHT = 80;
const AMOUNT_FIT_CHARACTER_COUNT = 12;
const MINIMUM_AMOUNT_FONT_SIZE = 14;
const MINIMUM_AMOUNT_FONT_SCALE = MINIMUM_AMOUNT_FONT_SIZE / 24;

function createActiveAmountStyle(
  amountText: string,
  typography: ThemeTokens['typography']['amount'],
) {
  const scale = Math.min(1, AMOUNT_FIT_CHARACTER_COUNT / Math.max(amountText.length, 1));
  const fontSize = Math.max(MINIMUM_AMOUNT_FONT_SIZE, Math.round(typography.fontSize * scale));

  return {
    fontSize,
    lineHeight: Math.round(fontSize * (typography.lineHeight / typography.fontSize)),
  };
}

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    body: {
      height: CARD_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.lg,
      borderWidth: CARD_BORDER_WIDTH,
      borderColor: theme.colors.border,
    },

    bodyActive: {
      borderColor: theme.colors.primary,
    },
    identityGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    code: {
      ...theme.typography.code,
      color: theme.colors.textPrimary,
      minWidth: 48,
    },

    values: {
      flex: 1,
      alignItems: 'flex-end',
    },
    amount: {
      ...theme.typography.amount,
      color: theme.colors.textPrimary,
    },
    amountWithoutRate: {
      height: theme.typography.amount.lineHeight + theme.typography.caption.lineHeight,
      textAlignVertical: 'center',
    },
    rate: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
  });
}

/** Renders one editable and removable currency row. */

import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import ReanimatedSwipeable, {
  SwipeDirection,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Easing,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { type ThemeTokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { CurrencyIcon } from '../../ui/CurrencyIcon';
import { TrashIcon } from '../../ui/icons';

import { AmountField } from './AmountField';
import { DELETE_ANIMATION_DURATION, REORDER_LONG_PRESS_DURATION } from './interactionConstants';

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
  readonly onRemove: (currencyCode: string) => void;

  readonly removeLabel: string;

  /** Starts dragging this row after its 500 ms long press is recognized. */
  readonly onReorderLongPress: () => void;

  /** Accessibility action for moving toward the start, or null at the first row. */
  readonly moveUpAction: CurrencyRowMoveAction | null;

  /** Accessibility action for moving toward the end, or null at the final row. */
  readonly moveDownAction: CurrencyRowMoveAction | null;

  readonly layoutDirection: 'ltr' | 'rtl';
}

/** Describes one localized row move exposed to assistive technology. */
export interface CurrencyRowMoveAction {
  /** User-facing action name announced by the platform. */
  readonly label: string;

  /** Applies the move to the persisted currency order. */
  readonly run: () => void;
}

const REMOVE_THRESHOLD = 44;
const REMOVE_ACTION_WIDTH = 64;
const FULL_SWIPE_DELETE_FRACTION = 0.6;
const TRASH_ICON_SIZE = 32;
const DISABLED_SWIPE_OFFSET = Number.MAX_SAFE_INTEGER;

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
  onRemove,
  removeLabel,
  onReorderLongPress,
  moveUpAction,
  moveDownAction,
  layoutDirection,
}: CurrencyRowProps) {
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const hasRateText = rateText !== null;
  const [cardWidth, setCardWidth] = useState(0);
  const [isRtlRemoveActionOpen, setIsRtlRemoveActionOpen] = useState(false);
  const fullSwipeReached = useRef(false);
  const deletionStarted = useRef(false);
  const removeSwipeDirection =
    layoutDirection === 'rtl' ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
  const swipeSign = layoutDirection === 'rtl' ? 1 : -1;
  const deleteTranslation = useSharedValue(0);
  const exitDistance = Math.max(cardWidth + theme.spacing.lg * 2, windowWidth + theme.spacing.lg);
  const deleteStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: deleteTranslation.value }],
  }));
  const activeAmountStyle = useMemo(
    () =>
      createActiveAmountStyle(
        isAmountFormatted ? placeholderAmountText : amountText,
        theme.typography.amount,
      ),
    [amountText, isAmountFormatted, placeholderAmountText, theme.typography.amount],
  );
  const reorderAccessibilityActions = useMemo<AccessibilityActionInfo[]>(
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

  const remove = useCallback(() => onRemove(currencyCode), [currencyCode, onRemove]);

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

  const measureCard = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) =>
      setCardWidth((currentWidth) =>
        currentWidth === nativeEvent.layout.width ? currentWidth : nativeEvent.layout.width,
      ),
    [],
  );

  const setFullSwipeReached = useCallback((reached: boolean) => {
    fullSwipeReached.current = reached;
  }, []);

  const startDelete = useCallback(() => {
    if (deletionStarted.current) {
      return;
    }

    deletionStarted.current = true;
    fullSwipeReached.current = false;
    setIsRtlRemoveActionOpen(false);
    deleteTranslation.set(
      withTiming(
        swipeSign * exitDistance,
        {
          duration: DELETE_ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(remove)();
          }
        },
      ) as unknown as number,
    );
  }, [deleteTranslation, exitDistance, remove, swipeSign]);

  const finishSwipe = useCallback(
    (direction: SwipeDirection) => {
      const shouldRemove = direction === removeSwipeDirection && fullSwipeReached.current;

      fullSwipeReached.current = false;

      if (shouldRemove) {
        startDelete();
      }
    },
    [removeSwipeDirection, startDelete],
  );

  const showRtlRemoveAction = useCallback(
    (direction: SwipeDirection) => {
      if (
        layoutDirection === 'rtl' &&
        direction === removeSwipeDirection &&
        !deletionStarted.current
      ) {
        setIsRtlRemoveActionOpen(true);
      }
    },
    [layoutDirection, removeSwipeDirection],
  );

  const hideRtlRemoveAction = useCallback(() => {
    fullSwipeReached.current = false;
    setIsRtlRemoveActionOpen(false);
  }, []);

  const renderRemoveAction = useCallback(
    (_progress: SharedValue<number>, translation: SharedValue<number>) => {
      const hasMeasuredRtlCard = layoutDirection === 'rtl' && cardWidth > REMOVE_ACTION_WIDTH;

      return (
        <RemoveAction
          translation={translation}
          fullSwipeThreshold={cardWidth * FULL_SWIPE_DELETE_FRACTION}
          swipeSign={swipeSign}
          actionOffset={hasMeasuredRtlCard ? -REMOVE_ACTION_WIDTH : 0}
          measurementWidth={
            hasMeasuredRtlCard ? cardWidth - REMOVE_ACTION_WIDTH : REMOVE_ACTION_WIDTH
          }
          isRtl={layoutDirection === 'rtl'}
          isAccessible={!isRtlRemoveActionOpen}
          onFullSwipeChange={setFullSwipeReached}
          onPress={startDelete}
          label={removeLabel}
          color={theme.colors.onEmphasis}
          styles={styles}
        />
      );
    },
    [
      cardWidth,
      isRtlRemoveActionOpen,
      layoutDirection,
      removeLabel,
      setFullSwipeReached,
      startDelete,
      styles,
      swipeSign,
      theme.colors.onEmphasis,
    ],
  );

  const values = (
    <View style={styles.values}>
      {}
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
    <Animated.View style={deleteStyle}>
      <View style={styles.card} onLayout={measureCard}>
        {}
        <ReanimatedSwipeable
          enabled={canRemove}
          renderLeftActions={
            canRemove && layoutDirection === 'rtl' ? renderRemoveAction : undefined
          }
          renderRightActions={
            canRemove && layoutDirection === 'ltr' ? renderRemoveAction : undefined
          }
          leftThreshold={layoutDirection === 'rtl' ? REMOVE_THRESHOLD : undefined}
          rightThreshold={layoutDirection === 'ltr' ? REMOVE_THRESHOLD : undefined}
          dragOffsetFromLeftEdge={layoutDirection === 'ltr' ? DISABLED_SWIPE_OFFSET : undefined}
          dragOffsetFromRightEdge={layoutDirection === 'rtl' ? DISABLED_SWIPE_OFFSET : undefined}
          friction={1}
          overshootLeft={layoutDirection === 'rtl'}
          overshootRight={layoutDirection === 'ltr'}
          overshootFriction={1}
          containerStyle={{ direction: layoutDirection }}
          onSwipeableWillOpen={finishSwipe}
          onSwipeableOpen={showRtlRemoveAction}
          onSwipeableWillClose={hideRtlRemoveAction}
        >
          {}
          <Pressable
            onPress={activate}
            onLongPress={onReorderLongPress}
            delayLongPress={REORDER_LONG_PRESS_DURATION}
            accessible={!isActive}
            accessibilityRole={isActive ? undefined : 'button'}
            accessibilityLabel={isActive ? undefined : accessibilityLabel}
            accessibilityState={isActive ? undefined : { selected: false }}
            accessibilityActions={reorderAccessibilityActions}
            onAccessibilityAction={move}
            style={[styles.body, isActive && styles.bodyActive]}
          >
            <View
              style={styles.identityGroup}
              accessible={isActive}
              accessibilityRole={isActive ? 'button' : undefined}
              accessibilityLabel={isActive ? accessibilityLabel : undefined}
              accessibilityState={isActive ? { selected: true } : undefined}
              accessibilityActions={isActive ? reorderAccessibilityActions : undefined}
              onAccessibilityAction={isActive ? move : undefined}
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
        </ReanimatedSwipeable>
        {isRtlRemoveActionOpen && (
          <Pressable
            onPress={startDelete}
            accessibilityRole="button"
            accessibilityLabel={removeLabel}
            style={styles.rtlOpenRemoveAction}
          >
            <TrashIcon color={theme.colors.onEmphasis} size={TRASH_ICON_SIZE} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export const CurrencyRow = memo(CurrencyRowComponent);

const CARD_BORDER_WIDTH = 2;
const CARD_HEIGHT = 80;
const AMOUNT_FIT_CHARACTER_COUNT = 12;
const MINIMUM_AMOUNT_FONT_SIZE = 14;
const MINIMUM_AMOUNT_FONT_SCALE = MINIMUM_AMOUNT_FONT_SIZE / 24;

interface RemoveActionProps {
  readonly translation: SharedValue<number>;
  readonly fullSwipeThreshold: number;
  readonly swipeSign: 1 | -1;
  readonly actionOffset: number;
  readonly measurementWidth: number;
  readonly isRtl: boolean;
  readonly isAccessible: boolean;
  readonly onFullSwipeChange: (reached: boolean) => void;
  readonly onPress: () => void;
  readonly label: string;
  readonly color: string;
  readonly styles: ReturnType<typeof createStyles>;
}

function RemoveAction({
  translation,
  fullSwipeThreshold,
  swipeSign,
  actionOffset,
  measurementWidth,
  isRtl,
  isAccessible,
  onFullSwipeChange,
  onPress,
  label,
  color,
  styles,
}: RemoveActionProps) {
  useAnimatedReaction(
    () =>
      fullSwipeThreshold > REMOVE_ACTION_WIDTH &&
      translation.value * swipeSign >= fullSwipeThreshold,
    (fullSwipe, previousFullSwipe) => {
      if (fullSwipe !== previousFullSwipe) {
        runOnJS(onFullSwipeChange)(fullSwipe);
      }
    },
    [fullSwipeThreshold, onFullSwipeChange, swipeSign, translation],
  );

  return (
    <View
      style={[
        styles.removeActionSlot,
        { width: measurementWidth },
        actionOffset === 0 ? undefined : { transform: [{ translateX: actionOffset }] },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.removeActionFill,
          isRtl ? styles.removeActionFillRtl : styles.removeActionFillLtr,
        ]}
      />
      <Pressable
        onPress={onPress}
        accessible={isAccessible}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={styles.removeAction}
      >
        <TrashIcon color={color} size={TRASH_ICON_SIZE} />
      </Pressable>
    </View>
  );
}

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
    card: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderRadius: theme.radii.lg,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },
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

    removeAction: {
      justifyContent: 'center',
      alignItems: 'center',
      width: REMOVE_ACTION_WIDTH,
      height: '100%',
      backgroundColor: theme.colors.danger,
    },
    removeActionSlot: {
      width: REMOVE_ACTION_WIDTH,
      height: '100%',
      direction: 'ltr',
    },
    removeActionFill: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: '1000%',
      backgroundColor: theme.colors.danger,
    },
    removeActionFillLtr: {
      right: 0,
    },
    removeActionFillRtl: {
      left: 0,
    },
    rtlOpenRemoveAction: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: REMOVE_ACTION_WIDTH,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.danger,
      zIndex: 1,
    },
  });
}

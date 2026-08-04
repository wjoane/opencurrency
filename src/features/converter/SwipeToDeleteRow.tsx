/** Isolates swipe-to-delete gesture-handler behavior from currency-row presentation. */

import { type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import ReanimatedSwipeable, {
  SwipeDirection,
  type SwipeableMethods,
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

import { type LayoutDirection } from '../../i18n/locales';
import { useTheme } from '../../theme/ThemeContext';
import { type ThemeTokens } from '../../theme/tokens';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { TrashIcon } from '../../ui/icons';
import { getDirectionProps, getDirectionStyle } from '../../ui/layoutDirection';

import { DELETE_ANIMATION_DURATION } from './interactionConstants';
import { createSwipeDeleteController, shouldShowRtlAction } from './swipeDeleteRules';

const REMOVE_THRESHOLD = 44;
const REMOVE_ACTION_WIDTH = 64;
const FULL_SWIPE_DELETE_FRACTION = 0.6;
const TRASH_ICON_SIZE = 32;
const DISABLED_SWIPE_OFFSET = Number.MAX_SAFE_INTEGER;

export interface SwipeToDeleteRowProps {
  readonly children: ReactNode;
  readonly canRemove: boolean;
  readonly removal: SwipeRemovalLifecycle;
  readonly removeLabel: string;
  readonly layoutDirection: LayoutDirection;
}

export interface SwipeRemovalLifecycle {
  readonly start: () => boolean;
  readonly finish: (completed: boolean) => void;
}

interface SwipeToDeleteOptions extends Omit<SwipeToDeleteRowProps, 'children'> {
  readonly swipeableRef: RefObject<SwipeableMethods | null>;
}

function useSwipeToDelete({
  canRemove,
  removal,
  removeLabel,
  layoutDirection,
  swipeableRef,
}: SwipeToDeleteOptions) {
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [cardWidth, setCardWidth] = useState(0);
  const [isRemoveActionRevealed, setIsRemoveActionRevealed] = useState(false);
  const [swipeController] = useState(createSwipeDeleteController);
  const unmountCleanupRef = useRef({ removal, swipeController });
  const isRtlRemoveActionOpen = layoutDirection === 'rtl' && isRemoveActionRevealed;
  const removeSwipeDirection =
    layoutDirection === 'rtl' ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
  const swipeSign = layoutDirection === 'rtl' ? 1 : -1;
  const deleteTranslation = useSharedValue(0);
  const exitDistance = Math.max(cardWidth + theme.spacing.lg * 2, windowWidth + theme.spacing.lg);
  const deleteStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: deleteTranslation.value }],
  }));

  const measureCard = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => setCardWidth(nativeEvent.layout.width),
    [],
  );

  const finishDelete = useCallback(
    (completed: boolean) => {
      swipeController.finishDelete();
      removal.finish(completed);
    },
    [removal, swipeController],
  );

  const requestDelete = useCallback(
    (requested: boolean) => {
      if (!swipeController.beginDelete(requested && canRemove)) {
        return;
      }

      if (!removal.start()) {
        swipeController.finishDelete();
        return;
      }

      setIsRemoveActionRevealed(false);
      deleteTranslation.set(
        withTiming(
          swipeSign * exitDistance,
          {
            duration: DELETE_ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic),
          },
          (finished) => runOnJS(finishDelete)(finished === true),
        ),
      );
    },
    [canRemove, deleteTranslation, exitDistance, finishDelete, removal, swipeController, swipeSign],
  );

  const startDelete = useCallback(() => requestDelete(true), [requestDelete]);

  const setFullSwipeReached = useCallback(
    (reached: boolean) => swipeController.setFullSwipeReached(reached),
    [swipeController],
  );

  const finishSwipe = useCallback(
    (direction: SwipeDirection) =>
      requestDelete(swipeController.shouldDeleteAfterSwipe(direction, removeSwipeDirection)),
    [removeSwipeDirection, requestDelete, swipeController],
  );

  const showRtlRemoveAction = useCallback(
    (direction: SwipeDirection) =>
      setIsRemoveActionRevealed(
        (revealed) =>
          revealed ||
          shouldShowRtlAction(
            layoutDirection,
            direction,
            removeSwipeDirection,
            swipeController.deletionStarted,
          ),
      ),
    [layoutDirection, removeSwipeDirection, swipeController],
  );

  const hideRtlRemoveAction = useCallback(() => {
    swipeController.setFullSwipeReached(false);
    setIsRemoveActionRevealed(false);
  }, [swipeController]);

  useEffect(() => {
    if (swipeController.deletionStarted) {
      return;
    }

    swipeableRef.current?.close();
  }, [layoutDirection, swipeableRef, swipeController]);

  useEffect(() => {
    unmountCleanupRef.current = { removal, swipeController };
  }, [removal, swipeController]);

  useEffect(
    () => () => {
      const { removal: latestRemoval, swipeController: latestSwipeController } =
        unmountCleanupRef.current;

      if (latestSwipeController.deletionStarted) {
        latestSwipeController.finishDelete();
        latestRemoval.finish(false);
      }
    },
    [],
  );

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
      swipeSign,
      theme.colors.onEmphasis,
    ],
  );

  return {
    deleteStyle,
    isRtlRemoveActionOpen,
    measureCard,
    renderRemoveAction,
    finishSwipe,
    showRtlRemoveAction,
    hideRtlRemoveAction,
    startDelete,
  };
}

export function SwipeToDeleteRow({
  children,
  canRemove,
  removal,
  removeLabel,
  layoutDirection,
}: SwipeToDeleteRowProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const swipeableRef = useRef<SwipeableMethods>(null);
  const swipe = useSwipeToDelete({
    canRemove,
    removal,
    removeLabel,
    layoutDirection,
    swipeableRef,
  });

  return (
    <Animated.View style={swipe.deleteStyle}>
      <View style={styles.card} onLayout={swipe.measureCard}>
        <ReanimatedSwipeable
          ref={swipeableRef}
          enabled={canRemove}
          renderLeftActions={
            canRemove && layoutDirection === 'rtl' ? swipe.renderRemoveAction : undefined
          }
          renderRightActions={
            canRemove && layoutDirection === 'ltr' ? swipe.renderRemoveAction : undefined
          }
          leftThreshold={layoutDirection === 'rtl' ? REMOVE_THRESHOLD : undefined}
          rightThreshold={layoutDirection === 'ltr' ? REMOVE_THRESHOLD : undefined}
          dragOffsetFromLeftEdge={layoutDirection === 'ltr' ? DISABLED_SWIPE_OFFSET : undefined}
          dragOffsetFromRightEdge={layoutDirection === 'rtl' ? DISABLED_SWIPE_OFFSET : undefined}
          friction={1}
          overshootLeft={layoutDirection === 'rtl'}
          overshootRight={layoutDirection === 'ltr'}
          overshootFriction={1}
          containerStyle={getDirectionStyle(layoutDirection)}
          onSwipeableWillOpen={swipe.finishSwipe}
          onSwipeableOpen={swipe.showRtlRemoveAction}
          onSwipeableWillClose={swipe.hideRtlRemoveAction}
        >
          {children}
        </ReanimatedSwipeable>
        {swipe.isRtlRemoveActionOpen && (
          <Pressable
            onPress={swipe.startDelete}
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
}: RemoveActionProps) {
  const styles = useThemedStyles(createStyles);

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
      {...getDirectionProps('ltr')}
      style={[
        styles.removeActionSlot,
        getDirectionStyle('ltr'),
        { width: measurementWidth },
        actionOffset === 0 ? undefined : { transform: [{ translateX: actionOffset }] },
      ]}
    >
      <View
        style={[
          styles.removeActionFill,
          styles.removeActionFillDisabled,
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

function createStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    card: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderRadius: theme.radii.lg,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
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
    },
    removeActionFill: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: '1000%',
      backgroundColor: theme.colors.danger,
    },
    removeActionFillDisabled: {
      pointerEvents: 'none',
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

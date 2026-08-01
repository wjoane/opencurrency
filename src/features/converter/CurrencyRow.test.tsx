import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import { nearestCompositeProps, outermostCompositeProps } from '../../testing/compositeProps';
import { ThemeProvider } from '../../theme/ThemeContext';
import { CURRENCY_BADGE_TEST_ID, FLAG_IMAGE_TEST_ID } from '../../ui/CurrencyIcon';

import { CurrencyRow, type CurrencyRowProps } from './CurrencyRow';
import { DELETE_ANIMATION_DURATION, REORDER_LONG_PRESS_DURATION } from './interactionConstants';

const BASE_PROPS: CurrencyRowProps = {
  currencyCode: 'jpy',
  countryCode: 'jp',
  badgeLabel: '¥',
  amountText: '¥ 173',
  placeholderAmountText: '¥ 173',
  isAmountFormatted: false,
  rateText: '1 USD = 152.31 JPY',
  isActive: false,
  accessibilityLabel: 'Japanese Yen, ¥ 173',
  amountAccessibilityLabel: 'Amount in Japanese Yen',
  editableAmountText: '173',
  onActivate: () => {},
  onAmountChange: () => {},
  onAmountEditingEnd: () => {},
  canRemove: true,
  onRemove: () => {},
  removeLabel: 'Remove Japanese Yen',
  onReorderLongPress: () => {},
  moveUpAction: { label: 'Move Japanese Yen up', run: () => {} },
  moveDownAction: { label: 'Move Japanese Yen down', run: () => {} },
  layoutDirection: 'ltr',
};

async function renderRow(overrides: Partial<CurrencyRowProps> = {}) {
  await render(
    <ThemeProvider initialPreference="light">
      <CurrencyRow {...BASE_PROPS} {...overrides} />
    </ThemeProvider>,
  );
}

type Element = ReturnType<typeof screen.getByRole>;

interface CardLayoutProps {
  readonly onLayout?: (event: {
    readonly nativeEvent: { readonly layout: { readonly width: number } };
  }) => void;
}

interface SwipeableProps {
  readonly renderLeftActions?: unknown;
  readonly renderRightActions?: unknown;
  readonly friction?: number;
  readonly leftThreshold?: number;
  readonly rightThreshold?: number;
  readonly dragOffsetFromLeftEdge?: number;
  readonly dragOffsetFromRightEdge?: number;
  readonly overshootRight?: boolean;
  readonly overshootLeft?: boolean;
  readonly containerStyle?: ViewStyle;
  readonly onSwipeableWillOpen?: (direction: 'left' | 'right') => void;
  readonly onSwipeableOpen?: (direction: 'left' | 'right') => void;
}

interface FullSwipeActionProps {
  readonly translation?: { value: number };
  readonly fullSwipeThreshold?: number;
  readonly swipeSign?: number;
}

interface ActionSlotProps {
  readonly style?: ViewStyle;
}

function ancestorLabels(element: Element): string[] {
  const labels: string[] = [];

  for (let node = element.parent; node !== null; node = node.parent) {
    const label: unknown = node.props.accessibilityLabel;

    if (typeof label === 'string') {
      labels.push(label);
    }
  }

  return labels;
}

describe('CurrencyRow', () => {
  it('shows the code, amount and rate sub-line without the full currency name', async () => {
    await renderRow();

    expect(screen.getByText('JPY')).toBeOnTheScreen();
    expect(screen.queryByText('Japanese Yen')).toBeNull();
    expect(screen.getByText('¥ 173')).toBeOnTheScreen();
    expect(screen.getByText('1 USD = 152.31 JPY')).toBeOnTheScreen();
  });

  it('omits the rate sub-line rather than rendering an empty one', async () => {
    await renderRow({ isActive: true, rateText: null });

    expect(screen.getByLabelText('Amount in Japanese Yen')).toBeOnTheScreen();
    expect(screen.queryByText('1 USD = 152.31 JPY')).toBeNull();
  });

  it('is announced by its name and amount, not by its raw code', async () => {
    await renderRow();

    expect(screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel })).toBeOnTheScreen();
  });

  it('carries an accessibility state when it is the active row', async () => {
    await renderRow({ isActive: true });

    expect(screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel })).toBeSelected();
  });

  it('reports itself as unselected when it is not the active row', async () => {
    await renderRow();

    expect(screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel })).not.toBeSelected();
  });

  it('starts reordering after a 500 ms long press', async () => {
    const onReorderLongPress = jest.fn();

    await renderRow({ onReorderLongPress });

    const row = screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel });

    await fireEvent(row, 'longPress');

    expect(onReorderLongPress).toHaveBeenCalledTimes(1);
  });

  it('pins the reorder hold duration to 500 ms', () => {
    expect(REORDER_LONG_PRESS_DURATION).toBe(500);
  });

  it('offers labelled accessibility actions for moving the row', async () => {
    await renderRow();

    expect(screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel })).toHaveProp(
      'accessibilityActions',
      [
        { name: 'moveUp', label: 'Move Japanese Yen up' },
        { name: 'moveDown', label: 'Move Japanese Yen down' },
      ],
    );
  });

  it('keeps reorder actions on the active row beside its separate amount input', async () => {
    await renderRow({ isActive: true });

    expect(screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel })).toHaveProp(
      'accessibilityActions',
      expect.arrayContaining([
        { name: 'moveUp', label: 'Move Japanese Yen up' },
        { name: 'moveDown', label: 'Move Japanese Yen down' },
      ]),
    );
  });

  it('moves the row through its public accessibility actions', async () => {
    const onMoveUp = jest.fn();
    const onMoveDown = jest.fn();

    await renderRow({
      moveUpAction: { label: 'Move Japanese Yen up', run: onMoveUp },
      moveDownAction: { label: 'Move Japanese Yen down', run: onMoveDown },
    });
    const row = screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel });

    await fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'moveUp' } });
    await fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'moveDown' } });

    expect(onMoveUp).toHaveBeenCalledTimes(1);
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  it('does not offer or run a move that would leave the list', async () => {
    const onMoveUp = jest.fn();

    await renderRow({ moveUpAction: null });
    const row = screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel });

    expect(row.props.accessibilityActions).toEqual([
      { name: 'moveDown', label: 'Move Japanese Yen down' },
    ]);

    await fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'moveUp' } });

    expect(onMoveUp).not.toHaveBeenCalled();
  });

  it('activates itself by code, carrying its own editable amount, when pressed', async () => {
    const onActivate = jest.fn();

    await renderRow({ onActivate });
    await fireEvent.press(screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel }));

    expect(onActivate).toHaveBeenCalledWith('jpy', '173');
  });

  it('draws the flag of the currency’s country', async () => {
    await renderRow();

    expect(
      screen.getByTestId(FLAG_IMAGE_TEST_ID, { includeHiddenElements: true }),
    ).toBeOnTheScreen();
  });

  it('falls back to a generated badge for a currency with no country', async () => {
    await renderRow({ currencyCode: 'btc', countryCode: null, badgeLabel: '₿' });

    expect(
      screen.getByTestId(CURRENCY_BADGE_TEST_ID, { includeHiddenElements: true }),
    ).toBeOnTheScreen();
    expect(screen.getByText('₿', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('swaps its amount for an input only while it is the active row', async () => {
    await renderRow();

    expect(screen.queryByLabelText('Amount in Japanese Yen')).toBeNull();

    await renderRow({ isActive: true });

    expect(screen.getByLabelText('Amount in Japanese Yen')).toBeOnTheScreen();
  });

  it('reports every keystroke without reformatting it', async () => {
    const onAmountChange = jest.fn();

    await renderRow({ isActive: true, onAmountChange });
    await fireEvent.changeText(screen.getByLabelText('Amount in Japanese Yen'), '1234567.');

    expect(onAmountChange).toHaveBeenCalledWith('1234567.');
  });

  it('reports when amount editing finishes', async () => {
    const onAmountEditingEnd = jest.fn();

    await renderRow({ isActive: true, onAmountEditingEnd });
    await fireEvent(screen.getByLabelText('Amount in Japanese Yen'), 'endEditing');

    expect(onAmountEditingEnd).toHaveBeenCalledTimes(1);
  });

  it('shows a carried-over value as a placeholder rather than as the field’s value', async () => {
    await renderRow({ isActive: true, isAmountFormatted: true, amountText: '173' });

    const field = screen.getByLabelText('Amount in Japanese Yen');

    expect(field.props.value).toBe('');
    expect(field.props.placeholder).toBe('¥ 173');
  });

  it('holds the typed text once the user has started typing', async () => {
    await renderRow({ isActive: true, isAmountFormatted: false, amountText: '5' });

    const field = screen.getByLabelText('Amount in Japanese Yen');

    expect(field.props.value).toBe('5');
    expect(field.props.placeholder).toBeUndefined();
  });

  it('keeps active and inactive cards at one fixed height', async () => {
    await renderRow();

    const inactiveStyle = StyleSheet.flatten(
      screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel }).props.style,
    ) as ViewStyle;

    await screen.unmount();
    await renderRow({ isActive: true });

    const activeRow = screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel });
    const activeBody = outermostCompositeProps<{ readonly style?: ViewStyle }>(
      activeRow,
      (props) => props.onPress !== undefined,
      'active currency card',
    );
    const activeStyle = StyleSheet.flatten(activeBody.style) as ViewStyle;

    expect(inactiveStyle.height).toEqual(expect.any(Number));
    expect(activeStyle.height).toBe(inactiveStyle.height);
  });

  it('shrinks a long inactive amount down to a readable minimum', async () => {
    const longAmount = '$ 12,345,678,901,234,567,890.12';

    await renderRow({ amountText: longAmount });

    expect(screen.getByText(longAmount)).toHaveProp('adjustsFontSizeToFit', true);
    expect(screen.getByText(longAmount)).toHaveProp('minimumFontScale', expect.any(Number));
  });

  it('shrinks a long amount while it is being edited', async () => {
    await renderRow({
      isActive: true,
      isAmountFormatted: false,
      amountText: '123456789012345678901234567890',
    });

    const style = StyleSheet.flatten(
      screen.getByLabelText('Amount in Japanese Yen').props.style,
    ) as TextStyle;

    expect(style.fontSize).toBeLessThan(24);
    expect(style.fontSize).toBeGreaterThanOrEqual(14);
  });

  it('keeps the amount input outside the row’s own accessible element', async () => {
    await renderRow({ isActive: true });

    const field = screen.getByLabelText('Amount in Japanese Yen');

    expect(ancestorLabels(field)).not.toContain(BASE_PROPS.accessibilityLabel);
  });

  it('offers a labelled remove action while removal is allowed', async () => {
    await renderRow();

    expect(screen.getByRole('button', { name: 'Remove Japanese Yen' })).toBeOnTheScreen();
    expect(screen.queryByText('Remove Japanese Yen')).toBeNull();
  });

  it('draws the delete reveal on a red background', async () => {
    await renderRow();

    const style = StyleSheet.flatten(
      screen.getByRole('button', { name: 'Remove Japanese Yen' }).props.style,
    ) as ViewStyle;

    expect(style.backgroundColor).toBe('#DC2626');
  });

  it('keeps an ordinary swipe actionable and reserves direct deletion for a full swipe', async () => {
    const onRemove = jest.fn();

    await renderRow({ onRemove });

    const row = screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel });
    const layout = outermostCompositeProps<CardLayoutProps>(
      row,
      (props) => props.onLayout !== undefined,
      'currency card layout',
    );

    await act(async () => {
      layout.onLayout?.({
        nativeEvent: { layout: { width: 300 } },
      });
      layout.onLayout?.({
        nativeEvent: { layout: { width: 300 } },
      });
    });

    const removeAction = screen.getByRole('button', { name: 'Remove Japanese Yen' });
    const swipeable = outermostCompositeProps<SwipeableProps>(
      removeAction,
      (props) => props.renderRightActions !== undefined,
      'swipeable card',
    );
    const fullSwipe = nearestCompositeProps<FullSwipeActionProps>(
      removeAction,
      (props) => props.fullSwipeThreshold !== undefined,
      'full-swipe remove action',
    );

    expect(swipeable.friction).toBe(1);
    expect(swipeable.overshootRight).toBe(true);
    expect(fullSwipe.fullSwipeThreshold).toBe(180);

    await act(async () => {
      if (fullSwipe.translation !== undefined) {
        fullSwipe.translation.value = -180;
      }
    });

    expect(onRemove).not.toHaveBeenCalled();

    await act(async () => {
      if (fullSwipe.translation !== undefined) {
        fullSwipe.translation.value = -100;
      }
    });

    jest.useFakeTimers();
    await act(async () => {
      swipeable.onSwipeableWillOpen?.('left');
    });
    await act(async () => {
      jest.advanceTimersByTime(DELETE_ANIMATION_DURATION);
    });
    jest.useRealTimers();

    expect(onRemove).not.toHaveBeenCalled();

    await act(async () => {
      if (fullSwipe.translation !== undefined) {
        fullSwipe.translation.value = -180;
      }
    });

    jest.useFakeTimers();
    await act(async () => {
      swipeable.onSwipeableWillOpen?.('left');
    });
    await act(async () => {
      jest.advanceTimersByTime(DELETE_ANIMATION_DURATION);
    });
    jest.useRealTimers();

    expect(onRemove).toHaveBeenCalledWith('jpy');
  });

  it('maps the delete reveal and gesture to the mirrored RTL direction', async () => {
    await renderRow({ layoutDirection: 'rtl' });

    const removeAction = screen.getByRole('button', { name: 'Remove Japanese Yen' });
    const swipeable = outermostCompositeProps<SwipeableProps>(
      removeAction,
      (props) => props.renderLeftActions !== undefined,
      'right-to-left swipeable card',
    );
    const fullSwipe = nearestCompositeProps<FullSwipeActionProps>(
      removeAction,
      (props) => props.fullSwipeThreshold !== undefined,
      'right-to-left full-swipe remove action',
    );

    expect(swipeable.renderRightActions).toBeUndefined();
    expect(swipeable.leftThreshold).toBe(44);
    expect(swipeable.overshootLeft).toBe(true);
    expect(swipeable.dragOffsetFromRightEdge).toBe(Number.MAX_SAFE_INTEGER);
    expect(swipeable.dragOffsetFromLeftEdge).toBeUndefined();
    expect((StyleSheet.flatten(swipeable.containerStyle) as ViewStyle | undefined)?.direction).toBe(
      'rtl',
    );
    expect(fullSwipe.swipeSign).toBe(1);
  });

  it('removes a currency from the independent RTL delete control after the row opens', async () => {
    const onRemove = jest.fn();

    await renderRow({ layoutDirection: 'rtl', onRemove });

    const removeAction = screen.getByRole('button', { name: 'Remove Japanese Yen' });
    const swipeable = outermostCompositeProps<SwipeableProps>(
      removeAction,
      (props) => props.renderLeftActions !== undefined,
      'right-to-left swipeable card',
    );

    expect(swipeable.onSwipeableOpen).toBeDefined();

    await act(async () => {
      swipeable.onSwipeableOpen?.('right');
    });

    const removeControl = screen.getByRole('button', { name: 'Remove Japanese Yen' });

    jest.useFakeTimers();
    await fireEvent.press(removeControl);
    await act(async () => {
      jest.advanceTimersByTime(DELETE_ANIMATION_DURATION);
    });
    jest.useRealTimers();

    expect(onRemove).toHaveBeenCalledWith('jpy');
  });

  it('keeps the RTL delete action hit target in its physical left reveal area', async () => {
    await renderRow({ layoutDirection: 'rtl' });

    const row = screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel });
    const layout = outermostCompositeProps<CardLayoutProps>(
      row,
      (props) => props.onLayout !== undefined,
      'right-to-left currency card layout',
    );

    await act(async () => {
      layout.onLayout?.({ nativeEvent: { layout: { width: 300 } } });
    });

    const actionStyle = StyleSheet.flatten(
      screen.getByRole('button', { name: 'Remove Japanese Yen' }).props.style,
    ) as ViewStyle;
    const slot = nearestCompositeProps<ActionSlotProps>(
      screen.getByRole('button', { name: 'Remove Japanese Yen' }),
      (props) => (StyleSheet.flatten(props.style) as ViewStyle | undefined)?.width === 236,
      'translated right-to-left delete-action slot',
    );
    const slotStyle = StyleSheet.flatten(slot.style) as ViewStyle;

    expect(actionStyle.transform).toBeUndefined();
    expect(slotStyle.transform).toEqual([{ translateX: -64 }]);
  });

  it('uses the inverse card width as the RTL delete-action measurement slot', async () => {
    await renderRow({ layoutDirection: 'rtl' });

    const row = screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel });
    const layout = outermostCompositeProps<CardLayoutProps>(
      row,
      (props) => props.onLayout !== undefined,
      'right-to-left currency card layout',
    );

    await act(async () => {
      layout.onLayout?.({ nativeEvent: { layout: { width: 300 } } });
    });

    const slot = nearestCompositeProps<ActionSlotProps>(
      screen.getByRole('button', { name: 'Remove Japanese Yen' }),
      (props) => {
        const style = StyleSheet.flatten(props.style) as ViewStyle | undefined;

        return style?.width === 236;
      },
      'right-to-left delete-action measurement slot',
    );

    expect(StyleSheet.flatten(slot.style)).toMatchObject({ width: 236 });
  });

  it('removes the currency it names when the action is pressed', async () => {
    const onRemove = jest.fn();

    await renderRow({ onRemove });
    jest.useFakeTimers();
    await fireEvent.press(screen.getByRole('button', { name: 'Remove Japanese Yen' }));
    await act(async () => {
      jest.advanceTimersByTime(DELETE_ANIMATION_DURATION);
    });
    jest.useRealTimers();

    expect(onRemove).toHaveBeenCalledWith('jpy');
  });

  it('does not offer removal at the two-row minimum', async () => {
    await renderRow({ canRemove: false });

    expect(screen.queryByRole('button', { name: 'Remove Japanese Yen' })).toBeNull();
  });
});

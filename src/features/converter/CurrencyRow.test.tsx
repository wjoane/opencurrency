import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, type TextStyle } from 'react-native';
import { ThemeProvider } from '../../theme/ThemeContext';

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
  removal: { start: () => true, finish: () => {} },
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

  it('falls back to a generated badge for a currency with no country', async () => {
    await renderRow({ currencyCode: 'btc', countryCode: null, badgeLabel: '₿' });

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

  it('exposes the active row and its amount input as separate controls', async () => {
    await renderRow({ isActive: true });

    expect(screen.getByRole('button', { name: BASE_PROPS.accessibilityLabel })).toBeOnTheScreen();
    expect(screen.getByLabelText('Amount in Japanese Yen')).toBeOnTheScreen();
  });

  it('removes the currency it names through the labelled remove control', async () => {
    const onRemoveFinish = jest.fn();
    jest.useFakeTimers();

    await renderRow({ removal: { start: () => true, finish: onRemoveFinish } });
    await fireEvent.press(screen.getByRole('button', { name: BASE_PROPS.removeLabel }));
    await act(async () => {
      jest.advanceTimersByTime(DELETE_ANIMATION_DURATION);
    });

    expect(onRemoveFinish).toHaveBeenCalledWith(true);
    jest.useRealTimers();
  });

  it('does not offer removal at the two-row minimum', async () => {
    await renderRow({ canRemove: false });

    expect(screen.queryByRole('button', { name: BASE_PROPS.removeLabel })).toBeNull();
  });
});

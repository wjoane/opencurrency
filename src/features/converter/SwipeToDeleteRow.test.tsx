/* eslint-disable @typescript-eslint/no-require-imports -- Jest mock factories run before imports. */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ThemeProvider } from '../../theme/ThemeContext';

import { DELETE_ANIMATION_DURATION } from './interactionConstants';
import { SwipeToDeleteRow, type SwipeToDeleteRowProps } from './SwipeToDeleteRow';

const mockCloseSwipeable = jest.fn();

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const React = require('react');
  const { View } = jest.requireActual('react-native');
  const { useSharedValue } = require('react-native-reanimated');

  function SwipeableMock(props: Record<string, unknown>) {
    const progress = useSharedValue(0);
    const translation = useSharedValue(0);
    const renderAction =
      (props.renderLeftActions as ((...values: unknown[]) => unknown) | undefined) ??
      (props.renderRightActions as ((...values: unknown[]) => unknown) | undefined);

    React.useImperativeHandle(props.ref, () => ({
      close: mockCloseSwipeable,
      openLeft: () => {},
      openRight: () => {},
      reset: () => {},
    }));

    return React.createElement(View, null, renderAction?.(progress, translation), props.children);
  }

  return {
    __esModule: true,
    default: SwipeableMock,
    SwipeDirection: { LEFT: 'left', RIGHT: 'right' },
  };
});

const BASE_PROPS: Omit<SwipeToDeleteRowProps, 'children'> = {
  canRemove: true,
  removal: { start: () => true, finish: () => {} },
  removeLabel: 'Remove Japanese Yen',
  layoutDirection: 'ltr',
};

function swipeRowTree(overrides: Partial<SwipeToDeleteRowProps> = {}) {
  return (
    <ThemeProvider initialPreference="light">
      <SwipeToDeleteRow {...BASE_PROPS} {...overrides}>
        <Text>row content</Text>
      </SwipeToDeleteRow>
    </ThemeProvider>
  );
}

async function renderSwipeRow(overrides: Partial<SwipeToDeleteRowProps> = {}) {
  return render(swipeRowTree(overrides));
}

async function finishDeleteAnimation() {
  await act(async () => {
    jest.advanceTimersByTime(DELETE_ANIMATION_DURATION);
  });
}

describe('SwipeToDeleteRow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockCloseSwipeable.mockClear();
  });
  afterEach(() => jest.useRealTimers());

  it('removes through the labelled reveal action once', async () => {
    const onRemoveFinish = jest.fn();

    await renderSwipeRow({ removal: { start: () => true, finish: onRemoveFinish } });
    const remove = screen.getByRole('button', { name: BASE_PROPS.removeLabel });

    await fireEvent.press(remove);
    await fireEvent.press(remove);
    await finishDeleteAnimation();

    expect(onRemoveFinish).toHaveBeenCalledTimes(1);
    expect(onRemoveFinish).toHaveBeenCalledWith(true);
  });

  it('does not animate a removal that cannot reserve a list slot', async () => {
    const onRemoveFinish = jest.fn();

    await renderSwipeRow({ removal: { start: () => false, finish: onRemoveFinish } });
    await fireEvent.press(screen.getByRole('button', { name: BASE_PROPS.removeLabel }));
    await finishDeleteAnimation();

    expect(onRemoveFinish).not.toHaveBeenCalled();
  });

  it('releases a reserved removal when the row unmounts during animation', async () => {
    const onRemoveFinish = jest.fn();

    await renderSwipeRow({ removal: { start: () => true, finish: onRemoveFinish } });
    await fireEvent.press(screen.getByRole('button', { name: BASE_PROPS.removeLabel }));
    await screen.unmount();

    expect(onRemoveFinish).toHaveBeenCalledWith(false);
  });

  it('keeps a reserved removal while lifecycle props change during animation', async () => {
    const firstFinish = jest.fn();
    const nextRemoval = { start: () => true, finish: jest.fn() };
    const view = await renderSwipeRow({ removal: { start: () => true, finish: firstFinish } });

    await fireEvent.press(screen.getByRole('button', { name: BASE_PROPS.removeLabel }));
    await view.rerender(swipeRowTree({ removal: nextRemoval }));

    expect(firstFinish).not.toHaveBeenCalled();
    expect(nextRemoval.finish).not.toHaveBeenCalled();

    await finishDeleteAnimation();

    expect(firstFinish).toHaveBeenCalledWith(true);
    expect(nextRemoval.finish).not.toHaveBeenCalled();
  });

  it('renders no reveal action when removal is disabled', async () => {
    await renderSwipeRow({ canRemove: false });

    expect(screen.queryByRole('button', { name: BASE_PROPS.removeLabel })).toBeNull();
    expect(screen.getByText('row content')).toBeOnTheScreen();
  });

  it('retains its labelled remove control in a right-to-left layout', async () => {
    await renderSwipeRow({ layoutDirection: 'rtl' });

    expect(screen.getByRole('button', { name: BASE_PROPS.removeLabel })).toBeOnTheScreen();
  });

  it('closes a revealed row when the layout direction flips', async () => {
    const view = await renderSwipeRow();

    mockCloseSwipeable.mockClear();
    await view.rerender(swipeRowTree({ layoutDirection: 'rtl' }));

    expect(mockCloseSwipeable).toHaveBeenCalledTimes(1);
  });

  it('leaves a row that is already being removed open while the direction flips', async () => {
    const onRemoveFinish = jest.fn();
    const view = await renderSwipeRow({ removal: { start: () => true, finish: onRemoveFinish } });

    await fireEvent.press(screen.getByRole('button', { name: BASE_PROPS.removeLabel }));
    mockCloseSwipeable.mockClear();
    await view.rerender(swipeRowTree({ layoutDirection: 'rtl' }));

    expect(mockCloseSwipeable).not.toHaveBeenCalled();

    await finishDeleteAnimation();

    expect(onRemoveFinish).toHaveBeenCalledWith(true);
  });
});

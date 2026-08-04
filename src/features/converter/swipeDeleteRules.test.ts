import { SwipeDirection } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { createSwipeDeleteController, shouldShowRtlAction } from './swipeDeleteRules';

describe('createSwipeDeleteController', () => {
  it('recognizes only a full swipe in the remove direction and consumes it', () => {
    const controller = createSwipeDeleteController();

    controller.setFullSwipeReached(true);
    expect(controller.shouldDeleteAfterSwipe(SwipeDirection.RIGHT, SwipeDirection.LEFT)).toBe(
      false,
    );

    controller.setFullSwipeReached(true);
    expect(controller.shouldDeleteAfterSwipe(SwipeDirection.LEFT, SwipeDirection.LEFT)).toBe(true);
    expect(controller.shouldDeleteAfterSwipe(SwipeDirection.LEFT, SwipeDirection.LEFT)).toBe(false);
  });

  it('starts at most one enabled deletion', () => {
    const controller = createSwipeDeleteController();

    expect(controller.beginDelete(false)).toBe(false);
    expect(controller.beginDelete(true)).toBe(true);
    expect(controller.beginDelete(true)).toBe(false);
  });

  it('allows a new deletion after the current lifecycle finishes', () => {
    const controller = createSwipeDeleteController();

    expect(controller.beginDelete(true)).toBe(true);
    controller.finishDelete();
    expect(controller.beginDelete(true)).toBe(true);
    controller.finishDelete();
    expect(controller.beginDelete(true)).toBe(true);
  });

  it('reports whether deletion has started', () => {
    const controller = createSwipeDeleteController();

    expect(controller.deletionStarted).toBe(false);
    controller.beginDelete(true);
    expect(controller.deletionStarted).toBe(true);
    controller.finishDelete();
    expect(controller.deletionStarted).toBe(false);
  });
});

describe('swipe delete decisions', () => {
  it('shows the RTL action only for the remove direction before deletion starts', () => {
    expect(shouldShowRtlAction('ltr', SwipeDirection.RIGHT, SwipeDirection.RIGHT, false)).toBe(
      false,
    );
    expect(shouldShowRtlAction('rtl', SwipeDirection.RIGHT, SwipeDirection.RIGHT, false)).toBe(
      true,
    );
    expect(shouldShowRtlAction('rtl', SwipeDirection.LEFT, SwipeDirection.RIGHT, false)).toBe(
      false,
    );
    expect(shouldShowRtlAction('rtl', SwipeDirection.RIGHT, SwipeDirection.RIGHT, true)).toBe(
      false,
    );
  });
});

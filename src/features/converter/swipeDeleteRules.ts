/** Defines the pure decisions used by swipe-to-delete gesture callbacks. */

import { SwipeDirection } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { type LayoutDirection } from '../../i18n/locales';

function fullSwipeRequestsDelete(
  fullSwipeReached: boolean,
  direction: SwipeDirection,
  removeDirection: SwipeDirection,
): boolean {
  return fullSwipeReached && direction === removeDirection;
}

export function shouldShowRtlAction(
  layoutDirection: LayoutDirection,
  direction: SwipeDirection,
  removeDirection: SwipeDirection,
  deletionStarted: boolean,
): boolean {
  return layoutDirection === 'rtl' && direction === removeDirection && !deletionStarted;
}

export interface SwipeDeleteController {
  readonly deletionStarted: boolean;
  readonly setFullSwipeReached: (reached: boolean) => void;
  readonly beginDelete: (allowed: boolean) => boolean;
  readonly finishDelete: () => void;
  readonly shouldDeleteAfterSwipe: (
    direction: SwipeDirection,
    removeDirection: SwipeDirection,
  ) => boolean;
}

export function createSwipeDeleteController(): SwipeDeleteController {
  let fullSwipeReached = false;
  let deletionStarted = false;

  return {
    get deletionStarted() {
      return deletionStarted;
    },
    setFullSwipeReached(reached) {
      fullSwipeReached = reached;
    },
    beginDelete(allowed) {
      if (!allowed || deletionStarted) {
        return false;
      }

      deletionStarted = true;
      fullSwipeReached = false;
      return true;
    },
    finishDelete() {
      deletionStarted = false;
    },
    shouldDeleteAfterSwipe(direction, removeDirection) {
      const shouldDelete = fullSwipeRequestsDelete(fullSwipeReached, direction, removeDirection);
      fullSwipeReached = false;
      return shouldDelete;
    },
  };
}

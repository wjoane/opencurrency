/** Keeps the platform writing direction aligned with the selected locale. */

import { I18nManager } from 'react-native';

import { type LayoutDirection } from './locales';

export interface DirectionEnvironment {
  readonly allowRTL: (allow: boolean) => void;
  readonly forceRTL: (force: boolean) => void;
  readonly isRTL: () => boolean;
}

function createPlatformEnvironment(): DirectionEnvironment {
  let committed: LayoutDirection | null = null;

  return {
    allowRTL: (allow) => I18nManager.allowRTL(allow),
    forceRTL: (force) => {
      I18nManager.forceRTL(force);
      committed = force ? 'rtl' : 'ltr';
    },
    isRTL: () => (committed === null ? I18nManager.isRTL : committed === 'rtl'),
  };
}

const platformDirection: DirectionEnvironment = createPlatformEnvironment();

function needsDirectionChange(
  direction: LayoutDirection,
  environment: DirectionEnvironment = platformDirection,
): boolean {
  return (direction === 'rtl') !== environment.isRTL();
}

export function reconcileDirection(
  direction: LayoutDirection,
  environment: DirectionEnvironment = platformDirection,
): void {
  if (!needsDirectionChange(direction, environment)) {
    return;
  }

  try {
    const rtl = direction === 'rtl';
    environment.allowRTL(rtl);
    environment.forceRTL(rtl);
  } catch {
    // Direction reconciliation is best-effort; the current platform direction remains usable.
  }
}

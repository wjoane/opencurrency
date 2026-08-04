/**
 * Carries a writing direction onto a single view.
 *
 * The two platforms take it through different channels: React Native lays out from the
 * `direction` style, while react-native-web rejects that style and reads the DOM `dir`
 * attribute instead. Both helpers are therefore needed on every view that mirrors, and
 * each is inert on the platform it does not serve.
 */

import { Platform, type ViewProps, type ViewStyle } from 'react-native';

import { type LayoutDirection } from '../i18n/locales';

/** Returns the `dir` attribute react-native-web mirrors from, and nothing on native. */
export function getDirectionProps(direction: LayoutDirection): ViewProps {
  return Platform.OS === 'web' ? ({ dir: direction } as ViewProps) : {};
}

/** Returns the layout style React Native mirrors from, and nothing on web. */
export function getDirectionStyle(direction: LayoutDirection): ViewStyle | undefined {
  return Platform.OS === 'web' ? undefined : { direction };
}

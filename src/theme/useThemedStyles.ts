/** Caches theme-dependent styles by their factory and stable theme-token object. */

import { useTheme } from './ThemeContext';
import { type ThemeTokens } from './tokens';

type StyleFactory<Styles extends object> = (theme: ThemeTokens) => Styles;

const stylesByFactory = new WeakMap<object, WeakMap<ThemeTokens, object>>();

/** Returns one shared stylesheet per factory and resolved theme. */
export function useThemedStyles<Styles extends object>(createStyles: StyleFactory<Styles>): Styles {
  const { theme } = useTheme();
  let stylesByTheme = stylesByFactory.get(createStyles);

  if (stylesByTheme === undefined) {
    stylesByTheme = new WeakMap();
    stylesByFactory.set(createStyles, stylesByTheme);
  }

  const cached = stylesByTheme.get(theme);

  if (cached !== undefined) {
    return cached as Styles;
  }

  const styles = createStyles(theme);
  stylesByTheme.set(theme, styles);

  return styles;
}

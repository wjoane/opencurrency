import { useMemo } from 'react';
/** Renders a currency flag or a generated currency badge. */

import { Image, StyleSheet, Text, View } from 'react-native';

import { type ThemeTokens } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';

import { FLAG_ASSETS } from './flagAssets';
import { METAL_ASSETS } from './metalAssets';

const ICON_SIZE = 36;

const BADGE_FONT_SIZES: readonly number[] = [15, 15, 14, 12, 10, 9];

function badgeFontSize(label: string): number {
  return BADGE_FONT_SIZES[Math.min(label.length, BADGE_FONT_SIZES.length - 1)];
}

const ASSETS_BY_COUNTRY: ReadonlyMap<string, number> = new Map(Object.entries(FLAG_ASSETS));

export const FLAG_IMAGE_TEST_ID = 'flag-image';
export const METAL_IMAGE_TEST_ID = 'metal-image';
export const CURRENCY_BADGE_TEST_ID = 'currency-badge';

export interface CurrencyIconProps {
  readonly currencyCode: string;

  readonly countryCode: string | null;

  readonly badgeLabel: string;
}

export function CurrencyIcon({ currencyCode, countryCode, badgeLabel }: CurrencyIconProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const asset = countryCode === null ? undefined : ASSETS_BY_COUNTRY.get(countryCode);
  const normalisedCurrencyCode = currencyCode.toLowerCase();
  const metalAsset = Object.hasOwn(METAL_ASSETS, normalisedCurrencyCode)
    ? METAL_ASSETS[normalisedCurrencyCode]
    : undefined;

  if (metalAsset !== undefined) {
    return (
      <Image
        testID={METAL_IMAGE_TEST_ID}
        source={metalAsset}
        style={styles.flag}
        resizeMode="cover"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }

  if (asset === undefined) {
    return (
      <View
        testID={CURRENCY_BADGE_TEST_ID}
        style={styles.badge}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text
          style={[styles.badgeLabel, { fontSize: badgeFontSize(badgeLabel) }]}
          numberOfLines={1}
        >
          {badgeLabel}
        </Text>
      </View>
    );
  }

  return (
    <Image
      testID={FLAG_IMAGE_TEST_ID}
      source={asset}
      style={styles.flag}
      resizeMode="cover"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

function createStyles(theme: ThemeTokens) {
  const circle = {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: theme.radii.pill,
  } as const;

  return StyleSheet.create({
    flag: circle,
    badge: {
      ...circle,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    badgeLabel: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
  });
}

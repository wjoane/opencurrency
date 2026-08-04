/** Renders a currency flag or a generated currency badge. */

import { Image, StyleSheet, Text, View } from 'react-native';

import { type ThemeTokens } from '../theme/tokens';
import { useThemedStyles } from '../theme/useThemedStyles';

import { resolveCurrencyIconAsset } from './currencyIconAsset';

const ICON_SIZE = 36;

const BADGE_FONT_SIZES: readonly number[] = [15, 15, 14, 12, 10, 9];

function badgeFontSize(label: string): number {
  return BADGE_FONT_SIZES[Math.min(label.length, BADGE_FONT_SIZES.length - 1)];
}

export interface CurrencyIconProps {
  readonly currencyCode: string;
  readonly countryCode: string | null;
  readonly badgeLabel: string;
}

export function CurrencyIcon({ currencyCode, countryCode, badgeLabel }: CurrencyIconProps) {
  const styles = useThemedStyles(createStyles);
  const imageAsset = resolveCurrencyIconAsset(currencyCode, countryCode);

  if (imageAsset === undefined) {
    return (
      <View
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
      source={imageAsset}
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

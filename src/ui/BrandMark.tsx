/** Renders the decorative OpenCurrency mark from its generated image asset. */

import { Image, View } from 'react-native';

const BRAND_MARK_SOURCE = require('../../assets/splash-icon.png');

export interface BrandMarkProps {
  readonly size: number;
}

export function BrandMark({ size }: BrandMarkProps) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image
        resizeMode="contain"
        source={BRAND_MARK_SOURCE}
        style={{ height: size, width: size }}
      />
    </View>
  );
}

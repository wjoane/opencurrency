/** Resolves the bundled image used by a currency icon. */

import { normaliseCurrencyCode } from '../domain/currencyCode';

import { FLAG_ASSETS } from './flagAssets';
import { METAL_ASSETS } from './metalAssets';

const ASSETS_BY_COUNTRY: ReadonlyMap<string, number> = new Map(Object.entries(FLAG_ASSETS));
const ASSETS_BY_METAL: ReadonlyMap<string, number> = new Map(Object.entries(METAL_ASSETS));

/** Returns the bundled image for a currency, or undefined when a badge is required. */
export function resolveCurrencyIconAsset(
  currencyCode: string,
  countryCode: string | null,
): number | undefined {
  return (
    ASSETS_BY_METAL.get(normaliseCurrencyCode(currencyCode)) ??
    (countryCode === null ? undefined : ASSETS_BY_COUNTRY.get(countryCode))
  );
}

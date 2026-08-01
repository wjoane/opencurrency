/** Provides the dated rate snapshot bundled for first-launch offline conversion. */

import { BUNDLED_RATES_DOCUMENT } from '../domain/appData';
import { parseRateSnapshot, type RateSnapshot } from './rateSchema';

function parseBundledRateSnapshot(): RateSnapshot {
  const result = parseRateSnapshot(JSON.stringify(BUNDLED_RATES_DOCUMENT));

  if (!result.ok) {
    throw new Error('The bundled rate snapshot is invalid.');
  }

  return result.snapshot;
}

export const BUNDLED_RATE_SNAPSHOT = parseBundledRateSnapshot();

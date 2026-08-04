/** Provides the dated rate snapshot bundled for first-launch offline conversion. */

import { BUNDLED_RATES_DOCUMENT } from '../domain/appData';
import { parseRateDocument, type RateSnapshot } from './rateSchema';

function parseBundledRateSnapshot(): RateSnapshot {
  const result = parseRateDocument(BUNDLED_RATES_DOCUMENT);

  /* istanbul ignore if -- catalogue tests validate the build-time generated document. */
  if (!result.ok) {
    throw new Error('The bundled rate snapshot is invalid.');
  }

  return result.snapshot;
}

export const BUNDLED_RATE_SNAPSHOT = parseBundledRateSnapshot();

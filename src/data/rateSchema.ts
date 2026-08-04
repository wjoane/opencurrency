/**
 * Validates and parses rate snapshots from storage and the provider.
 *
 * Malformed documents are returned as parse failures instead of throwing.
 */

import { REFERENCE_CURRENCY_CODE, type RateTable } from '../domain/conversion';
import { isPlainObject } from '../domain/json';

export interface RateSnapshot {
  /** The date reported by the provider. */
  readonly date: string;
  /** The currency used as the rate-table base. */
  readonly baseCurrencyCode: string;
  readonly rates: RateTable;
}

type RateSnapshotParseFailure = 'notJson' | 'malformed';

export type RateSnapshotParseResult =
  | { readonly ok: true; readonly snapshot: RateSnapshot }
  | { readonly ok: false; readonly reason: RateSnapshotParseFailure };

const RATE_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isRateDate(value: string): boolean {
  const match = RATE_DATE_PATTERN.exec(value);

  if (match === null) {
    return false;
  }

  const [, year, month, day] = match.map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function collectRates(source: Record<string, unknown>): RateTable {
  const rates: Record<string, number> = Object.create(null);

  for (const [code, value] of Object.entries(source)) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      rates[code] = value;
    }
  }

  return rates;
}

export function parseRateDocument(
  document: unknown,
  baseCurrencyCode: string = REFERENCE_CURRENCY_CODE,
): RateSnapshotParseResult {
  if (!isPlainObject(document)) {
    return { ok: false, reason: 'malformed' };
  }

  const { date } = document;

  if (typeof date !== 'string' || !isRateDate(date)) {
    return { ok: false, reason: 'malformed' };
  }

  const rateMap = document[baseCurrencyCode];

  if (!isPlainObject(rateMap)) {
    return { ok: false, reason: 'malformed' };
  }

  const rates = collectRates(rateMap);

  if (Object.keys(rates).length === 0) {
    return { ok: false, reason: 'malformed' };
  }

  return { ok: true, snapshot: { date, baseCurrencyCode, rates } };
}

export function parseRateSnapshot(
  body: string,
  baseCurrencyCode: string = REFERENCE_CURRENCY_CODE,
): RateSnapshotParseResult {
  try {
    return parseRateDocument(JSON.parse(body), baseCurrencyCode);
  } catch {
    return { ok: false, reason: 'notJson' };
  }
}

export function parseStoredSnapshot(raw: string): RateSnapshot | null {
  let document: unknown;

  try {
    document = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isPlainObject(document)) {
    return null;
  }

  const { date, baseCurrencyCode, rates: rateMap } = document;

  if (typeof date !== 'string' || !isRateDate(date)) {
    return null;
  }

  if (typeof baseCurrencyCode !== 'string' || !isPlainObject(rateMap)) {
    return null;
  }

  const rates = collectRates(rateMap);

  return Object.keys(rates).length === 0 ? null : { date, baseCurrencyCode, rates };
}

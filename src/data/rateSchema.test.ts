import { isRateDate, parseRateSnapshot } from './rateSchema';

const JSDELIVR_NOT_FOUND_BODY = "Couldn't find the requested release version 2024-03-01.";
const PAGES_NOT_FOUND_BODY = '<!DOCTYPE html>\n<html lang="en-US" class="min-height-100vh">';

const VALID_BODY = JSON.stringify({
  date: '2026-07-27',
  eur: { eur: 1, usd: 1.1697, jpy: 173.24 },
});

describe('isRateDate', () => {
  it('accepts a real calendar date', () => {
    expect(isRateDate('2024-03-02')).toBe(true);
    expect(isRateDate('2024-02-29')).toBe(true);
  });

  it('rejects a date that matches the pattern but is not a day', () => {
    expect(isRateDate('2026-02-31')).toBe(false);
    expect(isRateDate('2026-13-01')).toBe(false);
    expect(isRateDate('2025-02-29')).toBe(false);
  });

  it('rejects anything that is not YYYY-MM-DD', () => {
    expect(isRateDate('latest')).toBe(false);
    expect(isRateDate('2026-7-27')).toBe(false);
    expect(isRateDate('')).toBe(false);
  });
});

describe('parseRateSnapshot', () => {
  it('reads the date and the rate map nested under the base code', () => {
    const result = parseRateSnapshot(VALID_BODY, 'eur');

    expect(result).toEqual({
      ok: true,
      snapshot: {
        date: '2026-07-27',
        baseCurrencyCode: 'eur',
        rates: { eur: 1, usd: 1.1697, jpy: 173.24 },
      },
    });
  });

  it('defaults to the reference currency the app actually requests', () => {
    const result = parseRateSnapshot(VALID_BODY);

    expect(result.ok).toBe(true);
  });

  it("reports jsDelivr's plain-text 404 body as notJson rather than throwing", () => {
    expect(parseRateSnapshot(JSDELIVR_NOT_FOUND_BODY)).toEqual({ ok: false, reason: 'notJson' });
  });

  it("reports the fallback host's HTML 404 body as notJson rather than throwing", () => {
    expect(parseRateSnapshot(PAGES_NOT_FOUND_BODY)).toEqual({ ok: false, reason: 'notJson' });
  });

  it('rejects a body with no date', () => {
    expect(parseRateSnapshot(JSON.stringify({ eur: { usd: 1.17 } }))).toEqual({
      ok: false,
      reason: 'malformed',
    });
  });

  it('rejects a date that is not a calendar day', () => {
    expect(parseRateSnapshot(JSON.stringify({ date: '2026-02-31', eur: { usd: 1.17 } }))).toEqual({
      ok: false,
      reason: 'malformed',
    });
  });

  it('rejects a body whose rate map is missing or not an object', () => {
    expect(parseRateSnapshot(JSON.stringify({ date: '2026-07-27' }))).toEqual({
      ok: false,
      reason: 'malformed',
    });
    expect(parseRateSnapshot(JSON.stringify({ date: '2026-07-27', eur: [1, 2] }))).toEqual({
      ok: false,
      reason: 'malformed',
    });
  });

  it('rejects a JSON body that is not an object at all', () => {
    expect(parseRateSnapshot('[]')).toEqual({ ok: false, reason: 'malformed' });
    expect(parseRateSnapshot('"2026-07-27"')).toEqual({ ok: false, reason: 'malformed' });
  });

  it('drops a rate that is a string and keeps the rest', () => {
    const result = parseRateSnapshot(
      JSON.stringify({ date: '2026-07-27', eur: { usd: '1.17', jpy: 173.24 } }),
    );

    expect(result).toEqual({
      ok: true,
      snapshot: { date: '2026-07-27', baseCurrencyCode: 'eur', rates: { jpy: 173.24 } },
    });
  });

  it('drops a rate that is null, infinite or not positive', () => {
    const result = parseRateSnapshot(
      '{"date":"2026-07-27","eur":{"aaa":null,"bbb":1e999,"ccc":0,"ddd":-1,"usd":1.17}}',
    );

    expect(result).toEqual({
      ok: true,
      snapshot: { date: '2026-07-27', baseCurrencyCode: 'eur', rates: { usd: 1.17 } },
    });
  });

  it('rejects a rate map with no usable entry left', () => {
    expect(parseRateSnapshot(JSON.stringify({ date: '2026-07-27', eur: { usd: null } }))).toEqual({
      ok: false,
      reason: 'malformed',
    });
  });

  it('does not resolve an inherited property as a rate', () => {
    const result = parseRateSnapshot(
      '{"date":"2026-07-27","eur":{"usd":1.17,"__proto__":{"jpy":173.24}}}',
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(Object.getPrototypeOf(result.snapshot.rates)).toBeNull();
      expect(result.snapshot.rates.jpy).toBeUndefined();
      expect(result.snapshot.rates.usd).toBe(1.17);
    }
  });
});

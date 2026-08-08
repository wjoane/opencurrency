import {
  clampRateDate,
  EARLIEST_RATE_DATE,
  isSelectableRateDate,
  toRateDate,
  toUtcDate,
} from './dateBounds';

describe('toUtcDate and toRateDate', () => {
  it('round-trips a rate date without shifting the day', () => {
    expect(toRateDate(toUtcDate('2024-03-02'))).toBe('2024-03-02');
    expect(toRateDate(toUtcDate('2026-01-01'))).toBe('2026-01-01');
  });

  it('parses at UTC midnight, so no local offset can move it', () => {
    expect(toUtcDate('2024-03-02').toISOString()).toBe('2024-03-02T00:00:00.000Z');
  });
});

describe('clampRateDate', () => {
  const LATEST = '2026-07-28';

  it('leaves a date inside the range alone', () => {
    expect(clampRateDate('2025-01-15', LATEST)).toBe('2025-01-15');
  });

  it('refuses the day before the provider’s first publication', () => {
    expect(clampRateDate('2024-03-01', LATEST)).toBe(EARLIEST_RATE_DATE);
    expect(clampRateDate('1999-12-31', LATEST)).toBe(EARLIEST_RATE_DATE);
  });

  it('accepts the first published day itself', () => {
    expect(clampRateDate(EARLIEST_RATE_DATE, LATEST)).toBe(EARLIEST_RATE_DATE);
  });

  it('refuses the day after the latest published one, and accepts that day', () => {
    expect(clampRateDate('2026-07-29', LATEST)).toBe(LATEST);
    expect(clampRateDate('2027-01-01', LATEST)).toBe(LATEST);
    expect(clampRateDate(LATEST, LATEST)).toBe(LATEST);
  });

  it('compares across year and month boundaries, not just within one', () => {
    expect(clampRateDate('2024-09-30', LATEST)).toBe('2024-09-30');
    expect(clampRateDate('2026-12-31', LATEST)).toBe(LATEST);
  });
});

describe('isSelectableRateDate', () => {
  const LATEST = '2026-07-28';

  it('accepts the range the provider publishes, inclusive at both ends', () => {
    expect(isSelectableRateDate(EARLIEST_RATE_DATE, LATEST)).toBe(true);
    expect(isSelectableRateDate('2025-06-01', LATEST)).toBe(true);
    expect(isSelectableRateDate(LATEST, LATEST)).toBe(true);
  });

  it('rejects the day before the first publication, and the day after the latest one', () => {
    expect(isSelectableRateDate('2024-03-01', LATEST)).toBe(false);
    expect(isSelectableRateDate('2026-07-29', LATEST)).toBe(false);
  });

  it('rejects the partial years a date input streams while one is typed', () => {
    expect(isSelectableRateDate('0002-06-01', LATEST)).toBe(false);
    expect(isSelectableRateDate('0202-06-01', LATEST)).toBe(false);
  });
});

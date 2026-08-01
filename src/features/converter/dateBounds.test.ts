import {
  clampRateDate,
  currentRateDate,
  EARLIEST_RATE_DATE,
  isSelectableRateDate,
  latestSelectableRateDate,
  toRateDate,
  toUtcDate,
} from './dateBounds';

describe('currentRateDate', () => {
  it('reports the UTC day, not the device’s local one', () => {
    expect(currentRateDate(new Date('2026-07-29T11:30:00.000+13:00'))).toBe('2026-07-28');
  });

  it('does not roll back a day west of UTC either', () => {
    expect(currentRateDate(new Date('2026-07-28T20:00:00.000-05:00'))).toBe('2026-07-29');
  });
});

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
  const TODAY = '2026-07-28';

  it('leaves a date inside the range alone', () => {
    expect(clampRateDate('2025-01-15', TODAY)).toBe('2025-01-15');
  });

  it('refuses the day before the provider’s first publication', () => {
    expect(clampRateDate('2024-03-01', TODAY)).toBe(EARLIEST_RATE_DATE);
    expect(clampRateDate('1999-12-31', TODAY)).toBe(EARLIEST_RATE_DATE);
  });

  it('accepts the first published day itself', () => {
    expect(clampRateDate(EARLIEST_RATE_DATE, TODAY)).toBe(EARLIEST_RATE_DATE);
  });

  it('refuses tomorrow, and accepts today', () => {
    expect(clampRateDate('2026-07-29', TODAY)).toBe(TODAY);
    expect(clampRateDate('2027-01-01', TODAY)).toBe(TODAY);
    expect(clampRateDate(TODAY, TODAY)).toBe(TODAY);
  });

  it('compares across year and month boundaries, not just within one', () => {
    expect(clampRateDate('2024-09-30', TODAY)).toBe('2024-09-30');
    expect(clampRateDate('2026-12-31', TODAY)).toBe(TODAY);
  });
});

describe('latestSelectableRateDate', () => {
  it('is today when the clock is right', () => {
    expect(latestSelectableRateDate('2026-07-28', '2025-06-01')).toBe('2026-07-28');
  });

  it('includes the day on screen when the clock runs slow', () => {
    expect(latestSelectableRateDate('2026-07-27', '2026-07-28')).toBe('2026-07-28');
  });

  it('never falls below the provider’s first publication', () => {
    expect(latestSelectableRateDate('2019-01-01', '2019-01-01')).toBe(EARLIEST_RATE_DATE);
    expect(isSelectableRateDate(EARLIEST_RATE_DATE, EARLIEST_RATE_DATE)).toBe(true);
  });

  it('is at least the day on screen and at least today, whichever leads', () => {
    expect(latestSelectableRateDate('2026-07-28', '2027-01-01')).toBe('2027-01-01');
    expect(latestSelectableRateDate('2027-01-01', '2026-07-28')).toBe('2027-01-01');
  });
});

describe('isSelectableRateDate', () => {
  const TODAY = '2026-07-28';

  it('accepts the range the provider publishes, inclusive at both ends', () => {
    expect(isSelectableRateDate(EARLIEST_RATE_DATE, TODAY)).toBe(true);
    expect(isSelectableRateDate('2025-06-01', TODAY)).toBe(true);
    expect(isSelectableRateDate(TODAY, TODAY)).toBe(true);
  });

  it('rejects the day before the first publication, and tomorrow', () => {
    expect(isSelectableRateDate('2024-03-01', TODAY)).toBe(false);
    expect(isSelectableRateDate('2026-07-29', TODAY)).toBe(false);
  });

  it('rejects the partial years a date input streams while one is typed', () => {
    expect(isSelectableRateDate('0002-06-01', TODAY)).toBe(false);
    expect(isSelectableRateDate('0202-06-01', TODAY)).toBe(false);
  });
});

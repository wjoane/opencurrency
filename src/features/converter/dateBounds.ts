/** Defines the earliest selectable rate date. */
export const EARLIEST_RATE_DATE = '2024-03-02';

const RATE_DATE_LENGTH = 'YYYY-MM-DD'.length;

export function currentRateDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, RATE_DATE_LENGTH);
}

export function toUtcDate(rateDate: string): Date {
  return new Date(`${rateDate}T00:00:00.000Z`);
}

export function toRateDate(date: Date): string {
  return date.toISOString().slice(0, RATE_DATE_LENGTH);
}

export function latestSelectableRateDate(today: string, shownRateDate: string): string {
  return shownRateDate > today ? shownRateDate : today;
}

export function isSelectableRateDate(rateDate: string, today: string = currentRateDate()): boolean {
  return rateDate >= EARLIEST_RATE_DATE && rateDate <= today;
}

export function clampRateDate(rateDate: string, today: string = currentRateDate()): string {
  if (rateDate < EARLIEST_RATE_DATE) {
    return EARLIEST_RATE_DATE;
  }

  return rateDate > today ? today : rateDate;
}

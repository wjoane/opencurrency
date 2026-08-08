/** Defines the earliest selectable rate date. */
export const EARLIEST_RATE_DATE = '2024-03-02';

const RATE_DATE_LENGTH = 'YYYY-MM-DD'.length;

export function toUtcDate(rateDate: string): Date {
  return new Date(`${rateDate}T00:00:00.000Z`);
}

export function toRateDate(date: Date): string {
  return date.toISOString().slice(0, RATE_DATE_LENGTH);
}

export function isSelectableRateDate(rateDate: string, maximumDate: string): boolean {
  return rateDate >= EARLIEST_RATE_DATE && rateDate <= maximumDate;
}

export function clampRateDate(rateDate: string, maximumDate: string): string {
  if (rateDate < EARLIEST_RATE_DATE) {
    return EARLIEST_RATE_DATE;
  }

  return rateDate > maximumDate ? maximumDate : rateDate;
}

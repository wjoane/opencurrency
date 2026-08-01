const SUBTAG_SEPARATOR = '-';

export function baseLocaleTag(locale: string): string {
  const subtags = locale.split(SUBTAG_SEPARATOR).filter(Boolean);
  const singletonIndex = subtags.findIndex((subtag) => subtag.length === 1);

  return (singletonIndex === -1 ? subtags : subtags.slice(0, singletonIndex)).join(
    SUBTAG_SEPARATOR,
  );
}

export function lookupByLocaleTag<T>(
  table: Readonly<Record<string, T>>,
  locale: string,
): T | undefined {
  const index = new Map<string, T>(
    Object.entries(table).map(([key, value]) => [key.toLowerCase(), value]),
  );
  const subtags = baseLocaleTag(locale).toLowerCase().split(SUBTAG_SEPARATOR).filter(Boolean);

  for (let length = subtags.length; length > 0; length -= 1) {
    const match = index.get(subtags.slice(0, length).join(SUBTAG_SEPARATOR));
    if (match !== undefined) {
      return match;
    }
  }

  return undefined;
}
/** Matches locale tags to the supported locale tables. */

/** Matches locale tags to supported locale tables and caches their indexes. */

const SUBTAG_SEPARATOR = '-';
const indexesByTable = new WeakMap<object, ReadonlyMap<string, unknown>>();

function indexFor<T>(table: Readonly<Record<string, T>>): ReadonlyMap<string, T> {
  const cached = indexesByTable.get(table);
  if (cached !== undefined) {
    return cached as ReadonlyMap<string, T>;
  }

  const index = new Map(
    Object.entries(table).map(([key, value]) => [key.toLowerCase(), value] as const),
  );
  indexesByTable.set(table, index);

  return index;
}

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
  const index = indexFor(table);
  const subtags = baseLocaleTag(locale).toLowerCase().split(SUBTAG_SEPARATOR).filter(Boolean);

  for (let length = subtags.length; length > 0; length -= 1) {
    const match = index.get(subtags.slice(0, length).join(SUBTAG_SEPARATOR));
    if (match !== undefined) {
      return match;
    }
  }

  return undefined;
}

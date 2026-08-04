import en from './catalogues/en.json';
import { SUPPORTED_LOCALES } from './index';
import { getEndonym, getLayoutDirection } from './locales';

declare const __dirname: string;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readdirSync } = require('node:fs') as {
  readdirSync: (path: string) => readonly string[];
};

const KEYS = Object.keys(en) as (keyof typeof en)[];

const CATALOGUE_DIRECTORY = `${__dirname}/catalogues`;

const EXPECTED_TAGS = [
  'ar',
  'cs',
  'da',
  'de',
  'el',
  'en',
  'es',
  'fa',
  'fi',
  'fr',
  'he',
  'hi',
  'id',
  'it',
  'ja',
  'ko',
  'nl',
  'pl',
  'pt-BR',
  'ru',
  'sv',
  'th',
  'tr',
  'uk',
  'vi',
  'zh-Hans',
  'zh-Hant',
];

const RTL_TAGS = ['ar', 'he', 'fa'];

function placeholdersIn(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

describe('the catalogue set', () => {
  it('ships every locale the plan enumerates, and no others', () => {
    expect([...SUPPORTED_LOCALES].sort()).toEqual([...EXPECTED_TAGS].sort());
  });

  it('registers every catalogue file that exists on disk', () => {
    const onDisk = readdirSync(CATALOGUE_DIRECTORY)
      .filter((entry: string) => entry.endsWith('.json'))
      .map((entry: string) => entry.replace(/\.json$/, ''));

    expect(onDisk.sort()).toEqual([...EXPECTED_TAGS].sort());
  });

  it('names each language in its own script', () => {
    for (const tag of EXPECTED_TAGS) {
      expect(getEndonym(tag)).not.toBe(tag);
    }

    expect(getEndonym('de')).toBe('Deutsch');
    expect(getEndonym('ar')).toBe('العربية');
  });

  it('falls back to the tag for a language it cannot name', () => {
    expect(getEndonym('kl')).toBe('kl');
  });

  it('marks exactly the three right-to-left languages', () => {
    const rtl = EXPECTED_TAGS.filter((tag) => getLayoutDirection(tag) === 'rtl');

    expect(rtl.sort()).toEqual([...RTL_TAGS].sort());
  });

  it('reports left-to-right for a locale it does not know', () => {
    expect(getLayoutDirection('kl')).toBe('ltr');
  });
});

describe.each(EXPECTED_TAGS)('the %s catalogue', (locale) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const catalogue = require(`./catalogues/${locale}.json`) as Record<string, string>;

  it('carries every key the English catalogue declares, and no extras', () => {
    expect(Object.keys(catalogue).sort()).toEqual([...KEYS].sort());
  });

  it('keeps every placeholder the English string declares', () => {
    for (const key of KEYS) {
      expect({ key, placeholders: placeholdersIn(catalogue[key]) }).toEqual({
        key,
        placeholders: placeholdersIn(en[key]),
      });
    }
  });

  it('leaves no string empty', () => {
    for (const key of KEYS) {
      expect(catalogue[key].trim()).not.toBe('');
    }
  });

  it('keeps external destinations out of translated link labels', () => {
    expect(catalogue['settings.about.github']).not.toContain('https://');
    expect(catalogue['settings.about.buymeacoffee']).not.toContain('https://');
  });
});

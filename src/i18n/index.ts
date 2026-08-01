/** Defines the typed translation interface and catalogue lookup helpers. */

import { lookupByLocaleTag } from '../domain/localeTags';

import ar from './catalogues/ar.json';
import cs from './catalogues/cs.json';
import da from './catalogues/da.json';
import de from './catalogues/de.json';
import el from './catalogues/el.json';
import en from './catalogues/en.json';
import es from './catalogues/es.json';
import fa from './catalogues/fa.json';
import fi from './catalogues/fi.json';
import fr from './catalogues/fr.json';
import he from './catalogues/he.json';
import hi from './catalogues/hi.json';
import id from './catalogues/id.json';
import it from './catalogues/it.json';
import ja from './catalogues/ja.json';
import ko from './catalogues/ko.json';
import nl from './catalogues/nl.json';
import pl from './catalogues/pl.json';
import ptBR from './catalogues/pt-BR.json';
import ru from './catalogues/ru.json';
import sv from './catalogues/sv.json';
import th from './catalogues/th.json';
import tr from './catalogues/tr.json';
import uk from './catalogues/uk.json';
import vi from './catalogues/vi.json';
import zhHans from './catalogues/zh-Hans.json';
import zhHant from './catalogues/zh-Hant.json';

export type TranslationKey = keyof typeof en;

export type Catalogue = Readonly<Partial<Record<TranslationKey, string>>>;

type TranslationValues = Readonly<Record<string, string | number>>;

export const FALLBACK_LOCALE = 'en';

const CATALOGUES: Readonly<Record<string, Catalogue>> = {
  ar,
  cs,
  da,
  de,
  el,
  en,
  es,
  fa,
  fi,
  fr,
  he,
  hi,
  id,
  it,
  ja,
  ko,
  nl,
  pl,
  'pt-BR': ptBR,
  ru,
  sv,
  th,
  tr,
  uk,
  vi,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
};

export const SUPPORTED_LOCALES: readonly string[] = Object.keys(CATALOGUES).sort();

const LOCALE_TAGS_BY_KEY: Readonly<Record<string, string>> = Object.fromEntries(
  SUPPORTED_LOCALES.map((tag) => [tag, tag]),
);

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

export function resolveLocale(preferredLocales: readonly string[]): string {
  for (const candidate of preferredLocales) {
    const match = lookupByLocaleTag(LOCALE_TAGS_BY_KEY, candidate);
    if (match !== undefined) {
      return match;
    }
  }

  return FALLBACK_LOCALE;
}

function interpolate(template: string, values: TranslationValues | undefined): string {
  if (values === undefined) {
    return template;
  }

  return template.replace(PLACEHOLDER_PATTERN, (marker, name: string) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) {
      return marker;
    }

    const value = values[name];

    return value === undefined ? marker : String(value);
  });
}

export type Translate = (key: TranslationKey, values?: TranslationValues) => string;

export function createTranslator(
  locale: string,
  catalogues: Readonly<Record<string, Catalogue>> = CATALOGUES,
): Translate {
  const catalogue = lookupByLocaleTag(catalogues, locale) ?? en;

  return (key, values) => interpolate(catalogue[key] ?? en[key], values);
}

/** Lists supported locales and their writing directions. */

export type LayoutDirection = 'ltr' | 'rtl';

interface LocaleDescriptor {
  readonly tag: string;

  readonly endonym: string;
  readonly direction: LayoutDirection;
}

const LOCALES: readonly LocaleDescriptor[] = [
  { tag: 'ar', endonym: 'العربية', direction: 'rtl' },
  { tag: 'cs', endonym: 'Čeština', direction: 'ltr' },
  { tag: 'da', endonym: 'Dansk', direction: 'ltr' },
  { tag: 'de', endonym: 'Deutsch', direction: 'ltr' },
  { tag: 'el', endonym: 'Ελληνικά', direction: 'ltr' },
  { tag: 'en', endonym: 'English', direction: 'ltr' },
  { tag: 'es', endonym: 'Español', direction: 'ltr' },
  { tag: 'fa', endonym: 'فارسی', direction: 'rtl' },
  { tag: 'fi', endonym: 'Suomi', direction: 'ltr' },
  { tag: 'fr', endonym: 'Français', direction: 'ltr' },
  { tag: 'he', endonym: 'עברית', direction: 'rtl' },
  { tag: 'hi', endonym: 'हिन्दी', direction: 'ltr' },
  { tag: 'id', endonym: 'Bahasa Indonesia', direction: 'ltr' },
  { tag: 'it', endonym: 'Italiano', direction: 'ltr' },
  { tag: 'ja', endonym: '日本語', direction: 'ltr' },
  { tag: 'ko', endonym: '한국어', direction: 'ltr' },
  { tag: 'nl', endonym: 'Nederlands', direction: 'ltr' },
  { tag: 'pl', endonym: 'Polski', direction: 'ltr' },
  { tag: 'pt-BR', endonym: 'Português (Brasil)', direction: 'ltr' },
  { tag: 'ru', endonym: 'Русский', direction: 'ltr' },
  { tag: 'sv', endonym: 'Svenska', direction: 'ltr' },
  { tag: 'th', endonym: 'ไทย', direction: 'ltr' },
  { tag: 'tr', endonym: 'Türkçe', direction: 'ltr' },
  { tag: 'uk', endonym: 'Українська', direction: 'ltr' },
  { tag: 'vi', endonym: 'Tiếng Việt', direction: 'ltr' },
  { tag: 'zh-Hans', endonym: '简体中文', direction: 'ltr' },
  { tag: 'zh-Hant', endonym: '繁體中文', direction: 'ltr' },
];

const DESCRIPTORS_BY_TAG: ReadonlyMap<string, LocaleDescriptor> = new Map(
  LOCALES.map((locale) => [locale.tag, locale]),
);

export function getLayoutDirection(tag: string): LayoutDirection {
  return DESCRIPTORS_BY_TAG.get(tag)?.direction ?? 'ltr';
}

export function getEndonym(tag: string): string {
  return DESCRIPTORS_BY_TAG.get(tag)?.endonym ?? tag;
}

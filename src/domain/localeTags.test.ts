import { baseLocaleTag, lookupByLocaleTag } from './localeTags';

describe('baseLocaleTag', () => {
  it('leaves a plain language tag untouched', () => {
    expect(baseLocaleTag('de')).toBe('de');
    expect(baseLocaleTag('pt-BR')).toBe('pt-BR');
    expect(baseLocaleTag('zh-Hans-CN')).toBe('zh-Hans-CN');
  });

  it('drops Unicode extension sequences', () => {
    expect(baseLocaleTag('ar-EG-u-nu-arab')).toBe('ar-EG');
    expect(baseLocaleTag('de-DE-u-co-phonebk')).toBe('de-DE');
    expect(baseLocaleTag('en-x-private')).toBe('en');
  });

  it('tolerates empty and malformed input', () => {
    expect(baseLocaleTag('')).toBe('');
    expect(baseLocaleTag('--')).toBe('');
    expect(baseLocaleTag('u-nu-latn')).toBe('');
  });
});

describe('lookupByLocaleTag', () => {
  const table = { en: 'english', 'pt-BR': 'brazilian', 'zh-Hans': 'simplified' };

  it('matches an exact tag', () => {
    expect(lookupByLocaleTag(table, 'pt-BR')).toBe('brazilian');
  });

  it('falls back to a shorter tag', () => {
    expect(lookupByLocaleTag(table, 'en-GB')).toBe('english');
    expect(lookupByLocaleTag(table, 'zh-Hans-CN')).toBe('simplified');
  });

  it('ignores tag casing', () => {
    expect(lookupByLocaleTag(table, 'pt-br')).toBe('brazilian');
    expect(lookupByLocaleTag(table, 'ZH-HANS')).toBe('simplified');
  });

  it('ignores extension sequences', () => {
    expect(lookupByLocaleTag(table, 'pt-BR-u-nu-latn')).toBe('brazilian');
  });

  it('returns undefined when nothing matches', () => {
    expect(lookupByLocaleTag(table, 'pt-PT')).toBeUndefined();
    expect(lookupByLocaleTag(table, 'fr')).toBeUndefined();
    expect(lookupByLocaleTag(table, '')).toBeUndefined();
  });
});

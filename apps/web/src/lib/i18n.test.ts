import { describe, expect, it } from 'vitest';
import { getDictionary, localizePath, stripLocale } from './i18n';
describe('public language navigation', () => {
  it('keeps product identity, search, filters and section while changing language', () => {
    expect(localizePath('/en/produtos/consul-cwh13ab?variante=exact#experiencias', 'es')).toBe(
      '/es/produtos/consul-cwh13ab?variante=exact#experiencias',
    );
    expect(localizePath('/es/produtos?q=CWH13AB&brand=Consul&capacity=medium', 'pt')).toBe(
      '/produtos?q=CWH13AB&brand=Consul&capacity=medium',
    );
    expect(localizePath('/produtos?category=refrigerator&brand=Consul#resultados', 'en')).toBe(
      '/en/produtos?category=refrigerator&brand=Consul#resultados',
    );
    expect(localizePath('/pt', 'pt')).toBe('/');
    expect(localizePath('/', 'en')).toBe('/en');
    expect(stripLocale('/enigma')).toBe('/enigma');
  });
  it('provides equivalent translation coverage with matching substitution variables', async () => {
    function flatten(value: unknown, prefix = ''): Record<string, string> {
      if (typeof value === 'string') return { [prefix]: value };
      return Object.fromEntries(
        Object.entries(value as object).flatMap(([key, item]) => Object.entries(flatten(item, `${prefix}.${key}`))),
      );
    }
    const dictionaries = await Promise.all(
      ['pt', 'en', 'es'].map((locale) => getDictionary(locale as 'pt' | 'en' | 'es').then((d) => flatten(d))),
    );
    const base = dictionaries[0]!;
    for (const dictionary of dictionaries) {
      expect(Object.keys(dictionary).sort()).toEqual(Object.keys(base).sort());
      for (const [key, value] of Object.entries(dictionary)) {
        expect(value.trim(), key).not.toBe('');
        expect(value.match(/\{\w+\}/g) ?? [], key).toEqual(base[key]!.match(/\{\w+\}/g) ?? []);
      }
    }
  });
});

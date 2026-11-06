import { describe, expect, it } from 'vitest';
import { productCategories } from '@duraverso/core';
import { locales } from './i18n';
import { categoryLabel, formatProductMeasure, productMeasureLabel } from './product-presentation';

describe('product presentation by category', () => {
  it('preserves legacy washing capacities and formats each new category in its own unit', () => {
    expect(formatProductMeasure({ capacityKg: 8.5 }, 'pt')).toBe('8,5 kg');
    expect(formatProductMeasure({ category: 'refrigerator', capacityLiters: 375 }, 'en')).toBe('375 L');
    expect(formatProductMeasure({ category: 'microwave', capacityLiters: 32 }, 'es')).toBe('32 L');
    expect(formatProductMeasure({ category: 'stove', burnerCount: 4 }, 'pt')).toBe('4 bocas');
    expect(formatProductMeasure({ category: 'stove', burnerCount: 5 }, 'en')).toBe('5 burners');
    expect(formatProductMeasure({ category: 'stove', burnerCount: 4 }, 'es')).toBe('4 quemadores');
    expect(productMeasureLabel({ category: 'stove' }, 'pt')).toBe('Queimadores');
  });
  it('does not turn missing dimensions or unrelated units into product claims', () => {
    expect(formatProductMeasure({ category: 'refrigerator', capacityKg: 13 }, 'pt')).toBe('A confirmar');
    expect(formatProductMeasure({ category: 'stove', capacityLiters: 80 }, 'en')).toBe('To be confirmed');
    expect(formatProductMeasure({ category: 'microwave' }, 'es')).toBe('Por confirmar');
  });
  it('names every supported category in every interface language', () => {
    for (const locale of locales) {
      const labels = productCategories.map((category) => categoryLabel(category, locale));
      expect(labels.every((label) => label.length > 0)).toBe(true);
      expect(new Set(labels).size).toBe(productCategories.length);
    }
  });
});

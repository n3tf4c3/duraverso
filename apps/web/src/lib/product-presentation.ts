import { productCategory, type ProductCategory } from '@duraverso/core';
import { formatKg, localeMeta, type Locale } from './i18n';

const labels: Record<Locale, Record<ProductCategory, string>> = {
  pt: { washing_machine: 'Lavadora de roupas', refrigerator: 'Geladeira', microwave: 'Micro-ondas', stove: 'Fogão' },
  en: { washing_machine: 'Washing machine', refrigerator: 'Refrigerator', microwave: 'Microwave', stove: 'Stove' },
  es: { washing_machine: 'Lavadora', refrigerator: 'Refrigerador', microwave: 'Microondas', stove: 'Cocina' },
};

type ProductMeasures = { category?: ProductCategory; capacityKg?: number | null; capacityLiters?: number | null; burnerCount?: number | null };

export function categoryLabel(category: ProductCategory, locale: Locale) { return labels[locale][category]; }
export function formatProductMeasure(product: ProductMeasures, locale: Locale) {
  const category = productCategory(product);
  const number = (value: number) => new Intl.NumberFormat(localeMeta[locale].tag, { maximumFractionDigits: 1 }).format(value);
  if (category === 'washing_machine' && product.capacityKg != null) return formatKg(product.capacityKg, locale);
  if ((category === 'refrigerator' || category === 'microwave') && product.capacityLiters != null) return `${number(product.capacityLiters)} L`;
  if (category === 'stove' && product.burnerCount != null) return `${number(product.burnerCount)} ${locale === 'pt' ? 'bocas' : locale === 'en' ? 'burners' : 'quemadores'}`;
  return locale === 'pt' ? 'A confirmar' : locale === 'en' ? 'To be confirmed' : 'Por confirmar';
}

export function productMeasureLabel(product: ProductMeasures, locale: Locale) {
  if (productCategory(product) === 'stove') return locale === 'pt' ? 'Queimadores' : locale === 'en' ? 'Burners' : 'Quemadores';
  return locale === 'pt' ? 'Capacidade nominal' : locale === 'en' ? 'Rated capacity' : 'Capacidad nominal';
}

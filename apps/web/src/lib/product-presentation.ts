import { productMeasurementField, type ProductCategory } from '@duraverso/core';
import { formatKg, localeMeta, type Locale } from './i18n';

const labels: Record<Locale, Record<ProductCategory, string>> = {
  pt: { washing_machine: 'Lavadora de roupas', refrigerator: 'Geladeira', microwave: 'Micro-ondas', stove: 'Fogão', freezer: 'Freezer', oven: 'Forno', cooktop: 'Cooktop', dishwasher: 'Lava-louças', air_fryer: 'Air fryer', blender: 'Liquidificador', vacuum_cleaner: 'Aspirador de pó', coffee_maker: 'Cafeteira' },
  en: { washing_machine: 'Washing machine', refrigerator: 'Refrigerator', microwave: 'Microwave', stove: 'Stove', freezer: 'Freezer', oven: 'Oven', cooktop: 'Cooktop', dishwasher: 'Dishwasher', air_fryer: 'Air fryer', blender: 'Blender', vacuum_cleaner: 'Vacuum cleaner', coffee_maker: 'Coffee maker' },
  es: { washing_machine: 'Lavadora', refrigerator: 'Refrigerador', microwave: 'Microondas', stove: 'Cocina', freezer: 'Congelador', oven: 'Horno', cooktop: 'Placa de cocina', dishwasher: 'Lavavajillas', air_fryer: 'Freidora de aire', blender: 'Licuadora', vacuum_cleaner: 'Aspiradora', coffee_maker: 'Cafetera' },
};

type ProductMeasures = { category?: ProductCategory; capacityKg?: number | null; capacityLiters?: number | null; burnerCount?: number | null; placeSettings?: number | null; powerWatts?: number | null };

export function categoryLabel(category: ProductCategory, locale: Locale) { return labels[locale][category]; }
export function formatProductMeasure(product: ProductMeasures, locale: Locale) {
  const field = productMeasurementField(product);
  const number = (value: number) => new Intl.NumberFormat(localeMeta[locale].tag, { maximumFractionDigits: 2 }).format(value);
  if (field === 'capacityKg' && product.capacityKg != null) return formatKg(product.capacityKg, locale);
  if (field === 'capacityLiters' && product.capacityLiters != null) return `${number(product.capacityLiters)} L`;
  if (field === 'burnerCount' && product.burnerCount != null) return `${number(product.burnerCount)} ${locale === 'pt' ? 'bocas' : locale === 'en' ? 'burners' : 'quemadores'}`;
  if (field === 'placeSettings' && product.placeSettings != null) return `${number(product.placeSettings)} ${locale === 'pt' ? 'serviços' : locale === 'en' ? 'place settings' : 'servicios'}`;
  if (field === 'powerWatts' && product.powerWatts != null) return `${number(product.powerWatts)} W`;
  return locale === 'pt' ? 'A confirmar' : locale === 'en' ? 'To be confirmed' : 'Por confirmar';
}

export function productMeasureLabel(product: ProductMeasures, locale: Locale) {
  const field = productMeasurementField(product);
  if (field === 'burnerCount') return locale === 'pt' ? 'Queimadores' : locale === 'en' ? 'Burners' : 'Quemadores';
  if (field === 'placeSettings') return locale === 'pt' ? 'Capacidade em serviços' : locale === 'en' ? 'Place settings' : 'Capacidad en servicios';
  if (field === 'powerWatts') return locale === 'pt' ? 'Potência nominal' : locale === 'en' ? 'Rated power' : 'Potencia nominal';
  return locale === 'pt' ? 'Capacidade nominal' : locale === 'en' ? 'Rated capacity' : 'Capacidad nominal';
}

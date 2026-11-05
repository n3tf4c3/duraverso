import { catalogResponseSchema, searchProducts, type Product } from '@duraverso/core';
import { barcodeEvidence, catalogCheckedAt, modelSources } from './catalog-evidence';

const { brastempManual, consulManual } = modelSources;
const candidates: [Product['brand'], string, number, string][] = [
  ['Brastemp', 'BWK12A', 12, brastempManual], ['Brastemp', 'BWR12B', 12, brastempManual],
  ['Brastemp', 'BWK13A', 13, brastempManual], ['Brastemp', 'BWK14B', 14, brastempManual], ['Brastemp', 'BWF15A', 15, brastempManual],
  ['Brastemp', 'BWK16AB', 16, modelSources.BWK16AB],
  ['Consul', 'CWB08A', 8, consulManual], ['Consul', 'CWB09A', 9, consulManual], ['Consul', 'CWH11B', 11, consulManual],
  ['Consul', 'CWH12BB', 12, modelSources.CWH12BB],
  ['Consul', 'CWH15AB', 15, modelSources.CWH15AB],
  ['Consul', 'CWN15AB', 15, modelSources.CWN15AB],
  ['Electrolux', 'LAC09', 8.5, modelSources.LAC09], ['Electrolux', 'LED09', 9, modelSources.LED09],
  ['Electrolux', 'LES11', 11, modelSources.LES11], ['Electrolux', 'LED13', 13, modelSources.LED13],
  ['Electrolux', 'LET13', 13, modelSources.LET13], ['Electrolux', 'LDA13', 13, modelSources.LDA13],
  ['Electrolux', 'LED15', 15, modelSources.LED15],
  ['Electrolux', 'LAC12', 12, modelSources.LAC12],
];

export const catalog: Product[] = candidates.map(([brand, model, capacityKg, sourceUrl]) => ({
  id: `${brand}-${model}`.toLowerCase(), slug: `${brand}-${model}`.toLowerCase(), brand, model, capacityKg,
  sourceUrl, sourceCheckedAt: catalogCheckedAt, identification: 'candidate',
  confirmedGtins: [...(barcodeEvidence[`${brand}-${model}`.toLowerCase()]?.gtins ?? [])],
}));

export function catalogResponse(query = '', brand = '', capacity = '') {
  const data = searchProducts(catalog, query, brand, capacity);
  return catalogResponseSchema.parse({ data, total: data.length, mode: 'local_catalog' });
}
export function findProduct(slug: string) { return catalog.find((p) => p.slug === slug); }
export function capacityLabel(value: number) { return `${value.toLocaleString('pt-BR')} kg`; }

import { catalogResponseSchema, searchProducts, type Product } from '@duraverso/core';

const brastempManual = 'https://whirlpool.vteximg.com.br/arquivos/Brastemp_Combo_BWK13_BSR10_Guia_R%C3%A1pido.pdf';
const consulManual = 'https://whirlpool.vteximg.com.br/arquivos/Consul-Lavadora-CWH11BB-Guia-Rapido.pdf';
const electroluxCatalog = 'https://loja.electrolux.com.br/eletrodomesticos/maquina-de-lavar';
const candidates: [Product['brand'], string, number, string][] = [
  ['Brastemp', 'BWK12A', 12, brastempManual], ['Brastemp', 'BWR12B', 12, brastempManual],
  ['Brastemp', 'BWK13A', 13, brastempManual], ['Brastemp', 'BWK14B', 14, brastempManual], ['Brastemp', 'BWF15A', 15, brastempManual],
  ['Brastemp', 'BWK16AB', 16, 'https://www.brastemp.com.br/experience/tech/como-usar-a-maquina-de-lavar-brastemp-bwk-e-bwm'],
  ['Consul', 'CWB08A', 8, consulManual], ['Consul', 'CWB09A', 9, consulManual], ['Consul', 'CWH11B', 11, consulManual],
  ['Consul', 'CWH12BB', 12, 'https://www.consul.com.br/facilita-consul/bem-pensado-para-voce/como-escolher-maquina-de-lavar-roupa'],
  ['Consul', 'CWH15AB', 15, 'https://www.consul.com.br/facilita-consul/bem-pensado-para-voce/como-escolher-maquina-de-lavar-roupa'],
  ['Consul', 'CWN15AB', 15, 'https://www.consul.com.br/eletrodomesticos/lavadora-de-roupas'],
  ['Electrolux', 'LAC09', 8.5, electroluxCatalog], ['Electrolux', 'LED09', 9, electroluxCatalog],
  ['Electrolux', 'LES11', 11, electroluxCatalog], ['Electrolux', 'LED13', 13, electroluxCatalog],
  ['Electrolux', 'LET13', 13, electroluxCatalog], ['Electrolux', 'LDA13', 13, electroluxCatalog],
  ['Electrolux', 'LED15', 15, electroluxCatalog],
  ['Electrolux', 'LAC12', 12, 'https://loja.electrolux.com.br/lavadora-compacta-lac12-com-dispenser-autolimpante-cesto-inox-electrolux/p'],
];

export const catalog: Product[] = candidates.map(([brand, model, capacityKg, sourceUrl]) => ({
  id: `${brand}-${model}`.toLowerCase(), slug: `${brand}-${model}`.toLowerCase(), brand, model, capacityKg,
  sourceUrl, sourceCheckedAt: '2026-11-05', identification: 'candidate', confirmedGtins: [],
}));

export function catalogResponse(query = '', brand = '', capacity = '') {
  const data = searchProducts(catalog, query, brand, capacity);
  return catalogResponseSchema.parse({ data, total: data.length, mode: 'local_catalog' });
}
export function findProduct(slug: string) { return catalog.find((p) => p.slug === slug); }
export function capacityLabel(value: number) { return `${value.toLocaleString('pt-BR')} kg`; }

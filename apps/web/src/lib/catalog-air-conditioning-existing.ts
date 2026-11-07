import type { Product } from '@duraverso/core';

// Fontes oficiais lidas em 06/11/2026; referências de aparelhos completos.
// BTU/h é a capacidade nominal de refrigeração anunciada, sem conversão de watts.
// Os pares identificam um conjunto; suas unidades não são produtos independentes.
// Não duplicamos o mesmo aparelho por tensão. GTINs e variantes ainda não conferidos.
// Disponibilidade comercial, eficiência, durabilidade e avaliações não são inferidas.
const checkedAt = '2026-11-06';
type DocumentedModel = Pick<Product, 'brand' | 'model' | 'coolingCapacityBtuH' | 'sourceUrl'>;
const models: DocumentedModel[] = [
  // Janela: aparelho monobloco. CBK12CBXCJ é a referência comercial do split completo;
  // sua página descreve as unidades interna/externa e informa 12.000 BTUs/h.
  // Não usamos os anúncios identificados como unidade interna isolada.
  {
    brand: 'Consul',
    model: 'CCB07FB',
    coolingCapacityBtuH: 7500,
    sourceUrl: 'https://www.consul.com.br/ar-condicionado-janela-7500-btus-consul-frio-com-design-moderno-ccb07fb/p',
  },
  {
    brand: 'Consul',
    model: 'CCN07GB',
    coolingCapacityBtuH: 7500,
    sourceUrl:
      'https://www.consul.com.br/ar-condicionado-janela-7500btus-consul-frio-eletronico-com-design-moderno-ccn07gb/p',
  },
  {
    brand: 'Consul',
    model: 'CCN10GB',
    coolingCapacityBtuH: 10000,
    sourceUrl:
      'https://www.consul.com.br/ar-condicionado-janela-10000btus-consul-frio-eletronico-com-design-moderno-ccn10gb/p',
  },
  {
    brand: 'Consul',
    model: 'CCK10CB',
    coolingCapacityBtuH: 10000,
    sourceUrl:
      'https://www.consul.com.br/ar-condicionado-janela-10000btus-consul-inverter-frio-com-design-moderno-cck10cb/p',
  },
  {
    brand: 'Consul',
    model: 'CCB10GB',
    coolingCapacityBtuH: 10000,
    sourceUrl: 'https://www.consul.com.br/ar-condicionado-janela-10000-btus-consul-frio-com-design-moderno-ccb10gb/p',
  },
  {
    brand: 'Consul',
    model: 'CCB07GB',
    coolingCapacityBtuH: 7500,
    sourceUrl: 'https://www.consul.com.br/ar-condicionado-janela-7500-btus-consul-frio-com-design-moderno-ccb07gb/p',
  },
  {
    brand: 'Consul',
    model: 'CCK07BB',
    coolingCapacityBtuH: 7000,
    sourceUrl: 'https://www.consul.com.br/ar-condicionado-janela-7000-btus-consul-inverter-frio-cck07bb/p',
  },
  {
    brand: 'Consul',
    model: 'CCK07CB',
    coolingCapacityBtuH: 7000,
    sourceUrl: 'https://www.consul.com.br/ar-condicionado-janela-7000-btus-h-consul-inverter-frio-cck07cb/p',
  },
  {
    brand: 'Consul',
    model: 'CBK12CBXCJ',
    coolingCapacityBtuH: 12000,
    sourceUrl:
      'https://www.consul.com.br/ar-condicionado-split-consul-triple-inverter-economaxi-frio-12000-btus---cbk12cbxcj/p',
  },
  // Pares de unidades transcritos dos títulos oficiais de cada conjunto split.
  // SP12F é portátil. Medidas nominais confirmadas nas páginas individuais.
  {
    brand: 'Electrolux',
    model: 'SP12F',
    coolingCapacityBtuH: 12000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-portatil-electrolux-12-000-btus-frio-branco-com-wi-fi--sp12f/p',
  },
  {
    brand: 'Electrolux',
    model: 'JI09F/JE09F',
    coolingCapacityBtuH: 9000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-inverter-9000-btus-color-adapt-frio-ji09f-je09f/p',
  },
  {
    brand: 'Electrolux',
    model: 'JI12F/JE12F',
    coolingCapacityBtuH: 12000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-inverter-12000-btus-color-adapt-frio-ji12f-je12f/p',
  },
  {
    brand: 'Electrolux',
    model: 'JI18F/JE18F',
    coolingCapacityBtuH: 18000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-color-adapt-inverter-18-000-btus-frio-ji18f-je18f/p',
  },
  {
    brand: 'Electrolux',
    model: 'YI24R/YE24R',
    coolingCapacityBtuH: 24000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-24000-btus-color-adapt-quente-frio-com-wi-fi-yi24r-ye24r/p',
  },
  {
    brand: 'Electrolux',
    model: 'NI12R/NE12R',
    coolingCapacityBtuH: 12000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-maxcomfort-full-inverter-quente-frio-12-000-btus-ni12r-ne12r/p',
  },
  {
    brand: 'Electrolux',
    model: 'NI09R/NE09R',
    coolingCapacityBtuH: 9000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-maxcomfort-full-inverter-quente-frio-9-000-btus-ni09r-ne09r/p',
  },
  {
    brand: 'Electrolux',
    model: 'NI09F/NE09F',
    coolingCapacityBtuH: 9000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-maxcomfort-full-inverter-frio-9-000-btus-ni09f-ne09f/p',
  },
  {
    brand: 'Electrolux',
    model: 'YI09F/YE09F',
    coolingCapacityBtuH: 9000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-9000-btus-color-adapt-frio-com-wi-fi-yi09f-ye09f/p',
  },
  {
    brand: 'Electrolux',
    model: 'UI09F/UE09F',
    coolingCapacityBtuH: 9000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-9000-btus-color-adapt-frio-ui09f-ue09f/p',
  },
  {
    brand: 'Electrolux',
    model: 'YI09R/YE09R',
    coolingCapacityBtuH: 9000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-9000-btus-color-adapt-quente-frio-com-wi-fi-yi09r-ye09r/p',
  },
  {
    brand: 'Electrolux',
    model: 'NI12F/NE12F',
    coolingCapacityBtuH: 12000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-maxcomfort-full-inverter-frio-12-000-btus-ni12f-ne12f/p',
  },
  {
    brand: 'Electrolux',
    model: 'UI12F/UE12F',
    coolingCapacityBtuH: 12000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-12000-btus-color-adapt-frio-ui12f-ue12f/p',
  },
  {
    brand: 'Electrolux',
    model: 'YI12R/YE12R',
    coolingCapacityBtuH: 12000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-12000-btus-color-adapt-quente-frio-com-wi-fi-yi12r-ye12r/p',
  },
  {
    brand: 'Electrolux',
    model: 'YI12F/YE12F',
    coolingCapacityBtuH: 12000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-12000-btus-color-adapt-frio-com-wi-fi-yi12f-ye12f/p',
  },
  {
    brand: 'Electrolux',
    model: 'YI18R/YE18R',
    coolingCapacityBtuH: 18000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-18000-btus-color-adapt-quente-frio-com-wi-fi-yi18r-ye18r/p',
  },
  {
    brand: 'Electrolux',
    model: 'UI18R/UE18R',
    coolingCapacityBtuH: 18000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-18000-btus-color-adapt-quente-frio-ui18r-ue18r/p',
  },
  {
    brand: 'Electrolux',
    model: 'YI18F/YE18F',
    coolingCapacityBtuH: 18000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-18000-btus-color-adapt-frio-com-wi-fi-yi18f-ye18f/p',
  },
  {
    brand: 'Electrolux',
    model: 'UI18F/UE18F',
    coolingCapacityBtuH: 18000,
    sourceUrl:
      'https://loja.electrolux.com.br/ar-condicionado-split-electrolux-18000-btus-color-adapt-frio-ui18f-ue18f/p',
  },
  // Xtreme Save Connect: manual oficial, seção 13, páginas impressas 64–67.
  // Cada coluna da tabela une explicitamente os códigos 42/38 e a capacidade
  // nominal de refrigeração. Pares frio (C) e quente/frio (Q) são distintos.
  {
    brand: 'Midea',
    model: '42AGVCI09M5/38AGVCI09M5',
    coolingCapacityBtuH: 9000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/ar-condicionado-split-inverter-24000-btus-xtremesave-quente-e-frio-midea.pdf#page=64',
  },
  {
    brand: 'Midea',
    model: '42AGVQI09M5/38AGVQI09M5',
    coolingCapacityBtuH: 9000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/ar-condicionado-split-inverter-24000-btus-xtremesave-quente-e-frio-midea.pdf#page=64',
  },
  {
    brand: 'Midea',
    model: '42AGVCI12M5/38AGVCI12M5',
    coolingCapacityBtuH: 12000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/ar-condicionado-split-inverter-24000-btus-xtremesave-quente-e-frio-midea.pdf#page=65',
  },
  {
    brand: 'Midea',
    model: '42AGVQI12M5/38AGVQI12M5',
    coolingCapacityBtuH: 12000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/ar-condicionado-split-inverter-24000-btus-xtremesave-quente-e-frio-midea.pdf#page=65',
  },
  {
    brand: 'Midea',
    model: '42AGVCI18M5/38AGVCI18M5',
    coolingCapacityBtuH: 18000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/ar-condicionado-split-inverter-24000-btus-xtremesave-quente-e-frio-midea.pdf#page=66',
  },
  {
    brand: 'Midea',
    model: '42AGVQI18M5/38AGVQI18M5',
    coolingCapacityBtuH: 18000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/ar-condicionado-split-inverter-24000-btus-xtremesave-quente-e-frio-midea.pdf#page=66',
  },
  {
    brand: 'Midea',
    model: '42AGVCI24M5/38AGVCI24M5',
    coolingCapacityBtuH: 24000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/ar-condicionado-split-inverter-24000-btus-xtremesave-quente-e-frio-midea.pdf#page=67',
  },
  {
    brand: 'Midea',
    model: '42AGVQI24M5/38AGVQI24M5',
    coolingCapacityBtuH: 24000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/ar-condicionado-split-inverter-24000-btus-xtremesave-quente-e-frio-midea.pdf#page=67',
  },
];

export const existingBrandAirConditionerCatalog: Product[] = models.map((product) => {
  const slug = `${product.brand}-${product.model}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return {
    ...product,
    id: slug,
    slug,
    category: 'air_conditioner',
    sourceCheckedAt: checkedAt,
    identification: 'candidate',
    confirmedGtins: [],
  };
});

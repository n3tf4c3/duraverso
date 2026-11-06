import type { Product } from '@duraverso/core';

// Fontes oficiais consultadas em 06/11/2026. Somente identidade e medidas;
// não importamos preços, avaliações, alegações de desempenho ou imagens.
// Litros indicam a capacidade nominal anunciada (cuba/cesto/jarra conforme
// o fabricante), não uma equivalência entre categorias ou volume útil.
// A potência elétrica dos aspiradores não mede poder de sucção.
// GTINs/tensões não foram incorporados neste lote: exigem revisão de variantes.
const checkedAt = '2026-11-06';
const models: Omit<Product, 'id' | 'slug' | 'sourceCheckedAt' | 'identification' | 'confirmedGtins'>[] = [
  {
    brand: 'Electrolux', model: 'EAF85', category: 'air_fryer', capacityLiters: 12,
    sourceUrl: 'https://loja.electrolux.com.br/air-fryer-oven-5-em-1-electrolux-por-rita-lobo-12l-experience--eaf85-/p',
  },
  {
    brand: 'Electrolux', model: 'EAF90', category: 'air_fryer', capacityLiters: 12,
    sourceUrl: 'https://loja.electrolux.com.br/air-fryer-oven-electrolux-rita-lobo-12l-digital-grafite-c--espeto-e-grelhas-antiaderente--eaf90-/p',
  },
  {
    brand: 'Electrolux', model: 'EAF10', category: 'air_fryer', capacityLiters: 3.2,
    sourceUrl: 'https://loja.electrolux.com.br/air-fryer-electrolux-por-rita-lobo-32l-preta-efficient-1400w--eaf10-/p',
  },
  {
    brand: 'Electrolux', model: 'EAF40', category: 'air_fryer', capacityLiters: 5.6,
    sourceUrl: 'https://loja.electrolux.com.br/air-fryer-electrolux-por-rita-lobo-5-6-l-cinza-efficient-timer-e-conveccao-1400w-eaf40/p',
  },
  {
    brand: 'Electrolux', model: 'EAF180', category: 'air_fryer', capacityLiters: 7,
    sourceUrl: 'https://loja.electrolux.com.br/air-fryer-electrolux-por-rita-lobo-7l-experience-eaf180/p',
  },
  {
    brand: 'Electrolux', model: 'EAF15', category: 'air_fryer', capacityLiters: 4.6,
    sourceUrl: 'https://loja.electrolux.com.br/airfryer-fritadeira-eletrica-4-6-litros-electrolux--eaf15-/p',
  },
  {
    brand: 'Electrolux', model: 'EAF70', category: 'air_fryer', capacityLiters: 7,
    sourceUrl: 'https://loja.electrolux.com.br/air-fryer-electrolux-por-rita-lobo-7l-preta-efficient-1700w-eaf70/p',
  },
  {
    brand: 'Electrolux', model: 'EAF05', category: 'air_fryer', capacityLiters: 3,
    sourceUrl: 'https://loja.electrolux.com.br/air-fryer-electrolux-por-rita-lobo-3l-efficient-eaf05/p',
  },
  {
    brand: 'Electrolux', model: 'EAF30', category: 'air_fryer', capacityLiters: 4,
    sourceUrl: 'https://loja.electrolux.com.br/air-fryer-electrolux-por-rita-lobo-4l-cinza-grand-efficient-1400w--eaf30-/p',
  },
  {
    brand: 'Electrolux', model: 'EAF20', category: 'air_fryer', capacityLiters: 3.2,
    sourceUrl: 'https://loja.electrolux.com.br/air-fryer-electrolux-por-rita-lobo-32l-digital-cinza-experience-com-funcao-virar-1400w--eaf20-/p',
  },
  {
    brand: 'Philips Walita', model: 'RI2244/90', category: 'blender', capacityLiters: 3,
    sourceUrl: 'https://www.walita.com.br/liquidificador-philips-walita-serie-5000-ri2244-90_ri2244_90_inox/p',
  },
  {
    brand: 'Philips Walita', model: 'RI2242/90', category: 'blender', capacityLiters: 3,
    sourceUrl: 'https://www.walita.com.br/liquidificador-serie-5000-jarra-inquebravel-philips-walita-preto-1200w-ri2242_ri2242_90_preto/p',
  },
  {
    // A descrição de HR2270 cita 2L, enquanto a ficha cita 3L totais.
    // Capacidade omitida até resolver a divergência na fonte.
    brand: 'Philips Walita', model: 'HR2270/91', category: 'blender',
    sourceUrl: 'https://www.walita.com.br/liquidificador-serie-3000-turbo-preto-philips-walita-1000w---hr2270/p',
  },
  {
    brand: 'Philips Walita', model: 'HR2271/91', category: 'blender', capacityLiters: 3,
    sourceUrl: 'https://www.walita.com.br/liquidificador-serie-3000-turbo-preto-philips-walita-1200w---hr2271/p',
  },
  {
    brand: 'Philips Walita', model: 'HR2272/91', category: 'blender', capacityLiters: 2,
    sourceUrl: 'https://www.walita.com.br/liquidificador-serie-3000-turbo-jarra-de-vidro-preto-philips-walita-700w---hr2272/p',
  },
  {
    brand: 'Philips Walita', model: 'RI2110/90', category: 'blender', capacityLiters: 2,
    sourceUrl: 'https://www.walita.com.br/liquidificador-daily-philips-walita-ri2110-preto_ri2110-90_preto/p',
  },
  {
    brand: 'Electrolux', model: 'ECM30', category: 'coffee_maker', capacityLiters: 1.5,
    sourceUrl: 'https://loja.electrolux.com.br/cafeteira_eletrica_programavel_digital_ecm30_electrolux/p',
  },
  {
    // As demais fontes anunciam xícaras; não converter em litros por suposição.
    brand: 'Electrolux', model: 'ECM22', category: 'coffee_maker',
    sourceUrl: 'https://loja.electrolux.com.br/cafeteira-eletrica-electrolux-com-jarra-inox-30-xicaras-efficient--ecm22-/p',
  },
  {
    brand: 'Electrolux', model: 'ECM10', category: 'coffee_maker',
    sourceUrl: 'https://loja.electrolux.com.br/cafeteira-eletrica-electrolux-15-xicaras-efficient--ecm10-/p',
  },
  {
    brand: 'Electrolux', model: 'ECM12', category: 'coffee_maker',
    sourceUrl: 'https://loja.electrolux.com.br/cafeteira-eletrica-electrolux-efficient-com-jarra-de-aco-inox--ecm12-/p',
  },
  {
    brand: 'Electrolux', model: 'ECM20', category: 'coffee_maker',
    sourceUrl: 'https://loja.electrolux.com.br/cafeteira-eletrica-electrolux-inox-30-xicaras-efficient-ecm20/p',
  },
  {
    brand: 'Electrolux', model: 'CMP70', category: 'coffee_maker',
    sourceUrl: 'https://loja.electrolux.com.br/cafeteira-eletrica-electrolux-expert-cmp70-/p',
  },
  {
    brand: 'WAP', model: 'GTW 10', category: 'vacuum_cleaner', powerWatts: 1400,
    sourceUrl: 'https://loja.wap.ind.br/aspirador-de-po-e-agua-1400w-wap-gtw-10/p',
  },
  {
    brand: 'WAP', model: 'High Speed Plus', category: 'vacuum_cleaner', powerWatts: 1350,
    sourceUrl: 'https://loja.wap.ind.br/aspirador-de-po-vertical-3-em-1-1350w-wap-high-speed-plus-1/p',
  },
  {
    brand: 'WAP', model: 'Silent Speed Max', category: 'vacuum_cleaner', powerWatts: 1350,
    sourceUrl: 'https://loja.wap.ind.br/aspirador-de-po-vertical-3-em-1-1350w-wap-silent-speed-max-1/p',
  },
  {
    brand: 'WAP', model: 'Power Speed', category: 'vacuum_cleaner', powerWatts: 2000,
    sourceUrl: 'https://loja.wap.ind.br/aspirador-de-po-vertical-2-em-1-2000w-wap-power-speed/p',
  },
  {
    brand: 'WAP', model: 'GTW Inox 12', category: 'vacuum_cleaner', powerWatts: 1400,
    sourceUrl: 'https://loja.wap.ind.br/aspirador-de-po-e-agua-1400w-wap-gtw-inox-12/p',
  },
  {
    brand: 'WAP', model: 'Life Speed', category: 'vacuum_cleaner', powerWatts: 2000,
    sourceUrl: 'https://loja.wap.ind.br/aspirador-de-po-vertical-2-em-1-2000w-wap-life-speed/p',
  },
  {
    brand: 'WAP', model: 'GTW Compact', category: 'vacuum_cleaner', powerWatts: 1400,
    sourceUrl: 'https://loja.wap.ind.br/aspirador-de-po-e-agua-gtw-compact-1400w/p',
  },
  {
    brand: 'WAP', model: 'GTW Inox 20', category: 'vacuum_cleaner', powerWatts: 1600,
    sourceUrl: 'https://loja.wap.ind.br/aspirador-de-po-e-agua-1600w-wap-gtw-inox-20/p',
  },
];

export const smallApplianceCatalog: Product[] = models.map((product) => {
  const slug = `${product.brand}-${product.model}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { ...product, id: slug, slug, sourceCheckedAt: checkedAt, identification: 'candidate', confirmedGtins: [] };
});

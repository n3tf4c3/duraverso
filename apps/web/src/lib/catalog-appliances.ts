import type { Product } from '@duraverso/core';

// Conferência nas páginas oficiais em 06/11/2026: modelo e medida nominal
// anunciada pelo fabricante. Não representa estoque, teste físico ou durabilidade.
// O volume dos micro-ondas é o nominal anunciado, não o volume útil da cavidade.
// Nenhum GTIN, tensão ou variante foi inferido para este lote.
const checkedAt = '2026-11-06';
const applianceModels: Omit<Product, 'id' | 'slug' | 'sourceCheckedAt' | 'identification' | 'confirmedGtins'>[] = [
  {
    brand: 'Brastemp', model: 'BRM44HK', category: 'refrigerator', capacityLiters: 375,
    sourceUrl: 'https://www.brastemp.com.br/geladeira-brastemp-frost-free-375-litros-brm44hk/p',
  },
  {
    brand: 'Consul', model: 'CRB39AB', category: 'refrigerator', capacityLiters: 342,
    sourceUrl: 'https://www.consul.com.br/geladeira-consul-facilite-frost-free-342-litros-branca-crb39ab/p',
  },
  {
    brand: 'Brastemp', model: 'BMS46AB', category: 'microwave', capacityLiters: 32,
    sourceUrl: 'https://www.brastemp.com.br/micro-ondas-brastemp-32-litros-branco-com-menu-gourmet-bms46ab/p',
  },
  {
    brand: 'Consul', model: 'CMS46AB', category: 'microwave', capacityLiters: 32,
    sourceUrl: 'https://www.consul.com.br/micro-ondas-consul-32-litros-branco-com-menu-facil-cms46ab/p',
  },
  {
    brand: 'Brastemp', model: 'BFS5NCR', category: 'stove', burnerCount: 5,
    sourceUrl: 'https://www.brastemp.com.br/fogao-brastemp-5-bocas-cor-inox-com-botoes-removiveis-e-exclusivo-aro-protetor/p',
  },
  {
    brand: 'Consul', model: 'CFO4NAB', category: 'stove', burnerCount: 4,
    sourceUrl: 'https://www.consul.com.br/fogao-de-piso-consul-4-bocas-com-manipulos-removiveis-cfo4nab/p',
  },
];

export const applianceCatalog: Product[] = applianceModels.map((product) => ({
  ...product,
  id: `${product.brand}-${product.model}`.toLowerCase(),
  slug: `${product.brand}-${product.model}`.toLowerCase(),
  sourceCheckedAt: checkedAt,
  identification: 'candidate',
  confirmedGtins: [],
}));

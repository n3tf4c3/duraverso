import type { Product } from '@duraverso/core';

// Fontes oficiais consultadas em 06/11/2026. Referências de conjuntos completos:
// LG S3-, kits Samsung F- e modelos Gree da tabela de conjuntos do fabricante.
// Não inferimos pares a partir de códigos de evaporadoras/condensadoras avulsas.
// BTU/h é capacidade nominal de refrigeração, não potência elétrica, capacidade
// máxima ou aquecimento. GTINs e variantes físicas continuam sujeitos à revisão.
const checkedAt = '2026-11-06';
const lgAiAir =
  'https://www.lg.com/content/dam/lge/br/microsite/ar-condicionado/ar-condicionado-por-que-escolher-lg/assets/Tabela-Ai-Air.pdf';
const lgUniq =
  'https://www.lg.com/content/dam/lge/br/microsite/ar-condicionado/ar-condicionado-por-que-escolher-lg/assets/Tabela-Uniq.pdf';
const greeTop = 'https://gree.com.br/wp-content/uploads/2025/01/GTopAutoInverter_FolderDigital_00a.pdf';

const models: Omit<Product, 'id' | 'slug' | 'sourceCheckedAt' | 'identification' | 'confirmedGtins'>[] = [
  {
    brand: 'LG',
    model: 'S3-Q09AA33A',
    category: 'air_conditioner',
    coolingCapacityBtuH: 9000,
    sourceUrl: 'https://www.lg.com/br/ar-condicionado-residencial/dual-inverter-split/s3-q09aa33a/',
  },
  {
    brand: 'LG',
    model: 'S3-Q12JA33J',
    category: 'air_conditioner',
    coolingCapacityBtuH: 12000,
    sourceUrl: 'https://www.lg.com/br/ar-condicionado-residencial/dual-inverter-split/s3-q12ja33j/',
  },
  {
    // A família comercial é 18.000; a ficha informa nominal frio de 19.000 BTU/h.
    brand: 'LG',
    model: 'S3-Q18KL33B',
    category: 'air_conditioner',
    coolingCapacityBtuH: 19000,
    sourceUrl: 'https://www.lg.com/br/ar-condicionado-residencial/dual-inverter-split/s3-q18kl33b/',
  },
  {
    // A família comercial é 24.000; nominal frio 22.000 e máximo 24.000 BTU/h.
    brand: 'LG',
    model: 'S3-Q24K233B',
    category: 'air_conditioner',
    coolingCapacityBtuH: 22000,
    sourceUrl: 'https://www.lg.com/br/ar-condicionado-residencial/dual-inverter-split/s3-q24k233b/',
  },
  { brand: 'LG', model: 'S3-W090AKH0', category: 'air_conditioner', coolingCapacityBtuH: 9000, sourceUrl: lgAiAir },
  { brand: 'LG', model: 'S3-W120AKH0', category: 'air_conditioner', coolingCapacityBtuH: 12000, sourceUrl: lgAiAir },
  { brand: 'LG', model: 'S3-Q090AKH0', category: 'air_conditioner', coolingCapacityBtuH: 9000, sourceUrl: lgAiAir },
  { brand: 'LG', model: 'S3-Q120AKH0', category: 'air_conditioner', coolingCapacityBtuH: 12000, sourceUrl: lgAiAir },
  { brand: 'LG', model: 'S3-W091L1C0', category: 'air_conditioner', coolingCapacityBtuH: 9000, sourceUrl: lgUniq },
  { brand: 'LG', model: 'S3-W121L1C0', category: 'air_conditioner', coolingCapacityBtuH: 12000, sourceUrl: lgUniq },
  {
    brand: 'Samsung',
    model: 'F-AR09DYFAAWK',
    category: 'air_conditioner',
    coolingCapacityBtuH: 9000,
    sourceUrl:
      'https://www.samsung.com/br/air-conditioners/wall-mount/kit-air-conditioner-split-inverter-windfree-connect-ai-9000-btus-cold-white-220v-f-ar09dyfaawk/',
  },
  {
    brand: 'Samsung',
    model: 'F-AR12DYFAAWK',
    category: 'air_conditioner',
    coolingCapacityBtuH: 12000,
    sourceUrl:
      'https://www.samsung.com/br/air-conditioners/wall-mount/kit-air-conditioner-split-inverter-windfree-connect-ai-12000-btus-cold-white-220v-f-ar12dyfaawk/',
  },
  {
    brand: 'Samsung',
    model: 'F-AR12DXFAAWK',
    category: 'air_conditioner',
    coolingCapacityBtuH: 12000,
    sourceUrl:
      'https://www.samsung.com/br/air-conditioners/wall-mount/kit-air-conditioner-split-inverter-windfree-connect-ai-12-000-btus-hot-and-cold-white-220v-f-ar12dxfaawk/',
  },
  {
    brand: 'Samsung',
    model: 'F-AR60H09D1AW',
    category: 'air_conditioner',
    coolingCapacityBtuH: 9000,
    sourceUrl:
      'https://www.samsung.com/br/air-conditioners/wall-mount/air-conditioner-split-inverter-windfree-ai-pro-9000-btus-f-ar60h09d1aw/',
  },
  {
    brand: 'Samsung',
    model: 'F-AR60H12D1AW',
    category: 'air_conditioner',
    coolingCapacityBtuH: 12000,
    sourceUrl:
      'https://www.samsung.com/br/air-conditioners/wall-mount/air-conditioner-split-inverter-windfree-ai-pro-12000-btus-f-ar60h12d1aw/',
  },
  {
    brand: 'Samsung',
    model: 'F-AR60H24D1AW',
    category: 'air_conditioner',
    coolingCapacityBtuH: 24000,
    sourceUrl:
      'https://www.samsung.com/br/air-conditioners/wall-mount/air-conditioner-split-inverter-windfree-ai-pro-24000-btus-f-ar60h24d1aw/',
  },
  {
    brand: 'Samsung',
    model: 'F-AR60H09C1AWN',
    category: 'air_conditioner',
    coolingCapacityBtuH: 9000,
    sourceUrl:
      'https://www.samsung.com/br/air-conditioners/wall-mount/air-conditioner-inverter-windfree-ai-pro-9000-btu-qf-f-ar60h09c1awn/',
  },
  {
    brand: 'Samsung',
    model: 'F-AR60H12C1AWN',
    category: 'air_conditioner',
    coolingCapacityBtuH: 12000,
    sourceUrl:
      'https://www.samsung.com/br/air-conditioners/wall-mount/air-conditioner-inverter-windfree-ai-pro-12000-btu-qf-f-ar60h12c1awn/',
  },
  {
    // A ficha distingue refrigeração de 23.000 do aquecimento de 24.000 BTU/h.
    brand: 'Samsung',
    model: 'F-AR60H24C1AWN',
    category: 'air_conditioner',
    coolingCapacityBtuH: 23000,
    sourceUrl:
      'https://www.samsung.com/br/air-conditioners/wall-mount/air-conditioner-inverter-windfree-ai-pro-24000-btu-qf-f-ar60h24c1awn/',
  },
  {
    brand: 'Samsung',
    model: 'F-AR60F18C1AW',
    category: 'air_conditioner',
    coolingCapacityBtuH: 18000,
    sourceUrl:
      'https://www.samsung.com/br/air-conditioners/wall-mount/ar-condicionado-split-inverter-windfree-ai-q-f-220v-18-000-btus-hr-f-ar60f18c1aw/',
  },
  // Tabela da página 8 do folder: códigos exatos daquela revisão, sem substituir
  // ATA por ATB ou o sufixo A por B a partir de outra página/geração da linha.
  {
    brand: 'Gree',
    model: 'GWC09ATA-D6DNA1A',
    category: 'air_conditioner',
    coolingCapacityBtuH: 9000,
    sourceUrl: greeTop,
  },
  {
    brand: 'Gree',
    model: 'GWH09ATA-D6DNA1A',
    category: 'air_conditioner',
    coolingCapacityBtuH: 9000,
    sourceUrl: greeTop,
  },
  {
    brand: 'Gree',
    model: 'GWC12ATC-D6DNA1A',
    category: 'air_conditioner',
    coolingCapacityBtuH: 12000,
    sourceUrl: greeTop,
  },
  {
    brand: 'Gree',
    model: 'GWH12ATC-D6DNA1A',
    category: 'air_conditioner',
    coolingCapacityBtuH: 12000,
    sourceUrl: greeTop,
  },
  {
    brand: 'Gree',
    model: 'GWC18ATD-D6DNA1A',
    category: 'air_conditioner',
    coolingCapacityBtuH: 18000,
    sourceUrl: greeTop,
  },
  {
    brand: 'Gree',
    model: 'GWH18ATD-D6DNA1A',
    category: 'air_conditioner',
    coolingCapacityBtuH: 18000,
    sourceUrl: greeTop,
  },
  {
    brand: 'Gree',
    model: 'GWC24ATE-D6DNA1A',
    category: 'air_conditioner',
    coolingCapacityBtuH: 24000,
    sourceUrl: greeTop,
  },
  {
    brand: 'Gree',
    model: 'GWH24ATE-D6DNA1A',
    category: 'air_conditioner',
    coolingCapacityBtuH: 24000,
    sourceUrl: greeTop,
  },
  {
    brand: 'Gree',
    model: 'GWC30ATEXF-S6DNA1A',
    category: 'air_conditioner',
    coolingCapacityBtuH: 30000,
    sourceUrl: greeTop,
  },
  {
    brand: 'Gree',
    model: 'GWH30ATEXF-S6DNA1A',
    category: 'air_conditioner',
    coolingCapacityBtuH: 30000,
    sourceUrl: greeTop,
  },
];

export const newBrandAirConditionerCatalog: Product[] = models.map((product) => {
  const slug = `${product.brand}-${product.model}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return { ...product, id: slug, slug, sourceCheckedAt: checkedAt, identification: 'candidate', confirmedGtins: [] };
});

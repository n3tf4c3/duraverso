import type { Product } from '@duraverso/core';

// Fontes oficiais consultadas em 06/11/2026, ligadas pelo suporte brasileiro:
// https://www.generalww.com/br/support/downloads/split/index.html
// O portal atual usa GENERAL; estes catálogos identificam Fujitsu General do
// Brasil e os produtos Fujitsu/Airstage. Mantemos uma única marca Fujitsu.
// Cada referência preserva o par explícito da tabela, na ordem interna/externa.
// A medida é a capacidade nominal de refrigeração em BTU/h, não aquecimento,
// capacidade máxima nem consumo elétrico. Não foram inferidos GTINs/variantes.
const checkedAt = '2026-11-06';
const premiumSource = 'https://www.generalww.com/shared/br/pdf-fcbr-ctlg-split-wall-r32-pr-05.pdf';
const essentialSource = 'https://www.generalww.com/shared/br/pdf-fcbr-ctlg-split-wall-r32-es-04.pdf';

const models: Pick<Product, 'model' | 'coolingCapacityBtuH' | 'sourceUrl'>[] = [
  // Premium, página 4: seis pares somente frio e seis pares quente/frio.
  { model: 'ASBG09CMBA / AOBG09CMCA', coolingCapacityBtuH: 9000, sourceUrl: premiumSource },
  { model: 'ASBG12CMBA / AOBG12CMCA', coolingCapacityBtuH: 12000, sourceUrl: premiumSource },
  { model: 'ASBG18CMBA / AOBG18CMCA', coolingCapacityBtuH: 18000, sourceUrl: premiumSource },
  { model: 'ASBG24CMBA / AOBG24CMCA', coolingCapacityBtuH: 24000, sourceUrl: premiumSource },
  { model: 'ASBH27CMTA / AOBH27CMTA', coolingCapacityBtuH: 27000, sourceUrl: premiumSource },
  { model: 'ASBH31CMTA / AOBH31CMTA', coolingCapacityBtuH: 31000, sourceUrl: premiumSource },
  { model: 'ASBG09KMBA / AOBG09KMCA', coolingCapacityBtuH: 9000, sourceUrl: premiumSource },
  { model: 'ASBG12KMBA / AOBG12KMCA', coolingCapacityBtuH: 12000, sourceUrl: premiumSource },
  { model: 'ASBG18KMBA / AOBG18KMCA', coolingCapacityBtuH: 18000, sourceUrl: premiumSource },
  { model: 'ASBG24KMBA / AOBG24KMCA', coolingCapacityBtuH: 24000, sourceUrl: premiumSource },
  { model: 'ASBH27KMTA / AOBH27KMTA', coolingCapacityBtuH: 27000, sourceUrl: premiumSource },
  { model: 'ASBH31KMTA / AOBH31KMTA', coolingCapacityBtuH: 31000, sourceUrl: premiumSource },
  // Essencial, página 5. A linha de códigos dos kits de 24 mil diverge da capa;
  // usamos os pares explícitos das linhas de unidades, sem corrigir o código-Z.
  { model: 'ASKA09CPBA / AOKA09CPBA', coolingCapacityBtuH: 9000, sourceUrl: essentialSource },
  { model: 'ASKA12CPBA / AOKA12CPBA', coolingCapacityBtuH: 12000, sourceUrl: essentialSource },
  { model: 'ASKA18CPBA / AOKA18CPBA', coolingCapacityBtuH: 18000, sourceUrl: essentialSource },
  { model: 'ASKA24CPBA / AOKA24CPBA', coolingCapacityBtuH: 24000, sourceUrl: essentialSource },
  { model: 'ASKA30CPBA / AOKA30CPBA', coolingCapacityBtuH: 30000, sourceUrl: essentialSource },
  { model: 'ASKA36CPBA / AOKA36CPBA', coolingCapacityBtuH: 36000, sourceUrl: essentialSource },
  { model: 'ASKA09KPBA / AOKA09KPBA', coolingCapacityBtuH: 9000, sourceUrl: essentialSource },
  { model: 'ASKA12KPBA / AOKA12KPBA', coolingCapacityBtuH: 12000, sourceUrl: essentialSource },
  // O aquecimento do 18KPBA é 18.430; refrigeração nominal é 18.000 BTU/h.
  { model: 'ASKA18KPBA / AOKA18KPBA', coolingCapacityBtuH: 18000, sourceUrl: essentialSource },
  { model: 'ASKA24KPBA / AOKA24KPBA', coolingCapacityBtuH: 24000, sourceUrl: essentialSource },
  { model: 'ASKA30KPBA / AOKA30KPBA', coolingCapacityBtuH: 30000, sourceUrl: essentialSource },
  { model: 'ASKA36KPBA / AOKA36KPBA', coolingCapacityBtuH: 36000, sourceUrl: essentialSource },
];

export const fujitsuAirConditionerCatalog: Product[] = models.map((product) => {
  const slug = `fujitsu-${product.model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    ...product, id: slug, slug, brand: 'Fujitsu', category: 'air_conditioner',
    sourceCheckedAt: checkedAt, identification: 'candidate', confirmedGtins: [],
  };
});

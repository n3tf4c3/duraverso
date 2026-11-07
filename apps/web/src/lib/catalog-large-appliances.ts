import type { Product } from '@duraverso/core';

// Fontes primárias consultadas em 06/11/2026. Cada sourceUrl abaixo é a página
// oficial lida, cujo título identifica o modelo e sua medida nominal anunciada.
// O volume de micro-ondas não é o volume útil da cavidade. Modelos fora de estoque
// continuam úteis para relatos de proprietários; não afirmamos disponibilidade.
// Sem GTIN, tensão, variante elétrica, foto licenciada ou desempenho inferidos.
const checkedAt = '2026-11-06';
type DocumentedModel = Omit<Product, 'id' | 'slug' | 'sourceCheckedAt' | 'identification' | 'confirmedGtins'>;
const models: DocumentedModel[] = [
  // refrigerator: modelo e medida conferidos na fonte oficial indicada.
  {
    brand: 'Panasonic',
    model: 'NR-BB41PV2X',
    category: 'refrigerator',
    capacityLiters: 407,
    sourceUrl: 'https://loja.panasonic.com.br/geladeira-panasonic-bb41-aco-escovado-nr-bb41pv2x/p',
  },
  {
    brand: 'Panasonic',
    model: 'NR-BB41GV2B',
    category: 'refrigerator',
    capacityLiters: 407,
    sourceUrl: 'https://loja.panasonic.com.br/geladeira-panasonic-bb41-black-glass-nr-bb41gv2b/p',
  },
  {
    brand: 'Consul',
    model: 'CRM50MB',
    category: 'refrigerator',
    capacityLiters: 412,
    sourceUrl:
      'https://www.consul.com.br/geladeira-frost-free-412-litros-branca-consul-compartimentos-removiveis-crm50mb/p',
  },
  {
    brand: 'Consul',
    model: 'CRM44MB',
    category: 'refrigerator',
    capacityLiters: 377,
    sourceUrl: 'https://www.consul.com.br/geladeira-frost-free-duplex-consul-crm44mb/p',
  },
  {
    brand: 'Consul',
    model: 'CRE45MB',
    category: 'refrigerator',
    capacityLiters: 399,
    sourceUrl: 'https://www.consul.com.br/geladeira-consul-frost-free-duplex-com-freezer-embaixo-cre45mb/p',
  },
  // microwave: modelo e medida conferidos na fonte oficial indicada.
  {
    brand: 'Panasonic',
    model: 'NN-ST26SBRU',
    category: 'microwave',
    capacityLiters: 21,
    sourceUrl: 'https://parceiros.panasonic.com.br/micro-ondas-panasonic-st26-black-glass-nn-st26sbru/p',
  },
  {
    brand: 'Panasonic',
    model: 'NN-ST54RBRU',
    category: 'microwave',
    capacityLiters: 27,
    sourceUrl: 'https://parceiros.panasonic.com.br/micro-ondas--panasonic-st54-black-glass-nn-st54rbru/p',
  },
  {
    brand: 'Panasonic',
    model: 'NN-CD89NBRU',
    category: 'microwave',
    capacityLiters: 30,
    sourceUrl: 'https://parceiros.panasonic.com.br/micro-ondas-panasonic-cd89-black-glass-nn-cd89nbru/p',
  },
  {
    brand: 'Panasonic',
    model: 'NN-ST66NBRU',
    category: 'microwave',
    capacityLiters: 34,
    sourceUrl: 'https://parceiros.panasonic.com.br/micro-ondas-panasonic-st66-black-glass-nn-st66nbru/p',
  },
  {
    brand: 'Panasonic',
    model: 'NN-GT68LBRU',
    category: 'microwave',
    capacityLiters: 30,
    sourceUrl: 'https://parceiros.panasonic.com.br/micro-ondas-panasonic-gt68-black-glass-nn-gt68lbru/p',
  },
  // stove: modelo e medida conferidos na fonte oficial indicada.
  {
    brand: 'Consul',
    model: 'CFO4ZAE',
    category: 'stove',
    burnerCount: 4,
    sourceUrl: 'https://www.consul.com.br/fogao-4-bocas-preto-consul-cf04zae/p',
  },
  {
    brand: 'Consul',
    model: 'CFS5QAB',
    category: 'stove',
    burnerCount: 5,
    sourceUrl: 'https://www.consul.com.br/fogao-piso-consul-5-bocas-dupla-chama-cfs5qab/p',
  },
  {
    brand: 'Consul',
    model: 'CFS6NAB',
    category: 'stove',
    burnerCount: 6,
    sourceUrl: 'https://www.consul.com.br/fogao-piso-consul-6-bocas-cfs6nab/p',
  },
  {
    brand: 'Consul',
    model: 'CFS5VBE',
    category: 'stove',
    burnerCount: 5,
    sourceUrl: 'https://www.consul.com.br/fogao-consul-5-bocas-preto-com-mesa-de-vidro-cfs5vbe-1/p',
  },
  {
    brand: 'Consul',
    model: 'CFS5VAR',
    category: 'stove',
    burnerCount: 5,
    sourceUrl: 'https://www.consul.com.br/fogao-piso-consul-5-bocas-mesa-de-vidro-cfs5var/p',
  },
  // freezer: modelo e medida conferidos na fonte oficial indicada.
  {
    brand: 'Brastemp',
    model: 'BVR28PB',
    category: 'freezer',
    capacityLiters: 276,
    sourceUrl: 'https://www.brastemp.com.br/freezer-vertical-flex-frost-free-brastemp/p',
  },
  {
    brand: 'Brastemp',
    model: 'BVR28NB',
    category: 'freezer',
    capacityLiters: 228,
    sourceUrl: 'https://www.brastemp.com.br/freezer-vertical-brastemp-flex-frost-free-228-litros---bvr28nb/p',
  },
  {
    brand: 'Consul',
    model: 'CHA31MB',
    category: 'freezer',
    capacityLiters: 307,
    sourceUrl: 'https://www.consul.com.br/freezer-horizontal-consul-307-litros-branco-cha31mb/p',
  },
  {
    brand: 'Consul',
    model: 'CHA14MB',
    category: 'freezer',
    capacityLiters: 142,
    sourceUrl: 'https://www.consul.com.br/freezer-horizontal-consul-branco-cha14mb/p',
  },
  {
    brand: 'Consul',
    model: 'CVU30MB',
    category: 'freezer',
    capacityLiters: 293,
    sourceUrl: 'https://www.consul.com.br/freezer-vertical-293-litros-consul-cvu30mb/p',
  },
  // oven: modelo e medida conferidos na fonte oficial indicada.
  {
    brand: 'Brastemp',
    model: 'BOA84AE',
    category: 'oven',
    capacityLiters: 78,
    sourceUrl: 'https://www.brastemp.com.br/forno-a-gas-de-embutir-brastemp-boa84ae/p',
  },
  {
    brand: 'Brastemp',
    model: 'BO260AR',
    category: 'oven',
    capacityLiters: 67,
    sourceUrl: 'https://www.brastemp.com.br/forno-eletrico-de-embutir-brastemp-inox-bo260ar/p',
  },
  {
    brand: 'Brastemp',
    model: 'BOB84AE',
    category: 'oven',
    capacityLiters: 84,
    sourceUrl: 'https://www.brastemp.com.br/forno-eletrico-de-embutir-84-litros-preto-brastemp-bob84ae/p',
  },
  {
    brand: 'Brastemp',
    model: 'BOX47AR',
    category: 'oven',
    capacityLiters: 47,
    sourceUrl:
      'https://www.brastemp.com.br/forno-de-embutir-eletrico-brastemp-47-litros-cinza-com-air-fryer-pro-box47ar/p',
  },
  {
    brand: 'Brastemp',
    model: 'BOB47AE',
    category: 'oven',
    capacityLiters: 47,
    sourceUrl:
      'https://www.brastemp.com.br/forno-de-embutir-eletrico-47-litros-com-3-modos-de-preparo-preto-brastemp-bob47ae/p',
  },
  // cooktop: modelo e medida conferidos na fonte oficial indicada.
  {
    brand: 'Brastemp',
    model: 'BDS85AE',
    category: 'cooktop',
    burnerCount: 5,
    sourceUrl:
      'https://www.brastemp.com.br/cooktop-5-bocas-a-gas-brastemp-com--grades-de-ferro-fundido-e-super-chama-lateral-bds85ae-1/p',
  },
  {
    brand: 'Brastemp',
    model: 'BDS62AE',
    category: 'cooktop',
    burnerCount: 4,
    sourceUrl:
      'https://www.brastemp.com.br/cooktop-4-bocas-brastemp-com-grades-de-ferro--fundido-e-chamas-especiais-1/p',
  },
  {
    brand: 'Brastemp',
    model: 'BDK75DR',
    category: 'cooktop',
    burnerCount: 5,
    sourceUrl: 'https://www.brastemp.com.br/cooktop-a-gas-brastemp-gourmand-5-bocas-bdk75dr/p',
  },
  {
    brand: 'Brastemp',
    model: 'BDD75BE',
    category: 'cooktop',
    burnerCount: 5,
    sourceUrl: 'https://www.brastemp.com.br/cooktop-5-bocas-gas-brastemp-ferro-aramado-chama-simmer-bdd75be/p',
  },
  {
    brand: 'Brastemp',
    model: 'BDJ77BE',
    category: 'cooktop',
    burnerCount: 4,
    sourceUrl: 'https://www.brastemp.com.br/cooktop-4-bocas-de-inducao-brastemp-com-flexizone-preto-bdj77be/p',
  },
  // dishwasher: modelo e medida conferidos na fonte oficial indicada.
  {
    brand: 'Brastemp',
    model: 'BLF61AR',
    category: 'dishwasher',
    placeSettings: 15,
    sourceUrl: 'https://www.brastemp.com.br/lava-loucas-15-servicos-inox-smart-sensor-blf61ar/p',
  },
  {
    brand: 'Brastemp',
    model: 'BLF45AR',
    category: 'dishwasher',
    placeSettings: 11,
    sourceUrl: 'https://www.brastemp.com.br/lavaloucas-inteligente-b-smart-brastemp-11-servicos-inox-blf45ar/p',
  },
  {
    brand: 'Brastemp',
    model: 'BLF08BB',
    category: 'dishwasher',
    placeSettings: 8,
    sourceUrl: 'https://www.brastemp.com.br/lava-loucas-brastemp-8-servicos-branca-blf08bb/p',
  },
  // O manual Midea nomeia DWA08/DWA14 na capa e associa 8/14 serviços na p. 9.
  // Mantemos essas famílias documentais: cor e sufixos de tensão não são inferidos.
  {
    brand: 'Midea',
    model: 'DWA08',
    category: 'dishwasher',
    placeSettings: 8,
    sourceUrl: 'https://conteudo.midea.com.br/manuais/lava-loucas-8-servicos-preta-midea.pdf#page=9',
  },
  {
    brand: 'Midea',
    model: 'DWA14',
    category: 'dishwasher',
    placeSettings: 14,
    sourceUrl: 'https://conteudo.midea.com.br/manuais/lava-loucas-14-servicos-preta-midea.pdf#page=9',
  },
];

export const largeApplianceCatalog: Product[] = models.map((product) => {
  const slug = `${product.brand}-${product.model}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return { ...product, id: slug, slug, sourceCheckedAt: checkedAt, identification: 'candidate', confirmedGtins: [] };
});

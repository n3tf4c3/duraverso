import type { Product } from '@duraverso/core';

// Fontes oficiais brasileiras consultadas em 06/11/2026.
// Cada model transcreve um par completo unidade interna/externa do registro Inmetro;
// não derivamos combinações da nomenclatura, nem contamos unidades separadamente.
// O registro 001167/2021 contém histórico de inclusões e exclusões. É usado somente
// como evidência da identidade e capacidade nominal fria explicitamente em BTU/h.
// Não afirmamos certificação vigente, disponibilidade, eficiência ou durabilidade.
// Sem conversão de watts, duplicação por tensão/cor, GTIN ou variante inferidos.
type DocumentedModel = Pick<Product, 'model' | 'coolingCapacityBtuH' | 'sourceUrl'>;

const models: DocumentedModel[] = [
  // Full Inverter: pares e refrigeração nas linhas incluídas do registro, página 1.
  // A série FTKC/RKC e FTHC/RHC também é descrita pelo fabricante em
  // https://www.daikin.com.br/produto/split-hi-wall-full-inverter .
  {
    model: 'FTKC09T5VL/RKC09T5VL',
    coolingCapacityBtuH: 9000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTKC12T5VL/RKC12T5VL',
    coolingCapacityBtuH: 12000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTKC18T5VL/RKC18T5VL',
    coolingCapacityBtuH: 18000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTKC24T5VL/RKC24T5VL',
    coolingCapacityBtuH: 24000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTHC09T5VL/RHC09T5VL',
    coolingCapacityBtuH: 9000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTHC12T5VL/RHC12T5VL',
    coolingCapacityBtuH: 12000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTHC18T5VL/RHC18T5VL',
    coolingCapacityBtuH: 18000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTHC24T5VL/RHC24T5VL',
    coolingCapacityBtuH: 24000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  // EcoSwing Gold: seis pares na página 1 e dois de 24.000 BTU/h na página 2.
  // Os de 24.000 constam no histórico como excluídos; isso documenta identidade,
  // não comprova registro vigente nem significa uma avaliação de segurança.
  {
    model: 'FTKP09S5VL/RKP09S5VL',
    coolingCapacityBtuH: 9000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTKP12S5VL/RKP12S5VL',
    coolingCapacityBtuH: 12000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTKP18S5VL/RKP18S5VL',
    coolingCapacityBtuH: 18000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTKP24S5VL/RKP24S5VL',
    coolingCapacityBtuH: 24000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=2',
  },
  {
    model: 'FTHP09S5VL/RHP09S5VL',
    coolingCapacityBtuH: 9000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTHP12S5VL/RHP12S5VL',
    coolingCapacityBtuH: 12000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTHP18S5VL/RHP18S5VL',
    coolingCapacityBtuH: 18000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTHP24S5VL/RHP24S5VL',
    coolingCapacityBtuH: 24000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=2',
  },
  // EcoSwing legado: oito pares explicitamente descritos no histórico da página 1.
  // Foram excluídos do registro; permanecem candidatos para relatos de proprietários.
  // Repetições do mesmo conjunto no histórico são consolidadas em uma única linha.
  {
    model: 'FTKP09Q5VL/RKP09Q5VL',
    coolingCapacityBtuH: 9000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTKP12Q5VL/RKP12Q5VL',
    coolingCapacityBtuH: 12000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTKP18Q5VL/RKP18Q5VL',
    coolingCapacityBtuH: 18000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTKP24Q5VL/RKP24Q5VL',
    coolingCapacityBtuH: 24000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTHP09Q5VL/RHP09Q5VL',
    coolingCapacityBtuH: 9000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTHP12Q5VL/RHP12Q5VL',
    coolingCapacityBtuH: 12000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTHP18Q5VL/RHP18Q5VL',
    coolingCapacityBtuH: 18000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
  {
    model: 'FTHP24Q5VL/RHP24Q5VL',
    coolingCapacityBtuH: 24000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=001167%2F2021&pag=1',
  },
];

export const daikinAirConditionerCatalog: Product[] = models.map((product) => {
  const slug = `daikin-${product.model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    ...product,
    id: slug,
    slug,
    brand: 'Daikin',
    category: 'air_conditioner',
    sourceCheckedAt: '2026-11-06',
    identification: 'candidate',
    confirmedGtins: [],
  };
});

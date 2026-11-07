import type { Product } from '@duraverso/core';

// Fontes oficiais consultadas em 06/11/2026. Cada referência é um conjunto
// explicitamente associado pela fonte, na ordem unidade interna/externa.
// BTU/h nominal frio transcrito, sem conversão de watts e sem contar peças isoladas.
// Registros Inmetro são evidência de identidade/medida, inclusive histórica;
// não afirmam aqui certificação vigente, disponibilidade ou desempenho.
// GTINs do conjunto, variantes elétricas e avaliações continuam sem confirmação.
type DocumentedModel = Pick<Product, 'brand' | 'model' | 'coolingCapacityBtuH' | 'sourceUrl'>;

const models: DocumentedModel[] = [
  // Carrier XPower Connect R-32, revisão D: tabelas oficiais da seção 15, pp. 80–83.
  // Conjuntos e medidas também constam no registro Inmetro 006659/2023, página 1.
  // Nominais frios variam por ciclo: modelo 30 tem 31.000 (C)/30.000 (Q) e
  // modelo 60 tem 60.000 (C)/58.000 (Q). Não foram inferidos pelos dígitos do código.
  {
    brand: 'Carrier',
    model: '42ZQVD30C5/38CCVD30515MC',
    coolingCapacityBtuH: 31000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/Manual-do-Usuario-e-Instala%C3%A7%C3%A3o-VERSAO-D-Carrier-Teto-Xpower-Inverter-Connect-R32.pdf#page=80',
  },
  {
    brand: 'Carrier',
    model: '42ZQVD30C5/38CQVD30515MC',
    coolingCapacityBtuH: 30000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/Manual-do-Usuario-e-Instala%C3%A7%C3%A3o-VERSAO-D-Carrier-Teto-Xpower-Inverter-Connect-R32.pdf#page=80',
  },
  {
    brand: 'Carrier',
    model: '42ZQVD36C5/38CCVD36515MC',
    coolingCapacityBtuH: 36000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/Manual-do-Usuario-e-Instala%C3%A7%C3%A3o-VERSAO-D-Carrier-Teto-Xpower-Inverter-Connect-R32.pdf#page=81',
  },
  {
    brand: 'Carrier',
    model: '42ZQVD36C5/38CQVD36515MC',
    coolingCapacityBtuH: 36000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/Manual-do-Usuario-e-Instala%C3%A7%C3%A3o-VERSAO-D-Carrier-Teto-Xpower-Inverter-Connect-R32.pdf#page=81',
  },
  {
    brand: 'Carrier',
    model: '42ZQVD48C5/38CCVD48515MC',
    coolingCapacityBtuH: 48000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/Manual-do-Usuario-e-Instala%C3%A7%C3%A3o-VERSAO-D-Carrier-Teto-Xpower-Inverter-Connect-R32.pdf#page=82',
  },
  {
    brand: 'Carrier',
    model: '42ZQVD48C5/38CQVD48515MC',
    coolingCapacityBtuH: 48000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/Manual-do-Usuario-e-Instala%C3%A7%C3%A3o-VERSAO-D-Carrier-Teto-Xpower-Inverter-Connect-R32.pdf#page=82',
  },
  {
    brand: 'Carrier',
    model: '42ZQVD60C5/38CCVD60515MC',
    coolingCapacityBtuH: 60000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/Manual-do-Usuario-e-Instala%C3%A7%C3%A3o-VERSAO-D-Carrier-Teto-Xpower-Inverter-Connect-R32.pdf#page=83',
  },
  {
    brand: 'Carrier',
    model: '42ZQVD60C5/38CQVD60515MC',
    coolingCapacityBtuH: 58000,
    sourceUrl:
      'https://conteudo.midea.com.br/manuais/Manual-do-Usuario-e-Instala%C3%A7%C3%A3o-VERSAO-D-Carrier-Teto-Xpower-Inverter-Connect-R32.pdf#page=83',
  },
  // Springer Midea é a marca escrita no registro 007915/2014, distinta de Midea.
  // Página 1: pares MACB e TFCA; página 3: pares AFFCG e ABCA, todos ciclo frio.
  // Não extraímos GTINs individuais das unidades nem criamos versões ausentes.
  {
    brand: 'Springer Midea',
    model: '42MACB12S5/38KCY12S5',
    coolingCapacityBtuH: 12000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=007915%2F2014&pag=1',
  },
  {
    brand: 'Springer Midea',
    model: '42MACB18S5/38KCY18S5',
    coolingCapacityBtuH: 18000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=007915%2F2014&pag=1',
  },
  {
    brand: 'Springer Midea',
    model: '42TFCA09S5/38TFCA09S5',
    coolingCapacityBtuH: 9000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=007915%2F2014&pag=1',
  },
  {
    brand: 'Springer Midea',
    model: '42TFCA12S5/38TFCA12S5',
    coolingCapacityBtuH: 12000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=007915%2F2014&pag=1',
  },
  {
    brand: 'Springer Midea',
    model: '42TFCA18S5/38TFCA18S5',
    coolingCapacityBtuH: 18000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=007915%2F2014&pag=1',
  },
  {
    brand: 'Springer Midea',
    model: '42TFCA22S5/38TFCA22S5',
    coolingCapacityBtuH: 22000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=007915%2F2014&pag=1',
  },
  {
    brand: 'Springer Midea',
    model: '42AFFCG12S5/38TFCB12S5',
    coolingCapacityBtuH: 12000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=007915%2F2014&pag=3',
  },
  {
    brand: 'Springer Midea',
    model: '42AFFCG18S5/38TFCB18S5',
    coolingCapacityBtuH: 18000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=007915%2F2014&pag=3',
  },
  {
    brand: 'Springer Midea',
    model: '42AFFCG22S5/38TFCB22S5',
    coolingCapacityBtuH: 22000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=007915%2F2014&pag=3',
  },
  {
    brand: 'Springer Midea',
    model: '42ABCA30S5/38TFCB30S5',
    coolingCapacityBtuH: 30000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=007915%2F2014&pag=3',
  },
  // Elgin: pares explicitamente registrados na família High-Wall Inverter Frio,
  // registro 006724/2014, página 1. Mantidas famílias HJFI, HIFI e HSFI, sem
  // multiplicar variantes de tensão/cor ou repetir revisões de um mesmo par.
  // HSFI12C1IA/HSFE12C1NA também aparece como excluído no histórico (página 4);
  // sua presença documenta identidade histórica para relatos de proprietários.
  {
    brand: 'Elgin',
    model: 'HJFI09C2WB/HJFE09C2CB',
    coolingCapacityBtuH: 9000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=006724%2F2014&pag=1',
  },
  {
    brand: 'Elgin',
    model: 'HJFI12C2WB/HJFE12C2CB',
    coolingCapacityBtuH: 12000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=006724%2F2014&pag=1',
  },
  {
    brand: 'Elgin',
    model: 'HJFI18C2WB/HJFE18C2CB',
    coolingCapacityBtuH: 18000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=006724%2F2014&pag=1',
  },
  {
    brand: 'Elgin',
    model: 'HJFI24C2WB/HJFE24C2CB',
    coolingCapacityBtuH: 24000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=006724%2F2014&pag=1',
  },
  {
    brand: 'Elgin',
    model: 'HJFI30C2WB/HJFE30C2CB',
    coolingCapacityBtuH: 30000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=006724%2F2014&pag=1',
  },
  {
    brand: 'Elgin',
    model: 'HSFI12C1IA/HSFE12C1NA',
    coolingCapacityBtuH: 12000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=006724%2F2014&pag=1',
  },
  {
    brand: 'Elgin',
    model: 'HIFI09C2WA/HIFE09C2CA',
    coolingCapacityBtuH: 9000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=006724%2F2014&pag=1',
  },
  {
    brand: 'Elgin',
    model: 'HIFI12C2WA/HIFE12C2CA',
    coolingCapacityBtuH: 12000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=006724%2F2014&pag=1',
  },
  {
    brand: 'Elgin',
    model: 'HIFI18C2WA/HIFE18C2CA',
    coolingCapacityBtuH: 18000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=006724%2F2014&pag=1',
  },
  {
    brand: 'Elgin',
    model: 'HIFI24C2WA/HIFE24C2CA',
    coolingCapacityBtuH: 24000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=006724%2F2014&pag=1',
  },
  {
    brand: 'Elgin',
    model: 'HIFI30C2WA/HIFE30C2CA',
    coolingCapacityBtuH: 30000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=006724%2F2014&pag=1',
  },
  {
    brand: 'Elgin',
    model: 'HIFI36C2WA/HIFE36C2CA',
    coolingCapacityBtuH: 36000,
    sourceUrl: 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=006724%2F2014&pag=1',
  },
];

export const carrierElginAirConditionerCatalog: Product[] = models.map((product) => {
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
    sourceCheckedAt: '2026-11-06',
    identification: 'candidate',
    confirmedGtins: [],
  };
});

import type { CatalogVariantEvidence } from '@duraverso/core';
import { barcodeEvidence } from './catalog-evidence';

const checkedAt = '2026-11-06';
const inmetro = (page: number) => `https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=000727/2023&pag=${page}`;

// Tuplas explícitas: nunca converter 110 em 127 nem deduzir tensão pela ordem dos GTINs.
// O Inmetro é usado como evidência da identidade/tensão, não como selo de certificação atual.
// Há inclusões e exclusões históricas no registro, inclusive para modelos ainda no catálogo.
const whirlpool: [string, string, string, 127 | 220, number][] = [
  ['brastemp-bwm13ab', '7891129614529', 'BWM13ABANA', 127, 2],
  ['brastemp-bwm13ab', '7891129614703', 'BWM13ABBNA', 220, 2],
  ['brastemp-bwr12b', '7891129564084', 'BWR12BBANA', 127, 1],
  ['brastemp-bwr12b', '7891129564091', 'BWR12BBBNA', 220, 1],
  ['brastemp-bwk13a', '7891129570610', 'BWK13ABANA', 127, 2],
  ['brastemp-bwk13a', '7891129570627', 'BWK13ABBNA', 220, 2],
  ['brastemp-bwk14b', '7891129563551', 'BWK14BBANA', 127, 3],
  ['brastemp-bwk14b', '7891129563568', 'BWK14BBBNA', 220, 3],
  ['brastemp-bwf15a', '7891129568327', 'BWF15ABANA', 127, 1],
  ['brastemp-bwf15a', '7891129568334', 'BWF15ABBNA', 220, 1],
  ['brastemp-bwk16ab', '7891129547964', 'BWK16ABANA', 127, 1],
  ['brastemp-bwk16ab', '7891129547988', 'BWK16ABBNA', 220, 1],
  ['consul-cwm09ab', '7891129615250', 'CWM09ABANA', 127, 2],
  ['consul-cwm09ab', '7891129616219', 'CWM09ABBNA', 220, 2],
  ['consul-cwm12ab', '7891129607491', 'CWM12ABANA', 127, 1],
  ['consul-cwm12ab', '7891129608405', 'CWM12ABBNA', 220, 1],
  ['consul-cwh13ab', '7891129600980', 'CWH13ABANA', 127, 1],
  ['consul-cwh13ab', '7891129600997', 'CWH13ABBNA', 220, 1],
  ['consul-cwh12bb', '7891129552104', 'CWH12BBANA', 127, 1],
  ['consul-cwh12bb', '7891129552111', 'CWH12BBBNA', 220, 1],
  ['consul-cwh15ab', '7891129552258', 'CWH15ABANA', 127, 1],
  ['consul-cwh15ab', '7891129552265', 'CWH15ABBNA', 220, 1],
  ['consul-cwn15ab', '7891129576230', 'CWN15ABANA', 127, 1],
  ['consul-cwn15ab', '7891129576247', 'CWN15ABBNA', 220, 1],
];

// Preservamos a referência RefId da Electrolux, sem tratá-la como código comercial
// completo ou deduzir sufixos de revisão da etiqueta física.
// items.ean, items.referenceId e items.Voltagem pertencem ao mesmo item da API.
const electrolux: [string, string, string, 127 | 220][] = [
  ['LAC09', '7896584070767', '900941406', 127],
  ['LAC09', '7896584070774', '900941407', 220],
  ['LED09', '7909569442005', '900941843', 127],
  ['LED09', '7909569442012', '900941844', 220],
  ['LES11', '7896584099973', '900941648', 127],
  ['LES11', '7896584099980', '900941649', 220],
  ['LED13', '7909569358405', '900941710', 127],
  ['LED13', '7909569358412', '900941711', 220],
  ['LET13', '7909569501764', '900941900', 127],
  ['LET13', '7909569501771', '900941901', 220],
  ['LDA13', '7909569483121', '900941880', 127],
  ['LDA13', '7909569483138', '900941881', 220],
  ['LED15', '7909569358450', '900941714', 127],
  ['LED15', '7909569358467', '900941715', 220],
  ['LAC12', '7896584072143', '900941463', 127],
  ['LAC12', '7896584072150', '900941464', 220],
];

// Preparação documental local. Não consumida pelas rotas públicas ou pelo serviço de avaliações.
export const catalogVariantEvidence: CatalogVariantEvidence[] = [
  ...whirlpool.map(([productSlug, gtin, manufacturerCode, voltage, page]) => {
    const sourceUrl = barcodeEvidence[productSlug]?.dataUrl;
    if (!sourceUrl) throw new Error(`Falta fonte de GTIN para ${productSlug}.`);
    return {
      productSlug, gtin, manufacturerCode, voltage, codeKind: 'manufacturer_reference' as const,
      sourceUrl, voltageSourceUrl: inmetro(page), checkedAt,
      note: 'GTIN e RefId do mesmo item da API oficial, reconferidos nesta data. Tensão nominal pelo código completo no histórico do Inmetro; o rótulo comercial 110V não foi convertido automaticamente. Não declara certificação vigente.',
    };
  }),
  ...electrolux.map(([model, gtin, manufacturerCode, voltage]) => {
    const sourceUrl = `https://loja.electrolux.com.br/api/catalog_system/pub/products/search?ft=${model}`;
    return {
      productSlug: `electrolux-${model.toLowerCase()}`, gtin, manufacturerCode, voltage, codeKind: 'catalog_reference' as const,
      sourceUrl, voltageSourceUrl: sourceUrl, checkedAt,
      note: 'Produto com productReference exato; EAN, referência de catálogo (RefId) e tensão explícitos no mesmo item da API oficial. Não usa ordem de listas nem preenche código comercial ausente/truncado ou revisão de etiqueta.',
    };
  }),
];

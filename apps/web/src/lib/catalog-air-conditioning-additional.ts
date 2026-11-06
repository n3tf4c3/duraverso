import type { Product } from '@duraverso/core';

// Fontes oficiais consultadas em 06/11/2026. Referências comerciais completas:
// não são códigos avulsos de evaporadoras, nem pares deduzidos por semelhança.
// Capacidade de refrigeração em BTU/h; sem multiplicar modelos por tensão/cor.
const checkedAt = '2026-11-06';
const philcoSource = 'https://sac.philco.com.br/catalogos/catalogophilco_arcon.pdf';
const agrattoSource = 'https://registro.inmetro.gov.br/consulta/detalhe.aspx?NumeroRegistro=008946%2F2022&pag=2';
const tclSource = 'https://www.tcl.com/br/pt/air-conditioners/elite-gv-top-discharge-inverter';

const models: Pick<Product, 'brand' | 'model' | 'coolingCapacityBtuH' | 'sourceUrl'>[] = [
  // Philco, página 24: cada modelo comercial tem códigos logísticos separados
  // para unidade interna/externa na mesma coluna; importamos o modelo do conjunto.
  { brand: 'Philco', model: 'PAC9000IFM15', coolingCapacityBtuH: 9000, sourceUrl: philcoSource },
  { brand: 'Philco', model: 'PAC9000IQFM15', coolingCapacityBtuH: 9000, sourceUrl: philcoSource },
  { brand: 'Philco', model: 'PAC12000IFM15', coolingCapacityBtuH: 12000, sourceUrl: philcoSource },
  { brand: 'Philco', model: 'PAC12000IQFM15', coolingCapacityBtuH: 12000, sourceUrl: philcoSource },
  { brand: 'Philco', model: 'PAC18000IFM15', coolingCapacityBtuH: 18000, sourceUrl: philcoSource },
  { brand: 'Philco', model: 'PAC18000IQFM15', coolingCapacityBtuH: 18000, sourceUrl: philcoSource },
  { brand: 'Philco', model: 'PAC24000IFM15', coolingCapacityBtuH: 24000, sourceUrl: philcoSource },
  { brand: 'Philco', model: 'PAC24000IQFM15', coolingCapacityBtuH: 24000, sourceUrl: philcoSource },
  { brand: 'Philco', model: 'PAC30000IFM15', coolingCapacityBtuH: 30000, sourceUrl: philcoSource },
  { brand: 'Philco', model: 'PAC30000IQFM15', coolingCapacityBtuH: 30000, sourceUrl: philcoSource },
  { brand: 'Philco', model: 'PAC36000IQFM15', coolingCapacityBtuH: 36000, sourceUrl: philcoSource },
  // Portáteis completos, tabela técnica da página 6 (refrigeração, não aquecimento).
  // As versões 127/220 V não geram modelos adicionais nem variantes confirmadas.
  { brand: 'Philco', model: 'PAC12000F5', coolingCapacityBtuH: 12000, sourceUrl: philcoSource },
  { brand: 'Philco', model: 'PAC12000QF5', coolingCapacityBtuH: 12000, sourceUrl: philcoSource },
  // Registro ativo da Ventisol da Amazônia, marca Agratto, família split inverter
  // frio. Espaços de quebra de linha antes de 02 foram normalizados; nenhum par
  // foi construído. KNICST12F-02 foi excluído por divergência de capacidade entre
  // registro e fabricante; KNICS30F-02, por divergência com KNICST30F-02 no site.
  { brand: 'Agratto', model: 'KNICST9F-02', coolingCapacityBtuH: 9000, sourceUrl: agrattoSource },
  { brand: 'Agratto', model: 'KNICST18F-02', coolingCapacityBtuH: 18000, sourceUrl: agrattoSource },
  { brand: 'Agratto', model: 'KNICST24F-02', coolingCapacityBtuH: 24000, sourceUrl: agrattoSource },
  { brand: 'Agratto', model: 'ZICST18F-02', coolingCapacityBtuH: 18000, sourceUrl: agrattoSource },
  { brand: 'Agratto', model: 'ZICST24F-02', coolingCapacityBtuH: 24000, sourceUrl: agrattoSource },
  { brand: 'Agratto', model: 'ZICS30F-02', coolingCapacityBtuH: 30000, sourceUrl: agrattoSource },
  // Fichas técnicas oficiais: os splits descrevem ambas as unidades sob uma
  // referência comercial; o AP é portátil completo. Seletores sem ficha própria
  // não foram usados para deduzir outros códigos/capacidades.
  { brand: 'Hisense', model: 'AS-09TW2RLDTT00E', coolingCapacityBtuH: 9000, sourceUrl: 'https://www.hisense.com.br/ar-condicionado/split-hi-connect/' },
  { brand: 'Hisense', model: 'AS-12UW5RXV00A', coolingCapacityBtuH: 12000, sourceUrl: 'https://www.hisense.com.br/ar-condicionado/split-hi-smart/' },
  { brand: 'Hisense', model: 'AP-12CWBRNPS01', coolingCapacityBtuH: 12000, sourceUrl: 'https://www.hisense.com.br/ar-condicionado/portateis-portatil/' },
  // Elite GV: a página informa capacidades de resfriamento de 9.000/12.000.
  // A identidade de 12.000 também foi conferida na listagem oficial específica:
  // https://www.tcl.com/br/pt/air-conditioners/ac-12000-btu
  { brand: 'TCL', model: 'TAC-09CGV-INV', coolingCapacityBtuH: 9000, sourceUrl: tclSource },
  { brand: 'TCL', model: 'TAC-12CGV-INV', coolingCapacityBtuH: 12000, sourceUrl: tclSource },
];

export const additionalAirConditionerCatalog: Product[] = models.map((product) => {
  const slug = `${product.brand}-${product.model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    ...product, id: slug, slug, category: 'air_conditioner', sourceCheckedAt: checkedAt,
    identification: 'candidate', confirmedGtins: [],
  };
});

// Conferência documental em 05/11/2026. Estes dados identificam modelos para
// consulta; não criam variantes, comprovam posse nem liberam avaliações.
export const catalogCheckedAt = '2026-11-05';

export const modelSources = {
  brastempManual: 'https://whirlpool.vteximg.com.br/arquivos/Brastemp_Combo_BWK13_BSR10_Guia_R%C3%A1pido.pdf',
  BWK16AB: 'https://www.brastemp.com.br/maquina-de-lavar-brastemp-16kg-branca-com-ciclo-tira-manchas-advanced-e-ciclo-antibolinha-bwk16ab/p',
  consulManual: 'https://whirlpool.vteximg.com.br/arquivos/Consul-Lavadora-CWH11BB-Guia-Rapido.pdf',
  CWH12BB: 'https://www.consul.com.br/maquina-de-lavar-consul-12-kg-branca-com-dosagem-economica-e-ciclo-edredom-cwh12bb/p',
  CWH15AB: 'https://whirlpool.vteximg.com.br/arquivos/Consul_Lavadora_CWH15AB_Guia_Rapido_Vers%C3%A3o_Digital_1.pdf',
  CWN15AB: 'https://www.consul.com.br/maquina-de-lavar-consul-15-kg-branca-com-modo-eco-cwn15ab/p',
  LAC09: 'https://loja.electrolux.com.br/lavadora-turbo-economia-lac09-com-dispenser-autoclean-etecnologia--jet-clean/p',
  LED09: 'https://loja.electrolux.com.br/maquina-de-lavar-9kg-electrolux-efficient-care--led09-/p',
  LES11: 'https://api.electrolux-medialibrary.com/asset/fffdd6b1-70b8-4cdc-9e7d-ce76c1b88b64/E4RM3Q/499b0a0e-b382-488c-a350-05c165597bcb/ORIGINAL/499b0a0e-b382-488c-a350-05c165597bcb.pdf',
  LED13: 'https://loja.electrolux.com.br/maquina-de-lavar-13kg-electrolux-essential-care-com-cesto-inox-jet-clean-e-ultra-filter--led13-/p?idsku=310118598',
  LET13: 'https://loja.electrolux.com.br/maquina-de-lavar-electrolux-efficient-13kg-branca-compacta--economica-e-pre-diluicao-let13/p?workspace=master',
  // O manual confirma 13 kg; a ficha da loja apresenta 13,1 kg em um campo.
  LDA13: 'https://api.electrolux-medialibrary.com/asset/23a417b5-a045-4e9b-8f18-6d703d08ed5b/E4RM3Q/250521C5AN/PDF/250521C5AN.pdf',
  LED15: 'https://loja.electrolux.com.br/maquina-de-lavar-15kg-electrolux-essential-care-com-cesto-inox-jet-clean-e-ultra-filter--led15-/p?idsku=310118595',
  LAC12: 'https://loja.electrolux.com.br/lavadora-compacta-lac12-com-dispenser-autolimpante-cesto-inox-electrolux/p?skuId=2002554',
};

type BarcodeEvidence = {
  sourceUrl: string;
  checkedAt: string;
  gtins: readonly string[];
  note: string;
};

// A ordem dos códigos não representa voltagem. A busca retorna o modelo,
// nunca uma variante elétrica. Rótulos ambíguos da fonte ficam registrados.
export const barcodeEvidence: Readonly<Partial<Record<string, BarcodeEvidence>>> = {
  'electrolux-lac09': {
    sourceUrl: modelSources.LAC09, checkedAt: catalogCheckedAt,
    gtins: ['7896584070767', '7896584070774'],
    note: 'Campo EAN-13 da ficha; sem correspondência individual de tensão nesse campo.',
  },
  'electrolux-led09': {
    sourceUrl: 'https://loja.electrolux.com.br/regulamento-promo-electrolux', checkedAt: catalogCheckedAt,
    gtins: ['7909569442005', '7909569442012'],
    note: 'Lista de produtos da promoção de agosto de 2024 associa ambos ao LED09. A ficha do produto confirma o segundo como 220 V.',
  },
  'electrolux-les11': {
    sourceUrl: modelSources.LES11, checkedAt: catalogCheckedAt,
    gtins: ['7896584099973', '7896584099980'],
    note: 'Lâmina técnica: 7896584099973 (127 V), 7896584099980 (220 V).',
  },
  'electrolux-led13': {
    sourceUrl: modelSources.LED13, checkedAt: catalogCheckedAt,
    gtins: ['7909569358405', '7909569358412'],
    note: 'Campos EAN - 110v e EAN - 220v. O seletor usa 127V; não converter o rótulo em variante. Ignorado 79095693584, truncado no campo EAN-13.',
  },
  'electrolux-let13': {
    sourceUrl: modelSources.LET13, checkedAt: catalogCheckedAt,
    gtins: ['7909569501764', '7909569501771'],
    note: 'Campo EAN-13: 7909569501764 (127V), 7909569501771 (220V).',
  },
  'electrolux-lda13': {
    sourceUrl: 'https://loja.electrolux.com.br/Maquina-de-Lavar-Electrolux-13g-Efficient-Branca-com-Duplo-Dispenser--Cesto-Inox--Maxima-Diluicao--LDA13-/p?utmi_p=/produtos/LDA13&utmi_pc=botao-loja-online&utmi_src=cuida',
    checkedAt: catalogCheckedAt, gtins: ['7909569483121', '7909569483138'],
    note: 'Campo EAN-13: 7909569483121 (127V), 7909569483138 (220V). Capacidade obtida do manual, não deste campo divergente da loja.',
  },
  'electrolux-led15': {
    sourceUrl: modelSources.LED15, checkedAt: catalogCheckedAt,
    gtins: ['7909569358450', '7909569358467'],
    note: 'Campo EAN-13 da ficha; sem correspondência individual de tensão nesse campo.',
  },
  'electrolux-lac12': {
    sourceUrl: modelSources.LAC12, checkedAt: catalogCheckedAt,
    gtins: ['7896584072143', '7896584072150'],
    note: 'Campo EAN-13 da ficha; sem correspondência individual de tensão nesse campo.',
  },
};

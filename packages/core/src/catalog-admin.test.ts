import { describe, expect, it } from 'vitest';
import { catalogActivationIssues, catalogDecisionSchema, type AdminCatalogProduct } from './index';
const product: AdminCatalogProduct = { id: '00000000-0000-4000-8000-000000000001', slug: 'consul-test', brand: 'Consul', model: 'Test',
  capacityKg: 9, sourceUrl: 'https://example.test/model', sourceCheckedAt: '2026-01-01T00:00:00Z', verified: true, revision: 0,
  variants: [{ id: '00000000-0000-4000-8000-000000000002', manufacturerCode: 'REF127', codeKind: 'catalog_reference', voltage: 127, verified: false,
    gtins: [{ code: '7891129280056', sourceUrl: 'https://example.test/code', voltageSourceUrl: 'https://example.test/voltage', checkedAt: '2026-01-01T00:00:00Z', note: 'Referência documental' }] }] };
const today = new Date('2026-11-06T00:00:00Z');
describe('decisões e evidências administrativas', () => {
  it('exige confirmação e motivo na liberação e recusa permissões no payload', () => {
    const input = { productId: product.id, variantId: null, verified: true, expectedToken: 'a'.repeat(32), reason: 'Fontes conferidas.', evidenceConfirmed: true };
    expect(catalogDecisionSchema.safeParse(input).success).toBe(true);
    for (const changed of [{ evidenceConfirmed: false }, { reason: '   ' }, { role: 'admin' }, { expectedToken: 'antigo' }]) {
      expect(catalogDecisionSchema.safeParse({ ...input, ...changed }).success).toBe(false);
    }
    expect(catalogDecisionSchema.safeParse({ ...input, verified: false, evidenceConfirmed: false }).success).toBe(true);
  });
  it('recusa fontes incompletas, futuras ou inseguras e modelo não liberado', () => {
    // GTIN de fixture com checksum calculado, sem associação a um produto real.
    const fixture = structuredClone(product); fixture.variants[0]!.gtins[0]!.code = '2000000000008';
    expect(catalogActivationIssues(fixture, fixture.variants[0]!.id, today)).toEqual([]);
    expect(catalogActivationIssues({ ...fixture, verified: false }, fixture.variants[0]!.id, today)).not.toEqual([]);
    for (const sourceUrl of ['javascript:alert(1)', 'http://example.test', '']) {
      expect(catalogActivationIssues({ ...fixture, sourceUrl }, null, today)).not.toEqual([]);
    }
    for (const change of [{ code: '2000000000009' }, { voltageSourceUrl: null }, { checkedAt: '2999-01-01' }, { note: ' ' }]) {
      const invalid = structuredClone(fixture); Object.assign(invalid.variants[0]!.gtins[0]!, change);
      expect(catalogActivationIssues(invalid, invalid.variants[0]!.id, today)).not.toEqual([]);
    }
  });
  it('reconfere variantes já liberadas ao reativar o modelo', () => {
    const invalid = structuredClone(product); invalid.verified = false; invalid.variants[0]!.verified = true; invalid.variants[0]!.codeKind = null;
    expect(catalogActivationIssues(invalid, null, today)).not.toEqual([]);
  });
});

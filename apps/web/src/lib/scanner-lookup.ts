import { catalogResponseSchema, isValidGtin, type PublicProduct } from '@duraverso/core';
export function gtinError(value: string): 'empty' | 'chars' | 'length' | 'check' | null {
  if (!value) return 'empty';
  if (!/^\d+$/.test(value)) return 'chars';
  if (![8, 12, 13, 14].includes(value.length)) return 'length';
  return isValidGtin(value) ? null : 'check';
}
export async function lookupBarcode(code: string, signal: AbortSignal, request: typeof fetch = fetch): Promise<PublicProduct[]> {
  const response = await request(`/api/v1/products?q=${encodeURIComponent(code)}`, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('catalog_unavailable');
  const catalog = catalogResponseSchema.parse(await response.json());
  return catalog.data.filter((p) => p.confirmedGtins.includes(code));
}

import { describe, expect, it, vi } from 'vitest';
import { gtinError, lookupBarcode } from './scanner-lookup';
import { catalog as products } from './catalog';
describe('barcode consultation', () => {
  it('separates formatting failures and uses the canonical checksum including the all-zero prohibition', () => {
    expect(gtinError('')).toBe('empty'); expect(gtinError('789-1129614529')).toBe('chars'); expect(gtinError('123')).toBe('length'); expect(gtinError('0000000000000')).toBe('check'); expect(gtinError('7891129614520')).toBe('check'); expect(gtinError('7891129614529')).toBeNull();
  });
  it('uses the public contract and only accepts an exact documented code match', async () => {
    const p = products.find((p) => p.confirmedGtins.length)!; const code = p.confirmedGtins[0]!;
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: products, total: products.length, mode: 'local_catalog' }));
    const signal = new AbortController().signal;
    const result = await lookupBarcode(code, signal, request);
    expect(result.map((p) => p.slug)).toEqual([p.slug]);
    expect(request).toHaveBeenCalledWith(`/api/v1/products?q=${code}`, { signal, headers: { Accept: 'application/json' } });
  });
  it('does not confuse service failure, invalid payload or cancellation with a missing product', async () => {
    const signal = new AbortController().signal;
    await expect(lookupBarcode('7891129614529', signal, vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: 'unavailable' }, { status: 503 })))).rejects.toThrow('catalog_unavailable');
    await expect(lookupBarcode('7891129614529', signal, vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: [] })))).rejects.toThrow();
    await expect(lookupBarcode('7891129614529', signal, vi.fn<typeof fetch>().mockRejectedValue(new DOMException('aborted', 'AbortError')))).rejects.toThrow();
    await expect(lookupBarcode('7891129614529', signal, vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: [], total: 0, mode: 'local_catalog' })))).resolves.toEqual([]);
  });
});

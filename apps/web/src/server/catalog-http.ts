import { catalogQuerySchema, filterCatalog, type CatalogResponse } from '@duraverso/core';

export function catalogGet(read: () => Promise<CatalogResponse>) {
  return async (request: Request) => {
    const parsed = catalogQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success)
      return Response.json({ error: 'Consulta inválida.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    try {
      const { q, brand, capacity, category } = parsed.data;
      const result = filterCatalog(await read(), q, brand, capacity, category);
      return Response.json(result, {
        headers: { 'Cache-Control': result.mode === 'local_catalog' ? 'public, max-age=300' : 'no-store' },
      });
    } catch {
      return Response.json(
        { error: 'Catálogo temporariamente indisponível. Tente novamente.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  };
}

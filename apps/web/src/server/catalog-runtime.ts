import { cache } from 'react';
import { connection } from 'next/server';
import { catalogResponse } from '@/lib/catalog';
import { isConnected } from '@/lib/env';
import { database } from './database';
import { PublicCatalogService } from './catalog';

// Deduplicação apenas dentro da renderização da requisição (inclui metadata).
export const readCatalog = cache(async () => {
  if (!isConnected()) return catalogResponse();
  await connection();
  return new PublicCatalogService(database()).read();
});

export async function readProduct(slug: string) {
  return (await readCatalog()).data.find((product) => product.slug === slug);
}

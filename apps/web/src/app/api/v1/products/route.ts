import { catalogGet } from '@/server/catalog-http';
import { readCatalog } from '@/server/catalog-runtime';

export const GET = catalogGet(readCatalog);

import { z } from 'zod';
import { brands } from '@duraverso/core';
import { catalogResponse } from '@/lib/catalog';
const querySchema = z.object({
  q: z.string().max(120).default(''), brand: z.union([z.enum(brands), z.literal('')]).default(''),
  capacity: z.enum(['', 'small', 'medium', 'large']).default(''),
});
export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return Response.json({ error: 'Consulta inválida.' }, { status: 400 });
  const { q, brand, capacity } = parsed.data;
  return Response.json(catalogResponse(q, brand, capacity), { headers: { 'Cache-Control': 'public, max-age=300' } });
}

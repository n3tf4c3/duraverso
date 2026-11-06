import { catalogResponseSchema, type CatalogResponse } from '@duraverso/core';
import type { Database } from './database';

export class PublicCatalogService {
  constructor(private db: Database) {}

  async read(): Promise<CatalogResponse> {
    try {
      // Uma consulta fornece um retrato consistente. Apenas campos públicos;
      // importar não publica, e códigos de variantes pendentes ficam ocultos.
      const data = await this.db.query(`SELECT p.slug AS id,p.slug,p.brand,p.model,p.capacity_kg::float AS "capacityKg",
        p.source_url AS "sourceUrl",to_char(p.source_checked_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS "sourceCheckedAt",
        'verified' AS identification,
        COALESCE(array_agg(DISTINCT g.code ORDER BY g.code) FILTER (WHERE g.code IS NOT NULL),ARRAY[]::varchar[]) AS "confirmedGtins"
        FROM products p LEFT JOIN variants v ON v.product_id=p.id AND v.verified
        LEFT JOIN gtins g ON g.variant_id=v.id
        WHERE p.verified GROUP BY p.id ORDER BY p.brand,p.model,p.slug`);
      return catalogResponseSchema.parse({ mode: 'database_catalog', data, total: data.length });
    } catch {
      // Não expor detalhes do driver/credenciais nem substituir por candidatos locais.
      throw new Error('Catálogo temporariamente indisponível.');
    }
  }
}

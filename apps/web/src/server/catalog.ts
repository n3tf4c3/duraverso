import { catalogResponseSchema, type CatalogResponse } from '@duraverso/core';
import type { Database } from './database';

export class PublicCatalogService {
  constructor(private db: Database) {}

  async read(): Promise<CatalogResponse> {
    try {
      // Uma consulta fornece um retrato consistente. Apenas campos públicos;
      // importar não publica, e códigos de variantes pendentes ficam ocultos.
      const rows = await this.db.query(`SELECT p.slug AS id,p.slug,p.brand,p.model,p.category,p.capacity_kg::float AS "capacityKg",
        p.capacity_liters::float AS "capacityLiters",p.burner_count AS "burnerCount",
        p.source_url AS "sourceUrl",to_char(p.source_checked_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS "sourceCheckedAt",
        'verified' AS identification,
        COALESCE(array_agg(DISTINCT g.code ORDER BY g.code) FILTER (WHERE g.code IS NOT NULL),ARRAY[]::varchar[]) AS "confirmedGtins"
        FROM products p LEFT JOIN variants v ON v.product_id=p.id AND v.verified
        LEFT JOIN gtins g ON g.variant_id=v.id
        WHERE p.verified GROUP BY p.id ORDER BY p.brand,p.model,p.slug`);
      // Ausência de uma medida não é zero nem uma medida de outra categoria.
      const data = rows.map((row) => Object.fromEntries(Object.entries(row)
        .filter(([key, value]) => value !== null || !['capacityKg', 'capacityLiters', 'burnerCount'].includes(key))));
      return catalogResponseSchema.parse({ mode: 'database_catalog', data, total: data.length });
    } catch {
      // Não expor detalhes do driver/credenciais nem substituir por candidatos locais.
      throw new Error('Catálogo temporariamente indisponível.');
    }
  }
}

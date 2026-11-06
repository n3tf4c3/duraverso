ALTER TABLE "products" ALTER COLUMN "capacity_kg" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category" varchar(30) DEFAULT 'washing_machine' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "capacity_liters" numeric(6, 1);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "burner_count" integer;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "product_category_supported" CHECK ("products"."category" IN ('washing_machine', 'refrigerator', 'microwave', 'stove'));--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "capacity_liters_positive" CHECK ("products"."capacity_liters" > 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "burner_count_positive" CHECK ("products"."burner_count" > 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "product_category_measures" CHECK ((
    ("products"."category" = 'washing_machine' AND "products"."capacity_kg" IS NOT NULL AND "products"."capacity_liters" IS NULL AND "products"."burner_count" IS NULL) OR
    ("products"."category" IN ('refrigerator', 'microwave') AND "products"."capacity_kg" IS NULL AND "products"."burner_count" IS NULL) OR
    ("products"."category" = 'stove' AND "products"."capacity_kg" IS NULL AND "products"."capacity_liters" IS NULL)
  ));
--> statement-breakpoint
-- Amplia o retrato auditável. Alterar categoria ou medida invalida tokens antigos.
-- Omitir medidas ausentes mantém o contrato legado para lavadoras.
CREATE OR REPLACE FUNCTION duraverso_catalog_snapshot(product_key uuid) RETURNS jsonb
LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('id',p.id,'slug',p.slug,'brand',p.brand,'model',p.model,'category',p.category,
    'sourceUrl',p.source_url,'sourceCheckedAt',p.source_checked_at,'verified',p.verified,'revision',p.catalog_revision,
    'variants',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',v.id,'manufacturerCode',v.manufacturer_code,
      'codeKind',v.code_kind,'voltage',v.voltage,'verified',v.verified,
      'gtins',COALESCE((SELECT jsonb_agg(jsonb_build_object('code',g.code,'sourceUrl',g.source_url,
        'voltageSourceUrl',e.voltage_source_url,'checkedAt',e.checked_at,'note',e.note) ORDER BY g.code)
        FROM gtins g LEFT JOIN catalog_variant_evidence e ON e.gtin_code=g.code WHERE g.variant_id=v.id),'[]'::jsonb))
      ORDER BY v.voltage,v.manufacturer_code,v.id) FROM variants v WHERE v.product_id=p.id),'[]'::jsonb))
    || jsonb_strip_nulls(jsonb_build_object('capacityKg',p.capacity_kg,'capacityLiters',p.capacity_liters,'burnerCount',p.burner_count))
  FROM products p WHERE p.id=product_key
$$;
--> statement-breakpoint
-- Marcador criado por último; o preflight também confere as colunas e constraints.
CREATE FUNCTION duraverso_catalog_categories_version() RETURNS integer
LANGUAGE sql IMMUTABLE AS $$ SELECT 1 $$;

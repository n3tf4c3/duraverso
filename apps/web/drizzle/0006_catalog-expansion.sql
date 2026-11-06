-- Expansão aditiva; preserva os registros e INSERTs legados de lavadoras.
ALTER TABLE "products" DROP CONSTRAINT "product_category_supported";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "product_category_measures";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "capacity_liters" SET DATA TYPE numeric(7, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "place_settings" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "power_watts" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "place_settings_positive" CHECK ("products"."place_settings" > 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "power_watts_positive" CHECK ("products"."power_watts" > 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "product_category_supported" CHECK ("products"."category" IN ('washing_machine', 'refrigerator', 'microwave', 'stove', 'freezer', 'oven', 'cooktop', 'dishwasher', 'air_fryer', 'blender', 'vacuum_cleaner', 'coffee_maker'));--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "product_category_measures" CHECK ((
    ("products"."category" <> 'washing_machine' OR "products"."capacity_kg" IS NOT NULL) AND
    ("products"."capacity_kg" IS NULL OR "products"."category" = 'washing_machine') AND
    ("products"."capacity_liters" IS NULL OR "products"."category" IN ('refrigerator', 'microwave', 'freezer', 'oven', 'air_fryer', 'blender', 'coffee_maker')) AND
    ("products"."burner_count" IS NULL OR "products"."category" IN ('stove', 'cooktop')) AND
    ("products"."place_settings" IS NULL OR "products"."category" = 'dishwasher') AND
    ("products"."power_watts" IS NULL OR "products"."category" = 'vacuum_cleaner')
  ));

--> statement-breakpoint
-- Categoria e todas as medidas integram o token e a auditoria.
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
    || jsonb_strip_nulls(jsonb_build_object('capacityKg',p.capacity_kg,'capacityLiters',p.capacity_liters,'burnerCount',p.burner_count,'placeSettings',p.place_settings,'powerWatts',p.power_watts))
  FROM products p WHERE p.id=product_key
$$;

--> statement-breakpoint
-- Amplia somente as marcas aceitas; autorização, locks e auditoria preservados.
CREATE OR REPLACE FUNCTION duraverso_decide_catalog(actor_id uuid, actor_version integer, payload jsonb) RETURNS void
LANGUAGE plpgsql SET search_path = public, pg_temp SET timezone = 'UTC' AS $$
DECLARE actor users; product products; variant variants; snapshot jsonb;
  product_key uuid := (payload->>'productId')::uuid; variant_key uuid := (payload->>'variantId')::uuid;
  desired boolean := (payload->>'verified')::boolean; previous boolean; decision_reason text := trim(payload->>'reason');
BEGIN
  actor := duraverso_actor(actor_id,actor_version);
  IF actor.role <> 'admin' THEN RAISE EXCEPTION 'admin_required'; END IF;
  IF desired IS NULL OR decision_reason IS NULL OR length(decision_reason) NOT BETWEEN 1 AND 2000
    OR (desired AND (payload->>'evidenceConfirmed')::boolean IS DISTINCT FROM true)
    THEN RAISE EXCEPTION 'catalog_decision_invalid'; END IF;
  -- Piloto pequeno: serializa decisões/importação e impede alterações concorrentes nas evidências,
  -- inclusive inserções de GTINs que locks apenas nas linhas existentes não protegeriam.
  LOCK TABLE products,variants,gtins,catalog_variant_evidence IN SHARE ROW EXCLUSIVE MODE;
  SELECT * INTO product FROM products WHERE id=product_key;
  IF NOT FOUND THEN RAISE EXCEPTION 'catalog_not_found'; END IF;
  snapshot := duraverso_catalog_snapshot(product_key);
  IF (payload->>'expectedToken') IS DISTINCT FROM md5(snapshot::text) THEN RAISE EXCEPTION 'catalog_changed'; END IF;
  IF variant_key IS NULL THEN previous := product.verified;
  ELSE
    SELECT * INTO variant FROM variants WHERE id=variant_key AND product_id=product_key;
    IF NOT FOUND THEN RAISE EXCEPTION 'catalog_not_found'; END IF;
    previous := variant.verified;
  END IF;
  IF previous=desired THEN RAISE EXCEPTION 'catalog_decision_invalid'; END IF;
  IF desired THEN
    IF product.brand NOT IN ('Brastemp','Consul','Electrolux','Midea','Panasonic','Philips Walita','WAP') OR length(trim(product.slug))=0 OR length(trim(product.model))=0
      OR product.source_url !~ '^https://[^/[:space:]]+([/?#][^[:space:]]*)?$'
      OR NOT isfinite(product.source_checked_at) OR product.source_checked_at::date>current_date
      THEN RAISE EXCEPTION 'catalog_evidence_required'; END IF;
    IF variant_key IS NOT NULL AND NOT product.verified THEN RAISE EXCEPTION 'catalog_evidence_required'; END IF;
    FOR variant IN SELECT * FROM variants WHERE product_id=product_key AND
      ((variant_key IS NULL AND verified) OR id=variant_key) LOOP
      IF variant.code_kind IS NULL OR length(trim(variant.manufacturer_code))=0
        OR NOT EXISTS(SELECT 1 FROM gtins WHERE variant_id=variant.id)
        OR EXISTS(SELECT 1 FROM gtins g LEFT JOIN catalog_variant_evidence e ON e.gtin_code=g.code WHERE g.variant_id=variant.id AND
          (NOT duraverso_valid_gtin(g.code) OR g.source_url !~ '^https://[^/[:space:]]+([/?#][^[:space:]]*)?$'
            OR e.gtin_code IS NULL OR e.voltage_source_url !~ '^https://[^/[:space:]]+([/?#][^[:space:]]*)?$'
            OR NOT isfinite(e.checked_at) OR e.checked_at::date>current_date OR length(trim(e.note))=0))
        THEN RAISE EXCEPTION 'catalog_evidence_required'; END IF;
    END LOOP;
  END IF;
  IF variant_key IS NULL THEN UPDATE products SET verified=desired WHERE id=product_key;
  ELSE UPDATE variants SET verified=desired WHERE id=variant_key; END IF;
  UPDATE products SET catalog_revision=catalog_revision+1 WHERE id=product_key;
  INSERT INTO catalog_decisions(administrator_id,product_id,variant_id,before_verified,after_verified,reason,snapshot)
    VALUES(actor_id,product_key,variant_key,previous,desired,decision_reason,snapshot);
END $$;

--> statement-breakpoint
-- Publicado por último: a aplicação exige a versão 2 no preflight.
CREATE OR REPLACE FUNCTION duraverso_catalog_categories_version() RETURNS integer
LANGUAGE sql IMMUTABLE AS $$ SELECT 2 $$;

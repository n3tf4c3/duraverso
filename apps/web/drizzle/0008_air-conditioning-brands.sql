-- Amplia somente as marcas aceitas; preserva locks, evidências e auditoria atômica.
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
    IF product.brand NOT IN ('Brastemp','Consul','Electrolux','Midea','Panasonic','Philips Walita','WAP','LG','Samsung','Gree','Daikin','Fujitsu') OR length(trim(product.slug))=0 OR length(trim(product.model))=0
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
-- Preflight exige a whitelist atualizada antes de iniciar o modo conectado.
CREATE OR REPLACE FUNCTION duraverso_catalog_categories_version() RETURNS integer
LANGUAGE sql IMMUTABLE AS $$ SELECT 4 $$;

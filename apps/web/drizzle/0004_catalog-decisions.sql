CREATE TABLE "catalog_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"administrator_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"before_verified" boolean NOT NULL,
	"after_verified" boolean NOT NULL,
	"reason" varchar(2000) NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_decision_reason_required" CHECK (length(trim("catalog_decisions"."reason")) > 0),
	CONSTRAINT "catalog_decision_changes_state" CHECK ("catalog_decisions"."before_verified" <> "catalog_decisions"."after_verified")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "catalog_revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_decisions" ADD CONSTRAINT "catalog_decisions_administrator_id_users_id_fk" FOREIGN KEY ("administrator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_decisions" ADD CONSTRAINT "catalog_decisions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_decisions" ADD CONSTRAINT "catalog_decisions_variant_id_product_id_variants_id_product_id_fk" FOREIGN KEY ("variant_id","product_id") REFERENCES "public"."variants"("id","product_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
-- Snapshot documental completo. O token é um controle de concorrência, não uma credencial.
CREATE FUNCTION duraverso_catalog_snapshot(product_key uuid) RETURNS jsonb
LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('id',p.id,'slug',p.slug,'brand',p.brand,'model',p.model,'capacityKg',p.capacity_kg,
    'sourceUrl',p.source_url,'sourceCheckedAt',p.source_checked_at,'verified',p.verified,'revision',p.catalog_revision,
    'variants',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',v.id,'manufacturerCode',v.manufacturer_code,
      'codeKind',v.code_kind,'voltage',v.voltage,'verified',v.verified,
      'gtins',COALESCE((SELECT jsonb_agg(jsonb_build_object('code',g.code,'sourceUrl',g.source_url,
        'voltageSourceUrl',e.voltage_source_url,'checkedAt',e.checked_at,'note',e.note) ORDER BY g.code)
        FROM gtins g LEFT JOIN catalog_variant_evidence e ON e.gtin_code=g.code WHERE g.variant_id=v.id),'[]'::jsonb))
      ORDER BY v.voltage,v.manufacturer_code,v.id) FROM variants v WHERE v.product_id=p.id),'[]'::jsonb))
  FROM products p WHERE p.id=product_key
$$;
--> statement-breakpoint
CREATE FUNCTION duraverso_catalog_admin_read(actor_id uuid, actor_version integer) RETURNS jsonb
LANGUAGE plpgsql SET search_path = public, pg_temp SET timezone = 'UTC' AS $$
DECLARE actor users; result jsonb;
BEGIN
  actor := duraverso_actor(actor_id,actor_version);
  IF actor.role <> 'admin' THEN RAISE EXCEPTION 'admin_required'; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('product',s.snapshot,'token',md5(s.snapshot::text),'history',
    COALESCE((SELECT jsonb_agg(h.entry ORDER BY h.created_at DESC,h.id DESC) FROM (
      SELECT d.id,d.created_at,jsonb_build_object('id',d.id,'administratorId',d.administrator_id,'administrator',u.display_name,
        'variantId',d.variant_id,'beforeVerified',d.before_verified,'afterVerified',d.after_verified,'reason',d.reason,'createdAt',d.created_at) AS entry
      FROM catalog_decisions d JOIN users u ON u.id=d.administrator_id WHERE d.product_id=p.id
      ORDER BY d.created_at DESC,d.id DESC LIMIT 20) h),'[]'::jsonb)) ORDER BY p.brand,p.model,p.id),'[]'::jsonb)
    INTO result FROM products p CROSS JOIN LATERAL (SELECT duraverso_catalog_snapshot(p.id) AS snapshot) s;
  RETURN result;
END $$;
--> statement-breakpoint
-- Mesma regra de checksum do core; defesa em profundidade para dados legados no banco.
CREATE FUNCTION duraverso_valid_gtin(code text) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE total integer := 0; position integer; size integer := length(code);
BEGIN
  IF code IS NULL OR code !~ '^([0-9]{8}|[0-9]{12}|[0-9]{13}|[0-9]{14})$' OR code ~ '^0+$' THEN RETURN false; END IF;
  FOR position IN 1..size-1 LOOP
    total := total + substr(code,position,1)::integer * CASE WHEN (size-position)%2=1 THEN 3 ELSE 1 END;
  END LOOP;
  RETURN (10-total%10)%10=right(code,1)::integer;
END $$;
--> statement-breakpoint
-- Uma chamada = uma transação, inclusive em Neon HTTP. Nenhum papel é aceito do payload.
CREATE FUNCTION duraverso_decide_catalog(actor_id uuid, actor_version integer, payload jsonb) RETURNS void
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
    IF product.brand NOT IN ('Brastemp','Consul','Electrolux') OR length(trim(product.slug))=0 OR length(trim(product.model))=0
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

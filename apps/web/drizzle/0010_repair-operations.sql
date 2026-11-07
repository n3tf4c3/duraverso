ALTER TABLE "repairs" ADD COLUMN "submission_id" uuid;--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_submission_id_unique" UNIQUE("submission_id");--> statement-breakpoint
-- Reparos detalhados: mesmas garantias das avaliações. Cada operação é uma transação
-- no servidor; ordem de locks igual à das avaliações (posse, avaliação, item).
CREATE OR REPLACE FUNCTION duraverso_submit_repair(actor_id uuid, actor_version integer, submission_key uuid, payload jsonb)
RETURNS uuid LANGUAGE plpgsql SET search_path = public, pg_temp SET timezone = 'UTC' AS $$
DECLARE ownership ownerships; current_review reviews; existing repairs; repair_id uuid;
  symptom_text text := trim(payload->>'symptom'); comment_text text := coalesce(trim(payload->>'comment'),'');
  cost integer;
BEGIN
  PERFORM duraverso_actor(actor_id,actor_version);
  SELECT o.* INTO ownership FROM ownerships o JOIN reviews r ON r.ownership_id=o.id
    WHERE r.id=(payload->>'reviewId')::uuid AND o.owner_id=actor_id FOR UPDATE OF o;
  IF NOT FOUND THEN RAISE EXCEPTION 'review_not_found'; END IF;
  SELECT * INTO current_review FROM reviews WHERE ownership_id=ownership.id FOR SHARE;
  IF current_review.status='withdrawn' THEN RAISE EXCEPTION 'review_withdrawn'; END IF;
  PERFORM 1 FROM variants v JOIN products p ON p.id=v.product_id WHERE v.id=ownership.variant_id AND v.verified AND p.verified;
  IF NOT FOUND THEN RAISE EXCEPTION 'variant_unavailable'; END IF;
  SELECT * INTO existing FROM repairs WHERE submission_id=submission_key;
  IF FOUND THEN
    IF existing.ownership_id<>ownership.id THEN RAISE EXCEPTION 'submission_conflict'; END IF;
    RETURN existing.id;
  END IF;
  IF (payload->>'occurredMonth') !~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
     OR (payload->>'occurredMonth') < ownership.started_using OR (payload->>'occurredMonth') > to_char(current_date,'YYYY-MM')
     THEN RAISE EXCEPTION 'invalid_month'; END IF;
  IF jsonb_typeof(payload->'costCents') NOT IN ('number','null') THEN RAISE EXCEPTION 'repair_invalid'; END IF;
  cost := (payload->>'costCents')::integer;
  IF symptom_text IS NULL OR length(symptom_text) NOT BETWEEN 3 AND 500 OR length(comment_text)>2000
     OR jsonb_typeof(payload->'repaired')<>'boolean' OR (payload->>'resultingStatus') IS NULL
     OR (cost IS NOT NULL AND cost NOT BETWEEN 0 AND 10000000)
     THEN RAISE EXCEPTION 'repair_invalid'; END IF;
  IF (SELECT count(*) FROM repairs WHERE ownership_id=ownership.id AND status<>'withdrawn') >= 20
     THEN RAISE EXCEPTION 'repair_limit'; END IF;
  INSERT INTO repairs(ownership_id,submission_id,occurred_month,symptom,repaired,resulting_status,cost_cents,comment,status)
    VALUES(ownership.id,submission_key,payload->>'occurredMonth',symptom_text,(payload->>'repaired')::boolean,
      (payload->>'resultingStatus')::functioning_status,cost,comment_text,'pending')
    RETURNING id INTO repair_id;
  RETURN repair_id;
END $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION duraverso_moderate_repair(actor_id uuid, actor_version integer, target_id uuid, decision review_status, decision_reason text)
RETURNS void LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE actor users; ownership ownerships; current_review reviews; repair repairs;
BEGIN
  actor := duraverso_actor(actor_id,actor_version);
  IF actor.role NOT IN ('admin','moderator') THEN RAISE EXCEPTION 'moderator_required'; END IF;
  IF decision NOT IN ('published','rejected') OR decision_reason IS NULL OR length(trim(decision_reason))=0 OR length(decision_reason)>2000
    THEN RAISE EXCEPTION 'invalid_decision'; END IF;
  SELECT o.* INTO ownership FROM ownerships o JOIN repairs rp ON rp.ownership_id=o.id WHERE rp.id=target_id FOR UPDATE OF o;
  IF NOT FOUND THEN RAISE EXCEPTION 'repair_not_found'; END IF;
  SELECT * INTO current_review FROM reviews WHERE ownership_id=ownership.id FOR SHARE;
  SELECT * INTO repair FROM repairs WHERE id=target_id FOR UPDATE;
  IF ownership.owner_id=actor_id THEN RAISE EXCEPTION 'own_review'; END IF;
  IF current_review.status='withdrawn' THEN RAISE EXCEPTION 'review_withdrawn'; END IF;
  IF repair.status<>'pending' THEN RAISE EXCEPTION 'revision_not_pending'; END IF;
  UPDATE repairs SET status=decision WHERE id=target_id;
  INSERT INTO moderation_actions(moderator_id,target_type,target_id,action,reason)
    VALUES(actor_id,'repair',target_id,decision::text,trim(decision_reason));
END $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION duraverso_withdraw_repair(actor_id uuid, actor_version integer, target_id uuid)
RETURNS void LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE repair repairs;
BEGIN
  PERFORM duraverso_actor(actor_id,actor_version);
  PERFORM o.id FROM ownerships o JOIN repairs rp ON rp.ownership_id=o.id WHERE rp.id=target_id AND o.owner_id=actor_id FOR UPDATE OF o;
  IF NOT FOUND THEN RAISE EXCEPTION 'repair_not_found'; END IF;
  SELECT * INTO repair FROM repairs WHERE id=target_id FOR UPDATE;
  IF repair.status='withdrawn' THEN RETURN; END IF;
  UPDATE repairs SET status='withdrawn' WHERE id=target_id;
  INSERT INTO moderation_actions(moderator_id,target_type,target_id,action,reason)
    VALUES(actor_id,'repair',target_id,'withdrawn','Retirado pelo autor.');
END $$;

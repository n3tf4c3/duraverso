-- Funções invoker: cada operação é uma única transação no servidor PostgreSQL.
-- Mantém atomicidade também com Neon HTTP, sem transação interativa no cliente.
CREATE OR REPLACE FUNCTION duraverso_actor(actor_id uuid, actor_version integer)
RETURNS users LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE actor users;
BEGIN
  SELECT * INTO actor FROM users WHERE id=actor_id AND session_version=actor_version AND disabled_at IS NULL FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'actor_invalid'; END IF;
  RETURN actor;
END $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION duraverso_submit_review(actor_id uuid, actor_version integer, submission_key uuid, payload jsonb)
RETURNS uuid LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE variant variants; ownership ownerships; current_review reviews; revision_id uuid;
BEGIN
  PERFORM duraverso_actor(actor_id,actor_version);
  SELECT v.* INTO variant FROM variants v JOIN products p ON p.id=v.product_id
    WHERE v.id=(payload->>'variantId')::uuid AND v.verified AND p.verified FOR SHARE OF v,p;
  IF NOT FOUND THEN RAISE EXCEPTION 'variant_unavailable'; END IF;
  IF (payload->>'startedUsing') !~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
     OR (payload->>'startedUsing') < '1900-01' OR (payload->>'startedUsing') > to_char(current_date,'YYYY-MM')
     THEN RAISE EXCEPTION 'invalid_month'; END IF;
  INSERT INTO ownerships(owner_id,product_id,variant_id,started_using,acquired_used,functioning,last_confirmed_at)
    VALUES(actor_id,variant.product_id,variant.id,payload->>'startedUsing',(payload->>'acquired')='used',(payload->>'functioning')::functioning_status,now())
    ON CONFLICT(owner_id,product_id) DO UPDATE SET owner_id=EXCLUDED.owner_id RETURNING * INTO ownership;
  IF ownership.variant_id<>variant.id THEN RAISE EXCEPTION 'ownership_variant_conflict'; END IF;
  INSERT INTO reviews(ownership_id,rating,buy_again,had_repair,comment,status)
    VALUES(ownership.id,(payload->>'rating')::integer,(payload->>'buyAgain')::buy_again,(payload->>'hadRepair')::boolean,payload->>'comment','pending')
    ON CONFLICT(ownership_id) DO UPDATE SET ownership_id=EXCLUDED.ownership_id RETURNING * INTO current_review;
  IF current_review.status='withdrawn' THEN RAISE EXCEPTION 'review_withdrawn'; END IF;
  SELECT id INTO revision_id FROM review_revisions WHERE review_id=current_review.id AND submission_id=submission_key;
  IF FOUND THEN RETURN revision_id; END IF;
  UPDATE review_revisions SET status='withdrawn' WHERE review_id=current_review.id AND status='pending';
  INSERT INTO review_revisions(review_id,submission_id,rating,buy_again,had_repair,comment,status,started_using,acquired_used,functioning,created_at)
    VALUES(current_review.id,submission_key,(payload->>'rating')::integer,(payload->>'buyAgain')::buy_again,(payload->>'hadRepair')::boolean,payload->>'comment','pending',payload->>'startedUsing',(payload->>'acquired')='used',(payload->>'functioning')::functioning_status,clock_timestamp())
    RETURNING id INTO revision_id;
  IF current_review.status<>'published' THEN UPDATE reviews SET status='pending',updated_at=now() WHERE id=current_review.id; END IF;
  RETURN revision_id;
END $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION duraverso_moderate_review(actor_id uuid, actor_version integer, revision_id uuid, decision review_status, decision_reason text)
RETURNS void LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE actor users; target_id uuid; current_review reviews; revision review_revisions; ownership ownerships;
BEGIN
  actor := duraverso_actor(actor_id,actor_version);
  IF actor.role NOT IN ('admin','moderator') THEN RAISE EXCEPTION 'moderator_required'; END IF;
  IF decision NOT IN ('published','changes_requested','rejected') OR length(trim(decision_reason))=0 OR length(decision_reason)>2000 THEN RAISE EXCEPTION 'invalid_decision'; END IF;
  SELECT review_id INTO target_id FROM review_revisions WHERE id=revision_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'review_not_found'; END IF;
  -- Mesma ordem de locks da submissão: posse, avaliação e revisão.
  SELECT o.* INTO ownership FROM ownerships o JOIN reviews r ON r.ownership_id=o.id WHERE r.id=target_id FOR UPDATE OF o;
  SELECT * INTO current_review FROM reviews WHERE id=target_id FOR UPDATE;
  SELECT * INTO revision FROM review_revisions WHERE id=revision_id FOR UPDATE;
  IF ownership.owner_id=actor_id THEN RAISE EXCEPTION 'own_review'; END IF;
  IF current_review.status='withdrawn' THEN RAISE EXCEPTION 'review_withdrawn'; END IF;
  IF revision.status<>'pending' THEN RAISE EXCEPTION 'revision_not_pending'; END IF;
  IF decision='published' THEN
    UPDATE reviews SET rating=revision.rating,buy_again=revision.buy_again,had_repair=revision.had_repair,comment=revision.comment,status='published',updated_at=now() WHERE id=current_review.id;
    UPDATE ownerships SET started_using=revision.started_using,acquired_used=revision.acquired_used,functioning=revision.functioning,last_confirmed_at=now() WHERE id=ownership.id;
  ELSIF current_review.status<>'published' THEN
    UPDATE reviews SET status=decision,updated_at=now() WHERE id=current_review.id;
  END IF;
  UPDATE review_revisions SET status=decision WHERE id=revision.id;
  INSERT INTO moderation_actions(moderator_id,target_type,target_id,action,reason)
    VALUES(actor_id,'review_revision',revision.id,decision::text,trim(decision_reason));
END $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION duraverso_withdraw_review(actor_id uuid, actor_version integer, target_id uuid)
RETURNS void LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE current_review reviews;
BEGIN
  PERFORM duraverso_actor(actor_id,actor_version);
  PERFORM o.id FROM ownerships o JOIN reviews r ON r.ownership_id=o.id WHERE r.id=target_id AND o.owner_id=actor_id FOR UPDATE OF o;
  IF NOT FOUND THEN RAISE EXCEPTION 'review_not_found'; END IF;
  SELECT * INTO current_review FROM reviews WHERE id=target_id FOR UPDATE;
  IF current_review.status='withdrawn' THEN RETURN; END IF;
  UPDATE reviews SET status='withdrawn',updated_at=now() WHERE id=target_id;
  UPDATE review_revisions SET status='withdrawn' WHERE review_id=target_id AND status='pending';
  INSERT INTO moderation_actions(moderator_id,target_type,target_id,action,reason)
    VALUES(actor_id,'review',target_id,'withdrawn','Retirada pelo autor.');
END $$;

CREATE TABLE "rate_limits" (
	"bucket" varchar(20) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"hits" integer NOT NULL,
	CONSTRAINT "rate_limits_bucket_key_hash_window_start_pk" PRIMARY KEY("bucket","key_hash","window_start"),
	CONSTRAINT "rate_limit_hits_positive" CHECK ("rate_limits"."hits" > 0)
);
--> statement-breakpoint
-- Limitador compartilhado no próprio PostgreSQL (substitui o Upstash, sem custo adicional).
-- Uma única instrução atômica incrementa a janela atual; concorrência não ultrapassa o limite.
CREATE OR REPLACE FUNCTION duraverso_rate_limit(p_bucket text, p_key text, p_max integer)
RETURNS boolean LANGUAGE plpgsql SET search_path = public, pg_temp SET timezone = 'UTC' AS $$
DECLARE current_window timestamptz := date_trunc('minute', clock_timestamp()); total integer;
BEGIN
  IF p_bucket IS NULL OR p_bucket NOT IN ('write','auth') OR p_key IS NULL OR p_key !~ '^[a-f0-9]{64}$'
     OR p_max IS NULL OR p_max NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'rate_limit_invalid'; END IF;
  INSERT INTO rate_limits AS rl(bucket,key_hash,window_start,hits) VALUES(p_bucket,p_key,current_window,1)
    ON CONFLICT(bucket,key_hash,window_start) DO UPDATE SET hits=rl.hits+1
    RETURNING rl.hits INTO total;
  -- Limpeza ocasional das janelas encerradas, para a tabela não crescer.
  IF random() < 0.02 THEN DELETE FROM rate_limits WHERE window_start < current_window - interval '10 minutes'; END IF;
  RETURN total <= p_max;
END $$;

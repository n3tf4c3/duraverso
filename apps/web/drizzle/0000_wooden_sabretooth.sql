CREATE TYPE "public"."buy_again" AS ENUM('yes', 'no', 'unsure');--> statement-breakpoint
CREATE TYPE "public"."functioning_status" AS ENUM('working', 'with_problem', 'not_working');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'changes_requested', 'published', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."account_role" AS ENUM('member', 'moderator', 'admin');--> statement-breakpoint
CREATE TABLE "gtins" (
	"code" varchar(14) PRIMARY KEY NOT NULL,
	"variant_id" uuid NOT NULL,
	"source_url" text NOT NULL,
	CONSTRAINT "gtin_format" CHECK ("gtins"."code" ~ '^([0-9]{8}|[0-9]{12}|[0-9]{13}|[0-9]{14})$')
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moderator_id" uuid NOT NULL,
	"target_type" varchar(30) NOT NULL,
	"target_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"reason" varchar(2000) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moderation_reason_required" CHECK (length(trim("moderation_actions"."reason")) > 0)
);
--> statement-breakpoint
CREATE TABLE "ownerships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"started_using" varchar(7) NOT NULL,
	"acquired_used" boolean NOT NULL,
	"functioning" "functioning_status" NOT NULL,
	"last_confirmed_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "owner_one_model" UNIQUE("owner_id","product_id"),
	CONSTRAINT "ownership_month_format" CHECK ("ownerships"."started_using" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"brand" varchar(80) NOT NULL,
	"model" varchar(80) NOT NULL,
	"capacity_kg" numeric(4, 1) NOT NULL,
	"source_url" text NOT NULL,
	"source_checked_at" timestamp with time zone NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "product_brand_model_unique" UNIQUE("brand","model"),
	CONSTRAINT "capacity_positive" CHECK ("products"."capacity_kg" > 0)
);
--> statement-breakpoint
CREATE TABLE "repairs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ownership_id" uuid NOT NULL,
	"occurred_month" varchar(7) NOT NULL,
	"symptom" varchar(500) NOT NULL,
	"repaired" boolean NOT NULL,
	"resulting_status" "functioning_status" NOT NULL,
	"cost_cents" integer,
	"comment" varchar(2000) DEFAULT '' NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repair_cost_nonnegative" CHECK ("repairs"."cost_cents" IS NULL OR "repairs"."cost_cents" >= 0),
	CONSTRAINT "repair_month_format" CHECK ("repairs"."occurred_month" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);
--> statement-breakpoint
CREATE TABLE "review_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"buy_again" "buy_again" NOT NULL,
	"had_repair" boolean NOT NULL,
	"comment" varchar(2000) DEFAULT '' NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "revision_rating_range" CHECK ("review_revisions"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ownership_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"buy_again" "buy_again" NOT NULL,
	"had_repair" boolean NOT NULL,
	"comment" varchar(2000) DEFAULT '' NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_ownership_id_unique" UNIQUE("ownership_id"),
	CONSTRAINT "review_rating_range" CHECK ("reviews"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_subject" varchar(255) NOT NULL,
	"display_name" varchar(80) NOT NULL,
	"role" "account_role" DEFAULT 'member' NOT NULL,
	"session_version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_subject_unique" UNIQUE("google_subject")
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"manufacturer_code" varchar(100) NOT NULL,
	"voltage" integer NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	CONSTRAINT "variant_product_identity" UNIQUE("id","product_id"),
	CONSTRAINT "variant_manufacturer_voltage" UNIQUE("product_id","manufacturer_code","voltage"),
	CONSTRAINT "voltage_supported" CHECK ("variants"."voltage" IN (127, 220))
);
--> statement-breakpoint
ALTER TABLE "gtins" ADD CONSTRAINT "gtins_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_variant_id_product_id_variants_id_product_id_fk" FOREIGN KEY ("variant_id","product_id") REFERENCES "public"."variants"("id","product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_ownership_id_ownerships_id_fk" FOREIGN KEY ("ownership_id") REFERENCES "public"."ownerships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_revisions" ADD CONSTRAINT "review_revisions_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_ownership_id_ownerships_id_fk" FOREIGN KEY ("ownership_id") REFERENCES "public"."ownerships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
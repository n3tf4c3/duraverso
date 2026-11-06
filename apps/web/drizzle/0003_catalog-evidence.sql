CREATE TABLE "catalog_variant_evidence" (
	"gtin_code" varchar(14) PRIMARY KEY NOT NULL,
	"voltage_source_url" text NOT NULL,
	"checked_at" timestamp with time zone NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_evidence_note_required" CHECK (length(trim("catalog_variant_evidence"."note")) > 0)
);
--> statement-breakpoint
ALTER TABLE "variants" ADD COLUMN "code_kind" varchar(30);--> statement-breakpoint
ALTER TABLE "catalog_variant_evidence" ADD CONSTRAINT "catalog_variant_evidence_gtin_code_gtins_code_fk" FOREIGN KEY ("gtin_code") REFERENCES "public"."gtins"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variant_code_kind_supported" CHECK ("variants"."code_kind" IS NULL OR "variants"."code_kind" IN ('manufacturer_reference', 'catalog_reference'));
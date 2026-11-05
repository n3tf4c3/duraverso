ALTER TABLE "review_revisions" ADD COLUMN "submission_id" uuid;--> statement-breakpoint
ALTER TABLE "review_revisions" ADD COLUMN "started_using" varchar(7);--> statement-breakpoint
ALTER TABLE "review_revisions" ADD COLUMN "acquired_used" boolean;--> statement-breakpoint
ALTER TABLE "review_revisions" ADD COLUMN "functioning" "functioning_status";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "review_revisions" ADD CONSTRAINT "review_revisions_submission_id_unique" UNIQUE("submission_id");--> statement-breakpoint
ALTER TABLE "review_revisions" ADD CONSTRAINT "revision_month_format" CHECK ("review_revisions"."started_using" IS NULL OR "review_revisions"."started_using" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
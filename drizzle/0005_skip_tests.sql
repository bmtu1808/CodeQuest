CREATE TABLE "skip_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"question_ids" jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"score" integer,
	"total" integer NOT NULL,
	"passed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "skip_attempts" ADD CONSTRAINT "skip_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skip_attempts" ADD CONSTRAINT "skip_attempts_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skip_user_unit_idx" ON "skip_attempts" USING btree ("user_id","unit_id","started_at");
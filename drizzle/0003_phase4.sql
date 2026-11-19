CREATE TABLE "contest_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contest_problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"label" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"duration_min" integer NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"rated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contests_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "question_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"ease_milli" integer DEFAULT 2500 NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"last_reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rating_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"old_rating" integer NOT NULL,
	"new_rating" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_ratings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"rating" integer DEFAULT 1500 NOT NULL,
	"peak" integer DEFAULT 1500 NOT NULL,
	"contests_rated" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "contest_participant_id" uuid;--> statement-breakpoint
ALTER TABLE "contest_participants" ADD CONSTRAINT "contest_participants_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_participants" ADD CONSTRAINT "contest_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_problems" ADD CONSTRAINT "contest_problems_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_problems" ADD CONSTRAINT "contest_problems_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_reviews" ADD CONSTRAINT "question_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_reviews" ADD CONSTRAINT "question_reviews_question_id_lesson_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."lesson_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_changes" ADD CONSTRAINT "rating_changes_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_changes" ADD CONSTRAINT "rating_changes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ratings" ADD CONSTRAINT "user_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contest_participant_uq" ON "contest_participants" USING btree ("contest_id","user_id","mode");--> statement-breakpoint
CREATE UNIQUE INDEX "contest_problem_label_uq" ON "contest_problems" USING btree ("contest_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX "contest_problem_uq" ON "contest_problems" USING btree ("contest_id","problem_id");--> statement-breakpoint
CREATE INDEX "contests_starts_idx" ON "contests" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "review_user_question_uq" ON "question_reviews" USING btree ("user_id","question_id");--> statement-breakpoint
CREATE INDEX "review_user_due_idx" ON "question_reviews" USING btree ("user_id","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rating_change_uq" ON "rating_changes" USING btree ("contest_id","user_id");--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_contest_participant_id_contest_participants_id_fk" FOREIGN KEY ("contest_participant_id") REFERENCES "public"."contest_participants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "submissions_participant_idx" ON "submissions" USING btree ("contest_participant_id");
--> statement-breakpoint
-- Backfill: every question a learner has already answered correctly enters their review schedule, due in one day.
INSERT INTO "question_reviews" ("user_id", "question_id", "interval_days", "repetitions", "due_at")
SELECT DISTINCT a.user_id, a.question_id, 1, 1, now() + interval '1 day'
FROM "user_question_attempts" a
WHERE a.is_correct
ON CONFLICT DO NOTHING;

CREATE TYPE "public"."difficulty" AS ENUM('newbie', 'easy', 'medium', 'hard', 'expert');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('pending', 'judging', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'compilation_error', 'runtime_error', 'internal_error');--> statement-breakpoint
CREATE TABLE "problem_test_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"input" text NOT NULL,
	"expected_output" text NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"statement" text NOT NULL,
	"input_format" text NOT NULL,
	"output_format" text NOT NULL,
	"constraints" text NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"rating" integer NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"time_limit_ms" integer DEFAULT 1000 NOT NULL,
	"memory_limit_mb" integer DEFAULT 256 NOT NULL,
	"samples" jsonb NOT NULL,
	"hints" jsonb NOT NULL,
	"editorial" text NOT NULL,
	"reference_solution" text NOT NULL,
	"estimated_minutes" integer DEFAULT 15 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"language" text NOT NULL,
	"source_code" text NOT NULL,
	"verdict" "verdict" DEFAULT 'pending' NOT NULL,
	"time_ms" integer,
	"memory_kb" integer,
	"tests_passed" integer DEFAULT 0 NOT NULL,
	"tests_total" integer DEFAULT 0 NOT NULL,
	"failed_test" integer,
	"compile_output" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"judged_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_problem_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"solved" boolean DEFAULT false NOT NULL,
	"solved_at" timestamp with time zone,
	"solved_without_hints" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "problem_test_cases" ADD CONSTRAINT "problem_test_cases_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_problem_progress" ADD CONSTRAINT "user_problem_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_problem_progress" ADD CONSTRAINT "user_problem_progress_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "test_cases_problem_pos_uq" ON "problem_test_cases" USING btree ("problem_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "problems_slug_uq" ON "problems" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "problems_difficulty_idx" ON "problems" USING btree ("difficulty","rating");--> statement-breakpoint
CREATE INDEX "submissions_user_problem_idx" ON "submissions" USING btree ("user_id","problem_id","created_at");--> statement-breakpoint
CREATE INDEX "submissions_problem_verdict_idx" ON "submissions" USING btree ("problem_id","verdict");--> statement-breakpoint
CREATE INDEX "submissions_user_created_idx" ON "submissions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "problem_progress_uq" ON "user_problem_progress" USING btree ("user_id","problem_id");--> statement-breakpoint
CREATE INDEX "problem_progress_user_idx" ON "user_problem_progress" USING btree ("user_id","solved");
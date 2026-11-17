# CodeQuest

> Learn C++. Think Algorithmically. Become a Problem Solver.

CodeQuest is a Duolingo-style web app for learning C++ and, eventually, competitive programming. This repository contains **Phase 1 (MVP)**.

## Status: what is real and what is not

**Implemented and tested against a real PostgreSQL database**

| Area | Notes |
| --- | --- |
| Landing page | Shows the real curriculum read from the database. No fake testimonials. |
| Auth | Sign up, log in, log out. bcrypt hashes, hashed server-side sessions, httpOnly cookie, rate limiting. |
| Onboarding | 5 questions, skippable, stores a recommended world. |
| Dashboard | Continue Learning, level, daily goal, 7-day chart, recent activity. All from the database. |
| Learning Path | Skill-tree map. States: locked / available / in progress / completed / perfected. |
| Lesson engine | 7 question types, immediate feedback, explanations, missed questions return at the end. Progress survives reloads and logout. Grading happens **on the server**; answers are never sent to the browser. |
| XP | Append-only `xp_transactions` ledger with idempotency keys. `user_stats.total_xp` is only a cache written in the same transaction. Replaying a lesson cannot farm XP. |
| Levels | 100-level curve with the titles from the spec. |
| Streaks | Per-user local calendar day (timezone captured at sign-up), milestone bonuses. |
| Profile | Stats and an activity calendar. |
| Content | **World 1, C++ Foundations: 6 units, 18 lessons, 101 questions.** Every code sample is compiled with `g++`, and every "predict the output" answer is checked against the real program output (`npm run content:verify`). |

**Not built yet (nothing fakes them; the UI marks them as roadmap)**

- Worlds 2 to 6 have titles only and are stored unpublished ("Coming soon").
- Coding playground, Monaco editor, Judge0 integration, problem database, submissions (Phase 2). Nothing is ever marked "Accepted" without a real judge.
- Hearts, daily quests, achievements, leaderboards, notifications (Phase 3).
- Contests, statistics page, recommendations, spaced repetition (Phase 4).
- Admin CMS, social features (Phase 5). Content is currently authored in `src/content/` and loaded with `npm run db:seed`.
- Google OAuth and "forgot password" (need external services: Google credentials and an email provider).
- Settings page. Light/dark theme toggle exists in the top bar.

## Deviations from the spec (and why)

- **Drizzle ORM instead of Prisma.** Prisma downloads native engine binaries from `binaries.prisma.sh` during `generate`/`migrate`. That host was blocked in the environment this was built in, so Prisma could not run. Drizzle is pure JavaScript, fully typed, uses plain SQL migrations (`drizzle/`) and is equally at home on Vercel and Supabase. The schema is in `src/server/db/schema.ts`.
- **Custom session auth instead of Auth.js.** Small, auditable and sufficient for email/password. Auth.js can be added when Google OAuth is needed.
- **Geist Mono instead of JetBrains Mono** for code, bundled through the `geist` npm package so builds work offline.
- Next.js 16 and Tailwind CSS v4 (the current releases).

## Tech stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4 · Framer Motion · Lucide · PostgreSQL · Drizzle ORM · Zod · Vitest.

## Run locally

Requirements: Node.js 20+, PostgreSQL 14+, and `g++` only if you want to run `content:verify`.

```bash
# 1. Install
npm install

# 2. Create a database (example for a local Postgres)
sudo -u postgres psql -c "CREATE USER codequest WITH PASSWORD 'choose-a-password' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE codequest OWNER codequest;"

# 3. Configure environment
cp .env.example .env.local
# edit .env.local and set DATABASE_URL

# 4. Create tables and load the curriculum (safe to re-run)
npm run db:setup

# 5. Start
npm run dev          # http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (no `any` allowed) |
| `npm test` | Unit tests. Integration tests run when `TEST_DATABASE_URL` is set |
| `npm run content:verify` | Compiles and runs every C++ sample and checks marked answers |
| `npm run db:generate` | Generate a SQL migration after editing the schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Upsert curriculum. Keeps learner progress |

### Integration tests

They use a real database and **truncate users**, so point them at an empty, separate database:

```bash
sudo -u postgres psql -c "CREATE DATABASE codequest_test OWNER codequest;"
TEST_DATABASE_URL=postgresql://codequest:YOUR_PASSWORD@localhost:5432/codequest_test npm test
```

## Architecture

```
src/
  app/                 routes: (marketing), (auth), (app) dashboard/learn/profile, lesson, onboarding, api
  components/          ui (design system), layout, learning, lesson, dashboard, gamification
  features/            pure domain logic: gamification (xp, streak), learning (grader, recommend), auth
  server/              db (schema, client), services (path, lesson-run, xp, snapshot), auth, rate-limit
  content/             curriculum as typed TypeScript (world1/, roadmap.ts) + builders
scripts/               migrate, seed, verify-content
tests/                 unit + real-database integration tests
drizzle/               SQL migrations
```

Key design decisions:

- **Answers never reach the client.** `lesson_questions.data` is the public payload, `answer` is server-only. `publicData()` re-validates shapes so a bad content entry cannot leak an answer.
- **XP ledger.** Every award goes through `awardXp()` with a unique `(user_id, idempotency_key)`, for example `lesson:<id>:complete`. A second award with the same key is a no-op.
- **Lesson completion is one transaction** that locks the user's stats row, verifies every question was answered correctly, awards XP, updates streak, progress and activity.
- **Rules:** first completion earns the lesson XP; a first-time perfect run adds +10; a later perfect replay can claim the +10 once; other replays earn nothing but count for the streak.
- **Adding a question type:** add it to `QUESTION_TYPES`, to `grade()` and `publicData()` in `features/learning/grader.ts`, and add a renderer in `components/lesson/question-views.tsx`. No migration needed.
- **Adding content:** add a lesson to a unit file in `src/content/`, run `npm run content:verify`, then `npm run db:seed`.

## Security notes

- Passwords: bcrypt (cost 12). Sessions: random 256-bit token, only its SHA-256 is stored.
- All inputs validated with Zod. All SQL goes through Drizzle (parameterised).
- Security headers are set in `next.config.ts`.
- **Rate limiting is in-memory** (`src/server/rate-limit.ts`). On a multi-instance host such as Vercel it is per instance. Back it with Redis before relying on it in production.
- No user code is executed anywhere in this MVP. When Phase 2 adds code execution it must run in an isolated judge (Judge0 or similar), never in the Next.js process.
- Secrets live only in `.env.local` (git-ignored). `.env.example` contains placeholders.

## Deploy

1. Create a managed PostgreSQL database (for example Supabase). Copy its connection string.
2. Create a Vercel project from your GitHub repository.
3. Set environment variables in Vercel: `DATABASE_URL`, `DATABASE_SSL=true`, `NEXT_PUBLIC_APP_URL`.
4. From your machine, with `DATABASE_URL` pointing at the production database, run `npm run db:setup` once. Re-run `npm run db:seed` after content changes.
5. Deploy. Pages that read the database are rendered dynamically, so the build does not need database access.

## Assumptions

- XP curve: 100 XP for level 2, each next level needs 20 XP more. Values live in `src/features/gamification/xp.ts` and are ready to move into an admin-configurable table.
- Daily XP goal comes from the onboarding "minutes per day" answer (20/40/60/80 XP).
- Lessons unlock strictly in order across the whole path.

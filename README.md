# GFF Leagues

GFF Leagues is a mobile-first Progressive Web App for the Gambia Football Federation. It is designed as a central data platform for Gambian football leagues, fixtures, results, standings, teams, players, and controlled admin workflows.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS
- PostgreSQL on Supabase
- Supabase Auth integration point
- Prisma ORM schema and seed data
- Vercel deployment
- PWA manifest and service worker

## App Features

- Home dashboard with featured matches, upcoming fixtures, latest results, standings preview, team/player search, and top scorers.
- League index and detail pages for First Division, Second Division, Third Division, youth leagues, cup tournaments, and future women's leagues.
- Team profiles with logo, division, home ground, coach, squad, fixtures, results, and team stats.
- Player profiles with biographical details and football stats.
- Fixtures and results pages with mobile-friendly filters and match event displays.
- Standings tables with played, wins, draws, losses, goals for, goals against, goal difference, and points.
- Admin dashboard mock surface for role-based workflows, approvals, uploads, audit logs, and quick create actions.

## Data Rules

- Standings are computed from approved results only.
- Team admins update team profile and squad data, but standings are not directly editable.
- Match officials submit scores and events.
- Super Admin approves or rejects results.
- Important admin actions should create `audit_logs` records.

The sample UI computes standings in `src/lib/data.ts`. In production, move that recalculation into a transaction or Supabase Edge Function triggered when a result is approved.

## Local Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Create a Supabase project and paste the database URL plus public Supabase values into `.env`.

4. Push the Prisma schema:

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

5. Seed sample data:

   ```bash
   pnpm db:seed
   ```

6. Start the app:

   ```bash
   pnpm dev
   ```

## Supabase Setup

- Enable Supabase Auth email login.
- Store Supabase Auth user IDs in the `users.authId` column.
- Use the `roles` table to map authenticated users to Super Admin, League Admin, Team Admin, Match Official/Data Entry, or Public User.
- Create storage buckets for `team-logos` and `player-photos`.
- Add Row Level Security policies so team admins can only update their assigned team and squad records.

## Vercel Deployment

1. Push this repository to GitHub.
2. Import it in Vercel as a Next.js project.
3. Add the environment variables from `.env.example`.
4. Set the build command to:

   ```bash
   pnpm build
   ```

5. Deploy. The PWA manifest is available at `/manifest.webmanifest`, and the production service worker registers from `/sw.js`.

## Important Files

- `prisma/schema.prisma` - PostgreSQL schema for users, roles, leagues, seasons, teams, players, fixtures, matches, events, standings, stats, news, and audit logs.
- `prisma/seed.ts` - Sample seed data for roles, leagues, teams, players, fixtures, events, and audit logs.
- `src/lib/data.ts` - Frontend sample data and standings calculation.
- `src/lib/supabase.ts` - Lazy Supabase browser client.
- `src/lib/prisma.ts` - Lazy Prisma client helper.

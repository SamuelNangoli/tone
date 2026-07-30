# Tone

**Learn your voice once. Sound like yourself everywhere.**

Tone is an AI writing tool for marketing teams whose moat is a **persistent
Brand Voice Profile** — not one-off generation. You teach it your voice once
(writing samples + website + a short quiz); every draft after that is
conditioned on the profile, and a feedback loop keeps sharpening it.

## Quick start

```bash
npm install
npx prisma db push     # creates the local SQLite database
# configure Supabase auth (see below) before signing in
npm run dev
```

Open http://localhost:3000. The app runs even before Supabase is configured —
the landing page loads and the login screen shows a "finish setup" banner. To
actually sign in or sign up, set up Supabase auth first.

## Authentication (Supabase)

Auth is handled by **Supabase Auth**. The app needs three values in `.env`.
Without valid keys you'll see a setup banner instead of being able to sign in
(this is the fix for the old "internet error" — a missing/paused Supabase
project no longer crashes every page).

**Where to get the keys** — in the [Supabase dashboard](https://supabase.com/dashboard):

1. Open your project (or create a free one). If it shows **"Paused"**, click
   **Restore** — free projects auto-pause after ~1 week of inactivity, and a
   paused project is unreachable, which is what caused the "internet error".
2. Go to **Project Settings → API**.
3. Copy these into `.env`:

   ```ini
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<the "anon / public" key — a long JWT, ~220 chars>
   SUPABASE_SERVICE_ROLE_KEY=<the "service_role" key — also a long JWT; server-only>
   ```

   Both keys are JWTs starting with `eyJ...`. If a value is under ~100
   characters you copied the wrong field (likely the project ref, not the key).

4. Restart the dev server so the new env is picked up.

The `service_role` key bypasses row-level security and is only used server-side
(inviting teammates, seeding). Never expose it to the client or commit it.

### Seed a demo workspace (optional)

`prisma/seed.js` creates the demo users in **both** Supabase Auth and the local
database, so it needs the Supabase keys above set first:

```bash
node prisma/seed.js    # demo@tone.app / demo1234 + a teammate
```

## AI provider

All AI calls go through one service (`src/lib/ai`). The model is swappable:

- **No key set** → a deterministic local mock provider that still reads the
  voice profile (sliders, do/don't words, traits), so the entire product —
  including live voice controls — works offline.
- **`ANTHROPIC_API_KEY` set in `.env`** → Claude (`claude-opus-4-8`) with the
  voice profile compiled into the system prompt and structured JSON output for
  the side-by-side variations.

Add another provider by implementing `AIProvider` in `src/lib/ai/types.ts` and
wiring it in `src/lib/ai/index.ts`.

## Database

Local dev uses **SQLite** (zero setup). The schema is Postgres/Supabase
compatible: enum-like fields are strings, JSON payloads are text columns.

To move to Supabase:

1. In `prisma/schema.prisma`, change the datasource `provider` to
   `"postgresql"`.
2. Set `DATABASE_URL` in `.env` to your Supabase connection string
   (Settings → Database → Connection string, use the pooled port 6543 with
   `?pgbouncer=true` for serverless).
3. `npx prisma db push` (and re-seed if you want the demo data).

## Product map

| Area | Where |
|---|---|
| Voice Profile object (the asset) | `src/lib/voice.ts`, stored as JSON in `VoiceProfile.data` |
| Onboarding wizard (samples → website → quiz) | `src/app/onboarding` |
| Writing workspace (3-pane, live voice controls, format previews) | `src/components/write-workspace.tsx`, `src/components/previews.tsx` |
| Feedback loop → accuracy score | `src/app/api/feedback`, `refreshAccuracy` in `src/lib/api.ts` |
| Drafts (draft / approved / published) | `src/app/app/drafts` |
| Team roles (owner / editor / viewer) | enforced in API routes, managed in Settings |
| Theme, density, focus mode, per-workspace accent | `src/components/app-context.tsx`, Settings |

## Roles

- **Owner** — everything, including workspace settings, members, deletes.
- **Editor** — generate, edit, save drafts, tune profiles.
- **Viewer** — read-only.

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
node prisma/seed.js    # optional: demo workspace
npm run dev
```

Open http://localhost:3000 and sign in as **demo@tone.app / demo1234**
(seeded), or sign up to walk through the voice-onboarding wizard.

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

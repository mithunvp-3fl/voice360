# VoiceOver360

Voice-driven, offline-first audit platform for non-IT auditors in food, pharma, and retail. 3-month POC — full scope and decisions live in [`audit-app-poc-plan.md`](./audit-app-poc-plan.md).

## Layout

```
apps/admin       Next.js 15 admin web (audits, templates, vendors, PDF reports)
apps/mobile      Expo (React Native) auditor app — offline-first, voice mode
packages/shared  Shared types, lexicon, sync contract
packages/checklists  Seed data: 3 industry templates, demo vendors, demo users
supabase         Postgres schema, RLS, seed
```

## Quick start

```bash
pnpm install
pnpm typecheck
pnpm admin     # http://localhost:3000
```

Mobile needs a dev build (whisper.rn / onnxruntime / sqlite are native modules):
```bash
cd apps/mobile && npx expo prebuild && npx expo run:android
```

Env vars: see `.env.example`.

## Deployment

- **Admin** → Vercel (auto-deploys via GitHub integration; `runtime = 'nodejs'` is set on PDF + sync routes).
- **Supabase migrations** → applied by `.github/workflows/supabase-migrate.yml` on push to main.
- **Mobile OTA updates** → `.github/workflows/eas-update.yml` on push to main.
- **Mobile native builds** → `.github/workflows/eas-build.yml`, manual trigger.

Required GitHub repo secrets:

| Secret | Used by |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | supabase-migrate |
| `SUPABASE_PROJECT_REF` | supabase-migrate |
| `SUPABASE_DB_PASSWORD` | supabase-migrate |
| `EXPO_TOKEN` | eas-update, eas-build |

Vercel handles its own secrets (set via `vercel env add` or dashboard).

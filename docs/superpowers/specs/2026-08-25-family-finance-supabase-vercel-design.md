# Family Finance → Supabase Auth + Postgres + Vercel (Free)

**Date:** 2026-08-25  
**Status:** Approved for implementation planning  
**Stack choice:** Vite SPA + Supabase JS client + normalized Postgres tables

## Goal

Keep the existing Family Finance app (Thắng & Vân) feature set intact. Replace `localStorage` persistence with Supabase Postgres, add Google OAuth via Supabase Auth, and deploy the static Vite build to Vercel. Stay on free tiers for both services.

## Requirements (locked)

| Topic | Decision |
|--------|----------|
| Users | Exactly 2 people, one shared household, both can read and write all household data |
| Auth | Google OAuth through Supabase |
| Access control | Whitelist of 2 fixed emails in SQL/migration; other Google accounts may complete OAuth but see a blocked screen and get no data via RLS |
| Sync | No Realtime; the other user sees updates after refresh / reopen |
| Feature scope | Full existing feature set; swap storage + add login only |
| Initial data | Empty DB; no demo seed transactions; users enter data over time |
| Hosting | Vercel free (static Vite `dist`) |
| Database / Auth | Supabase free project |

## Non-goals

- Multi-household / multi-tenant product
- Realtime collaboration
- Migrating to Next.js
- Storing the whole `AppState` as a single JSON document
- Exposing `service_role` keys to the client
- Seed / demo transaction datasets in production

## Architecture

```
[Browser: Vite React SPA]
        │  Google OAuth (PKCE redirect)
        ▼
[Supabase Auth]
        │  email ∈ whitelist? → household_members
        ▼
[Supabase Postgres + RLS]
  households + domain tables (transactions, accounts, …)
        │
        ▼
[Vercel] serves static build from `dist`
```

- **Frontend:** Existing Vite + React UI. Add `@supabase/supabase-js`, login / blocked screens, and replace `src/lib/storage.ts` with Supabase-backed load/save while keeping `AppState` shape for components.
- **Backend:** No custom API server. Browser talks to Supabase; authorization is Postgres RLS.
- **Secrets on client:** Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable / anon). Never ship `service_role`.

### Environment variables

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

Values are set in local `.env` / `.env.local` (gitignored) and in the Vercel project settings. Do not commit real keys.

## Data model

### Identity & tenancy

- **`households`** — one row for this family app instance (created in migration).
- **`members`** — directory used by the UI (`thang`, `van`): name, avatar color, role. Created in migration as structural rows (not financial seed data).
- **`allowed_emails`** — the two Google emails allowed to join. Source of truth for whitelist lives in SQL/migration.
- **`profiles`** — `user_id` (auth.users) → display name from Google.
- **`household_members`** — links `auth.users.id` → `household_id` + `member_key` (`thang` | `van`).

**Whitelist → membership provisioning:** After Google login, a Postgres function (SECURITY DEFINER, not client-writable) checks `auth.jwt()` / user email against `allowed_emails`. If matched and not already linked, it inserts `household_members` with the pre-assigned `member_key` for that email. If not matched, no membership row is created. Clients cannot grant themselves access by inserting into `household_members`.

**Implementation gate:** Before applying the whitelist migration, collect the two real Google account emails and map each to `thang` or `van`. Do not ship placeholder emails to production.

### Domain tables (financial / planning)

Map 1:1 from existing TypeScript models in `src/types/finance.ts`, each row scoped by `household_id`:

- `accounts`, `categories`, `transactions`, `suggestion_rules`, `budgets`, `income_plans`
- `credit_card_config`, `credit_card_statements`, `installment_plans`
- `savings_deposits`, `counterparties`, `loans`, `funds`
- `planned_expenses`, `goals`, `events`, `event_items`, `event_contributions`
- `recurring_transactions`, `audit_logs`

Conventions:

- Prefer UUID primary keys; keep stable string keys for `members` (`thang` / `van`) and any account ids the UI already treats as fixed only if required for a smooth port.
- Soft delete for transactions via `deleted_at` to match the current model.
- Timestamps: `created_at`, `updated_at` where the domain model already has them.
- **Empty financial start:** migration does **not** insert transactions, budgets, accounts, categories, or other financial rows. The UI must work with empty collections; users add data over time.

### RLS

- Enable RLS on every table in `public`.
- Policy pattern: user may SELECT/INSERT/UPDATE/DELETE only rows whose `household_id` is in `household_members` for `auth.uid()`.
- `allowed_emails` is not broadly readable/writable by clients (or is readable only as needed for admin-less flows); membership is granted only via the SECURITY DEFINER provisioning function.
- Users not on the whitelist never get a `household_members` row → domain queries return empty / denied.
- Do not authorize from editable `user_metadata` JWT claims. Membership is table-driven.
- Views (if any) use `security_invoker = true` or stay out of the exposed API.

## Auth & app flow

1. Unauthenticated user sees Login → “Continue with Google”.
2. Supabase Google OAuth redirects back to the Vite app.
3. App calls `supabase.auth.getUser()`.
4. If email is not whitelisted / no `household_members` row → “Không có quyền truy cập” screen; no domain queries that assume access.
5. If authorized → parallel fetch of domain tables for the household → hydrate `AppState`.
6. Mutations (create/update/delete) go through the storage/data-access layer to Supabase instead of `localStorage`.
7. Refresh reloads from the database (no Realtime subscription in v1).
8. Existing Export/Import JSON may remain as optional manual backup; it is not the bootstrap path for the cloud DB.

### Google / Supabase dashboard setup

- Enable Google provider with Google Cloud OAuth Client ID/Secret.
- Supabase Auth redirect: `https://<project-ref>.supabase.co/auth/v1/callback`.
- Site URL: production Vercel URL; add `http://localhost:3000` for local dev (app currently uses Vite port 3000).

## Code structure (target)

| Area | Change |
|------|--------|
| `src/lib/supabase.ts` | Create browser client from Vite env |
| `src/lib/storage.ts` | Replace localStorage engine with Supabase load/save APIs preserving `AppState` |
| `src/App.tsx` | Auth gate, load-on-login, persist via async storage |
| Auth UI | Login + blocked screens |
| Components | Prefer no behavior change; keep props/`AppState` contracts |
| `supabase/migrations/` | Schema + RLS + whitelist seed |

## Deploy (Vercel)

- Import Git repo; framework preset Vite; build `vite build`; output `dist`.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- SPA fallback: rewrite all routes to `index.html` if client routes / OAuth return paths need it.

## Error handling

- OAuth failure → message + retry.
- Non-whitelisted user → blocked UI; RLS ensures no data leak.
- Save failure → keep prior UI state, show clear error (do not silently pretend success).
- Load failure → error state with retry; do not fall back to writing a local seed dataset into cloud.

## Testing plan

- Whitelisted Google account A and B can log in and CRUD shared data; refresh shows persistence.
- Non-whitelisted Google account is blocked and cannot read household rows (verify via UI and optionally SQL/RLS).
- Smoke all main tabs: Home, Transactions, Plan, Insights, More with empty then populated data.
- Vercel preview/production URL completes Google OAuth redirect with correct Site URL and env vars.

## Free-tier notes

- Vercel Hobby: static Vite site is appropriate.
- Supabase Free: Auth + Postgres sufficient for two users and household-scale rows; no Realtime requirement reduces complexity and load.

## Open input for implementation (not design ambiguity)

- The two concrete Google emails for the SQL whitelist (required before production migration apply).

# Family Finance — Thắng & Vân

Vite + React app with Supabase Auth (Google) and Postgres. Deploy target: Vercel.

## Local setup

1. `npm install`
2. Copy `.env.example` → `.env.local` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. In Supabase Dashboard → Authentication:
   - Enable **Google** provider (Google Cloud OAuth Client ID/Secret)
   - Redirect URI: `https://ysxhprvlxflhmeaiujfp.supabase.co/auth/v1/callback`
   - Site URL: `http://localhost:3000` (add production Vercel URL later)
4. `npm run dev` → http://localhost:3000

Whitelist emails are fixed in SQL migration (`allowed_emails`).

## Scripts

- `npm run dev` — local Vite on port 3000
- `npm run build` — production build to `dist`
- `npm test` — Vitest unit tests
- `npm run lint` — `tsc --noEmit`

## Deploy (Vercel)

1. Import GitHub repo `thangnv-ops/family-finance-app`, branch `feat/supabase-vercel` (or `main`)
2. Framework: Vite · Build: `vite build` · Output: `dist`
3. Env: same `VITE_SUPABASE_*` values
4. Set Supabase Auth Site URL to the Vercel domain

# Family Finance Supabase + Vercel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the existing Family Finance Vite app’s full feature set, replace `localStorage` with Supabase Postgres + Google OAuth (2 whitelisted emails, one household), and deploy the static build to Vercel on free tiers.

**Architecture:** Vite SPA talks directly to Supabase Auth/Postgres with RLS. A SECURITY DEFINER RPC provisions `household_members` from `allowed_emails`. `AppState` stays the UI contract; `src/lib/storage.ts` becomes async load + diff-sync to normalized tables. No Realtime; refresh reloads.

**Tech Stack:** Vite 6, React 19, TypeScript, `@supabase/supabase-js`, Supabase Auth (Google), Postgres + RLS, Vitest, Vercel static hosting.

## Global Constraints

- Free tiers only (Vercel Hobby + Supabase Free).
- Client env only: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — never `service_role`.
- Google OAuth only; whitelist of exactly 2 emails in SQL; non-whitelisted users see blocked UI and get no data via RLS.
- No Realtime in v1.
- No financial seed data (no demo transactions/budgets/accounts/categories); migration may create household + `members` (`thang`/`van`) + `allowed_emails` only.
- Preserve existing UI feature set; prefer not rewriting components’ props contracts.
- Do not authorize from editable `user_metadata`; membership is table-driven.
- Dev server port remains `3000` (`npm run dev`).

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `supabase/migrations/20260825120000_identity_rls.sql` | households, members, allowed_emails, profiles, household_members, claim RPC, RLS |
| `supabase/migrations/20260825120100_domain_tables.sql` | All financial/planning tables + RLS |
| `src/lib/supabase.ts` | Browser Supabase client from Vite env |
| `src/lib/emptyState.ts` | Build empty `AppState` (no financial seed) |
| `src/lib/db/types.ts` | Row types / collection keys for sync |
| `src/lib/db/mappers.ts` | App model ↔ DB row mapping |
| `src/lib/db/loadState.ts` | Parallel fetch → `AppState` |
| `src/lib/db/syncState.ts` | Diff prev/next `AppState` → upsert/delete |
| `src/lib/auth.ts` | Session helpers, `claimMembership`, access status |
| `src/lib/storage.ts` | Keep `AppState` type + export/import JSON; remove localStorage as source of truth |
| `src/hooks/useAuthSession.ts` | Auth state + claim + household context |
| `src/components/auth/LoginScreen.tsx` | Google login CTA |
| `src/components/auth/AccessDeniedScreen.tsx` | Blocked non-whitelist UI |
| `src/components/auth/AppLoadingScreen.tsx` | Loading / error with retry |
| `src/App.tsx` | Auth gate; async load; debounced `syncAppState` |
| `.env.example` | Document Vite Supabase vars |
| `vercel.json` | SPA rewrite to `index.html` |
| `vitest.config.ts` | Unit test config |
| `src/lib/db/mappers.test.ts` | Mapper tests |
| `src/lib/db/syncState.test.ts` | Diff/sync planning tests |
| `src/lib/auth.test.ts` | Access-status pure logic tests |
| `src/lib/emptyState.test.ts` | Empty state shape tests |

---

### Task 0: Collect whitelist emails (gate)

**Files:**
- Create: `supabase/migrations/20260825120000_identity_rls.sql` (emails filled in Task 1)

**Interfaces:**
- Consumes: none
- Produces: two concrete Google emails mapped to `thang` and `van` for Task 1 SQL

- [ ] **Step 1: Ask the human for the two Google account emails**

Stop and ask if not already known:

1. Email for **Thắng** (`member_key = 'thang'`)
2. Email for **Vân** (`member_key = 'van'`)

Do not invent emails. Do not proceed to Task 1 until both are provided in chat.

- [ ] **Step 2: Record mapping in the working notes for Task 1**

Example (replace with real values from Step 1):

```text
thang → alice@gmail.com
van   → bob@gmail.com
```

- [ ] **Step 3: Commit**

No code yet — skip commit if nothing to add. If a private note file is created, do **not** commit secrets; prefer keeping emails only inside the SQL migration in Task 1.

---

### Task 1: Identity schema, claim RPC, RLS

**Files:**
- Create: `supabase/migrations/20260825120000_identity_rls.sql`

**Interfaces:**
- Consumes: email map from Task 0
- Produces: tables `households`, `members`, `allowed_emails`, `profiles`, `household_members`; function `public.claim_household_membership()` returns `{ household_id uuid, member_key text, status text }` where `status` is `ok` | `forbidden`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/20260825120000_identity_rls.sql` with the following content. **Replace the two email literals** with Task 0 values before applying.

```sql
-- Identity, whitelist, membership claim (SECURITY DEFINER)

create extension if not exists "pgcrypto";
create extension if not exists citext;

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.members (
  id text not null,
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  avatar_color text not null,
  role text not null check (role in ('OWNER', 'MEMBER')),
  is_active boolean not null default true,
  primary key (household_id, id)
);

create table public.allowed_emails (
  email citext primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  member_key text not null,
  unique (household_id, member_key)
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table public.household_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  member_key text not null,
  created_at timestamptz not null default now(),
  unique (household_id, member_key)
);

-- Seed: one household + two directory members + whitelist
insert into public.households (id, name)
values ('11111111-1111-1111-1111-111111111111', 'Gia đình Thắng & Vân');

insert into public.members (id, household_id, name, avatar_color, role, is_active) values
  ('thang', '11111111-1111-1111-1111-111111111111', 'Thắng', '#3b82f6', 'OWNER', true),
  ('van',   '11111111-1111-1111-1111-111111111111', 'Vân',   '#ec4899', 'MEMBER', true);

-- REPLACE these emails with Task 0 values before apply:
insert into public.allowed_emails (email, household_id, member_key) values
  ('REPLACE_THANG_EMAIL@gmail.com', '11111111-1111-1111-1111-111111111111', 'thang'),
  ('REPLACE_VAN_EMAIL@gmail.com',   '11111111-1111-1111-1111-111111111111', 'van');

create or replace function public.claim_household_membership()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_row public.allowed_emails%rowtype;
  v_existing public.household_members%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('status', 'forbidden');
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is null then
    return jsonb_build_object('status', 'forbidden');
  end if;

  select * into v_existing from public.household_members where user_id = v_uid;
  if found then
    insert into public.profiles (user_id, display_name, updated_at)
    values (v_uid, split_part(v_email, '@', 1), now())
    on conflict (user_id) do update set updated_at = now();
    return jsonb_build_object(
      'status', 'ok',
      'household_id', v_existing.household_id,
      'member_key', v_existing.member_key
    );
  end if;

  select * into v_row from public.allowed_emails where email = lower(v_email);
  if not found then
    return jsonb_build_object('status', 'forbidden');
  end if;

  insert into public.household_members (user_id, household_id, member_key)
  values (v_uid, v_row.household_id, v_row.member_key);

  insert into public.profiles (user_id, display_name, updated_at)
  values (v_uid, split_part(v_email, '@', 1), now())
  on conflict (user_id) do update set updated_at = now();

  return jsonb_build_object(
    'status', 'ok',
    'household_id', v_row.household_id,
    'member_key', v_row.member_key
  );
end;
$$;

revoke all on function public.claim_household_membership() from public;
grant execute on function public.claim_household_membership() to authenticated;

alter table public.households enable row level security;
alter table public.members enable row level security;
alter table public.allowed_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.household_members enable row level security;

-- No client access to allowed_emails
revoke all on table public.allowed_emails from anon, authenticated;

create policy households_select on public.households
  for select to authenticated
  using (id in (select household_id from public.household_members where user_id = auth.uid()));

create policy members_select on public.members
  for select to authenticated
  using (household_id in (select household_id from public.household_members where user_id = auth.uid()));

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (user_id = auth.uid());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = auth.uid());

create policy household_members_select_own on public.household_members
  for select to authenticated
  using (user_id = auth.uid());

-- Clients must NOT insert/update/delete household_members (claim RPC only)
```

Note: create `citext` extension **before** `allowed_emails` if the order above fails — move `create extension citext` above the table.

- [ ] **Step 2: Apply migration to the Supabase project**

Prefer Supabase MCP `apply_migration` / SQL editor, or CLI linked to project `ysxhprvlxflhmeaiujfp`.

Verify:

```sql
select email, member_key from public.allowed_emails;
select id, name from public.members;
```

Expected: 2 emails, members `thang` and `van`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260825120000_identity_rls.sql
git commit -m "db: add household identity, whitelist, and claim RPC"
```

---

### Task 2: Domain tables + RLS

**Files:**
- Create: `supabase/migrations/20260825120100_domain_tables.sql`

**Interfaces:**
- Consumes: `households.id`, RLS helper pattern from Task 1
- Produces: all domain tables listed in the spec, each with `household_id`, RLS for SELECT/INSERT/UPDATE/DELETE for household members

- [ ] **Step 1: Write domain migration**

Create `supabase/migrations/20260825120100_domain_tables.sql`. Use this shared policy helper pattern for every table `T` with `household_id`:

```sql
create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where user_id = auth.uid() and household_id = p_household_id
  );
$$;

revoke all on function public.is_household_member(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated;
```

Then create each table. Column names use `snake_case` matching mappers in Task 4. Include at minimum:

**`accounts`:** `id text`, `household_id uuid`, `name text`, `type text`, `owner_member_id text`, `opening_balance numeric`, `is_active boolean`, `color text`, PK `(household_id, id)`.

**`categories`:** `id text`, `household_id uuid`, `name text`, `kind text`, `icon text`, `color text`, `daily_spend boolean`, `owner_scope text`, `is_active boolean`, PK `(household_id, id)`.

**`transactions`:** `id text`, `household_id uuid`, `transaction_date date`, `transaction_type text`, `amount numeric`, `currency text default 'VND'`, `description text`, `note text`, `category_id text`, `source_account_id text`, `destination_account_id text`, `member_id text`, `counterparty_id text`, `event_id text`, `goal_id text`, `fund_id text`, `savings_deposit_id text`, `loan_id text`, `reversal_of_transaction_id text`, `created_at timestamptz`, `updated_at timestamptz`, `deleted_at timestamptz`, PK `(household_id, id)`.

**`suggestion_rules`, `budgets`, `income_plans`, `credit_card_statements`, `installment_plans`, `savings_deposits`, `counterparties`, `loans`, `funds`, `planned_expenses`, `goals`, `events`, `event_items`, `event_contributions`, `recurring_transactions`, `audit_logs`:** mirror fields from `src/types/finance.ts` in snake_case + `household_id`.

**`credit_card_config`:** one row per household — PK `household_id`, fields from `CreditCardConfig` (`account_id`, `card_name`, `bank`, `credit_limit`, `statement_day`, `due_day`, `annual_fee`, `status`, `last4_digits`).

**`household_settings`:** `household_id uuid primary key`, `household_name text not null`, `current_member_id text not null default 'all'`, `last_backup_date timestamptz`.

For each domain table:

```sql
alter table public.<table> enable row level security;

create policy <table>_select on public.<table>
  for select to authenticated
  using (public.is_household_member(household_id));

create policy <table>_insert on public.<table>
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy <table>_update on public.<table>
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy <table>_delete on public.<table>
  for delete to authenticated
  using (public.is_household_member(household_id));
```

Do **not** insert any financial seed rows.

- [ ] **Step 2: Apply and verify empty tables**

```sql
select count(*) from public.transactions;
select count(*) from public.accounts;
```

Expected: `0` / `0`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260825120100_domain_tables.sql
git commit -m "db: add domain finance tables with household RLS"
```

---

### Task 3: Tooling — Supabase client, Vitest, env example

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (deps + scripts)
- Modify: `.env.example`
- Create: `.env.local` (gitignored — do not commit)

**Interfaces:**
- Consumes: Vite env vars
- Produces: `export const supabase: SupabaseClient`

- [ ] **Step 1: Install dependencies**

```bash
npm install @supabase/supabase-js
npm install -D vitest jsdom @vitest/coverage-v8
```

- [ ] **Step 2: Add Vitest config and test script**

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

In `package.json` scripts add: `"test": "vitest run"`.

- [ ] **Step 3: Create Supabase client**

`src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

- [ ] **Step 4: Update `.env.example`**

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Create `.env.local` locally with the real project values (already known to the human). Never commit `.env.local`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json bun.lock vitest.config.ts src/lib/supabase.ts .env.example
git commit -m "chore: add supabase-js, vitest, and env example"
```

---

### Task 4: Empty state + mappers (TDD)

**Files:**
- Create: `src/lib/emptyState.ts`
- Create: `src/lib/emptyState.test.ts`
- Create: `src/lib/db/mappers.ts`
- Create: `src/lib/db/mappers.test.ts`
- Create: `src/lib/db/types.ts`
- Modify: `src/lib/storage.ts` — keep `AppState` interface export; move/remove `getInitialSeedState` usage for cloud path; keep `exportAppStateAsJSON` / import helpers without writing localStorage as source of truth

**Interfaces:**
- Consumes: `AppState` from `src/lib/storage.ts`, domain types from `src/types/finance.ts`
- Produces:
  - `createEmptyAppState(householdName: string): AppState`
  - `memberToRow` / `rowToMember` (and same pattern for transactions, accounts, …)
  - `COLLECTION_TABLES` constant listing syncable array keys → table names

- [ ] **Step 1: Write failing empty-state test**

`src/lib/emptyState.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createEmptyAppState } from './emptyState';

describe('createEmptyAppState', () => {
  it('returns zero financial collections and default members filter', () => {
    const state = createEmptyAppState('Gia đình Thắng & Vân');
    expect(state.householdName).toBe('Gia đình Thắng & Vân');
    expect(state.currentMemberId).toBe('all');
    expect(state.transactions).toEqual([]);
    expect(state.accounts).toEqual([]);
    expect(state.categories).toEqual([]);
    expect(state.budgets).toEqual([]);
    expect(state.members).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- src/lib/emptyState.test.ts
```

Expected: FAIL (module/function missing).

- [ ] **Step 3: Implement `createEmptyAppState`**

```ts
import type { AppState } from './storage';
import type { CreditCardConfig } from '../types/finance';

const emptyCredit: CreditCardConfig = {
  accountId: 'tin_dung',
  cardName: '',
  bank: '',
  creditLimit: 0,
  statementDay: 1,
  dueDay: 1,
  annualFee: 0,
  status: 'ACTIVE',
};

export function createEmptyAppState(householdName: string): AppState {
  return {
    householdName,
    currentMemberId: 'all',
    members: [],
    accounts: [],
    categories: [],
    transactions: [],
    suggestionRules: [],
    budgets: [],
    incomePlans: [],
    creditCardConfig: emptyCredit,
    creditCardStatements: [],
    installmentPlans: [],
    savingsDeposits: [],
    counterparties: [],
    loans: [],
    funds: [],
    plannedExpenses: [],
    goals: [],
    events: [],
    eventItems: [],
    eventContributions: [],
    recurringTransactions: [],
    auditLogs: [],
  };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test -- src/lib/emptyState.test.ts
```

- [ ] **Step 5: Write mapper tests for transactions**

`src/lib/db/mappers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { transactionToRow, rowToTransaction } from './mappers';

describe('transaction mappers', () => {
  it('round-trips a transaction', () => {
    const tx = {
      id: 'tx_1',
      transactionDate: '2026-08-01',
      transactionType: 'EXPENSE' as const,
      amount: 1000,
      currency: 'VND' as const,
      description: 'Cafe',
      memberId: 'thang',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    };
    const row = transactionToRow('11111111-1111-1111-1111-111111111111', tx);
    expect(row.household_id).toBe('11111111-1111-1111-1111-111111111111');
    expect(row.amount).toBe(1000);
    expect(rowToTransaction(row).description).toBe('Cafe');
  });
});
```

- [ ] **Step 6: Implement mappers for all collections**

In `src/lib/db/mappers.ts`, implement `*ToRow` / `rowTo*` for every domain collection used by load/sync. Keep camelCase in app models and snake_case in rows.

- [ ] **Step 7: Run mapper tests — PASS**

```bash
npm test -- src/lib/db/mappers.test.ts
```

- [ ] **Step 8: Refactor `storage.ts`**

- Export `AppState` unchanged.
- Keep `exportAppStateAsJSON(state)`.
- Change `importAppStateFromJSON` to return parsed `AppState` only (caller persists via sync).
- Remove automatic seed-on-load behavior from the cloud path (`loadAppState` localStorage helpers may remain temporarily unused or deleted once App no longer calls them).

- [ ] **Step 9: Commit**

```bash
git add src/lib/emptyState.ts src/lib/emptyState.test.ts src/lib/db src/lib/storage.ts
git commit -m "feat: add empty AppState and DB mappers"
```

---

### Task 5: Auth helpers (TDD) + claim membership

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth.test.ts`
- Create: `src/hooks/useAuthSession.ts`

**Interfaces:**
- Consumes: `supabase`, RPC `claim_household_membership`
- Produces:
  - `type AccessStatus = 'loading' | 'signed_out' | 'forbidden' | 'ready'`
  - `type AuthContext = { status: AccessStatus; householdId: string | null; memberKey: string | null; email: string | null }`
  - `deriveAccessStatus(sessionUser: User | null, claim: { status: string } | null): AccessStatus` (pure, tested)
  - `signInWithGoogle(): Promise<void>`
  - `signOut(): Promise<void>`
  - `claimMembership(): Promise<{ status: 'ok' | 'forbidden'; householdId?: string; memberKey?: string }>`
  - `useAuthSession(): AuthContext & { signInWithGoogle, signOut, refresh }`

- [ ] **Step 1: Failing pure-status tests**

```ts
import { describe, it, expect } from 'vitest';
import { deriveAccessStatus } from './auth';

describe('deriveAccessStatus', () => {
  it('signed_out when no user', () => {
    expect(deriveAccessStatus(null, null)).toBe('signed_out');
  });
  it('forbidden when claim forbidden', () => {
    expect(deriveAccessStatus({ id: 'u1' } as any, { status: 'forbidden' })).toBe('forbidden');
  });
  it('ready when claim ok', () => {
    expect(deriveAccessStatus({ id: 'u1' } as any, { status: 'ok' })).toBe('ready');
  });
});
```

- [ ] **Step 2: Run — FAIL, then implement `deriveAccessStatus` + Google/signOut/claim wrappers**

```ts
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function claimMembership() {
  const { data, error } = await supabase.rpc('claim_household_membership');
  if (error) throw error;
  const payload = data as { status: string; household_id?: string; member_key?: string };
  if (payload.status !== 'ok') return { status: 'forbidden' as const };
  return {
    status: 'ok' as const,
    householdId: payload.household_id!,
    memberKey: payload.member_key!,
  };
}
```

- [ ] **Step 3: Implement `useAuthSession`**

On mount: `getSession` → if user, `claimMembership` → set status. Subscribe to `onAuthStateChange`. Expose actions.

- [ ] **Step 4: Run unit tests PASS**

```bash
npm test -- src/lib/auth.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts src/hooks/useAuthSession.ts
git commit -m "feat: add Google auth helpers and membership claim"
```

---

### Task 6: Load + sync state layer (TDD)

**Files:**
- Create: `src/lib/db/loadState.ts`
- Create: `src/lib/db/syncState.ts`
- Create: `src/lib/db/syncState.test.ts`

**Interfaces:**
- Consumes: `supabase`, mappers, `createEmptyAppState`
- Produces:
  - `loadAppStateFromDb(householdId: string): Promise<AppState>`
  - `planCollectionSync(prevIds: Set<string>, nextIds: Set<string>): { upsertIds: string[]; deleteIds: string[] }`
  - `syncAppState(householdId: string, prev: AppState, next: AppState): Promise<void>`

- [ ] **Step 1: Write sync planner tests**

```ts
import { describe, it, expect } from 'vitest';
import { planCollectionSync } from './syncState';

describe('planCollectionSync', () => {
  it('detects upserts and deletes', () => {
    const prev = new Set(['a', 'b']);
    const next = new Set(['b', 'c']);
    expect(planCollectionSync(prev, next)).toEqual({
      upsertIds: ['b', 'c'],
      deleteIds: ['a'],
    });
  });
});
```

- [ ] **Step 2: FAIL then implement planner + full `syncAppState`**

For each array collection: upsert all `next` rows for ids in upsert set; delete rows for ids only in prev. Always upsert `credit_card_config` and `household_settings` from `next`.

Use `.upsert(rows, { onConflict: 'household_id,id' })` (adjust conflict target for tables with different PKs).

- [ ] **Step 3: Implement `loadAppStateFromDb`**

Parallel `supabase.from(table).select('*').eq('household_id', householdId)` for all collections; map rows; fill `members` from `members` table; fill `householdName` / `currentMemberId` from `household_settings` (if missing settings row, use household name from `households` and `currentMemberId: 'all'`).

- [ ] **Step 4: Run tests**

```bash
npm test -- src/lib/db/syncState.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/loadState.ts src/lib/db/syncState.ts src/lib/db/syncState.test.ts
git commit -m "feat: load and diff-sync AppState to Supabase"
```

---

### Task 7: Auth screens

**Files:**
- Create: `src/components/auth/LoginScreen.tsx`
- Create: `src/components/auth/AccessDeniedScreen.tsx`
- Create: `src/components/auth/AppLoadingScreen.tsx`

**Interfaces:**
- Consumes: `signInWithGoogle`, `signOut` callbacks
- Produces: presentational screens with Vietnamese copy matching the app

- [ ] **Step 1: Implement LoginScreen**

Full-screen: product title “Gia đình Thắng & Vân”, short subtitle, primary button “Đăng nhập với Google”, optional error string prop.

- [ ] **Step 2: Implement AccessDeniedScreen**

Message: không có quyền truy cập; button “Đăng xuất”.

- [ ] **Step 3: Implement AppLoadingScreen**

Loading spinner text “Đang tải…”; optional error + “Thử lại” button.

- [ ] **Step 4: Commit**

```bash
git add src/components/auth
git commit -m "feat: add login, denied, and loading auth screens"
```

---

### Task 8: Wire App.tsx auth gate + async persist

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx` only if needed for auth callback

**Interfaces:**
- Consumes: `useAuthSession`, `loadAppStateFromDb`, `syncAppState`, auth screens
- Produces: gated app; no localStorage auto-seed path

- [ ] **Step 1: Replace localStorage bootstrap**

Remove `useState(() => loadAppState())` and the sync-to-localStorage `useEffect`.

Add:

```ts
const auth = useAuthSession();
const [appState, setAppState] = useState<AppState | null>(null);
const [prevState, setPrevState] = useState<AppState | null>(null);
const [loadError, setLoadError] = useState<string | null>(null);
const [saveError, setSaveError] = useState<string | null>(null);
```

When `auth.status === 'ready'` and `auth.householdId`:

```ts
const state = await loadAppStateFromDb(auth.householdId);
setAppState(state);
setPrevState(state);
```

- [ ] **Step 2: Debounced sync on `appState` changes**

```ts
useEffect(() => {
  if (!auth.householdId || !appState || !prevState) return;
  if (appState === prevState) return;
  const handle = setTimeout(async () => {
    const snapshot = appState;
    const baseline = prevState;
    try {
      await syncAppState(auth.householdId!, baseline, snapshot);
      setPrevState(snapshot);
      setSaveError(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Lưu thất bại');
      // Do not overwrite UI state with baseline; keep edits visible + show error
    }
  }, 400);
  return () => clearTimeout(handle);
}, [appState, prevState, auth.householdId]);
```

- [ ] **Step 3: Render gates**

```tsx
if (auth.status === 'loading') return <AppLoadingScreen />;
if (auth.status === 'signed_out') return <LoginScreen onGoogle={auth.signInWithGoogle} error={auth.error} />;
if (auth.status === 'forbidden') return <AccessDeniedScreen onSignOut={auth.signOut} />;
if (!appState) return <AppLoadingScreen error={loadError} onRetry={reload} />;
// existing shell…
```

Show a small non-blocking banner if `saveError` is set.

- [ ] **Step 4: Fix reset/import handlers**

- Reset: set empty state via `createEmptyAppState`, then sync (which deletes old rows).
- Import JSON: `setAppState(parsed)` only; sync persists.
- Remove calls that write seed data into Supabase.

- [ ] **Step 5: Manual smoke locally**

```bash
npm run lint
npm test
npm run dev
```

Log in with a whitelisted Google account (after Task 9 provider setup if needed). Confirm empty collections render without crash.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: gate app on Google auth and persist to Supabase"
```

---

### Task 9: Supabase Google provider + local OAuth verify

**Files:**
- None in repo (dashboard config). Optional: update README with setup steps.

**Interfaces:**
- Consumes: Google Cloud OAuth client
- Produces: working `signInWithOAuth({ provider: 'google' })` against project `ysxhprvlxflhmeaiujfp`

- [ ] **Step 1: Google Cloud Console**

Create OAuth 2.0 Client (Web). Authorized redirect URI:

`https://ysxhprvlxflhmeaiujfp.supabase.co/auth/v1/callback`

- [ ] **Step 2: Supabase Auth settings**

- Enable Google provider with Client ID/Secret.
- Site URL: `http://localhost:3000` for local test.
- Additional redirect URLs: `http://localhost:3000`

- [ ] **Step 3: Verify whitelist behavior**

1. Login with Thắng email → `ready`, sees app.
2. Login with Vân email → `ready`, same household data after refresh.
3. Login with a third Google account → `forbidden` screen; `select * from household_members` has no row for that user.

- [ ] **Step 4: Commit README setup notes only if updated**

```bash
git add README.md
git commit -m "docs: document Google OAuth and Supabase setup"
```

---

### Task 10: Vercel deploy

**Files:**
- Create: `vercel.json`
- Modify: `README.md` (run/deploy section)

**Interfaces:**
- Consumes: Git remote + Vercel project
- Produces: production URL with env vars set

- [ ] **Step 1: Add SPA rewrite**

`vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Ensure repo is pushable**

Add remaining app files if not yet committed:

```bash
git add -A
git status
git commit -m "chore: track application source for Vercel deploy"
```

Do **not** add `.env.local`.

- [ ] **Step 3: Create GitHub remote (if missing) and push**

```bash
# human may create empty GitHub repo family-finance-app first
git branch -M main
git remote add origin <github-repo-url>
git push -u origin main
```

- [ ] **Step 4: Vercel project**

- Import repo; preset Vite; build `vite build`; output `dist`.
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (same values as local).
- Deploy.

- [ ] **Step 5: Point Supabase Auth Site URL to production**

Site URL = `https://<vercel-domain>`  
Redirect URLs include production origin + `http://localhost:3000`.

- [ ] **Step 6: Production smoke**

Google login on production; CRUD one expense; refresh; second whitelisted user refresh sees it.

- [ ] **Step 7: Commit vercel.json / README if not committed**

```bash
git add vercel.json README.md
git commit -m "chore: add Vercel SPA rewrite and deploy notes"
git push
```

---

## Self-Review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Vite SPA + Supabase client | 3, 8 |
| Google OAuth | 5, 7, 9 |
| Whitelist in SQL | 0, 1 |
| Shared household R/W | 1, 2, 6 |
| No Realtime | 6, 8 (refresh/load only) |
| Full features / keep AppState | 4, 6, 8 |
| Empty financial DB | 1, 2, 4 |
| RLS on all tables | 1, 2 |
| claim SECURITY DEFINER | 1, 5 |
| Vercel free static | 10 |
| Env publishable only | 3, 10 |
| Export JSON optional backup | 4, 8 |
| Blocked UI for non-whitelist | 7, 8 |
| Save failure keeps UI + error | 8 |
| Testing auth/CRUD/deploy | 5 tests, 9 manual, 10 smoke |

No intentional placeholders left except Task 0 email gate (must be filled before Task 1 apply).

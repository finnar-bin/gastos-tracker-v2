# Next.js Protected SPA Migration Execution Handoff

## Purpose

This document is the current execution handoff for continuing the protected-area SPA migration.

It replaces older assumptions that no longer match the repo. Use this file as the source of truth for future Codex work on the migration.

## Hard Constraints

- Stay on Next.js App Router.
- Preserve existing auth, authorization, invite, cron, email, and mutation behavior.
- Prefer incremental refactors.
- Do not do a large route rewrite unless a step explicitly requires it.
- Follow `AGENTS.md`.

## Current Architecture Snapshot

The app is already partway through the migration.

What is already true:

- Root layout is lightweight and only mounts global providers.
- TanStack Query is installed globally in `src/app/layout.tsx`.
- The protected shell already exists at `src/app/sheet/[sheetId]/layout.tsx`.
- Protected access is enforced server-side via `requireSheetAccess()` in `src/lib/auth/sheets.ts`.
- Many protected read-heavy screens already use client-side Supabase reads via React Query.
- Add/edit flows for categories, payment types, recurring transactions, and transactions already use client-side form loaders for read bootstrap.
- Loading files already exist for the main protected routes.

What is not done yet:

- The migration is not structurally finished.
- There is no formal protected route group such as `src/app/(protected)`.
- Several protected pages still do server bootstrap reads that should be minimized or consolidated.
- Complex screens still assemble data from multiple browser queries instead of stable DB read models.
- Query keys are only partially standardized.
- Query invalidation is mostly missing.
- Route/query prefetching is minimal.
- Browser-read safety must not be assumed from repo state alone because DB policy state may have drifted.

## Current Route Ownership

### Public / server-first routes

Keep these server-owned:

- `/` redirects to `/sheet`
- `/login`
- `/signup`
- `/invite/[token]`
- `/auth/callback`
- `/auth/signout`
- `/api/**`

### Protected shell

Current protected shell:

- `src/app/sheet/[sheetId]/layout.tsx`

Current behavior:

- validates sheet access on the server
- computes role/permissions once per request tree
- mounts persistent navigation and device bootstrap components

This layout is already the protected shell. Do not rewrite this into a new route group unless there is a clear payoff.

### Semi-protected selector route

`/sheet` currently:

- checks auth server-side in `src/app/sheet/page.tsx`
- renders client-owned selector content in `src/app/sheet/sheet-selector-content.tsx`
- still includes top-level page chrome and sign-out button in the server page

This is acceptable. Treat it as a light authenticated entry page, not the main shell.

## Current Read Ownership By Screen

### Already client-owned for main reads

- `/sheet`
  - `src/app/sheet/sheet-selector-content.tsx`
- `/sheet/[sheetId]`
  - `src/app/sheet/[sheetId]/dashboard-content.tsx`
- `/sheet/[sheetId]/history`
  - `src/app/sheet/[sheetId]/history/history-content.tsx`
- `/sheet/[sheetId]/transactions`
  - `src/app/sheet/[sheetId]/transactions/transactions-content.tsx`
- `/sheet/[sheetId]/transactions/[transactionId]`
  - `src/app/sheet/[sheetId]/transactions/[transactionId]/category-transactions-content.tsx`
- `/sheet/[sheetId]/settings/category`
  - `src/app/sheet/[sheetId]/settings/category/category-list.tsx`
- `/sheet/[sheetId]/settings/payment-types`
  - `src/app/sheet/[sheetId]/settings/payment-types/payment-type-list.tsx`
- `/sheet/[sheetId]/settings/recurring`
  - `src/app/sheet/[sheetId]/settings/recurring/recurring-list.tsx`
- `/sheet/[sheetId]/settings/users`
  - `src/app/sheet/[sheetId]/settings/users/users-list.tsx`

### Still server-bootstrapped for initial props

These pages are thin wrappers, but they still pass server-fetched props into client screens:

- dashboard page passes `currency` and `memberProfiles`
- history page passes `currency`, `permissions`, and `memberProfiles`
- transactions page passes `currency`
- category transactions page passes category metadata, `currency`, `permissions`, and `memberProfiles`
- recurring page passes `currency` and permissions
- users page passes current user id, permissions, and `memberProfiles`

These are the main remaining server bootstrap seams inside the protected area.

### Intentionally server-owned for now

- `/sheet/[sheetId]/settings`
- `/sheet/[sheetId]/settings/general`
- invite flows
- all writes and destructive actions

Keep them server-owned unless a later step has a strong reason to change them.

## Current Data Access Pattern

### Browser reads already used

Browser Supabase reads are currently used against:

- `sheet_users`
- `sheet_invites`
- `sheet_settings`
- `categories`
- `payment_types`
- `transactions`
- `recurring_transactions`

### Server Drizzle reads already used

Server Drizzle reads are currently used for:

- auth-gated sheet access in `src/lib/auth/sheets.ts`
- sheet member profile bootstrap in `src/lib/sheet-member-profiles.ts`
- sheet currency bootstrap in `src/lib/sheet-settings.ts`
- general settings bootstrap
- category metadata lookup for `/transactions/[transactionId]`
- many mutation and privileged flows

### Important DB caveat

Do not assume repo migrations accurately describe the live DB policy state.

Why:

- `drizzle/0018_read_rls_for_client_safe_tables.sql` creates helper function and SELECT RLS policies
- `drizzle/0019_drop_duplicate_select_policies.sql` drops those same policies
- older notes indicate some policy state may exist manually in the database

Execution rule:

- before relying on any browser read, verify the current live policy state
- if policy state is missing, ambiguous, or drifted, fix it with migration-backed SQL before expanding client ownership

## Current Technical Gaps

### 1. Complex client fan-out queries still exist

Current examples:

- dashboard queries transactions 3 times and categories once, then joins member profiles from server props
- history queries categories, transactions, and payment types, then joins member profiles from server props
- recurring queries recurring transactions, categories, and payment types separately
- users queries memberships and invites separately, then joins member profiles from server props
- category transactions queries transactions and payment types separately, then joins member profiles from server props
- transaction form and recurring form loaders fetch multiple raw tables in parallel

This is functional but not the desired end state.

### 2. `profiles` remains server-only in practice

That is correct for now.

Current pattern:

- `getSheetMemberProfiles(sheetId)` uses Drizzle server-side and returns a constrained member profile list
- client screens receive that list as props and join it locally

Do not expose raw `profiles` to the browser unless there is an explicit security decision.

Preferred migration direction:

- replace the current server bootstrap + client join pattern with a stable member-facing read model such as `sheet_member_directory`

### 3. Query keys are incomplete

Current shared keys in `src/lib/query-keys.ts` only cover:

- sheet selector
- categories
- payment types
- sheet currency

Other screens still use ad hoc inline query keys.

### 4. Cache invalidation is underbuilt

Current state:

- almost no React Query invalidation exists
- only a couple of flows still call `router.refresh()`
- no shared mutation invalidation strategy exists for protected reads

This is one of the biggest remaining SPA-feel gaps.

### 5. Previous-data preservation is inconsistent

Several filtered screens use `useQuery`, but do not explicitly preserve prior results during filter transitions.

Target behavior:

- filter changes should keep the old list visible while the next result loads
- avoid replacing the whole section with loading skeletons during routine refetches

### 6. No migration-backed read models exist yet

Current repo state:

- no DB views
- no DB RPC/functions returning UI read models
- no migration-backed SPA read models for the complex protected screens

That is the main unfinished architectural step.

## End-State Goal

The protected area should behave like a client-led app inside the existing Next.js shell:

- auth and authorization stay server-side
- writes stay server-side
- protected navigation reuses the mounted shell
- list/detail reads are client-owned when RLS-safe
- complex protected reads use DB views or RPCs instead of client fan-out
- query keys are standardized
- mutations invalidate targeted caches instead of relying on broad refreshes
- common revisits feel instant or near-instant

## Read Classification Rules

Use these rules during the migration.

### Use browser Supabase + React Query when

- the read is strictly read-only
- the table/view is RLS-safe for authenticated users
- the shape is simple or moderate
- the result is a list/detail/table view

### Use DB view or RPC when

- the page needs joins across multiple tables
- the page needs aggregates or summary data
- the page currently does client fan-out
- the page needs member profile projection without exposing raw `profiles`
- the read model is reused across screens

### Use server Drizzle when

- the query is privileged
- the query drives a mutation flow
- the query depends on business logic
- the query touches server-only identity or admin concerns

## Recommended Read Models

These are the highest-value read models to add next.

### `dashboard_summary`

Should replace most logic inside `dashboard-content.tsx`.

Recommended fields:

- month income total
- month expense total
- monthly chart series for current year
- recent transactions with category summary
- creator display fields from a constrained member projection

### `history_feed`

Should replace the fan-out in `history-content.tsx`.

Recommended fields:

- transaction row fields
- category name/icon/type
- payment type name/icon
- creator display fields
- query parameters for month/year/type/category

### `transaction_overview`

Should replace the aggregate work in `transactions-content.tsx`.

Recommended fields:

- category id
- category name/icon/type
- budget
- month total by category for selected month/year/type

### `category_transactions`

Should replace the detail fan-out in `category-transactions-content.tsx`.

Recommended fields:

- transaction row fields for a category and period
- payment type name/icon
- creator display fields

### `sheet_member_directory`

Should replace the server bootstrap from `getSheetMemberProfiles()`.

Recommended fields:

- member id
- display name
- avatar url
- email only if intentionally exposed to sheet members
- role

### `recurring_overview`

Should replace the fan-out in `recurring-list.tsx`.

Recommended fields:

- recurring transaction row fields
- category name/icon
- payment type name/icon

## Execution Order

Follow this order unless a concrete blocker requires a different sequence.

### Phase 1. Audit browser-read safety first

Tasks:

- inspect current live RLS policy state in the DB
- compare live state against `drizzle/0018_*` and `drizzle/0019_*`
- decide which current browser reads are truly supported
- add migration-backed policy fixes before expanding browser read usage

Acceptance:

- every current browser-read table has an explicit, verified access story

### Phase 2. Standardize query ownership and cache keys

Tasks:

- expand `src/lib/query-keys.ts` for all protected reads
- convert inline keys to shared stable keys
- document invalidation targets for every mutation area

Suggested keys:

- `["sheet-selector"]`
- `["sheet", sheetId, "dashboard"]`
- `["sheet", sheetId, "history", filters]`
- `["sheet", sheetId, "transactions-overview", filters]`
- `["sheet", sheetId, "category-transactions", categoryId, filters]`
- `["sheet", sheetId, "users"]`
- `["sheet", sheetId, "recurring"]`
- `["sheet", sheetId, "category-form", categoryId]`
- `["sheet", sheetId, "payment-type-form", paymentTypeId]`
- `["sheet", sheetId, "transaction-form", mode, idOrNew, type]`
- `["sheet", sheetId, "recurring-form", mode, idOrNew]`

Acceptance:

- protected queries use a consistent key strategy

### Phase 3. Add the first DB read models

Priority order:

1. `sheet_member_directory`
2. `transaction_overview`
3. `history_feed`
4. `recurring_overview`
5. `dashboard_summary`

Reason for this order:

- member directory removes repeated server bootstrap props
- transactions/history/recurring have the clearest client fan-out today
- dashboard is valuable but slightly broader

Acceptance:

- the selected screen can fetch one stable read model instead of multiple raw tables

### Phase 4. Remove server bootstrap props from protected pages

Tasks:

- stop passing `memberProfiles` from server pages once `sheet_member_directory` exists
- stop passing `currency` from server pages when it can be part of the screen read model or a safe browser read
- keep only auth/permission checks and minimal route metadata in server wrappers

Acceptance:

- protected pages are thin wrappers around client-owned screen components

### Phase 5. Add real cache invalidation after mutations

Tasks:

- replace broad `router.refresh()` usage where targeted invalidation is enough
- invalidate only the affected query families after create/update/delete actions
- ensure settings mutations refresh the right list and form queries

Acceptance:

- user-visible data updates without full route refreshes

### Phase 6. Improve filter transitions and prefetching

Tasks:

- preserve previous data on filtered list transitions
- avoid blanking entire lists during refetch
- prefetch likely next pages and read queries where helpful

Acceptance:

- sibling navigation and filter changes feel local and fast

## Route-by-Route Target

### `/sheet`

Keep:

- server auth gate
- client-owned selector content

Optional improvement:

- move pending invite aggregation to a stable read model if the selector query grows more complex

### `/sheet/[sheetId]`

Target:

- keep server access gate
- replace current dashboard fan-out with `dashboard_summary`
- remove `memberProfiles` prop dependency

### `/sheet/[sheetId]/history`

Target:

- keep server permission gate
- replace raw multi-query fetch with `history_feed`
- preserve previous data during filter changes

### `/sheet/[sheetId]/transactions`

Target:

- replace current category + transactions aggregate logic with `transaction_overview`
- keep the server page thin

### `/sheet/[sheetId]/transactions/[transactionId]`

Current note:

- `transactionId` is actually a category id in this route

Target:

- keep server validation that the category belongs to the sheet
- replace detail fan-out with `category_transactions`
- consider renaming the segment later only if worth the churn

### `/sheet/[sheetId]/settings/category`

Current state is acceptable.

Possible follow-up:

- add targeted invalidation after add/edit actions

### `/sheet/[sheetId]/settings/payment-types`

Current state is acceptable.

Possible follow-up:

- add targeted invalidation after add/edit actions

### `/sheet/[sheetId]/settings/recurring`

Target:

- replace fan-out with `recurring_overview`
- add targeted invalidation after add/edit actions

### `/sheet/[sheetId]/settings/users`

Target:

- replace server `memberProfiles` bootstrap with `sheet_member_directory`
- keep invite/remove actions server-owned

### `/sheet/[sheetId]/settings/general`

Keep server-owned unless there is a strong reason to change it.

## Files Most Likely To Change Next

- `docs/next-spa-migration-execution.md`
- `src/lib/query-keys.ts`
- `src/app/sheet/[sheetId]/page.tsx`
- `src/app/sheet/[sheetId]/history/page.tsx`
- `src/app/sheet/[sheetId]/transactions/page.tsx`
- `src/app/sheet/[sheetId]/transactions/[transactionId]/page.tsx`
- `src/app/sheet/[sheetId]/settings/recurring/page.tsx`
- `src/app/sheet/[sheetId]/settings/users/page.tsx`
- `src/app/sheet/[sheetId]/dashboard-content.tsx`
- `src/app/sheet/[sheetId]/history/history-content.tsx`
- `src/app/sheet/[sheetId]/transactions/transactions-content.tsx`
- `src/app/sheet/[sheetId]/transactions/[transactionId]/category-transactions-content.tsx`
- `src/app/sheet/[sheetId]/settings/recurring/recurring-list.tsx`
- `src/app/sheet/[sheetId]/settings/users/users-list.tsx`
- `src/lib/sheet-member-profiles.ts`
- `src/lib/sheet-settings.ts`
- `drizzle/*.sql`
- `drizzle/meta/_journal.json`

## Validation Checklist

After each meaningful migration step:

- run `npm run lint`
- run `npx tsc --noEmit` if a typecheck script still does not exist

Manual checks:

- login redirect still works
- unauthorized sheet access still redirects safely
- invite flow still works
- protected shell navigation still persists
- dashboard renders correctly
- history filters do not blank the full screen
- transactions overview and category detail still match expected totals
- settings lists update after mutations
- users page still shows constrained member profile data only

## Prompt To Reuse Later

Use this when resuming the migration:

> Continue the protected SPA migration described in `docs/next-spa-migration-execution.md`.
> Follow `AGENTS.md`.
> Stay on Next.js App Router.
> Preserve auth, authorization, invite flows, cron routes, writes, and server-only business logic.
> Treat `src/app/sheet/[sheetId]/layout.tsx` as the existing protected shell.
> Verify browser-read safety against live DB policy state before expanding client ownership.
> Prefer DB views/RPC read models over client-side fan-out for dashboard, history, transactions, recurring, and users.
> Standardize React Query keys and targeted invalidation.
> Work incrementally, validate with lint and typecheck, and summarize risks clearly.

## Default Decision Rule

When uncertain:

- keep trust, permissions, writes, and identity-sensitive logic on the server
- keep protected UX client-led
- prefer stable DB read models over ad hoc client joins
- prefer incremental migration over structural rewrites

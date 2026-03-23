# Next.js Protected Navigation Execution Handoff

## Purpose

This document is the execution handoff for the next phase after the protected read-model migration.

The goal is not more database work. The goal is to make protected navigation feel more like a persistent client app:

- the shell stays mounted
- sibling route changes do not feel like full page reloads
- loading is local and subtle
- likely next screens are prefetched
- high-frequency flows update in place instead of feeling document-like

Use this file as the source of truth for that phase.

## Baseline Assumption

Assume the repo already contains the completed protected read-model work:

- shared query keys
- migration-backed protected read models
- client-owned protected list reads
- graceful validation for major protected forms
- graceful validation for login and signup
- latest migration set through `drizzle/0028_drop_duplicate_sheet_users_select_member_policy.sql`
- restored member-read RLS policies for client-safe tables (`drizzle/0026_restore_member_read_policies.sql`)
- `profiles` member-readable policy for shared-sheet users (`drizzle/0027_profiles_select_for_sheet_members.sql`)

Do not spend time redoing that work unless a later step explicitly requires adjustment.

## Hard Constraints

- Stay on Next.js App Router.
- Preserve existing auth and authorization behavior.
- Preserve current business logic and write behavior unless a step explicitly changes the UX pattern.
- Prefer incremental refactors over route rewrites.
- Follow `AGENTS.md`.
- Do not replace the existing `/sheet/[sheetId]/layout.tsx` shell with a brand-new route group unless there is a clear, measurable payoff.

## Problem Statement

The app is already more client-led than before, but it still does not feel like the Vercel dashboard.

Current user-visible issues:

- sibling protected navigation still looks like separate pages
- route-level loading files show broad skeletons that replace the main content area
- repeated page chrome remounts on navigation
- detail and edit flows still behave like full navigations
- route/query prefetching is minimal
- mutations often still feel redirect-driven instead of in-place

The outer shell already persists. The missing layer is a persistent inner content shell and a softer navigation model inside it.

## Current Repo Snapshot

### Persistent outer shell already exists

`src/app/sheet/[sheetId]/layout.tsx` already keeps these mounted across sheet routes:

- `DesktopNav`
- `BottomBar`
- `TimeZoneSync`
- `PushNotificationBootstrap`

This is good. Keep it.

### What still feels page-based

The sibling routes under the sheet shell still render their own page containers and headers:

- `src/app/sheet/[sheetId]/page.tsx`
- `src/app/sheet/[sheetId]/history/page.tsx`
- `src/app/sheet/[sheetId]/transactions/page.tsx`
- comparable settings/detail pages under the same shell

These wrappers still create the feeling that the whole content area is a new page.

### Current loading boundaries are too broad

These files currently render full-page skeleton states:

- `src/app/sheet/[sheetId]/loading.tsx`
- `src/app/sheet/[sheetId]/history/loading.tsx`
- `src/app/sheet/[sheetId]/transactions/loading.tsx`
- `src/app/sheet/[sheetId]/settings/loading.tsx`

These are useful for cold entry, but they are too aggressive for common sibling navigation.

### Current data layer is good enough for this phase

Assume these are already in place and should now be used as the foundation:

- stable query keys in `src/lib/query-keys.ts`
- React Query cache ownership for protected reads
- read-model helpers under `src/lib` backed by `dashboard_summary`, `history_feed`, `transaction_overview`, and `category_transactions`
- client-owned dashboard/history/transactions/recurring/users reads

The next work should build on that cache layer rather than bypass it.

## End-State Goal

Protected navigation should behave like this:

- nav/sidebar stays visually stable
- inner shell chrome stays mounted
- changing sibling screens swaps content, not the whole page feel
- routine route transitions do not show full-screen loading flashes
- query data is often warm before navigation completes
- detail flows can open as overlays or side panels where appropriate
- list/filter state survives common navigations

This does not require abandoning App Router. It requires using it more intentionally.

## Execution Order

Do the work in this order. Do not jump to modal-route polish before the shell and loading model are fixed.

### Phase 1: Persistent inner content shell

Create a mounted inner-shell layer for sheet routes.

Target:

- move repeated content-area page chrome into a shared shell component
- keep the central frame stable while child route content changes
- standardize width, padding, header spacing, and section structure

Expected implementation direction:

- introduce a sheet-scoped content shell component such as `src/components/sheet-content-shell.tsx`
- optionally add a nested layout under the sheet route tree if it materially improves persistence without a route rewrite
- page files should become thinner and primarily provide route-specific header metadata plus content body

Important rule:

- do not try to make every route share identical chrome
- do extract the repeated container and header pattern so it no longer remounts as visually “new page” chrome on every sibling route

Success criteria:

- navigation between dashboard, history, transactions, and settings feels like swapping content within one app frame
- duplicated page container code is reduced

### Phase 2: Soften route-level loading behavior

Change loading behavior so sibling navigation does not replace the screen with broad skeletons during routine transitions.

Target:

- keep previous content visible while the next route/query settles
- move pending indicators into the content region, header actions, or filter bars
- reserve large route-level skeletons for cold loads and direct deep links only

Expected implementation direction:

- audit `loading.tsx` files under `src/app/sheet/[sheetId]`
- reduce or remove broad skeleton replacement for high-frequency sibling routes
- prefer React Query pending states and small inline loading indicators inside client content components
- where route-level loading must remain, make it shell-preserving and minimal

Important rule:

- do not introduce spinner spam
- prefer “old content stays visible with subtle pending state”

Success criteria:

- clicking between dashboard/history/transactions no longer looks like a full page wipe
- the sidebar and inner shell remain visually stable

### Phase 3: Route and query prefetching

Aggressively prefetch likely next navigations.

Target:

- prefetch high-traffic routes from navigation controls
- prefetch matching React Query data for likely next screens
- warm detail views from list items where practical

Expected implementation direction:

- inspect `DesktopNav`, `BottomBar`, dashboard links, history rows, transaction rows, and settings entry links
- use `router.prefetch(...)` or Link prefetch behavior intentionally
- add query prefetching through the shared query keys and current read-model fetch helpers
- prefer hover, focus, or visible-in-viewport prefetch for likely next routes

Priority targets:

- dashboard
- history
- transactions
- settings
- transaction/category detail screens

Important rule:

- prefetch only high-confidence next destinations first
- avoid over-prefetching every possible detail route

Success criteria:

- repeat visits between main sibling screens become near-instant more often
- common detail navigations feel materially faster

### Phase 4: Preserve state across common navigations

Keep list and filter context alive across routine navigation.

Target:

- history filters persist cleanly
- transactions filters persist cleanly
- returning from detail/edit screens should feel stateful, not reset-heavy
- scroll position and visible data should remain stable where possible

Expected implementation direction:

- keep filter state in URL where that already exists
- ensure client content components reuse cached query data instead of resetting to empty
- for high-traffic list/detail flows, consider keeping the list mounted while detail changes

Important rule:

- prefer incremental state preservation over a deep state-management rewrite

Success criteria:

- leaving and returning to history/transactions does not feel like starting over

### Phase 5: High-traffic in-place flows

Convert the most important full-navigation detail flows into in-place interactions.

Priority candidates:

- transaction add/edit
- recurring add/edit
- category add/edit
- payment type add/edit
- category transaction detail

Expected implementation direction:

- use modal routes, intercepted routes, drawers, or split-pane detail views
- prefer one or two high-value flows first, not a blanket rewrite
- reuse the existing validated client form components

Important rule:

- do not convert all forms at once
- start with the flows that most affect perceived navigation quality

Success criteria:

- at least one major edit/detail flow no longer feels like leaving the screen

### Phase 6: Mutation UX refinement

After the shell and navigation changes are stable, remove more redirect-heavy mutation flows.

Target:

- prefer client mutations plus targeted invalidation
- use optimistic or near-optimistic updates where safe
- avoid broad route transitions after common edits

Expected implementation direction:

- start with transactions and categories
- build on the existing query-key and invalidation work
- preserve server authority for writes, but improve the client transition model around them

Success criteria:

- common add/edit/delete operations update the current view without navigation shock

## Concrete File Targets

These files are the likely starting points.

### Shell and chrome

- `src/app/sheet/[sheetId]/layout.tsx`
- `src/app/sheet/[sheetId]/page.tsx`
- `src/app/sheet/[sheetId]/history/page.tsx`
- `src/app/sheet/[sheetId]/transactions/page.tsx`
- `src/app/sheet/[sheetId]/settings/page.tsx`
- shared header/container components under `src/components`

### Loading behavior

- `src/app/sheet/[sheetId]/loading.tsx`
- `src/app/sheet/[sheetId]/history/loading.tsx`
- `src/app/sheet/[sheetId]/transactions/loading.tsx`
- `src/app/sheet/[sheetId]/settings/loading.tsx`
- content components that currently blank out or hard-switch on pending

### Prefetching

- `src/components/DesktopNav.tsx`
- `src/components/BottomBar.tsx`
- dashboard/history/transactions list row link components
- read-model fetch helpers in `src/lib`
- query keys in `src/lib/query-keys.ts`

### High-traffic flows

- transaction forms and loaders
- recurring forms and loaders
- settings lists
- category transaction detail route

## Non-Goals For This Phase

Do not spend this phase on:

- another DB schema redesign
- replacing App Router
- moving auth into the client
- exposing privileged reads to the browser
- redesigning the whole UI system
- a blanket conversion of every route into modal routing

## Quality Rules

- preserve existing permissions and access checks
- preserve direct deep-link behavior for routes
- preserve browser back/forward correctness
- do not regress mobile navigation
- avoid introducing double-fetch or duplicate prefetch loops
- prefer one strong pattern over several inconsistent route-interaction patterns

## Verification Checklist

At the end of each phase, verify these manually:

- dashboard -> history -> transactions -> settings navigation
- mobile bottom bar navigation
- desktop sidebar navigation
- browser back/forward across sibling routes
- direct deep link into history/transactions/detail/edit routes
- loading behavior on warm navigation vs hard refresh
- add/edit/delete after any shell or modal change

Also run:

- `npx tsc --noEmit`

## Recommended First Codex Task

If handing this document back to Codex, start with this exact scope:

1. Add a persistent inner content shell for sheet routes.
2. Reduce broad route-level loading flashes for dashboard, history, and transactions.
3. Add route/query prefetching to `DesktopNav` and `BottomBar`.

Do not start with modal routes first.

## Definition Of Done For This Document

This navigation phase is successful when:

- sibling protected navigation no longer feels like a full page reload
- the shell and inner content frame stay visually stable
- loading feedback becomes local and subtle
- common route transitions are often warm due to prefetching
- at least one major detail/edit flow is proven in-place without harming deep linking

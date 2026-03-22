# SPA Migration Plan

## Purpose

This document describes what it would mean to make the protected part of the app behave like a true SPA, what architecture changes that requires, and whether it is worth moving away from Next.js entirely.

The current app is a Next.js App Router SaaS application with:

- server-side auth enforcement
- server-owned writes and privileged logic
- Supabase auth
- Drizzle for database access
- TanStack Query for a growing set of protected client-side reads

The recent navigation refactor improved route responsiveness, but the product can still feel less SPA-like than expected because App Router still participates in route transitions and some data ownership remains split between server shells and client views.

This document is the recommended path if the product goal becomes:

- instant-feeling navigation inside the protected app
- client-owned list/detail views
- fewer visible server-rendering boundaries
- more persistent UI and cache reuse across routes

## Executive Summary

Recommended direction:

- keep Next.js
- make the protected app a persistent client-owned shell inside a lightweight protected server layout
- move most protected reads to client-side TanStack Query
- use Supabase browser reads only for clearly RLS-safe tables
- use DB views or RPCs for complex joined and aggregate read models
- keep writes, service-role logic, emails, and privileged business logic on the server

Not recommended as the first move:

- replacing Next.js with a fully separate SPA framework and API backend

Reason:

- the app already depends on server-side auth gating, invite flows, cron routes, server actions, and privileged Drizzle logic
- replacing Next.js would create a larger migration surface than needed to achieve SPA-like UX
- the bottleneck is not that the framework is incapable of SPA behavior; the bottleneck is current route/data ownership and the database read model

## What “Full SPA” Means For This App

For this codebase, a practical SPA target means:

- protected-route transitions should be client-led and cache-aware
- filters, search, tabs, pagination, and master-detail flows should not wait on server rendering
- the protected layout should remain mounted across route changes
- data reads should happen in client components through TanStack Query
- client cache should be reused across sibling routes
- loading states should feel like local section refreshes, not full-page reloads

It does not mean:

- removing server-side auth enforcement
- exposing privileged tables directly to the browser
- moving service-role logic to the client
- moving all business logic out of the server

## Current Architecture

### What the app already does well

- uses Next.js App Router with clean route boundaries
- enforces auth and sheet access on the server
- keeps writes on the server
- uses Supabase auth
- uses Drizzle for controlled server-side database access
- now has TanStack Query for several protected client reads

### What still limits SPA feel

- route segments still suspend as part of App Router navigation
- some protected pages still have thin but noticeable server bootstraps
- some complex reads still depend on server-owned data assembly
- the database read surface is not fully modeled for browser use
- some routes still conceptually behave like server-first pages rather than client-first views

## Proposed Target Architecture

## 1. Protected app becomes a client-owned shell

The protected section should behave like one long-lived client app mounted behind one server auth gate.

Recommended shape:

- `src/app/layout.tsx`
  - root layout only
  - providers only
  - no blocking fetches
- `src/app/(protected)/layout.tsx`
  - server-only auth/session gate
  - minimal bootstrap only
  - renders a persistent client app shell
- protected route entries
  - thin route wrappers
  - no heavy data work
  - pass only route params and minimal server-validated bootstrap props

That gives the user:

- persistent nav and header
- less remounting
- more cache reuse
- fewer server-visible transitions

## 2. Server responsibilities remain narrow and intentional

The server should continue to own:

- auth enforcement
- sheet access and permissions
- writes and mutations
- resend email actions
- cron and background logic
- service-role logic
- complex business rules
- privileged queries

The server should stop owning:

- most list renders
- most filter/search query handling
- most protected-page view composition

## 3. Client responsibilities become primary for protected reads

The client should own:

- list and table reads
- filters
- sorting
- search
- pagination
- master-detail browsing
- query caching
- optimistic updates where safe

The client should not own:

- auth trust
- permission enforcement
- destructive or privileged business logic

## Data Access Strategy

All protected reads should be classified into exactly one of these tiers.

## Tier A: Direct browser reads with RLS

Use Supabase browser client when:

- the query is read-only
- the data is clearly protected by RLS
- the read is table-shaped or moderately simple
- the result maps cleanly to a UI list or detail view

Examples:

- `sheets`
- `sheet_users`
- `sheet_settings`
- `categories`
- `payment_types`
- possibly `transactions` for direct filtered reads if RLS is explicitly defined and migration-backed

## Tier B: Browser-safe view or RPC reads

Use a DB view or RPC when:

- the client needs a complex join
- the page depends on aggregate or summary data
- the read model is reused across screens
- client-side fan-out queries would become brittle or expensive

This is the preferred model for SPA-heavy screens in this app.

Recommended read models:

- `history_feed(sheet_id, month, year, type, category_id)`
- `transaction_overview(sheet_id, month, year, type)`
- `dashboard_summary(sheet_id, year, month)`
- `sheet_member_directory(sheet_id)`
- `recurring_overview(sheet_id)`

## Tier C: Server-only Drizzle reads

Use server-side Drizzle when:

- the data is privileged
- the logic is business-heavy
- the read shape is coupled to a write flow
- the query should not become part of the client trust boundary

Examples:

- invite acceptance and email logic
- destructive flows
- general settings updates
- admin-only logic
- anything requiring service-role behavior

## Why complex read models should not be assembled in the client

If the app becomes more SPA-like, the wrong pattern is to solve every screen with multiple raw client queries and then join the data in React.

That causes:

- too many network round-trips
- harder cache invalidation
- more RLS complexity
- more duplicated query logic
- higher risk of inconsistent results

For this app, complex screens should use stable read models instead of client-side fan-out. The biggest candidates are history, dashboard, users, and recurring.

## Profiles Strategy

`profiles` should not be treated as a raw browser table dependency unless the product explicitly wants that exposure model.

Why:

- `profiles` is shared identity data, not sheet-owned content
- the app may not want all member fields exposed to all other members
- this is a privacy and product decision, not just a performance decision

Recommended approach:

- keep raw `profiles` server-only
- expose a constrained member-facing projection instead
- use a view or RPC such as `sheet_member_directory`

Recommended fields:

- `id`
- `display_name`
- `email` only if intended for all sheet members
- `avatar_url`
- `role`

This is safer and cleaner than broad raw-table RLS.

## Route Ownership Model

Each protected route should follow this pattern:

### Server route file

- validate auth
- validate sheet access
- load small bootstrap props if needed
- render the client screen component

### Client screen component

- own TanStack Query reads
- own filters and URL state syncing
- own loading, error, and empty states
- own optimistic UX where appropriate

### Server mutation layer

- own create/update/delete actions
- enforce permissions again on write
- trigger invalidation or refresh behavior

## Route-by-Route Recommendation

## Public routes

### `/login`

- remain server-routed page
- client form is fine

### `/signup`

- remain server-routed page
- client form is fine

### `/invite/[token]`

- remain server-first
- invite acceptance flow should stay server-owned

### `/auth/callback`

- remain server-only route handler

## Protected routes

### `/sheet`

Recommended ownership:

- server gate for auth
- client-owned sheet selector
- pending invites should move to a view or RPC if not already safely modeled

Why:

- high-frequency navigation entry point
- should feel instant and app-like

### `/sheet/[sheetId]` dashboard

Recommended ownership:

- server gate only
- client-owned dashboard panels
- use a single dashboard read model instead of multiple client joins if possible

Why:

- this is the most visible page in the app
- SPA feel depends heavily on dashboard responsiveness

### `/sheet/[sheetId]/transactions`

Recommended ownership:

- server gate only
- client-owned filters and overview
- prefer one read model for category totals by month/type

Why:

- list-heavy
- filter-heavy
- must not feel like a page reload

### `/sheet/[sheetId]/transactions/[transactionId]`

Recommended ownership:

- server validates access and category existence
- client owns filtered list
- use view/RPC if transaction detail joins become richer

### `/sheet/[sheetId]/history`

Recommended ownership:

- server gate only
- client-owned filters and feed
- use a read model for the history feed

Why:

- one of the most SPA-sensitive routes in the app

### `/sheet/[sheetId]/settings`

- server gate only
- page itself can remain light
- links and section chrome do not require special data work

### `/sheet/[sheetId]/settings/category`

- client-owned list
- server-owned writes

### `/sheet/[sheetId]/settings/payment-types`

- client-owned list
- server-owned writes

### `/sheet/[sheetId]/settings/recurring`

- client-owned list
- preferably use a read model instead of client fan-out joins

### `/sheet/[sheetId]/settings/users`

- client-owned directory display
- use a safe member directory read model
- keep invite and removal actions server-owned

### Add/edit routes

Recommended ownership:

- server validates access and permissions
- client owns form bootstrap where safe
- writes remain server-owned

This still fits the SPA model. “Form screen” does not need to mean “server-rendered data page.”

## Query Layer Rules

TanStack Query should become the default protected read layer.

Rules:

- use stable query keys
- avoid global over-abstraction
- preserve previous data during filter transitions where appropriate
- use `staleTime` intentionally
- invalidate narrowly after mutations
- prefetch likely next screens and detail views

Recommended examples:

- `["sheet", sheetId, "dashboard"]`
- `["sheet", sheetId, "transactions", filters]`
- `["sheet", sheetId, "history", filters]`
- `["sheet", sheetId, "users"]`
- `["sheet", sheetId, "recurring"]`

## URL State and Filter Behavior

To feel like an SPA:

- filters should update immediately in the UI
- URL should remain shareable and restorable
- data refetch should follow filter state, not block it

Recommended approach:

- keep filter state URL-backed
- update UI optimistically from local state
- let query refetch behind the scenes
- avoid visually resetting the entire page on filter changes

This is particularly important for:

- transactions
- history
- category detail

## Prefetching Strategy

If the protected app is meant to feel truly SPA-like, prefetching should be treated as a first-class feature.

Recommended prefetch opportunities:

- from dashboard to history and transactions
- from transactions overview to category detail
- from settings index to the first likely settings subpages
- from visible list rows to edit screens

Prefetching should include:

- route prefetch where useful
- query prefetch where the next data access is predictable

## Mutation Strategy

SPA feel is not just about reads. Mutation response matters just as much.

Recommended:

- optimistic updates for low-risk, easily reversible mutations
- invalidate or patch query cache after confirmed writes
- avoid unnecessary full refreshes

Good candidates:

- categories
- payment types
- recurring pause/resume
- invite revoke

Less suitable for optimism:

- destructive admin operations
- invite acceptance flows
- anything with background side effects

## Loading UX Guidance

Protected loading states should shift from “page is loading” to “section data is loading.”

Recommended patterns:

- skeletons only for first load
- subtle inline refresh states for refetches
- preserve previous data during filter changes where appropriate
- avoid blanking the whole screen when only one query changes

This is more SPA-like than repeatedly showing full route skeletons.

## Database Requirements

If the app is going to rely on client-side reads heavily, the database contract must be more disciplined than it is today.

Required improvements:

- every browser-readable table or view must have migration-backed RLS
- policies should not live only in the database manually
- complex protected screens should expose stable read models
- dev and prod policy drift must be removed

This is non-negotiable for a clean SPA architecture.

## Migration Phases

## Phase 1: Stabilize shell ownership

- introduce or formalize a protected route group
- keep the protected layout server-light
- make the client shell persistent
- ensure providers are mounted once

## Phase 2: Normalize read ownership

- inventory every protected read
- classify each as table, view/RPC, or server-only
- remove accidental privileged browser reads

## Phase 3: Create read models

Build views or RPCs for:

- dashboard summary
- history feed
- transaction overview
- recurring overview
- member directory

## Phase 4: Finish client ownership

- make each protected page a thin server wrapper around a client view
- unify query-key conventions
- add prefetch and optimistic mutation behavior

## Phase 5: Polish SPA behavior

- reduce remounting
- reduce full-screen loading
- preserve previous data on filter change
- improve perceived speed through cache reuse

## Why not move away from Next.js entirely?

This is the key decision question.

Short answer:

- because the app’s current needs are better served by changing the protected architecture than by changing frameworks

## Reasons to stay on Next.js

### 1. The app already benefits from server routing and auth boundaries

This app uses:

- auth callback routes
- invite token routes
- cron route handlers
- server actions
- protected route gating
- server-side permission checks

All of those map naturally to Next.js.

### 2. The app is not failing because of Next.js itself

The current friction is mostly caused by:

- server-heavy page ownership
- incomplete client-side read modeling
- inconsistent RLS and read contracts
- some remaining mixed ownership

Those can be fixed without replacing the framework.

### 3. Replacing Next.js would force a much larger migration

Leaving Next.js entirely likely means introducing:

- a separate frontend SPA app
- a separate API layer or BFF
- a new routing stack
- new auth integration details
- new deployment and hosting complexity
- rewritten mutation plumbing

That is a much larger project than “make the protected area feel like a SPA.”

### 4. Next.js can still deliver SPA-like protected UX

A client-owned protected shell with TanStack Query can feel very close to a traditional SPA if:

- the shell is persistent
- reads are client-owned
- routing is light
- data contracts are designed correctly

For this app, that is the better first target.

## When moving away from Next.js would make sense

A framework migration becomes more reasonable if the product decides that:

- every meaningful screen is fully client-owned
- almost all server logic is exposed through dedicated APIs
- server actions no longer provide much value
- SSR/public landing pages are not strategically important
- the team wants a fully separate frontend/backend platform

In that world, a stack like:

- React + TanStack Router + TanStack Query
- Supabase auth
- separate API service for writes and privileged logic

could be reasonable.

But that is a platform shift, not a navigation optimization.

## Costs of leaving Next.js

If the app leaves Next.js, expect to rebuild or rethink:

- route protection flow
- auth callback handling
- invite token flow
- mutation transport
- cron hosting strategy
- server-only secrets and service-role isolation
- deployment flow
- environment management
- SEO/public route handling if needed later

This is likely not the highest-leverage path right now.

## Recommendation

Recommended decision:

- do not move away from Next.js right now
- do make the protected app behave like a client-owned SPA inside Next.js

That delivers most of the UX benefit with far less migration risk.

## Concrete next steps

1. Create a formal protected route group and persistent protected shell.
2. Inventory all remaining protected reads and classify them.
3. Move manual RLS policy knowledge into Drizzle migrations.
4. Design and implement DB read models for dashboard, history, users, recurring, and transaction overview.
5. Convert protected routes to thin server wrappers around client screens.
6. Add prefetch and optimistic updates where safe.

## Decision checklist

Choose “stay on Next.js and make the protected app SPA-like” if:

- you want faster navigation without a platform rewrite
- you still need strong server auth boundaries
- you still rely on server actions, route handlers, and privileged DB logic
- you want to improve UX incrementally

Choose “leave Next.js entirely” only if:

- you are prepared for a broader frontend/backend platform split
- you want almost all app behavior to be API-driven
- you are willing to rebuild the current server-integrated patterns
- this is a strategic platform move, not just a UX improvement

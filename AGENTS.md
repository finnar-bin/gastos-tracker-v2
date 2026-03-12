# AGENTS.md

## Project rules

- Next.js App Router project
- Authenticated SaaS-style app
- Prefer incremental refactors, not large rewrites
- Preserve existing business logic and authorization behavior

## Architecture goals

Server responsibilities:
- Auth enforcement
- Protected route layout
- Writes (create/update/delete)
- Resend email actions
- Privileged queries
- Service-role logic
- Complex business logic

Client responsibilities:
- List/table reads for authenticated pages
- Pagination/filter/search queries
- Data caching via TanStack Query

## Data access rules

Use Supabase browser client when:
- Query is read-only
- Data can be protected via RLS
- Query is simple/moderate joins
- Result is a list/table view

Use Drizzle server-side when:
- Query uses aggressive joins
- Query contains business logic
- Query requires privileged access
- Query shapes complex data objects

Consider DB views or RPC when:
- Client query becomes complex
- Multiple joins are required
- A stable read model is preferable

## UI rules

Protected layout:
- `app/(protected)/layout.tsx`
- Enforce auth
- Must remain lightweight
- No heavy data fetching

Root layout:
- `app/layout.tsx`
- No blocking data fetch

List-heavy pages:
- Server component renders shell
- Add `loading.tsx`
- Main list is client component
- Use TanStack Query
- Paginate large datasets

Dashboard pages:
- Server-render shell
- Use Suspense only for small slow sections

## TanStack Query rules

- Use stable query keys
- Cache list reads
- Handle loading, error, empty states
- Invalidate queries after mutations
- Do not over-abstract hooks

## Security rules

- Never expose service-role keys to the client
- Browser reads must rely on RLS
- Admin client must stay server-only

## Refactor workflow

1. Audit routes and data fetching
2. Classify queries:
   - client-safe
   - view/RPC candidate
   - server-only
3. Migrate list-heavy pages first
4. Implement changes incrementally
5. Maintain existing functionality

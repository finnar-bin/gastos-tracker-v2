# Logic Loop MVP Setup Walkthrough

The Finance Tracker MVP has been successfully scaffolded and configured.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Drizzle ORM + Postgres (Supabase)
- **Auth**: Supabase Auth (Email + Google)
- **Deployment**: Dockerized (Cloud Run ready)

## Project Structure

- `src/app`: Application routes (Dashboard, Login, Add, History)
- `src/lib/db`: Drizzle schema and client
- `src/lib/supabase`: Supabase clients (SSR compatible)
- `src/components/ui`: shadcn/ui components

## Setup Instructions

### 1. Environment Variables

Update `.env.local` with your real Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgres://postgres:[password]@[host]:6543/postgres?pgbouncer=true
```

### 2. Database Migration

Once credentials are set, run:

```bash
npx drizzle-kit migrate
```

This will apply the `transactions` table to your Supabase project.

### 3. Local Development

```bash
npm run dev
```

### 4. Deployment

To build the Docker image:

```bash
docker build -t gastos-tracker .
```

Deploy to Cloud Run using your preferred method (e.g., `gcloud run deploy`).

## Verification Results

- `npm run build`: Passed (Standalone output enabled)
- New files structure verified.

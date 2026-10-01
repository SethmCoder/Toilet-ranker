# Toilet Ranker

Rate bathrooms on toilet/urinal, sink, and floor — then find them on a satellite map.

## Features

- Floating bubble UI (futuristic light + dark themes)
- Retractable rating sidebar with 1–10 sliders
- Overall score = average of the three ratings
- Notes/tips, location name, map pin placement
- Submit ratings to Supabase (falls back to local storage if not configured)
- Leaflet map with Esri satellite imagery and blue pins
- GPS: live location marker + “home to me” button (⌖)
- Nearby bathroom list with min/max rating filters
- Search with live result dropdown (location, notes, ratings)
- Login / sign up / forgot password via Supabase Auth
- 30-minute guest timeout for non-members

## Setup (local)

```bash
npm install
cp .env.example .env
```

Put your Supabase URL and anon key in `.env`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then start:

```bash
npm run dev
```

## Push schema to Supabase

The SQL schema lives at [`supabase/schema.sql`](supabase/schema.sql).

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → New query.
3. Paste the full contents of `supabase/schema.sql` and run it.
4. Enable **Email** auth: Authentication → Providers → Email.
5. Authentication → URL Configuration:
   - Site URL: your Vercel URL (or `http://localhost:5173` for local)
   - Redirect URLs: include both local and production URLs
6. Copy **Project URL** and **anon public** key from Project Settings → API into `.env` (and into Vercel env vars).

You do **not** “deploy the frontend to Supabase.” Supabase is the database + auth backend. The schema is applied once via the SQL editor (or Supabase CLI).

## Deploy to Vercel

1. Push this repo to GitHub (already set up as `SethmCoder/Toilet_ranker_new` if you finished `git push`).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import that repo.
3. Framework preset: **Vite**.
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. After deploy, update Supabase Auth Site URL / redirect URLs to the Vercel domain.

### Is it ready?

| Piece | Status |
| --- | --- |
| Frontend (Vite/React) | Ready for Vercel |
| Schema file | Ready — run `supabase/schema.sql` |
| Env vars | You must add Supabase keys |
| Auth email templates / Site URL | Configure in Supabase dashboard |

Without keys, the app still runs and stores ratings in `localStorage` for UI testing.

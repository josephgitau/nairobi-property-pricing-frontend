# Nairobi Property Intel

A real-time property market intelligence platform for Nairobi, Kenya. Track prices, spot deals, compare neighbourhoods, and visualise affordability across the city — powered by daily-scraped listings and a Supabase backend.

> **Live demo:** https://nairobi-property-pricing-frontend.vercel.app

---

## Features

| Page | What it does |
|---|---|
| **Dashboard** | City-wide median price, top affordable & expensive areas, live deal ticker |
| **Map** | Choropleth affordability map with per-location popups (Leaflet) |
| **Neighbourhoods** | Browse all 59 tracked areas sorted by price; click through for trend charts |
| **Deals** | Filtered feed of below-median listings with discount % badges |
| **Budget Calculator** | Estimate what you can afford given income, deposit, and interest rate |
| **Compare** | Side-by-side comparison of up to 4 neighbourhoods |

---

## Tech Stack

- **Framework** — Next.js 16 (App Router, React 19, TypeScript)
- **Styling** — Tailwind CSS v4, shadcn/ui components
- **Database** — Supabase (PostgreSQL) with Row-Level Security
- **Charts** — Recharts
- **Maps** — Leaflet + react-leaflet
- **Theming** — next-themes (light / dark)
- **Deployment** — Vercel (ISR, 1-hour revalidation)

---

## Project Structure

```
app/
  page.tsx              # Dashboard / hero
  map/                  # Interactive affordability map
  neighborhoods/        # Area listing + [slug] detail pages
  deals/                # Deal finder
  calculator/           # Budget calculator
  compare/              # Side-by-side comparison
  api/summaries/        # Cached REST endpoint for summary data
  loading.tsx           # Global skeleton loading screen
components/
  NavBar.tsx            # Sticky nav with live-data indicator & a11y
  HeroSearch.tsx        # Autocomplete neighbourhood search
  DealTicker.tsx        # Horizontal scrolling deal feed
  TrendChart.tsx        # Recharts price trend line
  AffordabilityMap.tsx  # Leaflet choropleth
lib/
  supabase.ts           # Supabase client (public + service role)
  data.ts               # All DB query functions (optimised)
  format.ts             # KES formatting, slugs, tier colours
  types.ts              # Shared TypeScript types
```

---

## Getting Started Locally

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/josephgitau/nairobi-property-pricing-frontend.git
cd nairobi-property-pricing-frontend
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Only needed for server-side data writes — never exposed to the browser
SUPABASE_SERVICE_KEY=<your-service-role-key>
```

Both keys are found in your Supabase dashboard under **Project Settings → API**.

### 3. Set up the database

Run the following SQL in the Supabase SQL editor:

```sql
-- Core tables
create table scrape_runs (
  id uuid primary key default gen_random_uuid(),
  scraped_at timestamptz not null default now(),
  listings_scraped int,
  source text
);

create table listings (
  id bigserial primary key,
  scrape_run_id uuid references scrape_runs(id),
  url text unique,
  title text,
  price_kes numeric,
  bedrooms int,
  location text,
  property_type text,
  scraped_at timestamptz default now(),
  is_deal boolean default false,
  deal_discount_pct numeric
);

create table location_summary (
  id bigserial primary key,
  summary_date date not null,
  location text not null,
  listing_count int,
  avg_price numeric,
  median_price numeric,
  avg_price_per_bedroom numeric,
  property_type text,
  min_price numeric,
  max_price numeric,
  median_bedrooms numeric
);

create table geocoded_cache (
  location text primary key,
  lat numeric,
  lng numeric
);

-- Performance indexes
create index idx_listings_scrape_run_id on listings(scrape_run_id);
create index idx_listings_deal_filter on listings(is_deal, price_kes) where is_deal = true;
create index idx_listings_location on listings(location);
create index idx_listings_scraped_at on listings(scraped_at desc);
create index idx_summary_date_type on location_summary(summary_date desc, property_type);
create index idx_summary_location_type on location_summary(location, property_type);

-- RPC helper used by hero stats
create or replace function count_distinct_sources()
returns bigint language sql stable security definer as $$
  select count(distinct source) from scrape_runs where source is not null;
$$;
grant execute on function count_distinct_sources() to anon, authenticated;
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Data Pipeline

Listings are scraped and summarised by Python scripts in the companion `nairobi_property_pricing/` directory:

```bash
# 1. Build per-location summaries from scraped CSV
python build_summary.py --type Both

# 2. Generate SQL batch files
python gen_today_sql.py

# 3. Upload to Supabase
python upload_to_supabase.py
```

The pipeline is designed to run daily. The frontend picks up fresh data automatically via Next.js ISR (revalidates every hour).

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Add the three environment variables under **Settings → Environment Variables**.
4. Click **Deploy** — Vercel auto-detects Next.js, no extra build config needed.

### Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key (safe to expose to the browser) |
| `SUPABASE_SERVICE_KEY` | Server only | Service role key — used for writes server-side only |

---

## License

MIT

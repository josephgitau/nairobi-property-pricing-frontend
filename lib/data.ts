import { supabase } from './supabase'
import type { LocationSummary, Listing, ScrapeRun, LocationWithGeo } from './types'

/** Get the most recent scrape run */
export async function getLatestRun(): Promise<ScrapeRun | null> {
  const { data } = await supabase
    .from('scrape_runs')
    .select('*')
    .eq('status', 'success')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data as ScrapeRun | null
}

/** Get today's (or latest available) location summaries — single round trip */
export async function getLatestSummaries(
  listingType: 'Sale' | 'Rent' | 'Both' = 'Both'
): Promise<LocationSummary[]> {
  // Use a single query with subquery to get latest date in one round trip
  const { data: _data } = await supabase
    .from('location_summary')
    .select('*')
    .eq('listing_type', listingType)
    .order('summary_date', { ascending: false })
    .order('affordability_rank', { ascending: true })
    .limit(200) // Max 200 locations — more than enough for any city

  const data = _data as LocationSummary[] | null
  if (!data || data.length === 0) return []

  // Filter to only the most recent date (first row determines the date)
  const latestDate = data[0].summary_date
  return data.filter((row) => row.summary_date === latestDate)
}

/** Get all summaries for a specific location (for trend chart) */
export async function getLocationTrend(
  location: string,
  listingType: 'Sale' | 'Rent' | 'Both' = 'Both',
  days = 30
): Promise<LocationSummary[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data } = await supabase
    .from('location_summary')
    .select('*')
    .eq('location', location)
    .eq('listing_type', listingType)
    .gte('summary_date', since.toISOString().split('T')[0])
    .order('summary_date', { ascending: true })

  return (data ?? []) as LocationSummary[]
}

/** Get listings flagged as deals, paginated */
export async function getDeals(page = 0, pageSize = 20): Promise<Listing[]> {
  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('is_deal', true)
    .order('scraped_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  return (data ?? []) as Listing[]
}

/** Get paginated listings with optional filters */
export async function getListings(options: {
  location?: string
  listingType?: 'Sale' | 'Rent'
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  page?: number
  pageSize?: number
} = {}): Promise<{ listings: Listing[]; count: number }> {
  const { location, listingType, minPrice, maxPrice, bedrooms, page = 0, pageSize = 20 } = options

  let query = supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .order('scraped_at', { ascending: false })

  if (location) query = query.ilike('location', `%${location}%`)
  if (listingType) query = query.eq('listing_type', listingType)
  if (minPrice) query = query.gte('price_kes', minPrice)
  if (maxPrice) query = query.lte('price_kes', maxPrice)
  if (bedrooms) query = query.eq('bedrooms', bedrooms)

  query = query.range(page * pageSize, (page + 1) * pageSize - 1)

  const { data, count } = await query
  return { listings: (data ?? []) as Listing[], count: count ?? 0 }
}

/** Get location summaries joined with geocoding for map display */
export async function getSummariesWithGeo(
  listingType: 'Sale' | 'Rent' | 'Both' = 'Both'
): Promise<LocationWithGeo[]> {
  const summaries = await getLatestSummaries(listingType)
  if (!summaries.length) return []

  const locations = summaries.map((s) => s.location)

  const { data: geoData } = await supabase
    .from('geocoded_cache')
    .select('*')
    .in('location', locations) as unknown as { data: Array<{ location: string; lat: number | null; lon: number | null }> | null }

  const geoMap = new Map((geoData ?? []).map((g) => [g.location, g]))

  return summaries.map((s) => ({
    ...s,
    lat: geoMap.get(s.location)?.lat ?? null,
    lon: geoMap.get(s.location)?.lon ?? null,
  }))
}

/** Quick stats for the homepage hero — single efficient query */
export async function getHeroStats(): Promise<{
  totalListings: number
  medianPrice: number | null
  mostAffordable: string | null
  lastUpdated: string | null
  activeSources: number
}> {
  const [runResult, summaryResult, countResult] = await Promise.all([
    supabase
      .from('scrape_runs')
      .select('completed_at, listings_scraped')
      .eq('status', 'success')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: { completed_at: string | null; listings_scraped: number | null } | null }>,
    getLatestSummaries('Both'),
    // Count distinct sources efficiently — no full table scan
    supabase.rpc('count_distinct_sources') as unknown as Promise<{ data: number | null; error: unknown }>,
  ])

  const medianPrices = summaryResult
    .map((s) => s.median_price)
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b)

  const medianPrice = medianPrices.length
    ? medianPrices[Math.floor(medianPrices.length / 2)]
    : null

  const mostAffordable = summaryResult.find((s) => s.affordability_rank === 1)?.location ?? null

  return {
    totalListings: runResult.data?.listings_scraped ?? summaryResult.reduce((s, l) => s + (l.listing_count ?? 0), 0),
    medianPrice,
    mostAffordable,
    lastUpdated: runResult.data?.completed_at ?? null,
    activeSources: (countResult.data as number | null) ?? 4,
  }
}

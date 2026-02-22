export type ListingType = 'Sale' | 'Rent' | 'Both'

export interface ScrapeRun {
  id: string
  started_at: string
  completed_at: string | null
  listings_scraped: number | null
  status: 'running' | 'success' | 'error'
  error_msg: string | null
}

export interface Listing {
  id: string
  scrape_run_id: string | null
  source: string
  listing_type: ListingType
  title: string | null
  price_kes: number | null
  location: string | null
  bedrooms: number | null
  bathrooms: number | null
  size_sqm: number | null
  property_type: string | null
  url: string | null
  scraped_at: string | null
  price_per_bedroom: number | null
  price_per_sqm: number | null
  is_deal: boolean
}

export interface LocationSummary {
  id: string
  location: string
  summary_date: string
  listing_type: ListingType
  avg_price: number | null
  median_price: number | null
  avg_price_per_bedroom: number | null
  median_price_per_bedroom: number | null
  affordability_rank: number | null
  listing_count: number | null
  median_bedrooms: number | null
}

export interface GeocodedCache {
  location: string
  lat: number | null
  lon: number | null
  strategy: string | null
  geocoded_at: string | null
}

export interface LocationWithGeo extends LocationSummary {
  lat: number | null
  lon: number | null
}

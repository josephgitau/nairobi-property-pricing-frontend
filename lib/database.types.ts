// Auto-generated shape for Supabase type-safe client
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      scrape_runs: {
        Row: {
          id: string
          started_at: string
          completed_at: string | null
          listings_scraped: number | null
          status: string
          error_msg: string | null
        }
        Insert: Omit<Database['public']['Tables']['scrape_runs']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['scrape_runs']['Row']>
      }
      listings: {
        Row: {
          id: string
          scrape_run_id: string | null
          source: string
          listing_type: string
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
        Insert: Omit<Database['public']['Tables']['listings']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['listings']['Row']>
      }
      location_summary: {
        Row: {
          id: string
          location: string
          summary_date: string
          listing_type: string
          avg_price: number | null
          median_price: number | null
          avg_price_per_bedroom: number | null
          median_price_per_bedroom: number | null
          affordability_rank: number | null
          listing_count: number | null
          median_bedrooms: number | null
        }
        Insert: Omit<Database['public']['Tables']['location_summary']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['location_summary']['Row']>
      }
      geocoded_cache: {
        Row: {
          location: string
          lat: number | null
          lon: number | null
          strategy: string | null
          geocoded_at: string | null
        }
        Insert: Database['public']['Tables']['geocoded_cache']['Row']
        Update: Partial<Database['public']['Tables']['geocoded_cache']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: {
      count_distinct_sources: {
        Args: Record<string, never>
        Returns: number
      }
    }
    Enums: Record<string, never>
  }
}

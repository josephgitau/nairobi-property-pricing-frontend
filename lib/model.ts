// Types and prediction logic for the price model (model.json)

export interface ModelMeta {
  trained_at: string
  training_rows: number
  r2: number
  rmse_log: number
  approx_rmse_multiplier: number
  locations_in_model: number
}

export interface LocationStats {
  name: string
  slug: string
  sale: PriceBucket | null
  rent: PriceBucket | null
  all: { count: number; median: number }
}

export interface PriceBucket {
  count: number
  median: number
  q25: number
  q75: number
  min: number
  max: number
}

export interface ModelData {
  meta: ModelMeta
  regression: {
    intercept: number
    coef_bedrooms: number
    coef_rent: number
    location_premiums: Record<string, number>
  }
  location_stats: Record<string, LocationStats>
  bedroom_median_price: Record<string, number>
  bedroom_distribution: Record<string, {
    count: number
    median_sale: number | null
    median_rent: number | null
  }>
  global_stats: {
    total_listings: number
    total_sale: number
    total_rent: number
    median_sale_price: number
    median_rent_price: number
    avg_bedrooms: number
    price_range: {
      sale_min: number; sale_max: number
      rent_min: number; rent_max: number
    }
  }
  price_tiers: {
    sale: Record<string, number>
    rent: Record<string, number>
  }
  top_lists: {
    affordable_sale: TopItem[]
    expensive_sale: TopItem[]
    affordable_rent: TopItem[]
    expensive_rent: TopItem[]
  }
}

export interface TopItem {
  slug: string
  name: string
  median: number
}

/** Predict price given inputs. Returns { predicted, low, high, confidence } */
export function predictPrice(
  model: ModelData,
  slug: string,
  bedrooms: number,
  listingType: 'Sale' | 'Rent'
): { predicted: number; low: number; high: number; confidence: 'high' | 'medium' | 'low'; inModel: boolean } {
  const { intercept, coef_bedrooms, coef_rent, location_premiums } = model.regression
  const is_rent = listingType === 'Rent' ? 1 : 0
  const loc_premium = location_premiums[slug] ?? 0
  const inModel = slug in location_premiums

  const log_price = intercept + coef_bedrooms * bedrooms + coef_rent * is_rent + loc_premium
  const predicted = Math.round(Math.exp(log_price))

  const mult = model.meta.approx_rmse_multiplier
  const low  = Math.round(predicted / mult)
  const high = Math.round(predicted * mult)

  // Location stats can narrow confidence
  const locStats = model.location_stats[slug]
  const bucket = listingType === 'Sale' ? locStats?.sale : locStats?.rent
  const enoughData = (bucket?.count ?? 0) >= 10

  const confidence: 'high' | 'medium' | 'low' = inModel && enoughData ? 'high' : inModel ? 'medium' : 'low'

  return { predicted, low, high, confidence, inModel }
}

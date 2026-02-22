import { NextRequest, NextResponse } from 'next/server'
import { getLatestSummaries } from '@/lib/data'

export const revalidate = 3600 // Cache for 1 hour

export async function GET(request: NextRequest) {
  // Validate and sanitize input — only allow known values
  const rawType = request.nextUrl.searchParams.get('type') ?? 'Both'
  const listingType = (['Sale', 'Rent', 'Both'].includes(rawType) ? rawType : 'Both') as 'Sale' | 'Rent' | 'Both'

  try {
    const summaries = await getLatestSummaries(listingType)

    return NextResponse.json(
      summaries.map((s) => ({
        location: s.location,
        avg_price: s.avg_price,
        avg_price_per_bedroom: s.avg_price_per_bedroom,
        median_price: s.median_price,
        listing_count: s.listing_count,
        affordability_rank: s.affordability_rank,
        median_bedrooms: s.median_bedrooms,
      })),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    )
  } catch (error) {
    console.error('[/api/summaries] Error fetching summaries:', error)
    return NextResponse.json({ error: 'Failed to fetch summaries' }, { status: 500 })
  }
}

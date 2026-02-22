import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Bed, Bath, Globe, TrendingUp, Hash, BarChart3, TrendingDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getLocationTrend, getListings } from '@/lib/data'
import { formatKES, priceTier, tierColor, toSlug } from '@/lib/format'
import type { LocationSummary } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import TrendChart from '@/components/TrendChart'
import { format } from 'date-fns'

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 86400

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const location = slug.replace(/-/g, ' ')
  return {
    title: `${toTitleCase(location)} Property Prices — ${format(new Date(), 'MMMM yyyy')}`,
    description: `Latest property prices in ${toTitleCase(location)}, Nairobi. Average price, price per bedroom, affordability rank, and 30-day trend.`,
  }
}

export default async function NeighborhoodPage({ params }: Props) {
  const { slug } = await params

  // Efficient: get distinct locations from the latest summary date only
  const { data: latestDateRow } = await supabase
    .from('location_summary')
    .select('summary_date')
    .order('summary_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latestDateRow) return notFound()

  const { data: allLocRows } = await supabase
    .from('location_summary')
    .select('location')
    .eq('summary_date', latestDateRow.summary_date)

  const uniqueLocations = (allLocRows ?? []).map((r: { location: string }) => r.location)
  const location = uniqueLocations.find((loc) => toSlug(loc) === slug)

  if (!location) return notFound()

  const { data: latestRows } = await supabase
    .from('location_summary')
    .select('*')
    .eq('location', location)
    .order('summary_date', { ascending: false })
    .limit(3)

  if (!latestRows || latestRows.length === 0) return notFound()

  const summary = latestRows[0] as unknown as LocationSummary
  const totalSummaries = await supabase
    .from('location_summary')
    .select('*', { count: 'exact', head: true })
    .eq('summary_date', summary.summary_date)
    .eq('listing_type', summary.listing_type)

  const total = totalSummaries.count ?? 1

  const [trend, { listings }] = await Promise.all([
    getLocationTrend(summary.location, summary.listing_type as 'Sale' | 'Rent' | 'Both', 180),
    getListings({ location: summary.location, pageSize: 8 }),
  ])

  const tier = priceTier(summary.affordability_rank ?? total, total)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12 animate-fade-up relative z-10">

      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 w-full max-w-2xl h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Back */}
      <div className="relative z-10">
        <Link href="/neighborhoods" className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all group bg-card/60 border border-border/50 backdrop-blur-md px-4 py-2 rounded-full hover:shadow-md hover:bg-card">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Directory
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10 mt-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-primary/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Hash className="h-7 w-7 text-indigo-500 group-hover:text-white transition-colors duration-500 relative z-10" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold capitalize tracking-tight">{summary.location}</h1>
              <Badge className={`${tierColor(tier)} text-xs uppercase px-3 py-1 font-bold shadow-sm`}>{tier} Market</Badge>
            </div>
            <p className="text-muted-foreground font-semibold text-sm mt-2 flex items-center gap-3">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">Rank <strong className="font-extrabold mx-1">#{summary.affordability_rank}</strong> of {total}</span>
              <span className="opacity-60 text-[11px] uppercase tracking-wider">Updated {summary.summary_date}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        <DetailStatCard icon={<BarChart3 className="h-5 w-5" />} label="Avg Price" value={formatKES(summary.avg_price)} />
        <DetailStatCard icon={<TrendingUp className="h-5 w-5" />} label="Median Price" value={formatKES(summary.median_price)} />
        <DetailStatCard icon={<Bed className="h-5 w-5" />} label="Avg / Bedroom" value={formatKES(summary.avg_price_per_bedroom)} highlight />
        <DetailStatCard icon={<Hash className="h-5 w-5" />} label="Listings" value={String(summary.listing_count ?? 0)} />
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-8 relative z-10">

        {/* Left Column: Chart */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card border border-border/50 rounded-3xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-8 w-1.5 rounded-full bg-primary" />
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Price Trend</h2>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5 opacity-80">30-day per-bed movement</p>
              </div>
            </div>
            <div className="h-[280px]">
              <TrendChart data={trend} metric="avg_price_per_bedroom" />
            </div>
          </div>
        </div>

        {/* Right Column: About */}
        <div className="space-y-6">
          <div className="glass-card border border-border/50 rounded-3xl p-6 shadow-md shadow-primary/5 hover:border-primary/30 transition-colors">
            <h2 className="text-lg font-extrabold text-foreground mb-4">Location Intelligence</h2>
            <div className="space-y-4 text-sm font-medium text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground capitalize">{summary.location}</strong> ranks <strong className="text-primary bg-primary/10 px-1.5 py-0.5 rounded-md mx-0.5">#{summary.affordability_rank}</strong> out of {total} active Nairobi neighborhoods, placing it firmly in the <strong className="text-foreground uppercase tracking-wider text-[11px] bg-accent px-1.5 py-0.5 rounded-md">{tier}</strong> tier.
              </p>
              <div className="h-px w-full bg-border/50 my-2" />
              <p>
                The average list price rests at <strong className="text-foreground">{formatKES(summary.avg_price)}</strong> with a true market median of <strong className="text-foreground">{formatKES(summary.median_price)}</strong> based on <strong className="text-foreground">{summary.listing_count}</strong> active properties.
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-[11px] font-bold uppercase tracking-wider mt-4">
                Powered by multi-source data sync (BuyRentKenya, Property24, PigiaMe, Jiji)
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent listings */}
      {listings.length > 0 && (
        <div className="space-y-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1.5 rounded-full bg-indigo-500" />
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Recent Opportunities</h2>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5 opacity-80">Latest {listings.length} properties discovered</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {listings.map((l) => (
              <a
                href={l.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                key={l.id}
                className="group relative flex flex-col glass-card border flex-1 border-border/50 hover:border-primary/40 rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 overflow-hidden"
              >
                {/* Meta badging */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-background/50 border-border/50">{l.listing_type}</Badge>
                  {l.is_deal && <Badge className="text-[10px] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-sm"><TrendingDown className="h-3 w-3 mr-1" /> Deal</Badge>}
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all ml-auto translate-x-2 group-hover:translate-x-0" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 mb-4">
                  <p className="font-bold text-sm tracking-tight leading-snug line-clamp-2 group-hover:text-primary transition-colors">{l.title ?? 'Untitled Listing'}</p>
                </div>

                <div className="mt-auto space-y-4 pt-4 border-t border-border/40">
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                    {l.bedrooms != null && <span className="flex items-center gap-1.5 bg-background border border-border/40 rounded-md px-1.5 py-1"><Bed className="h-3 w-3 text-foreground/40" />{l.bedrooms}</span>}
                    {l.bathrooms != null && <span className="flex items-center gap-1.5 bg-background border border-border/40 rounded-md px-1.5 py-1"><Bath className="h-3 w-3 text-foreground/40" />{l.bathrooms}</span>}
                    {l.property_type && <span className="capitalize bg-background border border-border/40 rounded-md px-1.5 py-1 ml-auto">{l.property_type}</span>}
                  </div>

                  <div className="flex items-end justify-between">
                    <p className="font-extrabold text-[17px] tracking-tight tabular-nums">{formatKES(l.price_kes)}</p>
                    <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60"><Globe className="h-3 w-3" />{l.source}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

function DetailStatCard({ icon, label, value, highlight }: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean
}) {
  return (
    <div className={`relative overflow-hidden glass-card border border-border/50 rounded-3xl p-5 ${highlight ? '!border-primary/40 shadow-lg shadow-primary/10' : 'shadow-sm'}`}>
      {highlight && <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${highlight ? 'bg-gradient-to-br from-primary to-indigo-600 text-white shadow-md shadow-primary/30' : 'bg-accent/60 text-muted-foreground border border-border/50'}`}>
        {icon}
      </div>
      <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-extrabold mb-0.5">{label}</p>
      <p className={`text-2xl font-extrabold tabular-nums tracking-tight ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function toTitleCase(str: string) {
  return str.split(/[\s,]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

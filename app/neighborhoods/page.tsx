import type { Metadata } from 'next'
import Link from 'next/link'
import { getLatestSummaries } from '@/lib/data'
import { formatKES, toSlug, priceTier, tierColor } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, BarChart3, TrendingUp, ArrowDown, ArrowUp, Layers } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Areas — NairobiPI',
  description: 'Browse property prices across 145+ Nairobi neighborhoods. Filter by sale or rental, sort by price, affordability rank, or listing count.',
}

export const revalidate = 3600

interface Props {
  searchParams: Promise<{ sort?: string }>
}

export default async function NeighborhoodsPage({ searchParams }: Props) {
  const params = await searchParams
  const sort = params.sort ?? 'rank'

  const summaries = await getLatestSummaries('Both')

  const sorted = [...summaries].sort((a, b) => {
    switch (sort) {
      case 'price_desc': return (b.avg_price ?? 0) - (a.avg_price ?? 0)
      case 'price_asc': return (a.avg_price ?? 0) - (b.avg_price ?? 0)
      case 'count': return (b.listing_count ?? 0) - (a.listing_count ?? 0)
      case 'rank':
      default: return (a.affordability_rank ?? 999) - (b.affordability_rank ?? 999)
    }
  })

  const avgPrice = sorted.length
    ? Math.round(sorted.reduce((s, l) => s + (l.avg_price ?? 0), 0) / sorted.length)
    : 0
  const topArea = sorted[0]?.location ?? '—'
  const totalListings = sorted.reduce((s, l) => s + (l.listing_count ?? 0), 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10 animate-fade-up relative z-10">

      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-primary/5 blur-3xl rounded-[100%] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <BarChart3 className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">Neighborhood Rankings</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">{sorted.length} tracked areas ranked by affordability</p>
          </div>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 staggered-grid relative z-10">
        <StatWidget icon={<Layers />} label="Tracked Areas" value={String(sorted.length)} />
        <StatWidget icon={<TrendingUp />} label="Market Average" value={formatKES(avgPrice)} />
        <StatWidget icon={<ArrowDown className="text-emerald-500" />} label="Most Accessible" value={topArea} />
        <StatWidget icon={<BarChart3 />} label="Total Listings" value={totalListings.toLocaleString()} />
      </div>

      {/* Controls & Grid Section */}
      <div className="space-y-6 relative z-10">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-card/40 backdrop-blur-sm border border-border/50 p-3 rounded-2xl">
          <span className="text-muted-foreground font-semibold px-2 text-sm">Sort by:</span>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { key: 'rank', label: 'Rank', icon: TrendingUp },
                { key: 'price_asc', label: 'Cheapest', icon: ArrowDown },
                { key: 'price_desc', label: 'Priciest', icon: ArrowUp },
                { key: 'count', label: 'Listings', icon: Layers },
              ] as const
            ).map(({ key, label, icon: Icon }) => {
              const isActive = sort === key;
              return (
                <Link
                  key={key}
                  href={`/neighborhoods?sort=${key}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
                    : 'bg-background border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map((s, i) => {
            const tier = priceTier(s.affordability_rank ?? sorted.length, sorted.length)
            const isTop3 = sort === 'rank' && i < 3
            return (
              <Link
                key={s.location}
                href={`/neighborhoods/${toSlug(s.location)}`}
                className={`group relative glass-card p-5 rounded-3xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl flex flex-col h-full ${isTop3 ? 'border-primary/40 dark:border-primary/30 shadow-primary/5' : 'border-border/50 hover:border-border'
                  }`}
              >
                {isTop3 && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full rounded-tr-3xl -z-10 transition-colors group-hover:bg-primary/20" />
                )}

                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold shrink-0 transition-all duration-300 ${isTop3
                      ? 'bg-gradient-to-br from-indigo-500 to-primary text-white shadow-md shadow-primary/30 group-hover:scale-110 group-hover:-rotate-3'
                      : 'bg-accent/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary border border-border/50'
                      }`}>
                      #{s.affordability_rank}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-lg capitalize truncate group-hover:text-primary transition-colors">
                        {s.location}
                      </p>
                      <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                        {s.listing_count ?? 0} active listings
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </div>

                <div className="pt-4 border-t border-border/40 grid grid-cols-2 gap-3">
                  <div className="bg-background/50 rounded-xl p-2.5 backdrop-blur-sm border border-border/30">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Avg Price</p>
                    <p className="text-sm font-bold tabular-nums text-foreground">{formatKES(s.avg_price)}</p>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-2.5 backdrop-blur-sm border border-primary/10">
                    <p className="text-[10px] text-primary uppercase tracking-wider font-bold mb-1 group-hover:text-primary/70 transition-colors">Per Bed</p>
                    <p className="text-sm font-bold text-primary tabular-nums">{formatKES(s.avg_price_per_bedroom)}</p>
                  </div>
                </div>

                <div className="mt-auto pt-3 text-center">
                  <Badge className={`text-[10px] w-full justify-center py-1 font-bold tracking-wider rounded-lg border-opacity-50 ${tierColor(tier)}`}>
                    {tier} Market
                  </Badge>
                </div>
              </Link>
            )
          })}
        </div>

        {sorted.length === 0 && (
          <div className="text-center py-24 space-y-4 glass-card rounded-3xl border-border/50">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No neighborhood data available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatWidget({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card border border-border/50 rounded-2xl p-5 flex flex-col justify-center">
      <div className="flex items-center gap-3 text-muted-foreground mb-3 font-semibold text-sm">
        <div className="p-1.5 rounded-lg bg-accent/50 border border-border/50 text-foreground group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="uppercase tracking-wider text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums text-foreground tracking-tight truncate">{value}</p>
    </div>
  )
}

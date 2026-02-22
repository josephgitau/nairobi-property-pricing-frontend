import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, Tag, AlertCircle, Bed, Bath, Ruler, Globe, Sparkles, ChevronRight, TrendingDown, MapPin } from 'lucide-react'
import { getDeals } from '@/lib/data'
import { formatKES, toSlug } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { format, formatDistanceToNow } from 'date-fns'

export const metadata: Metadata = {
  title: 'Deals — NairobiPI',
  description: 'Nairobi properties currently priced 15%+ below their neighborhood average price per bedroom. Updated daily from 4 property sites.',
}

export const revalidate = 3600

export default async function DealsPage() {
  const deals = await getDeals(0, 40)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10 animate-fade-up relative z-10">

      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-full max-w-xl h-64 bg-amber-500/10 blur-[100px] rounded-[100%] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Tag className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Deal Finder</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">
              Listings priced 15%+ below area median
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 backdrop-blur-md rounded-2xl px-5 py-3 shadow-lg shadow-amber-500/5">
          <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="font-extrabold text-amber-600 dark:text-amber-400 leading-none">{deals.length} active deals</span>
            <span className="text-[10px] uppercase tracking-wider text-amber-600/70 font-bold mt-1">Found Today</span>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="glass-card flex items-start gap-4 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-400 to-orange-600" />
        <TrendingDown className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-amber-600 dark:text-amber-400 mb-1">How our pipeline flags deals</h3>
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
            After daily data sync, our engine identifies listings where the <strong className="text-foreground">price-per-bedroom is 15%+ lower</strong> than the location&apos;s 14-day median.
            <span className="opacity-70 ml-1">Always perform due diligence with the seller as lower prices may reflect property conditions.</span>
          </p>
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="text-center py-24 space-y-4 glass-card rounded-3xl border-border/50">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <h3 className="text-xl font-bold">No deals flagged today</h3>
          <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto">Deals are strictly algorithm-identified. Check back tomorrow after the daily refresh.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {deals.map((listing) => (
            <div key={listing.id} className="relative glass-card border flex flex-col border-border/50 hover:border-amber-500/50 rounded-3xl p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-amber-500/10 group">

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className="text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 px-2 py-0.5 font-bold shadow-sm backdrop-blur-md">
                  <TrendingDown className="h-3 w-3 mr-1.5" />Deal
                </Badge>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold border-border/50 bg-background/50 shadow-sm">{listing.listing_type}</Badge>
                {listing.property_type && (
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold border-border/50 bg-background/50 shadow-sm">{listing.property_type}</Badge>
                )}
              </div>

              {/* Title & location */}
              <h3 className="font-bold text-base leading-snug line-clamp-2 mb-2 group-hover:text-amber-500 transition-colors">{listing.title ?? 'Untitled property'}</h3>
              {listing.location && (
                <Link href={`/neighborhoods/${toSlug(listing.location)}`} className="text-xs text-primary font-bold hover:underline capitalize inline-flex items-center gap-1 w-fit bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                  <MapPin className="h-3 w-3" /> {listing.location}
                </Link>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap gap-2 mt-4 text-xs font-semibold text-muted-foreground">
                {listing.bedrooms != null && (
                  <span className="flex items-center gap-1.5 bg-background border border-border/50 rounded-lg px-2 py-1 shadow-sm"><Bed className="h-3.5 w-3.5 text-foreground/50" />{listing.bedrooms}</span>
                )}
                {listing.bathrooms != null && (
                  <span className="flex items-center gap-1.5 bg-background border border-border/50 rounded-lg px-2 py-1 shadow-sm"><Bath className="h-3.5 w-3.5 text-foreground/50" />{listing.bathrooms}</span>
                )}
                {listing.size_sqm != null && (
                  <span className="flex items-center gap-1.5 bg-background border border-border/50 rounded-lg px-2 py-1 shadow-sm"><Ruler className="h-3.5 w-3.5 text-foreground/50" />{listing.size_sqm}m²</span>
                )}
                <span className="flex items-center gap-1.5 bg-background border border-border/50 rounded-lg px-2 py-1 shadow-sm"><Globe className="h-3.5 w-3.5 text-foreground/50" />{listing.source}</span>
              </div>

              {/* Price + link */}
              <div className="mt-auto pt-6 flex items-end justify-between border-t border-border/40 mt-6 relative">
                <div>
                  <p className="text-xl font-extrabold tabular-nums tracking-tight">{formatKES(listing.price_kes)}</p>
                  {listing.price_per_bedroom && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-bold tabular-nums mt-0.5">{formatKES(listing.price_per_bedroom)}/bed</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {listing.url && (
                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-foreground hover:bg-foreground/80 text-background px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
                    >
                      View <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {listing.scraped_at && (
                    <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/60">
                      Added {formatDistanceToNow(new Date(listing.scraped_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

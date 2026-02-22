import Link from 'next/link'
import {
  ArrowRight, MapPin, TrendingDown, TrendingUp, Tag, Calculator,
  Zap, BarChart3, Clock, Sparkles, Scale, Search, ShieldCheck, Globe
} from 'lucide-react'
import { getHeroStats, getLatestSummaries, getDeals } from '@/lib/data'
import HeroSearch from '@/components/HeroSearch'
import DealTicker from '@/components/DealTicker'
import { formatKES, priceTier, tierColor, toSlug } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export const revalidate = 3600

export default async function HomePage() {
  const [stats, summaries, deals] = await Promise.all([
    getHeroStats(),
    getLatestSummaries('Both'),
    getDeals(0, 5),
  ])

  const top5Affordable = summaries.slice(0, 4)
  const top5Expensive = [...summaries]
    .sort((a, b) => (b.avg_price ?? 0) - (a.avg_price ?? 0))
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 selection:text-primary">
      {/* Immersive Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex justify-center">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full mix-blend-screen opacity-50 dark:opacity-20 animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[150px] rounded-full mix-blend-screen opacity-50 dark:opacity-20" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.02] dark:opacity-[0.04] mix-blend-overlay" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-24 z-10 w-full overflow-hidden border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left Content */}
            <div className="flex-1 max-w-2xl animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-8 shadow-sm backdrop-blur-md">
                <span>Nairobi's Most Intelligent Real Estate Engine</span>
              </div>
              <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
                Discover the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-fuchsia-500">True Value of Home.</span>
              </h1>
              <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed mb-10 font-medium max-w-xl">
                We track <strong className="text-foreground">{stats.totalListings?.toLocaleString()}</strong> live active properties across <strong className="text-foreground">{summaries.length}</strong> neighborhoods. Stop guessing and start navigating with precision data.
              </p>

              <div className="relative z-50">
                <HeroSearch summaries={summaries} />
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 mt-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Verified Data</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> Daily Updates</span>
                <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-primary" /> {stats.activeSources}+ Sources</span>
              </div>
            </div>

            {/* Right Content - Floating Glass Dashboard */}
            <div className="flex-1 w-full lg:w-auto animate-fade-in relative hidden md:block select-none pointer-events-none mt-10 lg:mt-0">
              <div className="relative w-[500px] h-[550px] mx-auto perspective-2000">
                {/* Main floating card */}
                <div className="absolute inset-0 glass-card border border-white/20 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-between transform rotate-y-[-10deg] rotate-x-[5deg] animate-float">

                  <div className="flex items-center justify-between border-b border-border/50 pb-6">
                    <div>
                      <p className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider mb-2">City-wide Median</p>
                      <p className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">{formatKES(stats.medianPrice)}</p>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/30">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Top Deal Found Today</p>
                    {deals[0] ? (
                      <div className="bg-background/60 border border-border/50 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">Hot Deal</Badge>
                          <span className="text-xs font-bold text-muted-foreground">{deals[0].location}</span>
                        </div>
                        <p className="text-sm font-bold truncate mb-3">{deals[0].title}</p>
                        <p className="text-2xl font-extrabold tabular-nums tracking-tight">{formatKES(deals[0].price_kes)}</p>
                      </div>
                    ) : (
                      <div className="h-24 bg-muted/40 rounded-2xl animate-pulse" />
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-border/50 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Active Pipeline</span>
                    <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">
                      <Zap className="h-3 w-3" /> Syncing Live
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-32 pt-20 space-y-32 relative z-10">

        {/* Bento Grid Features */}
        <section>
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">Core Capabilities</h2>
              <p className="text-muted-foreground text-lg font-medium max-w-lg">Everything you need to navigate the Nairobi market, centralized in one powerful intelligence suite.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-auto md:auto-rows-[280px]">

            {/* Map Bento (Span 2x2 on desktop) */}
            <Link href="/map" className="group relative glass-card min-h-[300px] md:min-h-0 md:col-span-2 md:row-span-2 rounded-3xl sm:rounded-[2rem] overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-500 flex flex-col p-6 sm:p-10 hover:shadow-2xl hover:shadow-primary/10">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent z-0" />
              <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                <MapPin className="w-64 h-64 sm:w-96 sm:h-96 text-primary translate-x-1/4 translate-y-1/4" />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 sm:mb-6">
                  <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-500" />
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2 sm:mb-3 group-hover:text-primary transition-colors">Affordability Engine</h3>
                <p className="text-muted-foreground font-medium text-sm sm:text-lg max-w-sm mb-6 sm:mb-8 leading-relaxed">
                  Interactive heatmaps of the entire city. Spot undervalued neighborhoods instantly.
                </p>
                <div className="mt-auto flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-primary">
                  Launch Map <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Compare Bento */}
            <Link href="/compare" className="group relative glass-card md:col-span-1 rounded-3xl sm:rounded-[2rem] border border-border/50 hover:border-primary/50 transition-all duration-500 p-6 sm:p-8 flex flex-col hover:-translate-y-2 hover:shadow-xl min-h-[220px] md:min-h-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 sm:mb-6 text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <Scale className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">Compare</h3>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">Line up neighborhoods head-to-head. Analyze prices side-by-side.</p>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary mt-auto group-hover:translate-x-1 transition-all" />
            </Link>

            {/* Area Rankings Bento */}
            <Link href="/neighborhoods" className="group relative glass-card md:col-span-1 rounded-3xl sm:rounded-[2rem] border border-border/50 hover:border-primary/50 transition-all duration-500 p-6 sm:p-8 flex flex-col hover:-translate-y-2 hover:shadow-xl min-h-[220px] md:min-h-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-4 sm:mb-6 text-fuchsia-500 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">Rankings</h3>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">Explore the top {summaries.length} zones sorted dynamically by affordability and listing volume.</p>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-fuchsia-500 mt-auto group-hover:translate-x-1 transition-all" />
            </Link>

            {/* Deal Finder Bento */}
            <Link href="/deals" className="group relative glass-card md:col-span-1 rounded-3xl sm:rounded-[2rem] border border-border/50 hover:border-amber-500/50 transition-all duration-500 p-6 sm:p-8 flex flex-col hover:-translate-y-2 hover:shadow-xl min-h-[220px] md:min-h-0">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-amber-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 sm:mb-6 text-amber-500 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 relative z-10">
                <Tag className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2 relative z-10">Deal Finder</h3>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed relative z-10">Our algorithm flags properties priced severely below their local medians.</p>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-amber-500 mt-auto group-hover:translate-x-1 transition-all relative z-10" />
            </Link>

            {/* Calculator Bento */}
            <Link href="/calculator" className="group relative glass-card md:col-span-1 rounded-3xl sm:rounded-[2rem] border border-border/50 hover:border-emerald-500/50 transition-all duration-500 p-6 sm:p-8 flex flex-col hover:-translate-y-2 hover:shadow-xl min-h-[220px] md:min-h-0">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-emerald-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 sm:mb-6 text-emerald-500 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 relative z-10">
                <Calculator className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2 relative z-10">Calculators</h3>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed relative z-10">Buyer limits, Rental budgets, or Investor ROI metrics—calculated instantly.</p>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-emerald-500 mt-auto group-hover:translate-x-1 transition-all relative z-10" />
            </Link>

          </div>
        </section>

        {/* Unified Market Watch */}
        <section className="glass-card border border-border/50 rounded-3xl sm:rounded-[3rem] p-6 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-64 h-64 sm:w-96 sm:h-96 bg-primary/20 blur-[80px] sm:blur-[100px] rounded-full" />

          <div className="relative z-10 mb-8 sm:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight mb-2 sm:mb-4">Market Watch</h2>
              <p className="text-muted-foreground text-sm sm:text-lg font-medium">Contrasting the extremes of Nairobi's property landscape today.</p>
            </div>
            <Link href="/neighborhoods" className="inline-flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 font-bold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all sm:hover:scale-105 text-sm sm:text-base">
              View Directory <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 relative z-10">
            {/* Accessible */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <TrendingDown className="h-5 w-5 text-indigo-500" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight">Most Accessible</h3>
              </div>
              <div className="space-y-3">
                {top5Affordable.map((s, i) => (
                  <MarketRow key={s.location} s={s} index={i} total={summaries.length} hue="indigo" />
                ))}
              </div>
            </div>

            {/* Premium */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight">Highest Premium</h3>
              </div>
              <div className="space-y-3">
                {top5Expensive.map((s, i) => (
                  <MarketRow key={s.location} s={s} index={i} total={summaries.length} hue="primary" />
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

/* ── Market Row Sub-component ── */
function MarketRow({ s, index, total, hue }: { s: any; index: number; total: number; hue: 'indigo' | 'primary' }) {
  const tier = priceTier(s.affordability_rank ?? 1, total)

  return (
    <Link href={`/neighborhoods/${toSlug(s.location)}`}
      className={`flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-border/60 hover:bg-card/50 transition-all duration-300 group`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-sm font-extrabold text-muted-foreground group-hover:border-${hue}-500/40 group-hover:text-${hue}-500 transition-colors shadow-sm`}>
          {String(index + 1).padStart(2, '0')}
        </div>
        <div>
          <p className={`font-extrabold capitalize text-base group-hover:text-${hue}-500 transition-colors`}>{s.location}</p>
          <p className="text-[11px] uppercase font-bold text-muted-foreground mt-0.5 tracking-wider">{s.listing_count} tracks</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-extrabold text-[15px] tabular-nums mb-1 group-hover:text-foreground transition-colors">{formatKES(s.avg_price_per_bedroom)} <span className="text-[10px] text-muted-foreground uppercase font-bold">/bed</span></p>
        <Badge variant="outline" className={`text-[9px] uppercase font-extrabold tracking-widest rounded-md bg-background py-0 border-border/50 group-hover:border-${hue}-500/30 transition-colors ${tierColor(tier).split(' ')[1]}`}>{tier}</Badge>
      </div>
    </Link>
  )
}


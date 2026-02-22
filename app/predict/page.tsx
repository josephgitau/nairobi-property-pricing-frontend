'use client'

import { useState, useMemo } from 'react'
import { BrainCircuit, TrendingUp, TrendingDown, MapPin, Info, BarChart2, Home, DollarSign, AlertCircle, CheckCircle2, Gauge } from 'lucide-react'
import modelData from '@/public/model.json'
import type { ModelData } from '@/lib/model'
import { predictPrice } from '@/lib/model'
import { formatKES } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

const model = modelData as unknown as ModelData

// Build a clean sorted list of locations from model
const LOCATIONS = Object.values(model.location_stats)
  .sort((a, b) => a.name.localeCompare(b.name))

const CONFIDENCE_CONFIG = {
  high:   { label: 'High Confidence', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  medium: { label: 'Medium Confidence', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Gauge },
  low:    { label: 'Low Confidence', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: AlertCircle },
}

export default function PredictPage() {
  const [slug, setSlug] = useState(LOCATIONS[0]?.slug ?? '')
  const [bedrooms, setBedrooms] = useState(2)
  const [listingType, setListingType] = useState<'Sale' | 'Rent'>('Sale')

  const result = useMemo(() => {
    if (!slug) return null
    return predictPrice(model, slug, bedrooms, listingType)
  }, [slug, bedrooms, listingType])

  const locStats = model.location_stats[slug]
  const bucket   = listingType === 'Sale' ? locStats?.sale : locStats?.rent
  const conf     = result ? CONFIDENCE_CONFIG[result.confidence] : null

  // Comparable: 5 nearest-median locations of same listing type
  const comparables = useMemo(() => {
    if (!result) return []
    return Object.values(model.location_stats)
      .filter(l => l.slug !== slug && (listingType === 'Sale' ? l.sale : l.rent))
      .map(l => ({ ...l, med: (listingType === 'Sale' ? l.sale?.median : l.rent?.median) ?? 0 }))
      .sort((a, b) => Math.abs(a.med - result.predicted) - Math.abs(b.med - result.predicted))
      .slice(0, 5)
  }, [slug, listingType, result])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border/40 bg-gradient-to-br from-violet-500/5 via-background to-indigo-500/5 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <BrainCircuit className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">AI Price Predictor</h1>
              <p className="text-muted-foreground font-medium">Powered by linear regression trained on {model.meta.training_rows.toLocaleString()} Nairobi listings</p>
            </div>
          </div>
          {/* Model stats */}
          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { label: 'Model Accuracy (R²)', value: `${(model.meta.r2 * 100).toFixed(1)}%` },
              { label: 'Locations Modelled', value: model.meta.locations_in_model },
              { label: 'Training Listings', value: model.meta.training_rows.toLocaleString() },
              { label: 'Est. Error Range', value: `±${model.meta.approx_rmse_multiplier}x` },
            ].map(s => (
              <div key={s.label} className="glass-card border border-border/50 rounded-xl px-4 py-2 flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</span>
                <span className="text-sm font-extrabold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-2 gap-8">

          {/* ── Left: Inputs ── */}
          <div className="space-y-6">
            <div className="glass-card border border-border/50 rounded-3xl p-6 space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2"><Home className="h-5 w-5 text-primary" /> Property Details</h2>

              {/* Listing type toggle */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Listing Type</label>
                <div className="flex rounded-xl overflow-hidden border border-border/50 w-fit">
                  {(['Sale', 'Rent'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setListingType(t)}
                      className={`px-6 py-2.5 text-sm font-bold transition-all ${listingType === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Neighbourhood</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    className="w-full bg-background border border-border/50 rounded-xl pl-9 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
                  >
                    {LOCATIONS.map(l => (
                      <option key={l.slug} value={l.slug}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                  Bedrooms — <span className="text-primary">{bedrooms} BR</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <button
                      key={n}
                      onClick={() => setBedrooms(n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${bedrooms === n ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20' : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Neighbourhood real data */}
            {locStats && (
              <div className="glass-card border border-border/50 rounded-3xl p-6">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Neighbourhood Market Data</h2>
                <p className="font-bold text-base mb-4 capitalize">{locStats.name}</p>
                <div className="grid grid-cols-2 gap-3">
                  {bucket ? (
                    <>
                      <Stat label="Listings tracked" value={bucket.count} />
                      <Stat label="Median price" value={formatKES(bucket.median)} />
                      <Stat label="Lower quartile" value={formatKES(bucket.q25)} />
                      <Stat label="Upper quartile" value={formatKES(bucket.q75)} />
                      <Stat label="Cheapest seen" value={formatKES(bucket.min)} />
                      <Stat label="Most expensive" value={formatKES(bucket.max)} />
                    </>
                  ) : (
                    <p className="col-span-2 text-sm text-muted-foreground">No {listingType} data for this location yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Result ── */}
          <div className="space-y-6">
            {result && conf && (
              <>
                {/* Main prediction card */}
                <div className="glass-card border border-primary/20 rounded-3xl p-8 bg-gradient-to-br from-primary/5 to-violet-500/5">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Predicted Price</p>
                    <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${conf.bg} ${conf.color}`}>
                      <conf.icon className="h-3.5 w-3.5" />
                      {conf.label}
                    </span>
                  </div>

                  <div className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500 mb-2">
                    {formatKES(result.predicted)}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium mb-6">
                    {listingType === 'Rent' ? 'per month' : 'purchase price'}
                  </p>

                  {/* Range bar */}
                  <div className="bg-muted/40 rounded-xl p-4">
                    <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                      <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3 text-emerald-500" /> Low estimate</span>
                      <span className="flex items-center gap-1">High estimate <TrendingUp className="h-3 w-3 text-rose-500" /></span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold mb-3">
                      <span className="text-emerald-600 dark:text-emerald-400">{formatKES(result.low)}</span>
                      <span className="text-rose-600 dark:text-rose-400">{formatKES(result.high)}</span>
                    </div>
                    {/* Visual range */}
                    <div className="relative h-2 rounded-full bg-gradient-to-r from-emerald-500/20 via-primary/40 to-rose-500/20">
                      <div className="absolute left-1/2 -translate-x-1/2 -top-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background shadow-md" />
                    </div>
                  </div>

                  {!result.inModel && (
                    <div className="flex items-start gap-2 mt-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      Location not in training data — prediction uses city-wide baselines only. Accuracy may be lower.
                    </div>
                  )}
                </div>

                {/* Breakdown */}
                <div className="glass-card border border-border/50 rounded-3xl p-6">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" /> Price Factors
                  </h3>
                  <div className="space-y-3">
                    <Factor label="Location premium" value={`${model.regression.location_premiums[slug] !== undefined ? (model.regression.location_premiums[slug] > 0 ? '+' : '') + (model.regression.location_premiums[slug] * 100).toFixed(1) + '% vs baseline' : 'Using city baseline'}`} />
                    <Factor label={`${bedrooms} bedroom${bedrooms > 1 ? 's' : ''}`} value={`+${((Math.exp(model.regression.coef_bedrooms * bedrooms) - 1) * 100).toFixed(0)}% over studio`} />
                    <Factor label="Listing type" value={listingType === 'Rent' ? `${(model.regression.coef_rent * 100).toFixed(0)}% vs sale (rent discount)` : 'No adjustment'} />
                    <Factor label="Model R²" value={`${(model.meta.r2 * 100).toFixed(1)}% variance explained`} />
                  </div>
                </div>

                {/* Comparables */}
                {comparables.length > 0 && (
                  <div className="glass-card border border-border/50 rounded-3xl p-6">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Similar-priced Areas
                    </h3>
                    <div className="space-y-2">
                      {comparables.map(c => (
                        <div key={c.slug} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                          <span className="text-sm font-semibold capitalize truncate max-w-[60%]">{c.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{formatKES(c.med)}</span>
                            {c.med < result.predicted
                              ? <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">{Math.round((result.predicted - c.med) / result.predicted * 100)}% cheaper</Badge>
                              : <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px]">{Math.round((c.med - result.predicted) / result.predicted * 100)}% pricier</Badge>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-muted/30 rounded-xl p-3">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-extrabold">{value}</p>
    </div>
  )
}

function Factor({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-bold text-right max-w-[55%]">{value}</span>
    </div>
  )
}

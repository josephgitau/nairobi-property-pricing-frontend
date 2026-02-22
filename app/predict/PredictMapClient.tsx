'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle2, Gauge, Crosshair, MapPin } from 'lucide-react'
import modelData from '@/public/model.json'
import geocodedData from '@/public/geocoded.json'
import type { ModelData } from '@/lib/model'
import { predictPrice } from '@/lib/model'
import { formatKES } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

const model = modelData as unknown as ModelData

interface GeoPoint {
  slug: string
  name: string
  lat: number
  lon: number
  sale_median: number | null
  rent_median: number | null
}

const GEOCODED: GeoPoint[] = geocodedData as GeoPoint[]

const CONFIDENCE_CONFIG = {
  high:   { label: 'High Confidence', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  medium: { label: 'Medium Confidence', color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   icon: Gauge },
  low:    { label: 'Low Confidence',    color: 'text-rose-600 dark:text-rose-400',      bg: 'bg-rose-500/10 border-rose-500/20',      icon: AlertCircle },
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function nearestLocation(lat: number, lon: number): GeoPoint {
  return GEOCODED.reduce((best, pt) => {
    return haversineKm(lat, lon, pt.lat, pt.lon) < haversineKm(lat, lon, best.lat, best.lon) ? pt : best
  })
}

function salePriceTier(v: number | null): string {
  if (!v) return '#94a3b8'
  if (v < 5_000_000)  return '#10b981'  // emerald - affordable
  if (v < 15_000_000) return '#6366f1'  // indigo - mid
  if (v < 30_000_000) return '#f59e0b'  // amber - premium
  return '#ef4444'                       // red - luxury
}

// Lazy-load map to prevent SSR issues
const PriceMap = dynamic(() => import('./PriceMapLeaflet'), { ssr: false, loading: () => (
  <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-2xl">
    <div className="text-center space-y-2">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
        <MapPin className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">Loading map…</p>
    </div>
  </div>
) })

export default function PredictMapClient() {
  const [pin, setPin]       = useState<{ lat: number; lon: number } | null>(null)
  const [nearest, setNearest] = useState<GeoPoint | null>(null)
  const [bedrooms, setBedrooms]   = useState(2)
  const [listingType, setListingType] = useState<'Sale' | 'Rent'>('Sale')

  const handleMapClick = useCallback((lat: number, lon: number) => {
    const near = nearestLocation(lat, lon)
    setPin({ lat, lon })
    setNearest(near)
  }, [])

  const result = useMemo(() => {
    if (!nearest) return null
    return predictPrice(model, nearest.slug, bedrooms, listingType)
  }, [nearest, bedrooms, listingType])

  const conf = result ? CONFIDENCE_CONFIG[result.confidence] : null

  const locStats = nearest ? model.location_stats[nearest.slug] : null
  const bucket   = locStats ? (listingType === 'Sale' ? locStats.sale : locStats.rent) : null

  const comparables = useMemo(() => {
    if (!result || !nearest) return []
    return Object.values(model.location_stats)
      .filter(l => l.slug !== nearest.slug && (listingType === 'Sale' ? l.sale : l.rent))
      .map(l => ({ ...l, med: (listingType === 'Sale' ? l.sale?.median : l.rent?.median) ?? 0 }))
      .sort((a, b) => Math.abs(a.med - result.predicted) - Math.abs(b.med - result.predicted))
      .slice(0, 4)
  }, [nearest, listingType, result])

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">

      {/* ── Map ── */}
      <div className="flex-1 relative">
        {/* Legend */}
        <div className="absolute top-3 left-3 z-[1000] bg-card/90 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-lg text-[11px] font-bold space-y-1.5">
          <p className="text-muted-foreground uppercase tracking-wider mb-2">Sale Price</p>
          {[
            { color: '#10b981', label: '< 5M' },
            { color: '#6366f1', label: '5M–15M' },
            { color: '#f59e0b', label: '15M–30M' },
            { color: '#ef4444', label: '> 30M' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>

        {/* Instruction overlay */}
        {!pin && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-pulse-soft pointer-events-none">
            <Crosshair className="h-4 w-4" /> Click anywhere on the map to predict prices
          </div>
        )}

        <div className="w-full h-[480px] lg:h-full min-h-[420px] rounded-2xl overflow-hidden border border-border/50 shadow-inner">
          <PriceMap
            points={GEOCODED}
            pin={pin}
            nearest={nearest}
            getTierColor={salePriceTier}
            onMapClick={handleMapClick}
          />
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-full lg:w-96 flex flex-col gap-4">

        {/* Type + Bedrooms */}
        <div className="glass-card border border-border/50 rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Listing Type</p>
            <div className="flex rounded-xl overflow-hidden border border-border/50 w-fit">
              {(['Sale', 'Rent'] as const).map(t => (
                <button key={t} onClick={() => setListingType(t)}
                  className={`px-6 py-2 text-sm font-bold transition-all ${listingType === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Bedrooms — <span className="text-primary">{bedrooms} BR</span>
            </p>
            <div className="flex gap-1.5">
              {[1,2,3,4,5,6,7].map(n => (
                <button key={n} onClick={() => setBedrooms(n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border ${bedrooms === n ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20' : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* No pin state */}
        {!nearest && (
          <div className="flex-1 glass-card border border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-8 text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MapPin className="h-7 w-7 text-primary/60" />
            </div>
            <p className="font-bold text-muted-foreground">Drop a pin on the map</p>
            <p className="text-sm text-muted-foreground/70">Click any location in Nairobi and we&apos;ll find the nearest tracked neighbourhood and predict the price.</p>
          </div>
        )}

        {/* Prediction result */}
        {nearest && result && conf && (
          <>
            {/* Location + confidence */}
            <div className="glass-card border border-border/50 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Nearest Neighbourhood</p>
                  <p className="font-bold capitalize text-sm leading-tight">{nearest.name.split(',')[0]}</p>
                </div>
                <span className={`shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${conf.bg} ${conf.color}`}>
                  <conf.icon className="h-3 w-3" />
                  {conf.label}
                </span>
              </div>
            </div>

            {/* Price prediction */}
            <div className="glass-card border border-primary/20 rounded-2xl p-5 bg-gradient-to-br from-primary/5 to-violet-500/5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Predicted Price</p>
              <div className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500 mb-0.5">
                {formatKES(result.predicted)}
              </div>
              <p className="text-xs text-muted-foreground">{listingType === 'Rent' ? 'per month' : 'purchase price'} · {bedrooms} bedroom{bedrooms > 1 ? 's' : ''}</p>

              <div className="mt-4 flex justify-between items-center text-xs font-bold">
                <div className="text-emerald-600 dark:text-emerald-400">
                  <TrendingDown className="h-3 w-3 inline mr-1" />{formatKES(result.low)}
                  <span className="text-muted-foreground font-normal ml-1">low</span>
                </div>
                <div className="text-rose-600 dark:text-rose-400">
                  {formatKES(result.high)}<TrendingUp className="h-3 w-3 inline ml-1" />
                  <span className="text-muted-foreground font-normal ml-1">high</span>
                </div>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-gradient-to-r from-emerald-500/30 via-primary/50 to-rose-500/30 relative">
                <div className="absolute left-1/2 -translate-x-1/2 -top-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background shadow" />
              </div>
            </div>

            {/* Market data */}
            {bucket && (
              <div className="glass-card border border-border/50 rounded-2xl p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Market Data — {listingType}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Listings', value: bucket.count },
                    { label: 'Median', value: formatKES(bucket.median) },
                    { label: 'Range', value: `${formatKES(bucket.q25)}–${formatKES(bucket.q75)}` },
                  ].map(s => (
                    <div key={s.label} className="bg-muted/30 rounded-xl p-2.5">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{s.label}</p>
                      <p className="text-xs font-extrabold">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comparables */}
            {comparables.length > 0 && (
              <div className="glass-card border border-border/50 rounded-2xl p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" /> Similar Areas
                </p>
                <div className="space-y-1.5">
                  {comparables.map(c => (
                    <div key={c.slug} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                      <span className="text-xs font-semibold capitalize truncate max-w-[55%]">{c.name.split(',')[0]}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold">{formatKES(c.med)}</span>
                        {c.med < result.predicted
                          ? <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] px-1.5 py-0.5">cheaper</Badge>
                          : <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[9px] px-1.5 py-0.5">pricier</Badge>
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
  )
}

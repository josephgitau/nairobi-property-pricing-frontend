'use client'

import { useState, useMemo, useCallback } from 'react'
import type { LocationWithGeo } from '@/lib/types'
import { formatKES, rankToColor, toSlug } from '@/lib/format'
import { Search, MapPin, ChevronRight, Layers, BarChart3, X } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  locations: LocationWithGeo[]
  totalLocations: number
}

/* Helper component: fly the map to a location when it changes */
function FlyTo({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  map.flyTo([lat, lon], 14, { duration: 0.8 })
  return null
}

export default function AffordabilityMap({ locations, totalLocations }: Props) {
  const [search, setSearch] = useState('')
  const [priceLimit, setPriceLimit] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [mapRef, setMapRef] = useState<LeafletMap | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  const validLocations = useMemo(
    () => locations.filter((l) => l.lat != null && l.lon != null),
    [locations]
  )

  const absoluteMaxPrice = useMemo(() => {
    return locations.reduce((max, loc) => Math.max(max, loc.avg_price_per_bedroom ?? 0), 0)
  }, [locations])

  const filteredList = useMemo(
    () => locations.filter((l) => {
      const matchSearch = l.location.toLowerCase().includes(search.toLowerCase())
      const matchPrice = priceLimit === 0 || (l.avg_price_per_bedroom ?? 0) <= priceLimit
      return matchSearch && matchPrice
    }),
    [locations, search, priceLimit]
  )

  const selectedLoc = useMemo(
    () => locations.find((l) => l.location === selected),
    [locations, selected]
  )

  const handleSelect = useCallback((locName: string) => {
    setSelected((prev) => (prev === locName ? null : locName))
  }, [])

  function tierLabel(rank: number, total: number) {
    const r = rank / total
    if (r <= 0.25) return { label: 'Accessible', cls: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20' }
    if (r <= 0.5) return { label: 'Moderate', cls: 'text-primary dark:text-primary bg-primary/10 border-primary/20' }
    if (r <= 0.75) return { label: 'Mid-Range', cls: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' }
    return { label: 'Premium', cls: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full p-2">
      {/* Sidebar */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col bg-background/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-md shadow-md sm:max-h-[40vh] lg:max-h-none lg:h-full">
        {/* Search header */}
        <div className="p-3 sm:p-5 border-b border-border/50 space-y-3 sm:space-y-4 bg-card/60">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search areas..."
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm font-semibold rounded-xl border border-border/60 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Max Price/Bed</label>
              <span className="text-xs font-bold text-primary">{priceLimit > 0 ? formatKES(priceLimit) : 'Any'}</span>
            </div>
            <input
              type="range"
              min="0"
              max={absoluteMaxPrice || 500000}
              step="5000"
              value={priceLimit}
              onChange={(e) => setPriceLimit(Number(e.target.value))}
              className="w-full accent-primary h-1.5 bg-border/50 rounded-full appearance-none cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              <span className="text-foreground">{validLocations.length}</span> / {locations.length} Geocoded
            </p>
            {filteredList.length !== locations.length && (
              <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-primary">{filteredList.length} match</p>
            )}
          </div>
        </div>

        {/* Location list */}
        <div className="flex-1 overflow-y-auto max-h-[30vh] sm:max-h-64 lg:max-h-none scrollbar-hide">
          {filteredList.map((loc) => {
            const { cls } = tierLabel(loc.affordability_rank ?? totalLocations, totalLocations)
            const isSelected = selected === loc.location
            return (
              <button
                key={loc.location}
                onClick={() => handleSelect(loc.location)}
                className={`w-full text-left px-4 sm:px-5 py-3 sm:py-4 text-sm transition-all border-b border-border/30 last:border-0 relative ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-accent/30'
                  }`}
              >
                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`font-extrabold capitalize truncate flex-1 transition-colors ${isSelected ? 'text-primary' : 'text-foreground'}`}>{loc.location}</span>
                  <span className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md border ${cls}`}>#{loc.affordability_rank}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground tabular-nums">{formatKES(loc.avg_price_per_bedroom)}/bed</span>
                  <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">{loc.listing_count} list</span>
                </div>
              </button>
            )
          })}
          {filteredList.length === 0 && (
            <div className="text-center py-12 sm:py-16 px-4 space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-2">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-bold text-foreground">No matches found</p>
            </div>
          )}
        </div>
      </div>

      {/* Map + selected panel */}
      <div className="flex-1 flex flex-col gap-4 relative h-full min-h-[400px] sm:min-h-[500px]">
        {/* Map */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden bg-background">
          <MapContainer
            center={[-1.2921, 36.8219]}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
            ref={setMapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
              url={tileUrl}
              className="opacity-80 saturate-[1.2] invert-0 dark:invert dark:hue-rotate-180 dark:brightness-90 transition-all duration-1000"
            />

            {/* Fly to selected location */}
            {selectedLoc && selectedLoc.lat != null && selectedLoc.lon != null && (
              <FlyTo lat={selectedLoc.lat} lon={selectedLoc.lon} />
            )}

            {validLocations
              .filter(l => priceLimit === 0 || (l.avg_price_per_bedroom ?? 0) <= priceLimit)
              .map((loc) => {
                const isActive = selected === loc.location
                const radius = isActive ? 18 : Math.max(9, Math.min(18, (loc.listing_count ?? 1) * 1.5))
                return (
                  <CircleMarker
                    key={loc.location}
                    center={[loc.lat!, loc.lon!]}
                    radius={radius}
                    pathOptions={{
                      fillColor: rankToColor(loc.affordability_rank ?? totalLocations, totalLocations),
                      color: isActive ? 'hsl(var(--primary))' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                      weight: isActive ? 4 : 2,
                      fillOpacity: isActive ? 1 : 0.85,
                    }}
                    eventHandlers={{ click: () => handleSelect(loc.location) }}
                  >
                  </CircleMarker>
                )
              })}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-[1000] glass-card border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider shadow-xl scale-75 origin-bottom-left sm:scale-100 max-w-[150px] sm:max-w-none">
            <div className="flex items-center gap-2 mb-2 sm:mb-3 text-muted-foreground whitespace-nowrap">
              <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
              Per Bed Pricing
            </div>
            <div className="space-y-1.5 sm:space-y-2.5">
              {[
                { color: '#22c55e', label: 'Access (Top 25%)' },
                { color: '#84cc16', label: 'Moderate' },
                { color: '#f59e0b', label: 'Mid-range' },
                { color: '#ef4444', label: 'Premium (Top 25%)' },
              ].map(({ color, label }) => (
                <div key={color} className="flex items-center gap-2 sm:gap-3">
                  <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0 shadow-inner border border-black/10" style={{ background: color }} />
                  <span className="text-foreground/90 whitespace-nowrap">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {validLocations.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center glass-card z-[1000]">
              <div className="text-center space-y-4 max-w-sm px-6">
                <MapPin className="h-16 w-16 mx-auto text-muted-foreground/20" />
                <p className="text-xl font-extrabold text-foreground">No geocoded data</p>
                <p className="text-sm text-muted-foreground font-medium">Please run the geocoding pipeline to plot neighborhoods on the map.</p>
              </div>
            </div>
          )}
        </div>

        {/* Selected detail floating card */}
        {selectedLoc && (
          <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-auto sm:right-4 z-[1000] sm:w-[320px] bg-card/90 backdrop-blur-xl border border-border/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 animate-fade-up shadow-2xl">
            <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-indigo-600/20 border border-primary/30 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-base sm:text-lg capitalize tracking-tight leading-tight truncate">{selectedLoc.location}</h3>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-muted-foreground mt-0.5 sm:mt-1 truncate">
                    Rank <span className="text-foreground">#{selectedLoc.affordability_rank}</span> · {selectedLoc.listing_count} list
                  </p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
              <MiniCard label="Avg Price" value={formatKES(selectedLoc.avg_price)} />
              <MiniCard label="Per Bed" value={formatKES(selectedLoc.avg_price_per_bedroom)} accent />
              <MiniCard label="Median" value={formatKES(selectedLoc.median_price)} />
              <MiniCard label="Med Beds" value={String(selectedLoc.median_bedrooms ?? '—')} />
            </div>

            <Link
              href={`/neighborhoods/${toSlug(selectedLoc.location)}`}
              className="flex justify-center items-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground text-[12px] sm:text-[13px] font-extrabold py-2.5 sm:py-3 rounded-xl transition-all shadow-md group"
            >
              Explore Intelligence <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function PopupRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-xs uppercase tracking-wider font-bold text-gray-500 m-0">{label}</span>
      <span className={`text-[13px] ${accent ? 'font-extrabold text-primary' : 'font-bold'}`}>{value}</span>
    </div>
  )
}

function MiniCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 border ${accent ? 'bg-primary/5 border-primary/20' : 'bg-muted/40 border-border/50'}`}>
      <p className={`text-[10px] uppercase tracking-wider font-bold ${accent ? 'text-primary/70' : 'text-muted-foreground'}`}>{label}</p>
      <p className={`font-extrabold text-sm mt-1 tabular-nums ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}

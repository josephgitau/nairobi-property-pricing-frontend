import { getSummariesWithGeo } from '@/lib/data'
import { Map } from 'lucide-react'
import type { Metadata } from 'next'
import MapClient from './MapClient'

export const metadata: Metadata = {
  title: 'Price Map — NairobiPI',
  description: 'Interactive affordability map of Nairobi neighborhoods',
}

export default async function MapPage() {
  const locations = await getSummariesWithGeo()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 lg:py-12 flex flex-col space-y-4 sm:space-y-8 animate-fade-up relative z-10 w-full min-h-[calc(100dvh-4rem)] lg:h-[calc(100vh-theme(spacing.16))]">

      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 w-full max-w-2xl h-64 bg-primary/10 blur-[100px] rounded-[100%] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 relative z-10 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-500/20 to-primary/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Map className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">Market Map</h1>
            <p className="text-muted-foreground text-xs sm:text-sm font-medium mt-0.5 sm:mt-1">
              Geospatial analysis of {locations.length} tracked neighborhoods
            </p>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 min-h-[60vh] sm:min-h-[500px] relative z-10 glass-card border border-border/50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl shadow-primary/5 group transition-all duration-500 flex flex-col">
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl group-hover:shadow-[inset_0_0_50px_rgba(var(--primary-rgb),0.05)] transition-shadow pointer-events-none z-10" />
        <MapClient locations={locations} totalLocations={locations.length} />
      </div>
    </div>
  )
}

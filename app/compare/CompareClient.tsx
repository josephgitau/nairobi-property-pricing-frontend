'use client'

import { useState } from 'react'
import { Plus, X, BarChart3, TrendingUp, Bed, Layers, Star } from 'lucide-react'
import { formatKES, priceTier, tierColor } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

interface Summary {
    location: string
    listing_count: number | null
    avg_price: number | null
    median_price: number | null
    avg_price_per_bedroom: number | null
    median_bedrooms: number | null
    affordability_rank: number | null
}

export default function CompareClient({ summaries }: { summaries: Summary[] }) {
    const [selectedLocations, setSelectedLocations] = useState<string[]>([])
    const [search, setSearch] = useState('')
    const [isOpen, setIsOpen] = useState(false)

    const total = summaries.length
    const filtered = summaries.filter(s => s.location.toLowerCase().includes(search.toLowerCase()) && !selectedLocations.includes(s.location)).slice(0, 10)

    const selectedSummaries = selectedLocations.map(loc => summaries.find(s => s.location === loc)!).filter(Boolean)

    const handleAdd = (location: string) => {
        if (selectedLocations.length < 3) {
            setSelectedLocations([...selectedLocations, location])
        }
        setSearch('')
        setIsOpen(false)
    }

    const handleRemove = (location: string) => {
        setSelectedLocations(selectedLocations.filter(loc => loc !== location))
    }

    return (
        <div className="space-y-12">
            {/* Search Bar Container */}
            {selectedLocations.length < 3 && (
                <div className="relative max-w-xl mx-auto z-50">
                    <div className="relative glass-card border flex items-center border-border/60 rounded-2xl shadow-lg p-2 bg-card/60">
                        <Plus className="h-5 w-5 text-primary ml-3 mr-2 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setIsOpen(true)
                            }}
                            onFocus={() => setIsOpen(true)}
                            placeholder={`Add up to ${3 - selectedLocations.length} more neighborhood${3 - selectedLocations.length > 1 ? 's' : ''}...`}
                            className="w-full bg-transparent border-none text-foreground px-2 py-2 focus:outline-none focus:ring-0 font-semibold"
                        />
                    </div>

                    {isOpen && search.trim() !== '' && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-card/90 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl p-2 z-[60] max-h-[300px] overflow-auto">
                            {filtered.length > 0 ? filtered.map((s) => (
                                <button
                                    key={s.location}
                                    onClick={() => handleAdd(s.location)}
                                    className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-xl transition-colors flex items-center justify-between group"
                                >
                                    <div>
                                        <p className="font-bold text-[15px] group-hover:text-primary transition-colors capitalize">{s.location}</p>
                                        <p className="text-xs font-medium text-muted-foreground">{s.listing_count} listings</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-extrabold tabular-nums">{formatKES(s.avg_price_per_bedroom)}</p>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">/ bed</p>
                                    </div>
                                </button>
                            )) : (
                                <p className="text-sm font-bold text-muted-foreground p-4 text-center">No additional matches found.</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Comparison Grid */}
            {selectedSummaries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 w-full overflow-x-auto pb-4">
                    {selectedSummaries.map((s) => {
                        const tier = priceTier(s.affordability_rank ?? total, total)
                        const rankRatio = ((s.affordability_rank ?? 0) / total) * 100

                        return (
                            <div key={s.location} className="glass-card border border-border/50 rounded-[2rem] p-6 lg:p-8 relative min-w-[280px]">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-8 relative">
                                    <div>
                                        <h2 className="text-2xl font-extrabold capitalize tracking-tight mb-2">{s.location}</h2>
                                        <Badge className={`${tierColor(tier)} text-[10px] font-bold uppercase tracking-wider px-2 py-0.5`}>{tier}</Badge>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(s.location)}
                                        className="p-1.5 rounded-full bg-accent hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors absolute -top-2 -right-2"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Metrics */}
                                <div className="space-y-6">
                                    <MetricRow icon={<BarChart3 />} label="Avg Price" value={formatKES(s.avg_price)} />
                                    <MetricRow icon={<Bed />} label="Per Bedroom" value={formatKES(s.avg_price_per_bedroom)} highlight />
                                    <MetricRow icon={<TrendingUp />} label="Median Price" value={formatKES(s.median_price)} />

                                    <div className="border-t border-border/50 pt-6 mt-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><Layers className="h-4 w-4" /> Listings Tracked</span>
                                            <span className="font-extrabold">{s.listing_count}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><Star className="h-4 w-4" /> Med. Bedrooms</span>
                                            <span className="font-extrabold">{s.median_bedrooms ?? 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Rank Bar */}
                                    <div className="bg-background/50 border border-border/50 rounded-2xl p-4 mt-8">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Affordability Rank</span>
                                            <span className="font-extrabold text-sm">#{s.affordability_rank} <span className="text-muted-foreground font-semibold text-xs ml-1">of {total}</span></span>
                                        </div>
                                        <div className="h-2.5 w-full bg-accent rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-teal-500 via-amber-500 to-rose-500 transition-all rounded-full"
                                                style={{ width: `${100 - rankRatio}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-2">
                                            <span>Premium</span>
                                            <span>Accessible</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="glass-card border border-border/50 rounded-[2rem] p-12 text-center max-w-2xl mx-auto mt-12">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary/20">
                        <Plus className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight mb-2">No areas selected</h2>
                    <p className="text-muted-foreground font-medium">Use the search bar above to generate a side-by-side comparison of local markets. Extremely useful for identifying arbitrage opportunities across similar neighborhoods.</p>
                </div>
            )}
        </div>
    )
}

function MetricRow({ icon, label, value, highlight }: { icon: React.ReactNode, label: string, value: string, highlight?: boolean }) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-xl border ${highlight ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-transparent border-transparent'}`}>
            <div className={`flex items-center gap-2.5 ${highlight ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className="opacity-80 scale-90">{icon}</div>
                <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
            </div>
            <span className={`font-extrabold tabular-nums tracking-tight ${highlight ? 'text-primary text-lg' : 'text-foreground text-base'}`}>{value}</span>
        </div>
    )
}

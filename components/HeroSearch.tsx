'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, MapPin, ChevronRight, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toSlug, formatKES } from '@/lib/format'

interface Summary {
    location: string
    listing_count: number | null
    avg_price_per_bedroom: number | null
}

export default function HeroSearch({ summaries }: { summaries: Summary[] }) {
    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const wrapperRef = useRef<HTMLDivElement>(null)

    const filtered = query.trim() === ''
        ? []
        : summaries.filter(s => s.location.toLowerCase().includes(query.toLowerCase())).slice(0, 5)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (location: string) => {
        setQuery('')
        setIsOpen(false)
        router.push(`/neighborhoods/${toSlug(location)}`)
    }

    return (
        <div ref={wrapperRef} className="relative w-full max-w-xl animate-fade-up">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="w-full bg-background/50 backdrop-blur-xl border border-border/50 text-foreground rounded-2xl pl-12 pr-4 py-4 sm:py-5 shadow-lg shadow-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all font-semibold placeholder:text-muted-foreground/70"
                    placeholder="Where do you want to live? (e.g. Kilimani)"
                />
                {query.length > 0 && (
                    <div className="absolute inset-y-0 right-2 flex items-center">
                        <button
                            onClick={() => filtered.length > 0 && handleSelect(filtered[0].location)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-1.5 animate-fade-in"
                            type="button"
                            aria-label={filtered.length > 0 ? `Explore ${filtered[0].location}` : 'Explore'}
                        >
                            Explore <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                )}
            </div>

            {/* Auto-suggest dropdown */}
            {isOpen && filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card/85 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="p-2 space-y-1">
                        {filtered.map((s) => (
                            <button
                                key={s.location}
                                onClick={() => handleSelect(s.location)}
                                className="w-full text-left px-4 py-3 flex items-center justify-between rounded-xl hover:bg-primary/10 group transition-all"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-accent/50 group-hover:bg-primary/20 flex items-center justify-center transition-colors shrink-0">
                                        <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <div className="truncate">
                                        <p className="font-bold text-[15px] text-foreground group-hover:text-primary transition-colors capitalize truncate">{s.location}</p>
                                        <p className="text-xs text-muted-foreground font-medium">{s.listing_count} listings</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-extrabold tabular-nums">{formatKES(s.avg_price_per_bedroom)}</p>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">/bed</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {isOpen && query.trim() !== '' && filtered.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card/85 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl p-6 text-center z-50">
                    <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm font-bold text-foreground">No matches found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try another neighborhood</p>
                </div>
            )}
        </div>
    )
}

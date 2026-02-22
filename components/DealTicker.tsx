'use client'

import React from 'react'
import Link from 'next/link'
import { Tag, ExternalLink } from 'lucide-react'
import { formatKES, toSlug } from '@/lib/format'

interface Deal {
    id: string
    title: string | null
    location: string | null
    price_kes: number | null
    price_per_bedroom: number | null
    url: string | null
}

export default function DealTicker({ deals }: { deals: Deal[] }) {
    if (!deals || deals.length === 0) return null

    return (
        <div className="w-full bg-amber-500/10 border-y border-amber-500/20 overflow-hidden py-3 relative z-20 backdrop-blur-md">
            <div className="flex animate-marquee whitespace-nowrap gap-12 font-medium">
                {/* Duplicate the deals array to create a seamless infinite scroll effect */}
                {[...deals, ...deals, ...deals].map((deal, i) => (
                    <div key={`${deal.id}-${i}`} className="inline-flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded-md">
                            <Tag className="h-3 w-3" /> Deal
                        </span>
                        <span className="text-sm font-semibold text-foreground/80 truncate max-w-[200px] sm:max-w-xs">{deal.title}</span>
                        <span className="text-sm font-extrabold tabular-nums text-foreground">{formatKES(deal.price_kes)}</span>
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{deal.location}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

import { getLatestSummaries } from '@/lib/data'
import { Scale } from 'lucide-react'
import type { Metadata } from 'next'
import CompareClient from './CompareClient'

export const metadata: Metadata = {
    title: 'Compare Areas — NairobiPI',
    description: 'Head-to-head comparison of Nairobi neighborhoods.',
}

export const revalidate = 3600

export default async function ComparePage() {
    const summaries = await getLatestSummaries('Both')

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10 animate-fade-up relative z-10">

            {/* Background radial glow */}
            <div className="absolute top-0 right-1/4 w-full max-w-2xl h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-primary/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                    <Scale className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 mt-1">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Head-to-Head Comparison</h1>
                    <p className="text-muted-foreground text-sm font-medium max-w-2xl">
                        Select up to 3 neighborhoods to compare their market data side-by-side, including pricing, listing volume, and affordability tier.
                    </p>
                </div>
            </div>

            <CompareClient summaries={summaries} />
        </div>
    )
}

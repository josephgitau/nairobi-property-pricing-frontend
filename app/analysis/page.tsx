import { BarChart3, TrendingUp, Brain } from 'lucide-react'
import { getLatestSummaries } from '@/lib/data'
import modelJson from '@/public/model.json'
import type { ModelData } from '@/lib/model'
import AnalysisCharts from './AnalysisCharts'
import Link from 'next/link'
import { format } from 'date-fns'

export const revalidate = 3600

const model = modelJson as unknown as ModelData

export default async function AnalysisPage() {
  const [saleSummaries, rentSummaries] = await Promise.all([
    getLatestSummaries('Sale'),
    getLatestSummaries('Rent'),
  ])

  const summaries = [...saleSummaries, ...rentSummaries].map(s => ({
    location: s.location,
    listing_type: s.listing_type,
    median_price: s.median_price,
    avg_price: s.avg_price,
    listing_count: s.listing_count,
    affordability_rank: s.affordability_rank,
    avg_price_per_bedroom: s.avg_price_per_bedroom,
    median_bedrooms: s.median_bedrooms,
  }))

  const latestDate = saleSummaries[0]?.summary_date ?? rentSummaries[0]?.summary_date ?? null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border/40 bg-gradient-to-br from-indigo-500/5 via-background to-violet-500/5 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Market Analysis</h1>
                <p className="text-muted-foreground font-medium mt-1">
                  Deep-dive into Nairobi&apos;s property market
                  {latestDate && (
                    <span className="ml-2 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                      Data: {format(new Date(latestDate), 'dd MMM yyyy')}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Link
              href="/predict"
              className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-violet-500/20 transition-colors"
            >
              <Brain className="h-4 w-4" /> Try AI Price Predictor
            </Link>
          </div>

          {/* Summary banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {[
              { label: 'Locations tracked', value: `${saleSummaries.length} areas` },
              { label: 'Sale listings', value: model.global_stats.total_sale.toLocaleString() },
              { label: 'Rental listings', value: model.global_stats.total_rent.toLocaleString() },
              { label: 'Model accuracy (R²)', value: `${(model.meta.r2 * 100).toFixed(1)}%` },
            ].map(s => (
              <div key={s.label} className="glass-card border border-border/50 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
                <p className="text-lg font-extrabold">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charts */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <AnalysisCharts model={model} summaries={summaries} />
      </main>
    </div>
  )
}

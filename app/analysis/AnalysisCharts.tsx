'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import type { ModelData, TopItem } from '@/lib/model'
import { formatKES } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Home, DollarSign, BarChart3, Users } from 'lucide-react'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

interface Props {
  model: ModelData
  summaries: Array<{
    location: string
    listing_type: string
    median_price: number | null
    avg_price: number | null
    listing_count: number | null
    affordability_rank: number | null
    avg_price_per_bedroom: number | null
    median_bedrooms: number | null
  }>
}

function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs">
      {label && <p className="font-bold mb-2 text-foreground">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold text-foreground">{formatKES(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalysisCharts({ model, summaries }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'locations' | 'bedrooms' | 'tiers'>('overview')

  const gs = model.global_stats

  // ── Data prep ──────────────────────────────────────────────────────────
  const bedroomData = Object.entries(model.bedroom_distribution)
    .filter(([, v]) => v.median_sale || v.median_rent)
    .map(([br, v]) => ({
      name: `${br} BR`,
      Sale: v.median_sale ?? 0,
      Rent: v.median_rent ?? 0,
      count: v.count,
    }))
    .sort((a, b) => parseInt(a.name) - parseInt(b.name))

  const saleVsRent = [
    { name: 'Sale', median: gs.median_sale_price, count: gs.total_sale, color: COLORS[0] },
    { name: 'Rent', median: gs.median_rent_price, count: gs.total_rent, color: COLORS[4] },
  ]

  const saleTierData = [
    { name: '< 5M', value: model.price_tiers.sale.under_5m },
    { name: '5M–15M', value: model.price_tiers.sale['5m_to_15m'] },
    { name: '15M–30M', value: model.price_tiers.sale['15m_to_30m'] },
    { name: '> 30M', value: model.price_tiers.sale.above_30m },
  ]

  const rentTierData = [
    { name: '< 50K', value: model.price_tiers.rent.under_50k },
    { name: '50K–150K', value: model.price_tiers.rent['50k_to_150k'] },
    { name: '150K–300K', value: model.price_tiers.rent['150k_to_300k'] },
    { name: '> 300K', value: model.price_tiers.rent.above_300k },
  ]

  // Top location summary from live summaries (both types combined)
  const locationTable = Object.values(
    summaries.reduce<Record<string, { location: string; sale: number | null; rent: number | null; count: number }>>((acc, s) => {
      if (!acc[s.location]) acc[s.location] = { location: s.location, sale: null, rent: null, count: 0 }
      if (s.listing_type === 'Sale') acc[s.location].sale = s.median_price
      if (s.listing_type === 'Rent') acc[s.location].rent = s.median_price
      acc[s.location].count += s.listing_count ?? 0
      return acc
    }, {})
  ).sort((a, b) => (b.sale ?? b.rent ?? 0) - (a.sale ?? a.rent ?? 0))

  const radarData = model.top_lists.expensive_sale.slice(0, 6).map(l => ({
    location: l.name.split(',')[0].replace(/-/g, ' '),
    price: Math.round(l.median / 1_000_000 * 10) / 10,
  }))

  const tabs = [
    { id: 'overview', label: 'Market Overview' },
    { id: 'bedrooms', label: 'By Bedrooms' },
    { id: 'tiers', label: 'Price Tiers' },
    { id: 'locations', label: 'Locations Table' },
  ] as const

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard icon={Home} label="Total Listings" value={gs.total_listings.toLocaleString()} sub={`${gs.total_sale} for sale · ${gs.total_rent} for rent`} color="indigo" />
        <KpiCard icon={DollarSign} label="Median Sale Price" value={formatKES(gs.median_sale_price)} sub={`Range: ${fmtK(gs.price_range.sale_min)} – ${fmtK(gs.price_range.sale_max)}`} color="violet" />
        <KpiCard icon={TrendingDown} label="Median Rent" value={formatKES(gs.median_rent_price)} sub={`Range: ${fmtK(gs.price_range.rent_min)} – ${fmtK(gs.price_range.rent_max)}/mo`} color="emerald" />
        <KpiCard icon={Users} label="Avg Bedrooms" value={`${gs.avg_bedrooms} BR`} sub={`Across all ${gs.total_listings.toLocaleString()} listings`} color="amber" />
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${activeTab === t.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Sale vs Rent median bar */}
          <ChartCard title="Median Price: Sale vs Rent" sub="City-wide medians across all tracked listings">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={saleVsRent} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="median" name="Median Price" radius={[8, 8, 0, 0]}>
                  {saleVsRent.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top 6 expensive sale radar */}
          <ChartCard title="Premium Locations" sub="Median sale price (KES M) — top 6 locations">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="location" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Radar name="Price (M)" dataKey="price" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                <Tooltip formatter={(v: number | undefined) => [`${v ?? 0}M`, 'Median']} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top 5 affordable sale */}
          <RankCard title="Most Affordable Neighbourhoods" items={model.top_lists.affordable_sale} badge="sale" type="affordable" />
          <RankCard title="Most Expensive Neighbourhoods" items={model.top_lists.expensive_sale} badge="sale" type="expensive" />
        </div>
      )}

      {/* ── Bedrooms tab ── */}
      {activeTab === 'bedrooms' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <ChartCard title="Median Sale Price by Bedrooms" sub="How bedroom count affects sale prices">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bedroomData} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Sale" name="Sale" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Median Rent by Bedrooms" sub="Monthly rent across bedroom types">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bedroomData} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Rent" name="Rent" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Sale vs Rent by Bedroom Count" sub="Side-by-side comparison across bedroom types" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bedroomData} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Sale" name="Sale" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Rent" name="Rent/mo" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ── Price tiers tab ── */}
      {activeTab === 'tiers' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <ChartCard title="Sale Price Distribution" sub="How listings are distributed across price bands">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={saleTierData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`} labelLine={false}>
                  {saleTierData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number | undefined) => [(v ?? 0).toLocaleString(), 'Listings']} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Rent Distribution" sub="Monthly rent bands across tracked rental listings">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={rentTierData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`} labelLine={false}>
                  {rentTierData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number | undefined) => [(v ?? 0).toLocaleString(), 'Listings']} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Horizontal bar for sale tiers */}
          <ChartCard title="Sale Tiers — Listing Count" sub="Number of listings per price band" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={saleTierData} layout="vertical" margin={{ top: 8, right: 32, left: 48, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} width={70} />
                <Tooltip formatter={(v: number | undefined) => [(v ?? 0).toLocaleString(), 'Listings']} />
                <Bar dataKey="value" name="Listings" radius={[0, 6, 6, 0]}>
                  {saleTierData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ── Locations table tab ── */}
      {activeTab === 'locations' && (
        <div className="glass-card border border-border/50 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-border/40">
            <h3 className="font-bold text-lg">All Tracked Neighbourhoods</h3>
            <p className="text-sm text-muted-foreground mt-1">Live data from latest scrape · {locationTable.length} locations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="text-left px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Neighbourhood</th>
                  <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Median Sale</th>
                  <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Median Rent</th>
                  <th className="text-right px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Listings</th>
                </tr>
              </thead>
              <tbody>
                {locationTable.map((row, i) => (
                  <tr key={row.location} className={`border-b border-border/20 hover:bg-accent/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                    <td className="px-6 py-3 font-semibold capitalize">{row.location}</td>
                    <td className="px-4 py-3 text-right font-bold">{row.sale != null ? formatKES(row.sale) : <span className="text-muted-foreground text-xs">—</span>}</td>
                    <td className="px-4 py-3 text-right font-bold">{row.rent != null ? formatKES(row.rent) : <span className="text-muted-foreground text-xs">—</span>}</td>
                    <td className="px-6 py-3 text-right">
                      <Badge variant="outline" className="font-mono">{row.count}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'from-indigo-500 to-indigo-600',
    violet: 'from-violet-500 to-violet-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
  }
  return (
    <div className="glass-card border border-border/50 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-extrabold tracking-tight mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}

function ChartCard({ title, sub, children, className = '' }: { title: string; sub: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card border border-border/50 rounded-3xl p-6 ${className}`}>
      <h3 className="font-bold text-base mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4">{sub}</p>
      {children}
    </div>
  )
}

function RankCard({ title, items, badge, type }: { title: string; items: TopItem[]; badge: string; type: 'affordable' | 'expensive' }) {
  return (
    <div className="glass-card border border-border/50 rounded-3xl p-6">
      <h3 className="font-bold text-base mb-4 flex items-center gap-2">
        {type === 'affordable' ? <TrendingDown className="h-4 w-4 text-emerald-500" /> : <TrendingUp className="h-4 w-4 text-rose-500" />}
        {title}
      </h3>
      <ol className="space-y-2">
        {items.slice(0, 5).map((item, i) => (
          <li key={item.slug} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-0">
            <span className="w-6 h-6 rounded-full bg-muted/50 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
            <span className="text-sm font-semibold capitalize flex-1 truncate">{item.name.split(',')[0]}</span>
            <span className={`text-sm font-extrabold ${type === 'affordable' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatKES(item.median)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

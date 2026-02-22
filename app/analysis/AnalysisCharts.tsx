'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import type { ModelData, TopItem } from '@/lib/model'
import { formatKES } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Home, DollarSign, BarChart3, Users, Building2, BedDouble, PieChart as PieIcon, MapPin } from 'lucide-react'

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

// SVG fill/tick attributes don't resolve CSS custom properties — read real hex from the DOM class.
function useChartColors() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains('dark'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return {
    axisLabel:     dark ? '#8fa3c0' : '#475569',
    grid:          dark ? '#1e3050' : '#e2e8f0',
    tooltipBg:     dark ? '#141e2e' : '#ffffff',
    tooltipBorder: dark ? '#1e3050' : '#e2e8f0',
    tooltipText:   dark ? '#e8edf5' : '#0f172a',
    tooltipMuted:  dark ? '#8fa3c0' : '#64748b',
  }
}

function SectionHeader({ icon: Icon, title, sub, color = '#6366f1' }: { icon: React.ElementType; title: string; sub: string; color?: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}22` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
    </div>
  )
}

export default function AnalysisCharts({ model, summaries }: Props) {
  const gs = model.global_stats
  const c  = useChartColors()

  const axisTick  = { fontSize: 11, fill: c.axisLabel }
  const axisTickS = { fontSize: 10, fill: c.axisLabel }
  const tooltipStyle = {
    contentStyle: { background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 12 },
    labelStyle:   { color: c.tooltipText, fontWeight: 700 },
    itemStyle:    { color: c.tooltipText },
  }

  // ── Data prep ──────────────────────────────────────────────────────────
  const bedroomSale = Object.entries(model.bedroom_distribution)
    .filter(([, v]) => v.median_sale)
    .map(([br, v]) => ({ name: `${br} BR`, value: v.median_sale ?? 0 }))
    .sort((a, b) => parseInt(a.name) - parseInt(b.name))

  const bedroomRent = Object.entries(model.bedroom_distribution)
    .filter(([, v]) => v.median_rent)
    .map(([br, v]) => ({ name: `${br} BR`, value: v.median_rent ?? 0 }))
    .sort((a, b) => parseInt(a.name) - parseInt(b.name))

  const topSaleLocations = Object.values(model.location_stats)
    .filter(l => l.sale?.median)
    .sort((a, b) => b.sale!.median - a.sale!.median)
    .slice(0, 12)
    .map(l => ({ name: l.name.split(',')[0].replace(/-nairobi$/i, ''), value: l.sale!.median }))

  const topRentLocations = Object.values(model.location_stats)
    .filter(l => l.rent?.median)
    .sort((a, b) => b.rent!.median - a.rent!.median)
    .slice(0, 12)
    .map(l => ({ name: l.name.split(',')[0].replace(/-nairobi$/i, ''), value: l.rent!.median }))

  const saleTierData = [
    { name: '< 5M',    value: model.price_tiers.sale.under_5m,         color: '#10b981' },
    { name: '5M–15M',  value: model.price_tiers.sale['5m_to_15m'],      color: '#6366f1' },
    { name: '15M–30M', value: model.price_tiers.sale['15m_to_30m'],     color: '#f59e0b' },
    { name: '> 30M',   value: model.price_tiers.sale.above_30m,         color: '#ef4444' },
  ]

  const rentTierData = [
    { name: '< 50K',     value: model.price_tiers.rent.under_50k,       color: '#10b981' },
    { name: '50K–150K',  value: model.price_tiers.rent['50k_to_150k'],  color: '#6366f1' },
    { name: '150K–300K', value: model.price_tiers.rent['150k_to_300k'], color: '#f59e0b' },
    { name: '> 300K',    value: model.price_tiers.rent.above_300k,      color: '#ef4444' },
  ]

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
    location: l.name.split(',')[0].replace(/-/g, ' ').replace(/nairobi$/i, '').trim(),
    price: Math.round(l.median / 1_000_000 * 10) / 10,
  }))

  const vBarMargin = { top: 4, right: 24, left: 0, bottom: 0 }

  return (
    <div className="space-y-16">

      {/* ── § 1  KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Home}         label="Total Listings"    value={gs.total_listings.toLocaleString()} sub={`${gs.total_sale} for sale · ${gs.total_rent} for rent`} color="indigo" />
        <KpiCard icon={DollarSign}   label="Median Sale Price" value={formatKES(gs.median_sale_price)}    sub={`${fmtK(gs.price_range.sale_min)} – ${fmtK(gs.price_range.sale_max)}`} color="violet" />
        <KpiCard icon={TrendingDown} label="Median Rent /mo"   value={formatKES(gs.median_rent_price)}    sub={`${fmtK(gs.price_range.rent_min)} – ${fmtK(gs.price_range.rent_max)}`} color="emerald" />
        <KpiCard icon={Users}        label="Avg Bedrooms"      value={`${gs.avg_bedrooms} BR`}            sub={`Across ${gs.total_listings.toLocaleString()} listings`} color="amber" />
      </div>

      {/* ── § 2  Sales & Rental Market ──────────────────────────────────── */}
      <section>
        <SectionHeader icon={Building2} title="Market Breakdown by Neighbourhood"
          sub="Split by listing type — sale (KES M) and rent (KES K) use independent scales" color="#6366f1" />
        <div className="grid lg:grid-cols-2 gap-6">

          <ChartCard title="🏠 Sale Prices" sub="Median sale price — top 12 areas (purchase price in KES)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topSaleLocations} layout="vertical" margin={vBarMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
                <XAxis type="number" tickFormatter={fmtK} tick={axisTickS} />
                <YAxis type="category" dataKey="name" tick={axisTickS} width={96} />
                <Tooltip formatter={(v: number | undefined) => [formatKES(v ?? 0), 'Median Sale']} {...tooltipStyle} />
                <Bar dataKey="value" name="Median Sale" radius={[0, 6, 6, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="🔑 Rental Prices" sub="Median monthly rent — top 12 areas (KES per month)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topRentLocations} layout="vertical" margin={vBarMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
                <XAxis type="number" tickFormatter={fmtK} tick={axisTickS} />
                <YAxis type="category" dataKey="name" tick={axisTickS} width={96} />
                <Tooltip formatter={(v: number | undefined) => [formatKES(v ?? 0), 'Median Rent/mo']} {...tooltipStyle} />
                <Bar dataKey="value" name="Median Rent/mo" radius={[0, 6, 6, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>

      {/* ── § 3  Bedrooms ────────────────────────────────────────────────── */}
      <section>
        <SectionHeader icon={BedDouble} title="Price by Bedroom Count"
          sub="Separate charts — sale (KES M) and rent (KES K) have very different scales" color="#8b5cf6" />
        <div className="grid lg:grid-cols-2 gap-6">

          <ChartCard title="🏠 Sale Price by Bedrooms" sub="Median purchase price (KES) per bedroom type">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bedroomSale} margin={{ top: 16, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} strokeOpacity={0.7} />
                <XAxis dataKey="name" tick={axisTick} />
                <YAxis tickFormatter={fmtK} tick={axisTick} />
                <Tooltip formatter={(v: number | undefined) => [formatKES(v ?? 0), 'Median Sale']} {...tooltipStyle} />
                <Bar dataKey="value" name="Median Sale" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="🔑 Rent /mo by Bedrooms" sub="Median monthly rent (KES) per bedroom type">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bedroomRent} margin={{ top: 16, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} strokeOpacity={0.7} />
                <XAxis dataKey="name" tick={axisTick} />
                <YAxis tickFormatter={fmtK} tick={axisTick} />
                <Tooltip formatter={(v: number | undefined) => [formatKES(v ?? 0), 'Median Rent/mo']} {...tooltipStyle} />
                <Bar dataKey="value" name="Median Rent/mo" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>

      {/* ── § 4  Premium Locations Radar ────────────────────────────────── */}
      <section>
        <SectionHeader icon={BarChart3} title="Premium Locations Radar"
          sub="Median sale price (KES M) for the 6 most expensive neighbourhoods" color="#ec4899" />
        <ChartCard title="🎯 Top 6 Premium Areas" sub="Radar comparison — larger area = higher price">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} margin={{ top: 16, right: 48, bottom: 8, left: 48 }}>
              <PolarGrid stroke={c.grid} />
              <PolarAngleAxis dataKey="location" tick={{ fontSize: 11, fill: c.axisLabel }} />
              <Radar name="Price (M KES)" dataKey="price" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
              <Tooltip formatter={(v: number | undefined) => [`KES ${v ?? 0}M`, 'Median Sale']} {...tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* ── § 5  Price Tiers ─────────────────────────────────────────────── */}
      <section>
        <SectionHeader icon={PieIcon} title="Price Tier Distribution"
          sub="How listings spread across affordable → luxury bands" color="#f59e0b" />
        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard title="🏷️ Sale Price Bands" sub="Share of listings in each purchase price tier">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={saleTierData} cx="50%" cy="50%" outerRadius={100} innerRadius={40} dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: c.axisLabel }} paddingAngle={2}>
                  {saleTierData.map((item, i) => <Cell key={i} fill={item.color} />)}
                </Pie>
                <Tooltip formatter={(v: number | undefined) => [(v ?? 0).toLocaleString(), 'Listings']} {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="💰 Rent Price Bands" sub="Share of rental listings per monthly price band">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={rentTierData} cx="50%" cy="50%" outerRadius={100} innerRadius={40} dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: c.axisLabel }} paddingAngle={2}>
                  {rentTierData.map((item, i) => <Cell key={i} fill={item.color} />)}
                </Pie>
                <Tooltip formatter={(v: number | undefined) => [(v ?? 0).toLocaleString(), 'Listings']} {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>

      {/* ── § 6  Affordability Rankings ─────────────────────────────────── */}
      <section>
        <SectionHeader icon={TrendingDown} title="Affordability Rankings"
          sub="Most affordable and most expensive neighbourhoods for buyers and renters" color="#10b981" />
        <div className="grid lg:grid-cols-2 gap-6">
          <RankCard title="Most Affordable to Buy"  items={model.top_lists.affordable_sale} type="affordable" />
          <RankCard title="Most Expensive to Buy"   items={model.top_lists.expensive_sale}  type="expensive" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <RankCard title="Most Affordable to Rent" items={model.top_lists.affordable_rent} type="affordable" isRent />
          <RankCard title="Most Expensive to Rent"  items={model.top_lists.expensive_rent}  type="expensive" isRent />
        </div>
      </section>

      {/* ── § 7  Full Locations Table ────────────────────────────────────── */}
      <section>
        <SectionHeader icon={MapPin} title="All Tracked Neighbourhoods"
          sub={`Live data from latest scrape · ${locationTable.length} areas`} color="#3b82f6" />
        <div className="glass-card border border-border/50 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="text-left px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground w-8">#</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Neighbourhood</th>
                  <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Median Sale</th>
                  <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Median Rent/mo</th>
                  <th className="text-right px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Listings</th>
                </tr>
              </thead>
              <tbody>
                {locationTable.map((row, i) => (
                  <tr key={row.location} className={`border-b border-border/20 hover:bg-accent/30 transition-colors ${i % 2 !== 0 ? 'bg-muted/10' : ''}`}>
                    <td className="px-6 py-3 text-xs text-muted-foreground font-mono">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold capitalize">{row.location}</td>
                    <td className="px-4 py-3 text-right font-bold">{row.sale != null ? formatKES(row.sale) : <span className="text-muted-foreground text-xs">—</span>}</td>
                    <td className="px-4 py-3 text-right font-bold">{row.rent != null ? formatKES(row.rent) : <span className="text-muted-foreground text-xs">—</span>}</td>
                    <td className="px-6 py-3 text-right">
                      <Badge variant="outline" className="font-mono text-xs">{row.count}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string; sub: string; color: string }) {
  const palette: Record<string, string> = {
    indigo:  'from-indigo-500 to-indigo-600',
    violet:  'from-violet-500 to-violet-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber:   'from-amber-500 to-amber-600',
  }
  return (
    <div className="glass-card border border-border/50 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${palette[color]} flex items-center justify-center`}>
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
      <p className="text-xs text-muted-foreground mb-5">{sub}</p>
      {children}
    </div>
  )
}

function RankCard({ title, items, type, isRent = false }: { title: string; items: TopItem[]; type: 'affordable' | 'expensive'; isRent?: boolean }) {
  return (
    <div className="glass-card border border-border/50 rounded-3xl p-6">
      <h3 className="font-bold text-base mb-4 flex items-center gap-2">
        {type === 'affordable'
          ? <TrendingDown className="h-4 w-4 text-emerald-500" />
          : <TrendingUp className="h-4 w-4 text-rose-500" />}
        {title}
      </h3>
      <ol className="space-y-2">
        {items.slice(0, 5).map((item, i) => (
          <li key={item.slug} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-0">
            <span className="w-6 h-6 rounded-full bg-muted/50 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
            <span className="text-sm font-semibold capitalize flex-1 truncate">{item.name.split(',')[0]}</span>
            <span className={`text-sm font-extrabold ${type === 'affordable' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatKES(item.median)}{isRent ? '/mo' : ''}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

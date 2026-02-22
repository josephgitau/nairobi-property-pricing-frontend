'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Dot,
} from 'recharts'
import { formatKESCompact } from '@/lib/format'
import { format, parseISO } from 'date-fns'

interface DataPoint {
  summary_date: string
  avg_price: number | null
  avg_price_per_bedroom: number | null
  median_price: number | null
}

interface Props {
  data: DataPoint[]
  metric?: 'avg_price' | 'avg_price_per_bedroom' | 'median_price'
}

export default function TrendChart({ data, metric = 'avg_price_per_bedroom' }: Props) {
  const [days, setDays] = useState<30 | 90 | 180>(30)

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/10 rounded-2xl border border-border/50">
        <p className="text-muted-foreground text-sm font-semibold">Insufficient historical data.</p>
      </div>
    )
  }

  // Filter the data down by the selected timeframe
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const filteredData = data.filter(d => d.summary_date >= cutoffStr)

  const chartData = filteredData.map((d) => ({
    date: format(parseISO(d.summary_date), 'MMM d'),
    value: d[metric] ?? null,
  }))

  const values = chartData.map((d) => d.value).filter((v): v is number => v != null)
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null

  const labels: Record<string, string> = {
    avg_price: 'Avg Price',
    avg_price_per_bedroom: 'Avg Price / Bed',
    median_price: 'Median Price',
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center mb-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{labels[metric]} — Trend analysis</p>
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl">
          {[30, 90, 180].map(d => (
            <button
              key={d}
              onClick={() => setDays(d as any)}
              className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all ${days === d ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
                }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
            <XAxis dataKey="date" tick={{ className: 'fill-muted-foreground', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tickFormatter={formatKESCompact} tick={{ className: 'fill-muted-foreground', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} width={45} dx={-10} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                background: 'linear-gradient(135deg, oklch(0.2 0.02 265 / 85%), oklch(0.14 0.015 265 / 85%))',
                backdropFilter: 'blur(16px)',
                border: '1px solid hsl(var(--border) / 0.5)',
                borderRadius: 16,
                fontSize: 12,
                fontWeight: 700,
                color: 'hsl(var(--foreground))',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}
              formatter={(v: number | undefined) => [`KES ${(v ?? 0).toLocaleString()}`, labels[metric]]}
            />
            {avg != null && (
              <ReferenceLine y={avg} stroke="hsl(var(--primary))" strokeOpacity={0.5} strokeDasharray="4 4" label={{ value: 'AVG', fill: 'hsl(var(--primary))', fontSize: 9, fontWeight: 800, position: 'insideTopLeft' }} />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

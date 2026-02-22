'use client'

import { useState, useMemo } from 'react'
import { Calculator, Info, CheckCircle2, AlertTriangle, XCircle, Wallet, Home, TrendingUp, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { toSlug } from '@/lib/format'

// 30% gross income rule
function calcMaxRent(monthlyIncome: number): number {
  return monthlyIncome * 0.30
}

// PMT-based max purchase
function calcMaxPurchase(monthlyIncome: number, downPaymentPct: number, tenureYears: number): number {
  const rate = 0.13 / 12 // Kenya avg mortgage rate
  const n = tenureYears * 12
  const monthlyAffordable = monthlyIncome * 0.30
  const pv = monthlyAffordable * ((1 - Math.pow(1 + rate, -n)) / rate)
  return pv / (1 - downPaymentPct / 100)
}

function fmtKES(v: number): string {
  if (v >= 1_000_000) return `KES ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `KES ${(v / 1_000).toFixed(0)}K`
  return `KES ${v.toLocaleString()}`
}

function fmtPct(v: number): string {
  return `${v.toFixed(2)}%`
}

interface NeighborhoodData {
  location: string
  avg_price: number | null
  avg_price_per_bedroom: number | null
  median_price: number | null
  listing_count: number | null
  affordability_rank: number | null
}

export default function CalculatorPage() {
  const [mode, setMode] = useState<'buy' | 'rent' | 'invest'>('buy')

  // Buy / Rent State
  const [income, setIncome] = useState('')
  const [down, setDown] = useState('20')
  const [tenure, setTenure] = useState('20')
  const [bedrooms, setBedrooms] = useState('2')

  // Invest State
  const [purchasePrice, setPurchasePrice] = useState('')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [vacancyRate, setVacancyRate] = useState('5')
  const [operatingExp, setOperatingExp] = useState('15')

  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodData[]>([])
  const [loading, setLoading] = useState(false)
  const [calculated, setCalculated] = useState(false)

  const monthlyIncome = parseFloat(income.replace(/,/g, '')) || 0
  const downPct = parseFloat(down) || 20
  const tenureYrs = parseFloat(tenure) || 20
  const beds = parseFloat(bedrooms) || 2

  const maxRent = calcMaxRent(monthlyIncome)
  const maxPurchase = calcMaxPurchase(monthlyIncome, downPct, tenureYrs)
  const monthlyPayment = monthlyIncome * 0.30

  // Invest Calculations
  const pp = parseFloat(purchasePrice.replace(/,/g, '')) || 0
  const mr = parseFloat(monthlyRent.replace(/,/g, '')) || 0
  const vr = parseFloat(vacancyRate) || 0
  const oe = parseFloat(operatingExp) || 0

  const annualGrossRent = mr * 12
  const grossYield = pp > 0 ? (annualGrossRent / pp) * 100 : 0
  const effectiveGrossIncome = annualGrossRent * (1 - vr / 100)
  const netOperatingIncome = effectiveGrossIncome * (1 - oe / 100)
  const capRate = pp > 0 ? (netOperatingIncome / pp) * 100 : 0

  async function doCalculate() {
    if (mode === 'invest') {
      if (!pp || !mr) return
      setCalculated(true)
      return
    }

    if (!monthlyIncome) return
    setLoading(true)
    try {
      const res = await fetch(`/api/summaries?type=${mode === 'rent' ? 'Rent' : 'Sale'}`)
      if (res.ok) {
        const data = await res.json()
        setNeighborhoods(data)
      }
    } catch {
      // fallback
    }
    setLoading(false)
    setCalculated(true)
  }

  const { affordable, stretch } = useMemo(() => {
    if (!calculated || mode === 'invest') return { affordable: [], stretch: [], outOfBudget: [] }
    const aff: NeighborhoodData[] = []
    const str: NeighborhoodData[] = []

    neighborhoods.forEach((n) => {
      const price = mode === 'rent'
        ? (n.median_price ?? 0)
        : ((n.avg_price_per_bedroom ?? 0) * beds)

      if (mode === 'rent') {
        if (price <= maxRent) aff.push(n)
        else if (price <= maxRent * 1.2) str.push(n)
      } else {
        if (price <= maxPurchase) aff.push(n)
        else if (price <= maxPurchase * 1.2) str.push(n)
      }
    })
    return { affordable: aff, stretch: str }
  }, [neighborhoods, calculated, mode, beds, maxRent, maxPurchase])

  const budgetRatio = neighborhoods.length > 0
    ? Math.round((affordable.length / neighborhoods.length) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-up py-12 px-4 sm:px-6 relative z-10">
      <div className="absolute top-0 right-1/4 w-full max-w-2xl h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 relative z-10">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <Calculator className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1 mt-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Market Calculators</h1>
          <p className="text-muted-foreground text-sm font-medium">Evaluate personal affordability limits, or analyze potential real estate investment returns across Nairobi.</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex justify-center sm:justify-start">
        <div className="flex items-center gap-1 sm:gap-2 bg-card border border-border/60 rounded-full p-1.5 shadow-sm backdrop-blur-md relative z-10 overflow-x-auto w-full sm:w-auto overflow-hidden">
          {(['buy', 'rent', 'invest'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setCalculated(false) }}
              className={`px-6 sm:px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 sm:gap-2.5 whitespace-nowrap ${mode === m
                ? 'bg-primary text-primary-foreground shadow-md scale-100'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 scale-95'
                }`}
            >
              {m === 'buy' ? <Home className="h-4 w-4 shrink-0" /> : m === 'rent' ? <Wallet className="h-4 w-4 shrink-0" /> : <Briefcase className="h-4 w-4 shrink-0" />}
              {m === 'buy' ? 'Purchase' : m === 'rent' ? 'Rental' : 'ROI (Investor)'}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs block */}
      <div className="glass-card rounded-3xl border border-border/50 p-6 sm:p-8 space-y-6 relative z-10">
        {mode === 'invest' ? (
          <div className="grid sm:grid-cols-2 gap-6 animate-fade-in">
            <div className="space-y-3 lg:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Purchase Price (KES)</label>
                <div className="relative w-32 sm:w-48">
                  <input type="text" value={purchasePrice} onChange={(e) => {
                    const val = e.target.value.replace(/,/g, '')
                    if (val === '') {
                      setPurchasePrice('')
                    } else if (!isNaN(Number(val))) {
                      setPurchasePrice(Number(val).toLocaleString())
                    }
                  }} placeholder="e.g. 15,000,000" className="w-full bg-background border border-border/60 rounded-full px-5 py-2.5 text-right text-base font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all shadow-sm" />
                </div>
              </div>
              <input type="range" min="1000000" max="100000000" step="500000" value={pp || 1000000} onChange={(e) => setPurchasePrice(Number(e.target.value).toLocaleString())} className="w-full accent-primary h-2 bg-muted rounded-full appearance-none cursor-pointer" />
              <div className="flex justify-between text-xs font-bold text-muted-foreground/60 px-1">
                <span>1M</span>
                <span>100M+</span>
              </div>
            </div>

            <div className="space-y-3 lg:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Expected Monthly Rent (KES)</label>
                <div className="relative w-32 sm:w-48">
                  <input type="text" value={monthlyRent} onChange={(e) => {
                    const val = e.target.value.replace(/,/g, '')
                    if (val === '') {
                      setMonthlyRent('')
                    } else if (!isNaN(Number(val))) {
                      setMonthlyRent(Number(val).toLocaleString())
                    }
                  }} placeholder="e.g. 100,000" className="w-full bg-background border border-border/60 rounded-full px-5 py-2.5 text-right text-base font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all shadow-sm" />
                </div>
              </div>
              <input type="range" min="10000" max="1000000" step="5000" value={mr || 10000} onChange={(e) => setMonthlyRent(Number(e.target.value).toLocaleString())} className="w-full accent-primary h-2 bg-muted rounded-full appearance-none cursor-pointer" />
              <div className="flex justify-between text-xs font-bold text-muted-foreground/60 px-1">
                <span>10K</span>
                <span>1M+</span>
              </div>
            </div>

            <div className="space-y-3 animate-fade-in">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Vacancy Rate (%)</label>
                <span className="font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-lg text-sm border border-primary/20">{vacancyRate}%</span>
              </div>
              <input type="range" min="0" max="30" step="1" value={vacancyRate} onChange={(e) => setVacancyRate(e.target.value)} className="w-full accent-primary h-2 bg-muted rounded-full appearance-none cursor-pointer" />
            </div>

            <div className="space-y-3 animate-fade-in">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Operating Expenses (%)</label>
                <span className="font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-lg text-sm border border-primary/20">{operatingExp}%</span>
              </div>
              <input type="range" min="0" max="50" step="1" value={operatingExp} onChange={(e) => setOperatingExp(e.target.value)} className="w-full accent-primary h-2 bg-muted rounded-full appearance-none cursor-pointer" />
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6 animate-fade-in">
            <div className="space-y-3 lg:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" /> Monthly Gross Income (KES)
                </label>
                <div className="relative w-32 sm:w-48">
                  <input type="text" value={income} onChange={(e) => {
                    const val = e.target.value.replace(/,/g, '')
                    if (val === '') {
                      setIncome('')
                    } else if (!isNaN(Number(val))) {
                      setIncome(Number(val).toLocaleString())
                    }
                  }} placeholder="e.g. 200,000" className="w-full bg-background border border-border/60 rounded-full px-5 py-2.5 text-right text-base font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all shadow-sm" />
                </div>
              </div>
              <input type="range" min="50000" max="2000000" step="10000" value={monthlyIncome || 50000} onChange={(e) => setIncome(Number(e.target.value).toLocaleString())} className="w-full accent-primary h-2 bg-muted rounded-full appearance-none cursor-pointer" />
              <div className="flex justify-between text-xs font-bold text-muted-foreground/60 px-1">
                <span>50K</span>
                <span>2M+</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground flex items-center mb-2">Bedrooms Required</label>
              <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="w-full bg-background border border-border/60 rounded-full px-5 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all shadow-sm appearance-none">
                {[1, 2, 3, 4, 5].map((b) => <option key={b} value={b}>{b} bedroom{b > 1 ? 's' : ''}</option>)}
              </select>
            </div>

            {mode === 'buy' && (
              <>
                <div className="space-y-3 animate-fade-in">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Down payment (%)</label>
                    <span className="font-extrabold text-primary bg-primary/10 px-4 py-1 rounded-full text-sm border border-primary/20">{down}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="5" value={down} onChange={(e) => setDown(e.target.value)} className="w-full accent-primary h-1.5 bg-muted rounded-full appearance-none cursor-pointer" />
                </div>
                <div className="space-y-3 animate-fade-in">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Mortgage Tenure</label>
                    <span className="font-extrabold text-primary bg-primary/10 px-4 py-1 rounded-full text-sm border border-primary/20">{tenure} yrs</span>
                  </div>
                  <input type="range" min="5" max="35" step="5" value={tenure} onChange={(e) => setTenure(e.target.value)} className="w-full accent-primary h-1.5 bg-muted rounded-full appearance-none cursor-pointer" />
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={doCalculate}
          disabled={loading || (mode === 'invest' ? !pp || !mr : !monthlyIncome)}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:hover:bg-primary text-primary-foreground font-extrabold py-3.5 rounded-full transition-all duration-300 flex items-center justify-center gap-3 shadow-md hover:shadow-xl hover:-translate-y-1 mt-4"
        >
          {loading ? (
            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
          ) : (
            <TrendingUp className="h-5 w-5" />
          )}
          {mode === 'invest' ? 'Calculate Returns' : 'Analyze Market Opportunities'}
        </button>
      </div>

      {/* Invest Results */}
      {calculated && mode === 'invest' && (
        <div className="space-y-8 animate-fade-up relative z-10 pt-4">
          <div className="grid md:grid-cols-3 gap-4">

            <div className="relative overflow-hidden glass-card border border-primary/30 rounded-3xl p-6 shadow-lg shadow-primary/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <p className="text-primary text-[11px] uppercase tracking-wider font-extrabold mb-1">Cap Rate (NOI)</p>
              <p className="text-4xl font-extrabold text-foreground mt-1 tabular-nums tracking-tight">{fmtPct(capRate)}</p>
              <p className="text-[11px] font-semibold text-muted-foreground mt-3 uppercase tracking-wider">Target: 6% - 8%</p>
            </div>

            <div className="relative overflow-hidden glass-card border border-border/50 rounded-3xl p-6 shadow-sm">
              <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-extrabold mb-1">Gross Yield</p>
              <p className="text-3xl font-extrabold tabular-nums tracking-tight">{fmtPct(grossYield)}</p>
              <p className="text-[11px] font-semibold text-muted-foreground mt-3 uppercase tracking-wider">Before OPEX/Vacancy</p>
            </div>

            <div className="relative overflow-hidden glass-card border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-extrabold mb-1">Annual Cash Flow</p>
                <p className="text-3xl font-extrabold tabular-nums tracking-tight">{fmtKES(netOperatingIncome)}</p>
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Estimated NOI</p>
            </div>

          </div>

          <div className="flex items-start gap-3 text-xs text-muted-foreground bg-accent/30 border border-border/50 rounded-2xl p-4 mt-8">
            <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <p className="font-medium leading-relaxed">
              <strong>Cap Rate</strong> is Net Operating Income (NOI) divided by Purchase Price. This does not account for mortgage debt service, appreciation, or major Capex events. Use this formula for quick baseline property-to-property comparisons.
            </p>
          </div>
        </div>
      )}

      {/* Buy/Rent Results Section */}
      {calculated && mode !== 'invest' && monthlyIncome > 0 && (
        <div className="space-y-8 animate-fade-up relative z-10 pt-4">

          {/* Summary Metric Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative overflow-hidden glass-card border border-primary/30 rounded-3xl p-6 shadow-lg shadow-primary/5 md:col-span-1 z-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <p className="text-primary text-[11px] uppercase tracking-wider font-extrabold mb-1">
                {mode === 'rent' ? 'Max Monthly Rent' : `Max Purchase (${beds}-bed)`}
              </p>
              <p className="text-3xl font-extrabold text-foreground mt-1 tabular-nums tracking-tight">
                {fmtKES(mode === 'rent' ? maxRent : maxPurchase)}
              </p>
              {mode === 'buy' && (
                <p className="text-[11px] font-semibold text-muted-foreground mt-3 bg-background/50 inline-block px-2 py-1 rounded-md">
                  {fmtKES(monthlyPayment)}/mo • {down}% down • {tenure}yr • 13% p.a.
                </p>
              )}
            </div>

            <div className="relative overflow-hidden glass-card border border-border/50 rounded-3xl p-6 shadow-md">
              <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-extrabold mb-1">Affordable Zones</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-extrabold tabular-nums tracking-tight">{affordable.length}</p>
                <p className="text-sm font-semibold text-muted-foreground">of {neighborhoods.length} total</p>
              </div>
            </div>

            <div className="relative overflow-hidden glass-card border border-border/50 rounded-3xl p-6 shadow-md">
              <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-extrabold mb-1">Market Coverage</p>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-3xl font-extrabold tabular-nums tracking-tight">{budgetRatio}%</p>
                <div className="flex-1 h-3 rounded-full bg-accent overflow-hidden border border-border/50">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                    style={{ width: `${budgetRatio}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Affordable list */}
          {affordable.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-primary" />
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-extrabold text-foreground">Matched Neighborhoods ({affordable.length})</h2>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {affordable.map((n) => (
                  <Link
                    key={n.location}
                    href={`/neighborhoods/${toSlug(n.location)}`}
                    className="flex justify-between items-center glass-card hover:bg-primary/5 hover:border-primary/40 border-border/50 rounded-2xl px-5 py-4 transition-all hover:-translate-y-1 shadow-sm hover:shadow-primary/10 group"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-bold capitalize truncate block text-[15px] group-hover:text-primary transition-colors">{n.location}</span>
                      <span className="text-xs font-medium text-muted-foreground mt-0.5">{n.listing_count} listings</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-extrabold text-[15px] text-foreground tabular-nums">
                        {mode === 'rent' ? fmtKES(n.median_price ?? 0) : fmtKES((n.avg_price_per_bedroom ?? 0) * beds)}
                      </span>
                      {mode === 'rent' && <span className="text-[10px] uppercase font-bold text-muted-foreground">/mo avg</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stretch list */}
          {stretch.length > 0 && (
            <div className="space-y-4 mt-8">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-amber-500" />
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-extrabold text-foreground">Stretch Limits <span className="text-muted-foreground text-sm font-semibold opacity-80 ml-2">Up to 20% over budget</span></h2>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stretch.map((n) => (
                  <Link
                    key={n.location}
                    href={`/neighborhoods/${toSlug(n.location)}`}
                    className="flex justify-between items-center glass-card hover:bg-amber-500/5 hover:border-amber-500/40 border-border/50 rounded-2xl px-5 py-4 transition-all hover:-translate-y-1 shadow-sm hover:shadow-amber-500/10 group"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-bold capitalize truncate block text-[15px] group-hover:text-amber-500 transition-colors">{n.location}</span>
                      <span className="text-xs font-medium text-muted-foreground mt-0.5">{n.listing_count} listings</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-extrabold text-[15px] text-foreground tabular-nums opacity-80">
                        {mode === 'rent' ? fmtKES(n.median_price ?? 0) : fmtKES((n.avg_price_per_bedroom ?? 0) * beds)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {affordable.length === 0 && stretch.length === 0 && (
            <div className="text-center py-16 space-y-4 glass-card border-border/50 rounded-3xl">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-2">
                <XCircle className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <p className="text-xl font-extrabold tracking-tight">No Exact Matches</p>
              <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto">Consider increasing your targeted income, adjusting the tenure period, or reducing bedrooms.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

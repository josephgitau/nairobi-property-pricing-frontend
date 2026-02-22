import { BrainCircuit, Crosshair } from 'lucide-react'
import modelData from '@/public/model.json'
import type { ModelData } from '@/lib/model'
import PredictMapClient from './PredictMapClient'

const model = modelData as unknown as ModelData

export default function PredictPage() {

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <section className="border-b border-border/40 bg-gradient-to-br from-violet-500/5 via-background to-indigo-500/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <BrainCircuit className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">AI Price Predictor</h1>
              <p className="text-muted-foreground font-medium mt-0.5">
                Drop a pin anywhere on Nairobi — get instant price predictions
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Model Accuracy (R²)', value: `${(model.meta.r2 * 100).toFixed(1)}%` },
              { label: 'Locations Covered',   value: model.meta.locations_in_model },
              { label: 'Training Listings',    value: model.meta.training_rows.toLocaleString() },
              { label: 'Neighbourhoods on Map', value: 30 },
            ].map(s => (
              <div key={s.label} className="glass-card border border-border/50 rounded-xl px-4 py-2 flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</span>
                <span className="text-sm font-extrabold">{s.value}</span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-primary" />
            Coloured dots = tracked neighbourhoods · Circle colour = sale price tier · Click anywhere to drop a pin
          </p>
        </div>
      </section>

      {/* ── Map + Panel ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-[680px] lg:h-[720px]">
          <PredictMapClient />
        </div>
      </div>
    </div>
  )
}

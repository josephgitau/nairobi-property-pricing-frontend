/** Format KES value as a human-readable string */
export function formatKES(value: number | null | undefined): string {
  if (value == null) return 'N/A'
  if (value >= 1_000_000) {
    return `KES ${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `KES ${(value / 1_000).toFixed(0)}K`
  }
  return `KES ${value.toLocaleString()}`
}

/** Format KES for axis / compact display */
export function formatKESCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}

/** Capitalize a location slug (e.g. "kilimani" → "Kilimani") */
export function titleCase(str: string): string {
  return str
    .split(/[\s-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Convert location string to URL slug */
export function toSlug(location: string): string {
  return location
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Color scale for affordability rank (rank 1 = green, high = red) */
export function rankToColor(rank: number, total: number): string {
  const ratio = rank / total
  if (ratio <= 0.25) return '#22c55e'   // green
  if (ratio <= 0.5) return '#84cc16'   // lime
  if (ratio <= 0.75) return '#f59e0b'   // amber
  return '#ef4444'                       // red
}

/** Price tier label based on affordability rank tercile */
export function priceTier(rank: number, total: number): 'Affordable' | 'Mid-Range' | 'Premium' {
  const ratio = rank / total
  if (ratio <= 0.33) return 'Affordable'
  if (ratio <= 0.66) return 'Mid-Range'
  return 'Premium'
}

/** Tier badge color */
export function tierColor(tier: string): string {
  switch (tier) {
    case 'Affordable': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
    case 'Mid-Range': return 'bg-primary/10 text-primary dark:text-primary border-primary/20'
    case 'Premium': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    default: return 'bg-muted text-muted-foreground border-border/50'
  }
}

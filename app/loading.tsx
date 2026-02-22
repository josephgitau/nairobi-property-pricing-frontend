export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-xl animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 border border-border/50">
            <div className="h-4 w-20 bg-muted rounded animate-pulse mb-3" />
            <div className="h-7 w-28 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card rounded-3xl p-5 border border-border/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="h-3 w-full bg-muted rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-muted rounded animate-pulse" />
            <div className="h-8 w-full bg-muted rounded-xl animate-pulse mt-2" />
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Activity, MapPin, BarChart3, Tag, Calculator, Home, Menu, X, Scale, BrainCircuit, LineChart, ChevronRight } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

const links = [
  { href: '/',              label: 'Dashboard', icon: Home,         desc: 'Market overview & stats'     },
  { href: '/map',           label: 'Map',        icon: MapPin,       desc: 'Interactive property map'    },
  { href: '/neighborhoods', label: 'Areas',      icon: BarChart3,    desc: 'Neighbourhood deep-dives'    },
  { href: '/analysis',      label: 'Analysis',   icon: LineChart,    desc: 'Charts & market trends'      },
  { href: '/deals',         label: 'Deals',      icon: Tag,          desc: 'Best value listings'         },
  { href: '/predict',       label: 'Predict',    icon: BrainCircuit, desc: 'AI drop-pin price predictor' },
  { href: '/calculator',    label: 'Budget',     icon: Calculator,   desc: 'Affordability calculator'    },
  { href: '/compare',       label: 'Compare',    icon: Scale,        desc: 'Side-by-side area comparison'},
]

export default function NavBar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const closeMenu = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeMenu])

  useEffect(() => { closeMenu() }, [pathname, closeMenu])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Brand */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0" onClick={closeMenu}>
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Activity className="h-4 w-4 text-white" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" aria-hidden="true" />
              </div>
              <div className="hidden sm:block leading-none">
                <p className="font-extrabold text-[15px] tracking-tight">
                  Nairobi<span className="text-indigo-500 dark:text-indigo-400">PI</span>
                </p>
                <p className="text-[10px] text-muted-foreground tracking-wide mt-0.5">Property Intelligence</p>
              </div>
            </Link>

            {/* Desktop nav — pill group, visible ≥1024 px */}
            <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-0.5 bg-muted/50 border border-border/40 rounded-2xl p-1">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
                      active
                        ? 'bg-background text-foreground shadow-sm shadow-black/5 dark:shadow-black/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/70'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </nav>

            {/* Tablet nav — icon-only, visible 768–1023 px */}
            <nav aria-label="Main navigation" className="hidden md:flex lg:hidden items-center gap-0.5">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    title={label}
                    aria-label={label}
                    aria-current={active ? 'page' : undefined}
                    className={`relative p-2 rounded-xl transition-all duration-150 ${
                      active
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {active && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" aria-hidden="true" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle />
              {/* Hamburger — mobile only */}
              <button
                onClick={() => setOpen(v => !v)}
                className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                aria-label={open ? 'Close menu' : 'Open navigation menu'}
                aria-expanded={open}
                aria-controls="mobile-drawer"
              >
                <Menu className={`h-5 w-5 absolute transition-all duration-200 ${open ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'}`} />
                <X    className={`h-5 w-5 absolute transition-all duration-200 ${open ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}`} />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ── Mobile backdrop ── */}
      <div
        onClick={closeMenu}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── Mobile drawer (right side) ── */}
      <aside
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={`fixed top-0 right-0 z-50 h-dvh w-72 max-w-[85vw] flex flex-col bg-card/95 backdrop-blur-2xl border-l border-border/50 shadow-2xl md:hidden transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <div className="leading-none">
              <p className="font-extrabold text-sm">Nairobi<span className="text-indigo-500 dark:text-indigo-400">PI</span></p>
              <p className="text-[10px] text-muted-foreground">Property Intelligence</p>
            </div>
          </div>
          <button
            onClick={closeMenu}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {links.map(({ href, label, icon: Icon, desc }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMenu}
                aria-current={active ? 'page' : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 ${
                  active
                    ? 'bg-indigo-500/10 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  active ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' : 'bg-muted/60 group-hover:bg-muted'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold leading-none ${active ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{desc}</p>
                </div>
                <ChevronRight className={`h-4 w-4 shrink-0 transition-all duration-150 ${active ? 'text-indigo-400 opacity-100' : 'opacity-0 group-hover:opacity-40 -translate-x-1 group-hover:translate-x-0'}`} />
              </Link>
            )
          })}
        </nav>

        {/* Drawer footer */}
        <div className="px-5 py-4 border-t border-border/40 shrink-0 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground">Nairobi Property Intel</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Live market data · Nairobi, KE</p>
          </div>
          <ThemeToggle />
        </div>
      </aside>
    </>
  )
}

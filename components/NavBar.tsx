'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Activity, MapPin, BarChart3, Tag, Calculator, Home, Menu, X, Scale } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

const links = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/map', label: 'Map', icon: MapPin },
  { href: '/neighborhoods', label: 'Areas', icon: BarChart3 },
  { href: '/deals', label: 'Deals', icon: Tag },
  { href: '/calculator', label: 'Budget', icon: Calculator },
  { href: '/compare', label: 'Compare', icon: Scale },
]

export default function NavBar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const closeMenu = useCallback(() => setOpen(false), [])

  // Close mobile menu on Escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeMenu])

  // Close mobile menu on route change
  useEffect(() => { closeMenu() }, [pathname, closeMenu])

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 w-full transition-all">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-90" onClick={closeMenu}>
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-indigo-500/20">
              <Activity className="h-4 w-4 text-white" />
              {/* Live data indicator */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse-soft" aria-hidden="true" title="Live data" />
            </div>
            <span className="font-bold text-[15px] tracking-tight ml-1">
              Nairobi<span className="text-indigo-600 dark:text-indigo-400">PI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1.5">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${active
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {active && (
                    <span className="absolute -bottom-[21px] left-0 right-0 h-[2px] bg-indigo-500 text-shadow-glow" aria-hidden="true" />
                  )}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div
            id="mobile-menu"
            role="menu"
            className="md:hidden border-t border-border/40 py-3 space-y-1 animate-fade-in shadow-xl glass-card rounded-b-2xl absolute left-0 right-0 px-4 z-50"
          >
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  aria-current={active ? 'page' : undefined}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${active
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                </Link>
              )
            })}
          </div>
        )}
      </nav>
    </header>
  )
}

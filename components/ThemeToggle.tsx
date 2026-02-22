'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />

  const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <button
      onClick={() => setTheme(next)}
      className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
      aria-label={`Switch to ${next} mode`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Activity } from 'lucide-react'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: {
    default: 'Nairobi Property Intel — Live Prices, Deals & Affordability',
    template: '%s | Nairobi Property Intel',
  },
  description:
    'Daily-updated property pricing intelligence for Nairobi. Compare neighborhoods, find below-market deals, and discover where your budget goes furthest.',
  keywords: [
    'nairobi property prices',
    'nairobi real estate',
    'kenya property market',
    'nairobi affordability map',
    'nairobi neighborhoods',
    'buy property nairobi',
    'rent nairobi',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    siteName: 'Nairobi Property Intel',
    title: 'Nairobi Property Intel — Live Prices, Deals & Affordability',
    description: 'Daily-updated property pricing intelligence across 60+ Nairobi neighborhoods.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  authors: [{ name: 'Nairobi Property Intel' }],
}

// Viewport must be exported separately in Next.js 15
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#05192d' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans antialiased min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary`}>
        <ThemeProvider>
          <div className="relative flex min-h-screen flex-col">
            <NavBar />
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <footer className="border-t border-border/40 bg-background/80 backdrop-blur-md">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-base font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        Nairobi<span className="text-indigo-500 dark:text-indigo-400">PI</span>
                      </span>
                    </div>
                    <span className="hidden md:block h-4 w-px bg-border/60" />
                    <p className="text-sm text-muted-foreground/80 font-medium hidden sm:block">Live property intelligence for Nairobi</p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground/80 font-medium">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">Live Pipeline</span>
                    </div>
                    <span className="h-4 w-px bg-border/60" />
                    <span>&copy; {new Date().getFullYear()} NPI</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

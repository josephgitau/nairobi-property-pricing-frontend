import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables')
}

// Public client — safe for browser, only reads allowed (RLS)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  global: {
    headers: { 'x-application-name': 'nairobi-property-intel' },
  },
})

// Server client — used in API routes / server actions with service key
// Only available on the server; never expose to the browser
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!serviceKey || serviceKey === 'your-service-role-key-here') {
    throw new Error('SUPABASE_SERVICE_KEY is not configured. Set it in .env.local.')
  }
  return createClient<Database>(supabaseUrl!, serviceKey, {
    auth: { persistSession: false },
  })
}

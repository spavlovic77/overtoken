import { createBrowserClient } from '@supabase/ssr'

// Fallbacks let the build succeed before Supabase is connected on Vercel.
// Once the Supabase Vercel integration injects real env vars, the rebuild
// inlines the real values and these placeholders are never used.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

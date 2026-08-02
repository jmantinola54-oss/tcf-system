import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// SERVER-ONLY. Uses the service role key, which bypasses Row Level Security.
// Never import this file from a Client Component or expose the key to the
// browser — only use it inside Route Handlers / Server Actions after you've
// already verified the caller is an authenticated admin.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    throw new Error(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYnBtYWNncnpyY2F1aXJ5d2RwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE0NDMwOCwiZXhwIjoyMTAwNzIwMzA4fQ.lNJt6amBUjFEeQchSkuZd-x0TOnjlH1gCubVPLJcjF0'
    )
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
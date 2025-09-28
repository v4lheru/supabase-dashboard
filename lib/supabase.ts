import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Enhanced client options for better international connectivity
const clientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-web'
    }
  },
  // Increase timeouts for international users
  db: {
    schema: 'public'
  },
  // Add retry logic for network issues
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
}

// Enhanced admin client options
const adminClientOptions = {
  ...clientOptions,
  auth: {
    ...clientOptions.auth,
    persistSession: false // Admin client doesn't need session persistence
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions)

// For server-side operations that need elevated permissions
// Only create admin client if we have the service role key (server-side only)
export const supabaseAdmin = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, adminClientOptions)
  : supabase // Fallback to regular client on client-side

// Connection health check utility
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('client_mappings')
      .select('count')
      .limit(1)
      .single()
    
    return { connected: !error, error }
  } catch (err) {
    return { connected: false, error: err }
  }
}

// Retry wrapper for database operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError
}

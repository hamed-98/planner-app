import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

// Checks if an error is related to JWT timestamp clock skew or expiration (PGRST303, PGRST301)
export function isJwtError(error: any): boolean {
  if (!error) return false;
  const code = error.code || '';
  const message = error.message || '';
  const str = typeof error === 'string' ? error : (typeof error === 'object' ? JSON.stringify(error) : '');
  return (
    code === 'PGRST303' ||
    code === 'PGRST301' ||
    str.includes('PGRST303') ||
    str.includes('PGRST301') ||
    str.includes('JWT issued at future') ||
    str.includes('JWT expired') ||
    str.includes('invalid claim: iat')
  );
}

// Unified error handler to prevent crashing or noisy logs on clock skew / transient auth errors
export function handleSupabaseError(context: string, error: any) {
  if (!error) return;
  if (isJwtError(error)) {
    console.warn(`[Supabase Auth] JWT clock skew/expiration detected in ${context}. Auto-recovering session.`);
    if (supabaseInstance) {
      supabaseInstance.auth.refreshSession().catch(() => {});
    }
    return;
  }
  console.warn(`Supabase notice in ${context}:`, error?.message || error);
}

export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  const getEnv = (key: string) => {
    if (typeof window !== 'undefined' && (window as any).ENV && (window as any).ENV[key]) {
      return (window as any).ENV[key];
    }
    return process.env[`NEXT_PUBLIC_${key}`] || process.env[key] || '';
  };

  const url = getEnv('SUPABASE_URL') || 'https://placeholder.supabase.co';
  const key = getEnv('SUPABASE_ANON_KEY') || 'placeholder';

  // Custom fetch interceptor to handle clock skew (PGRST303: JWT issued at future) and expired tokens
  const customFetch: typeof fetch = async (input, init) => {
    try {
      const response = await fetch(input, init);

      if (response.status === 401) {
        try {
          const cloned = response.clone();
          const errorText = await cloned.text();

          if (
            errorText.includes('PGRST303') ||
            errorText.includes('JWT issued at future') ||
            errorText.includes('JWT expired') ||
            errorText.includes('PGRST301')
          ) {
            // Attempt to refresh session
            if (supabaseInstance) {
              try {
                const { data } = await supabaseInstance.auth.refreshSession();
                if (data?.session?.access_token && init) {
                  const headers = new Headers(init.headers || {});
                  headers.set('Authorization', `Bearer ${data.session.access_token}`);
                  headers.set('apikey', key);
                  const retried = await fetch(input, { ...init, headers });
                  if (retried.ok) return retried;
                }
              } catch {
                // If refresh fails, continue to anon fallback
              }
            }

            // Fallback retry with anonymous key for readable queries
            if (init && key && key !== 'placeholder') {
              const headers = new Headers(init.headers || {});
              headers.set('Authorization', `Bearer ${key}`);
              headers.set('apikey', key);
              const anonRetried = await fetch(input, { ...init, headers });
              if (anonRetried.ok) return anonRetried;
            }
          }
        } catch {
          // Ignore parse errors on cloned response
        }
      }

      return response;
    } catch (fetchError) {
      throw fetchError;
    }
  };

  supabaseInstance = createSupabaseClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: customFetch,
    },
  });

  return supabaseInstance;
}


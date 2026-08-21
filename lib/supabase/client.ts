import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

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

export function handleSupabaseError(context: string, error: any) {
  if (!error) return;
  if (isJwtError(error)) {
    console.warn(`[Supabase Auth] JWT issue in ${context}. Auto-recovering session.`);
    if (supabaseInstance) {
      supabaseInstance.auth.refreshSession().catch(() => {});
    }
    return;
  }
  console.warn(`Supabase notice in ${context}:`, error?.message || error);
}

export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  // خواندن مستقیم و بدون ساختار داینامیک برای جایگذاری درست در باندل کلاینت
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || url.includes('placeholder')) {
    console.error('Supabase URL is missing or invalid in .env.local');
  }

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
              } catch {}
            }
          }
        } catch {}
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
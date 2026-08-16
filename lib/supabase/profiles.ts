import { createClient, handleSupabaseError } from './client';

export async function getProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) {
    handleSupabaseError('getProfile', error);
    return null;
  }
  return data as any;
}

export async function updateProfile(updates: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await (supabase.from('profiles') as any).update(updates).eq('id', user.id).select().single();
  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  return data as any;
}

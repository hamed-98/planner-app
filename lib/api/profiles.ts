// lib/api/profiles.ts
export async function getProfile() {
  try {
    const res = await fetch('/api/profile', { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('API getProfile error:', err);
    return null;
  }
}

export async function updateProfile(updates: any) {
  try {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('API updateProfile error:', err);
    return null;
  }
}
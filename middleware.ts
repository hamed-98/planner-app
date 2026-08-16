import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect /admin routes
  if (path.startsWith('/admin')) {
    // Note: Since the app uses localStorage for Supabase Auth,
    // we cannot fully verify the session here without cookie-based auth.
    // The main authorization check is performed in the AdminLayout component.
    // However, if we do have cookie based auth in the future, it goes here.
    
    // We let it pass to the client component for the actual role check, 
    // or we could block if a specific cookie is missing.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

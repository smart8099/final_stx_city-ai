import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Clerk auth is disabled until NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is configured.
// Dashboard routes are unprotected in dev. Add Clerk back in production.
export default function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/(api|trpc)(.*)'],
};

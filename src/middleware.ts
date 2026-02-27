import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isDashboardRoute(request)) {
    const { userId, orgSlug } = await auth();

    // Not signed in — redirect to home
    if (!userId) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Extract tenant slug from URL: /dashboard/{tenant_slug}/...
    const pathParts = request.nextUrl.pathname.split("/");
    const urlTenantSlug = pathParts[2]; // e.g. "city-of-austin"

    // If user has an org and the URL slug doesn't match, redirect to their org
    if (orgSlug && urlTenantSlug && urlTenantSlug !== orgSlug) {
      const correctPath = request.nextUrl.pathname.replace(
        `/dashboard/${urlTenantSlug}`,
        `/dashboard/${orgSlug}`
      );
      return NextResponse.redirect(new URL(correctPath, request.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

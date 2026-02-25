import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. Define routes that do NOT require Clerk authentication
// Note: /api routes are public because the backend handles its own auth
const isPublicRoute = createRouteMatcher(['/login(.*)', '/register(.*)', '/api(.*)']);

export default clerkMiddleware(async (auth, request) => {
  // 2. If the route is NOT public, protect it
  if (!isPublicRoute(request)) {
    // This replaces the old "redirectToSignIn" logic
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
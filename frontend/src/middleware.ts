/**
 * Global middleware for the SupportSafe frontend.
 *
 * Every incoming request passes through this function. It currently acts as a
 * lightweight pass-through (calling `NextResponse.next()`), which keeps the
 * pipeline open for future concerns such as:
 *   - Request logging / analytics
 *   - Security headers (CSP, HSTS, ...)
 *   - Simple rate limiting
 *
 * The `config.matcher` below scopes the middleware to everything except
 * Next.js internals (_next) and static assets, so it only runs on real page
 * and API requests rather than every file the app serves.
 */
import { NextResponse } from 'next/server';

/**
 * Invoked for each matching request before it reaches a route handler.
 * @returns a response that continues down the normal routing pipeline.
 */
export function middleware() {
  // Continue processing without modifying the request or response.
  return NextResponse.next();
}

/**
 * URL patterns this middleware applies to.
 * - Line 1: any path that is not a Next.js internal and not a static asset
 *   (images, stylesheets, scripts, fonts, favicons, archives, Office docs).
 * - Line 2: always apply to the API routes so they are covered as well.
 */
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

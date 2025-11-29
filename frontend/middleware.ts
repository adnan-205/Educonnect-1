import { clerkMiddleware } from '@clerk/nextjs/server'

// Use default middleware and exclude the embedded video-call route via matcher below
export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and the embedded video-call route
    '/((?!_next|dashboard/video-call|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

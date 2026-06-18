import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isDJRoute = createRouteMatcher(["/dj/dashboard(.*)"]);
const isPartnerRoute = createRouteMatcher(["/partner/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req) || isDJRoute(req) || isPartnerRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

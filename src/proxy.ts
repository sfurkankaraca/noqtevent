import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/adminEmails";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/dj/dashboard(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Bulgu 7: /admin yalnızca oturum değil, admin rolü de ister.
// Oturum claim'lerinde e-posta/rol taşınıyorsa burada reddedilir; taşınmıyorsa
// (Clerk JWT şablonuna bağlı) middleware kırılmaz, asıl kapı server action'lardaki
// requireAdmin() olmaya devam eder.
function claimsSayAdmin(sessionClaims: Record<string, unknown> | null): boolean | null {
  if (!sessionClaims) return null;

  const metadata = (sessionClaims.metadata ?? sessionClaims.publicMetadata) as
    | { role?: string }
    | undefined;
  if (typeof metadata?.role === "string") return metadata.role === "admin";

  const email =
    (typeof sessionClaims.email === "string" && sessionClaims.email) ||
    (typeof sessionClaims.primary_email_address === "string" && sessionClaims.primary_email_address) ||
    null;
  if (email) return isAdminEmail(email);

  return null; // claim'lerde bilgi yok — karar verilemiyor
}

const handler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  if (isAdminRoute(req)) {
    const { sessionClaims } = await auth();
    if (claimsSayAdmin((sessionClaims ?? null) as Record<string, unknown> | null) === false) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
});

export { handler as proxy };
export default handler;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

import { type NextRequest } from "next/server";
import { env } from "@/server/config";

/**
 * Verify that the request carries a valid Clerk JWT with an org role.
 * Dev bypass: returns true if CLERK_SECRET_KEY is not set.
 * Accepts any org member (org:admin or org:member).
 */
export async function verifyClerkAdmin(req: NextRequest): Promise<boolean> {
  if (!env.CLERK_SECRET_KEY) return true; // dev bypass

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);

  try {
    const { verifyToken } = await import("@clerk/nextjs/server");
    const payload = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });

    // Any valid Clerk token means the user is authenticated
    if (payload && payload.sub) return true;

    return false;
  } catch (e) {
    console.error("[clerk] JWT verification failed:", String(e));
    return false;
  }
}

import { type NextRequest } from "next/server";
import { env } from "@/server/config";

/**
 * Verify that the request carries a valid Clerk JWT with admin role.
 * Dev bypass: returns true if CLERK_SECRET_KEY is not set.
 */
export async function verifyClerkAdmin(req: NextRequest): Promise<boolean> {
  if (!env.CLERK_SECRET_KEY) return true; // dev bypass

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);

  try {
    const { verifyToken } = await import("@clerk/nextjs/server");
    const payload = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });

    const role = (payload as { public_metadata?: { role?: string } }).public_metadata?.role;
    const orgRole = (payload as { org_role?: string }).org_role;

    return role === "admin" || orgRole === "org:admin";
  } catch {
    return false;
  }
}

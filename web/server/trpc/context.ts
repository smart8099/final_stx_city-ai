/**
 * tRPC request context — resolved once per HTTP request.
 *
 * Injects the authenticated tenant (from X-CityAssist-Key), admin flag
 * (from Clerk JWT), and shared db/redis singletons into every procedure.
 */
import { type NextRequest } from "next/server";
import { db } from "@/server/db";
import { getRedis } from "@/server/redis";
import { getTenantByApiKey } from "@/server/services/tenant_service";
import { verifyClerkAdmin } from "./clerk";
import type { Tenant } from "@/server/db/schema";

/** Shared context available to all tRPC procedures. */
export interface Context {
  db: typeof db;
  redis: ReturnType<typeof getRedis>;
  tenant: Tenant | null;
  isAdmin: boolean;
  req: NextRequest;
}

/**
 * Builds the tRPC context for each incoming request.
 *
 * @param req - The incoming Next.js request.
 * @returns Resolved context including tenant, isAdmin, db, and redis.
 */
export async function createContext(req: NextRequest): Promise<Context> {
  const redis = getRedis();

  // Resolve tenant from widget API key
  let tenant: Tenant | null = null;
  const apiKey = req.headers.get("x-cityassist-key");
  if (apiKey) {
    tenant = await getTenantByApiKey(db, apiKey, redis);
    if (tenant && !tenant.isActive) tenant = null;
  }

  // Resolve Clerk admin
  const isAdmin = await verifyClerkAdmin(req);

  return { db, redis, tenant, isAdmin, req };
}

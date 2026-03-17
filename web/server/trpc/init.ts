/**
 * tRPC initialisation — defines the base procedures and middleware.
 *
 * Exports three procedure builders:
 *   - publicProcedure   — no authentication required
 *   - tenantProcedure   — requires a valid X-CityAssist-Key header
 *   - adminProcedure    — requires a valid Clerk JWT with admin role
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Tenant-authenticated procedure — requires X-CityAssist-Key
export const tenantProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.tenant) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing or invalid X-CityAssist-Key" });
  }
  return next({ ctx: { ...ctx, tenant: ctx.tenant } });
});

// Clerk admin procedure — requires valid Clerk JWT with admin role
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin access required" });
  }
  return next({ ctx });
});

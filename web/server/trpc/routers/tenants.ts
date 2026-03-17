import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "../init";
import {
  createTenant,
  listTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  rotateTenantKey,
} from "@/server/services/tenant_admin_service";
import { listDepartments } from "@/server/services/department_service";
import { clearAllTenantCaches } from "@/server/services/cache_service";
import { getTenantBySlug } from "@/server/services/tenant_service";

const TenantCreateInput = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  websiteDomain: z.string().min(1).max(255),
  searchDomains: z.array(z.string()).optional(),
});

const TenantUpdateInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  websiteDomain: z.string().min(1).max(255).optional(),
  searchDomains: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  dailyRequestQuota: z.number().int().positive().nullable().optional(),
  llmApiKey: z.string().nullable().optional(),
});

export const tenantsRouter = router({
  create: adminProcedure.input(TenantCreateInput).mutation(async ({ ctx, input }) => {
    const tenant = await createTenant(ctx.db, input);
    const departments = await listDepartments(ctx.db, tenant.id, ctx.redis);
    return { ...tenant, departments };
  }),

  list: adminProcedure.query(async ({ ctx }) => {
    return listTenants(ctx.db);
  }),

  getById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const tenant = await getTenantById(ctx.db, input.id);
      if (!tenant) throw new Error("Tenant not found");
      const departments = await listDepartments(ctx.db, tenant.id, ctx.redis);
      return { ...tenant, departments };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenant = await getTenantBySlug(ctx.db, input.slug);
      if (!tenant) throw new Error("Tenant not found");
      // Return only public fields for widget use
      return {
        slug: tenant.slug,
        name: tenant.name,
        websiteDomain: tenant.websiteDomain,
        apiKey: tenant.apiKey,
      };
    }),

  update: adminProcedure.input(TenantUpdateInput).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    const updated = await updateTenant(ctx.db, ctx.redis, id, data);
    if (!updated) throw new Error("Tenant not found");
    return updated;
  }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteTenant(ctx.db, ctx.redis, input.id);
      if (!ok) throw new Error("Tenant not found");
      return { success: true };
    }),

  rotateKey: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const newKey = await rotateTenantKey(ctx.db, ctx.redis, input.id);
      if (!newKey) throw new Error("Tenant not found");
      return { apiKey: newKey };
    }),

  clearCache: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getTenantById(ctx.db, input.id);
      if (!tenant) throw new Error("Tenant not found");
      const keysDeleted = await clearAllTenantCaches(ctx.redis, tenant.apiKey, tenant.id);
      return { keysDeleted, tenantId: input.id };
    }),
});

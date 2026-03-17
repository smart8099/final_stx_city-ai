/**
 * Root tRPC router — aggregates all sub-routers into the top-level appRouter.
 *
 * Sub-routers:
 *   chat        — resident chat (send mutation)
 *   tenants     — admin tenant CRUD
 *   departments — admin department CRUD
 *   health      — liveness ping
 */
import { router } from "./init";
import { chatRouter } from "./routers/chat";
import { tenantsRouter } from "./routers/tenants";
import { departmentsRouter } from "./routers/departments";
import { healthRouter } from "./routers/health";

export const appRouter = router({
  chat: chatRouter,
  tenants: tenantsRouter,
  departments: departmentsRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;

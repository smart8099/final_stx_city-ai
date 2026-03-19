# CityAssist — Monorepo Root

## What Is This
Multi-tenant civic AI chatbot. Cities embed a widget that answers resident questions using a LangGraph agent. **Phase 1: web search only (Tavily API).** No local knowledge base yet.

## Monorepo Layout
```
city_bot/
  web/              Next.js 14 + tRPC backend + admin dashboard (TypeScript/pnpm)
  widget/           Embeddable IIFE widget (Vite, TypeScript)
  docker-compose.yml  postgres:16 + redis:7-alpine
```

## Dev Commands
```bash
make up              # start postgres + redis via docker-compose
make env-setup       # create .env + web/.env.local symlink (run once)
make db-migrate      # apply Drizzle migrations
make web-dev         # Next.js + WS custom server on port 3000
make web-test        # run Vitest suite
make widget-copy     # build widget + copy to web/public/static/
```

## Phase 1 Scope — NOT Implemented Yet
- pgvector / local knowledge base (knowledge_chunks)
- Unstructured.io document ingestion
- Zendesk / live agent handoff
- Analytics pipeline
- CI/CD

## Key Architecture

- **Hybrid search**: BM25 + semantic with RRF + Cohere Rerank (Phase 2)
- **Confidence threshold**: 0.78 — below this, escalate; never hallucinate
- **LLM-agnostic**: swap model via `LLM_PROVIDER` env var, zero code changes
- **Tenant isolation**: every DB query includes `WHERE tenant_id = X`
- **Widget**: Shadow DOM for CSS isolation, IIFE format, zero runtime deps
- **Session memory**: Redis, k=6 window (12 messages), 30-minute TTL — stored as raw `BaseMessage[]`
- **Tenant injection to tools**: `AsyncLocalStorage` (`setCurrentTenant`), never pass as function arg
- **Agent**: LangGraph `createReactAgent` with `stateModifier` for system prompt

## Tooling
- Node: `pnpm` (never npm or yarn)
- DB migrations: `drizzle-kit` (never edit existing migrations, only generate new ones)
- Tests: `vitest` (never call real LLM, Tavily, or external APIs in tests)

## web/ Structure
```
web/
  server/
    config.ts           env config (@t3-oss/env-nextjs + zod)
    redis.ts            ioredis singleton
    db/
      schema.ts         Drizzle schema (tenants, departments, conversations, messages)
      index.ts          Drizzle client (postgres.js)
      migrate.ts        migration runner
    agent/
      executor.ts       getCachedAgent() + invokeAgent() + streamAgent()
      prompts.ts        buildSystemPrompt(tenant, departments)
      tools/
        web_search.ts   Tavily tool — tenant via AsyncLocalStorage
    llm/
      factory.ts        getLlm(apiKey?) — ChatGroq | ChatAnthropic
      groq_rate_limiter.ts  invokeWithBackoff() + rate-limit alerts
    memory/
      session.ts        SessionMemoryManager — load/save BaseMessage[] in Redis
    services/           tenant, department, conversation, cache, quota services
    trpc/
      root.ts           appRouter (chat, tenants, departments, health)
      init.ts           publicProcedure, tenantProcedure, adminProcedure
      context.ts        createContext — resolves tenant + isAdmin per request
      routers/          chat.ts, tenants.ts, departments.ts, health.ts
  app/
    api/trpc/[trpc]/    tRPC HTTP handler
    api/tenants/[slug]/ plain REST for widget config fetch
    api/ws/             placeholder (WS handled by server.ts)
    dashboard/          admin UI pages
  server.ts             custom Node.js server — Next.js + WebSocket at /api/ws
  tests/                Vitest suite
```

## Docstrings — Required on Every File, Class, Function, and Method
Every TypeScript/JavaScript file, class, exported function, and non-trivial method MUST have a JSDoc docstring. This is a hard rule — do not create or modify code without adding the required docstring.

**File-level** — top of every `.ts` / `.js` file:
```ts
/**
 * Brief one-line description of what this module does.
 *
 * Longer explanation if needed (purpose, design decisions, usage notes).
 */
```

**Functions and methods**:
```ts
/**
 * Brief description of what the function does.
 *
 * @param paramName - What this parameter is.
 * @returns What is returned, including shape if non-obvious.
 * @throws {ErrorType} When this can throw and why.
 */
```

**Classes**:
```ts
/**
 * Brief description of the class and its responsibility.
 *
 * Explain lifecycle, ownership, or important invariants if relevant.
 */
```

## tRPC Panel
Every new tRPC procedure must be reachable from the panel at `GET /api/panel`.

The panel auto-discovers procedures from `appRouter`, so no manual registration is needed — but every new procedure **must** be wired into the root router in `server/trpc/root.ts`. If a new sub-router is created, it must be added there too. After adding any new procedure, verify it appears in the panel before considering the work done.

## Never Do
- Hardcode tenant data or API keys
- Add per-tenant code branches/forks
- Call real LLM, Tavily, or external APIs in tests
- Use npm or yarn instead of pnpm
- Edit existing Drizzle migrations — only generate new ones
- Pass tenant as a function argument through the agent tool chain (use `AsyncLocalStorage`)
- Create or modify any file, class, function, or method without a JSDoc docstring

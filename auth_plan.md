# Plan: Tech Admin Dashboard + Hybrid RBAC

## Context
The platform needs a superuser dashboard where tech admins control the entire system:
create cities, send invitations to city admins, trigger crawls, and monitor all
operations. Auth uses **Clerk for identity only** (login/sessions/JWT) while all
tenant membership, roles, and permissions live in **Postgres** — giving full
flexibility to add roles, per-feature permissions, and multi-city membership
without Clerk plan constraints.

The existing `/dashboard/[tenant_slug]/...` pages stay for city admins. The tech
admin gets a new, fully separate `/admin` route.

---

## Role Hierarchy

```
tech_admin       — global superuser, no tenantId, can do everything
city_admin       — admin of one tenant (city), manages departments/staff/settings
supervisor       — city-scoped, can see all conversations, assign tickets
staff            — city-scoped, handles assigned conversations
member           — read-only city-scoped access
[custom roles]   — city_admin can create more roles with custom permission sets
```

---

## Database Changes

### New migration: `0005_add_rbac.sql`

```sql
-- Internal user registry (Clerk userId → our user)
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id    TEXT NOT NULL UNIQUE,   -- Clerk's sub (JWT subject)
  email       TEXT NOT NULL,
  name        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Roles (tech_admin role has tenant_id = NULL = global)
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = global
  name        TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]',  -- ["conversations:read", "crawl:trigger", ...]
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Membership: which user belongs to which tenant with which role
CREATE TABLE tenant_memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = tech_admin (global)
  role_id     UUID NOT NULL REFERENCES roles(id),
  invited_by  UUID REFERENCES users(id),
  joined_at   TIMESTAMPTZ,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Invitation tokens (email → pending membership)
CREATE TABLE invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role_id       UUID NOT NULL REFERENCES roles(id),
  token         TEXT NOT NULL UNIQUE,  -- 64-char hex, included in invite link
  invited_by    UUID REFERENCES users(id),
  expires_at    TIMESTAMPTZ NOT NULL,
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON tenant_memberships (user_id);
CREATE INDEX ON tenant_memberships (tenant_id);
CREATE INDEX ON invitations (token);

-- Seed default global roles
INSERT INTO roles (tenant_id, name, permissions) VALUES
  (NULL, 'tech_admin',  '["*"]'),
  (NULL, 'city_admin',  '["conversations:*","departments:*","settings:*","knowledge_base:*","members:manage","crawl:trigger"]'),
  (NULL, 'staff',       '["conversations:read","conversations:update"]');
```

### Drizzle schema additions (`server/db/schema.ts`)
Add `users`, `roles`, `tenantMemberships`, `invitations` tables with Drizzle
relations to existing `tenants` table.

---

## Auth Flow Changes

### `server/trpc/clerk.ts` → extend to `resolveUserContext`
Replace `verifyClerkAdmin(req): boolean` with:
```ts
resolveUserContext(req): Promise<{
  clerkId: string;
  user: User | null;        // from our users table
  role: string | null;      // 'tech_admin' | 'city_admin' | etc.
  tenantId: string | null;  // null for tech_admin
  permissions: string[];
} | null>
```
Flow: verify Clerk JWT → extract `sub` → query `users` JOIN `tenant_memberships`
JOIN `roles` → return role + permissions.
Cache result in Redis (`user:{clerkId}:ctx`, 5-min TTL) to avoid per-request DB hit.

### `server/trpc/context.ts` → extend Context
```ts
interface Context {
  db, redis, tenant, req,
  clerkId: string | null,
  user: User | null,
  role: string | null,       // 'tech_admin' | 'city_admin' | 'staff' | etc.
  userTenantId: string | null,  // user's tenant (not widget tenant)
  permissions: string[],
  isAdmin: boolean,          // kept for backward-compatibility
}
```

### `server/trpc/init.ts` → new procedure builders
```ts
// Keep existing (backward-compatible, checks isAdmin)
adminProcedure

// New
techAdminProcedure     — requires role === 'tech_admin'
tenantAdminProcedure   — requires role === 'city_admin' AND userTenantId matches input tenantId
```

---

## Invitation Flow

1. Tech admin fills form: email + city + role → calls `admin.sendInvitation`
2. Backend creates `invitations` row: `token = randomBytes(32).hex()`, `expiresAt = now + 7 days`
3. `email_service.ts` sends email via **Resend** with link: `/invite/[token]`
4. Recipient clicks → `app/invite/[token]/page.tsx` → "You've been invited to CityAssist" page
5. Clerk sign-in/sign-up modal opens (they authenticate with Clerk)
6. After auth: page calls `POST /api/invitations/accept` with token + Clerk JWT
7. Accept handler:
   - Verifies token not expired, not already accepted
   - Calls `getOrCreateUser(clerkId, email)` → upserts `users` row
   - Inserts `tenant_memberships` row (userId, tenantId, roleId, joinedAt=now)
   - Marks `invitations.acceptedAt = now`
   - Returns redirect URL → `/dashboard/[tenant_slug]/conversations` (or `/admin` for tech_admin invites)

---

## Tech Admin Dashboard Pages (`/admin`)

### Layout (`app/admin/layout.tsx`)
Dark sidebar (same visual style as existing `/dashboard` layout) with:
- "CityAssist Admin" header + "Tech Admin" badge
- Nav: Overview, Cities, Invitations, System
- User button + sign-out at bottom
- Guard: if `role !== 'tech_admin'` → redirect to `/`

### Pages

| Route | Purpose |
|---|---|
| `/admin` | **Overview** — total cities, active cities, total conversations today, system health chips (DB ✓, Redis ✓, Groq API status) |
| `/admin/cities` | **Cities table** — name, slug, status badge, quota usage bar, conversation count, last crawl date. Actions per row: Edit / Deactivate / Trigger Crawl |
| `/admin/cities/[tenantId]` | **City detail** — tabs: General (name, domain, search domains, quota), Departments (list + inline edit), Knowledge Base (docs/FAQs list + Trigger Crawl button), Members (memberships + role assignment) |
| `/admin/invitations` | **Invitations** — table: email, city, role, status (pending/accepted/expired), expiry date. "Send Invitation" button opens modal |
| `/admin/system` | **System health** — DB ping, Redis ping, env key presence (Groq, Tavily, OpenAI, Resend), recent 10 error log entries |

---

## New tRPC Router: `admin` (`server/trpc/routers/admin.ts`)

All procedures use `techAdminProcedure`.

| Procedure | Type | Description |
|---|---|---|
| `admin.overview` | query | System-wide stats: tenant count, active count, conversations today, system health booleans |
| `admin.listCities` | query | All tenants + conversation count + quota usage + last crawl date |
| `admin.updateCity` | mutation | Update any tenant (name, domain, searchDomains, quota, isActive, llmApiKey) |
| `admin.triggerCrawl` | mutation | `{tenantId}` → stub now, calls `crawl_service.crawlTenant()` when Firecrawl implemented |
| `admin.sendInvitation` | mutation | `{email, tenantId?, roleId}` → create invitation + send email |
| `admin.listInvitations` | query | All invitations with computed status (pending/accepted/expired) |
| `admin.revokeInvitation` | mutation | Delete invitation by id |
| `admin.listMembers` | query | `{tenantId}` → all active memberships for a city |
| `admin.updateMember` | mutation | `{membershipId, roleId?, isActive?}` → change role or deactivate |
| `admin.removeMember` | mutation | Delete membership row |
| `admin.systemHealth` | query | DB ping, Redis ping, env key presence checks |
| `admin.listRoles` | query | All global + tenant-scoped roles |
| `admin.createRole` | mutation | `{tenantId?, name, permissions[]}` → new role |

Wire into `root.ts`: `admin: adminRouter`.

---

## New Service Files

| File | Purpose |
|---|---|
| `server/services/user_service.ts` | `getOrCreateUser(clerkId, email, name)`, `getUserByClerkId(clerkId)` |
| `server/services/invitation_service.ts` | `createInvitation(...)`, `getInvitationByToken(token)`, `acceptInvitation(token, clerkId)`, `listInvitations()`, `revokeInvitation(id)` |
| `server/services/email_service.ts` | `sendInvitationEmail({to, inviterName, cityName, role, inviteUrl})` via Resend SDK |
| `server/services/membership_service.ts` | `getUserContext(clerkId, redis)` (with cache), `createMembership(...)`, `listMemberships(tenantId)`, `updateMembership(...)`, `removeMembership(...)` |

---

## New API Route

| File | Purpose |
|---|---|
| `app/api/invitations/accept/route.ts` | `POST` — verifies token + Clerk JWT, upserts user, creates membership, returns `{redirectUrl}` |

---

## New Page Files

| File | Purpose |
|---|---|
| `app/admin/layout.tsx` | Tech admin sidebar layout with `role !== 'tech_admin'` guard |
| `app/admin/page.tsx` | System overview dashboard |
| `app/admin/cities/page.tsx` | All cities table |
| `app/admin/cities/[tenantId]/page.tsx` | City detail (tabbed: General, Departments, KB, Members) |
| `app/admin/invitations/page.tsx` | Invitation management + send modal |
| `app/admin/system/page.tsx` | System health panel |
| `app/invite/[token]/page.tsx` | Invitation acceptance landing page + Clerk auth trigger |

---

## Modified Files

| File | Change |
|---|---|
| `server/db/schema.ts` | Add users, roles, tenantMemberships, invitations tables + Drizzle relations |
| `server/db/migrations/0005_add_rbac.sql` | New migration (never edit existing migrations) |
| `server/trpc/clerk.ts` | Replace `verifyClerkAdmin` with `resolveUserContext` (keeps dev bypass) |
| `server/trpc/context.ts` | Extend Context with clerkId, user, role, userTenantId, permissions |
| `server/trpc/init.ts` | Add `techAdminProcedure`, `tenantAdminProcedure`; keep `adminProcedure` |
| `server/trpc/root.ts` | Add `admin: adminRouter` |
| `web/package.json` | Add `resend` |
| `.env` / `.env.example` | Add `RESEND_API_KEY` |

---

## New Environment Variable
```
RESEND_API_KEY=        # resend.com — free tier: 3,000 emails/month
```

---

## Existing Dashboard Compatibility

The `/dashboard/[tenant_slug]/...` pages remain **unchanged** for city admins.
The `adminProcedure` in `init.ts` keeps its existing `isAdmin` check — all existing
procedures continue to work. The Context extension is purely additive.

---

## Verification

1. `make web-check` — typecheck + tests green
2. `make db-migrate` — migration applies cleanly, seed roles inserted
3. Sign in as tech_admin → redirects to `/admin`, sees all cities table
4. Send invitation → email received, link is `/invite/[token]`
5. Accept invitation as new user → `tenant_memberships` row created, redirected to city dashboard
6. Tech admin triggers crawl for a city → logs "crawl triggered for [tenantId]" (stub)
7. `/api/panel` — `admin.*` procedures appear with input schemas
8. City admin user cannot access `/admin` — redirected to `/`
9. Expired invitation token → acceptance returns 400 "Invitation expired"

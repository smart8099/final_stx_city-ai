import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Timestamps mixin (applied manually per table) ─────────────────────────────

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

// ── Tenants ───────────────────────────────────────────────────────────────────

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  apiKey: varchar("api_key", { length: 255 }).notNull().unique(),
  websiteDomain: varchar("website_domain", { length: 255 }).notNull(),
  searchDomains: json("search_domains").$type<string[]>().notNull().default([]),
  logoPath: varchar("logo_path", { length: 500 }),
  isActive: boolean("is_active").notNull().default(true),
  dailyRequestQuota: integer("daily_request_quota"),
  llmApiKey: varchar("llm_api_key", { length: 500 }),
  ...timestamps,
});

// ── Departments ───────────────────────────────────────────────────────────────

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  keywords: text("keywords"),
  location: json("location").$type<{
    street?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    country?: string;
  }>(),
  hours: text("hours"),
  ...timestamps,
});

// ── Conversations ─────────────────────────────────────────────────────────────

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  ...timestamps,
});

// ── Messages ──────────────────────────────────────────────────────────────────

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  ...timestamps,
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const tenantsRelations = relations(tenants, ({ many }) => ({
  departments: many(departments),
  conversations: many(conversations),
}));

export const departmentsRelations = relations(departments, ({ one }) => ({
  tenant: one(tenants, { fields: [departments.tenantId], references: [tenants.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [conversations.tenantId], references: [tenants.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// ── Inferred types ────────────────────────────────────────────────────────────

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

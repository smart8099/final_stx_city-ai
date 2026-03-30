/**
 * Drizzle ORM schema for CityAssist.
 *
 * Defines all tables, relations, and inferred TypeScript types for the
 * multi-tenant civic chatbot platform.
 */
import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  unique,
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
  widgetSettings: json("widget_settings").$type<{
    cityName?: string;
    primaryColor?: string;
    welcomeMessage?: string;
    logoUrl?: string;
    autoOpen?: boolean;
    position?: string; // "bottom-right" | "bottom-left" | "top-right" | "top-left"
    slaFirstResponseHours?: number;   // default 24
    slaResolutionHours?: number;      // default 72
    slaExcludeWeekends?: boolean;     // default true
    slaBusinessHoursStart?: number;   // e.g. 8 (8 AM), null = 24/7
    slaBusinessHoursEnd?: number;     // e.g. 17 (5 PM), null = 24/7
  }>(),
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

// ── Documents (Knowledge Base) ────────────────────────────────────────────────

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 500 }).notNull(),
  savedAs: varchar("saved_as", { length: 500 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // "pdf" | "txt"
  size: integer("size").notNull(), // bytes
  status: varchar("status", { length: 20 }).notNull().default("processing"), // "processing" | "ingested" | "failed"
  textContent: text("text_content"),
  ...timestamps,
});

// ── FAQs (Knowledge Base) ────────────────────────────────────────────────────

export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  ...timestamps,
});

// ── Conversations ─────────────────────────────────────────────────────────────

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("new"), // new | open | resolved | escalated
  priority: varchar("priority", { length: 20 }).notNull().default("normal"), // low | normal | high | urgent
  departmentId: uuid("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  intent: varchar("intent", { length: 100 }),
  assignedTo: varchar("assigned_to", { length: 255 }),
  wasEscalated: boolean("was_escalated").notNull().default(false),
  // SLA tracking timestamps
  firstResponseAt: timestamp("first_response_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  escalatedAt: timestamp("escalated_at", { withTimezone: true }),
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

// ── Conversation Departments (junction table) ─────────────────────────────────

/**
 * Junction table linking conversations to one or more departments.
 *
 * Populated automatically by the LLM routing layer after each assistant response.
 * A conversation may belong to multiple departments (e.g. pothole → Public Works,
 * fire risk → Fire Department). The unique constraint prevents duplicate entries.
 */
export const conversationDepartments = pgTable(
  "conversation_departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    detectedAt: timestamp("detected_at", { withTimezone: true }).defaultNow().notNull(),
    triggerMessageId: uuid("trigger_message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
    reason: text("reason"),
  },
  (table) => ({
    uniq: unique().on(table.conversationId, table.departmentId),
  }),
);

// ── Internal Notes ────────────────────────────────────────────────────────────

export const internalNotes = pgTable("internal_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorId: varchar("author_id", { length: 255 }).notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  ...timestamps,
});

// ── Macros ────────────────────────────────────────────────────────────────────

export const macros = pgTable("macros", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  ...timestamps,
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const tenantsRelations = relations(tenants, ({ many }) => ({
  departments: many(departments),
  documents: many(documents),
  faqs: many(faqs),
  conversations: many(conversations),
  macros: many(macros),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  tenant: one(tenants, { fields: [departments.tenantId], references: [tenants.id] }),
  documents: many(documents),
  faqs: many(faqs),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  tenant: one(tenants, { fields: [documents.tenantId], references: [tenants.id] }),
  department: one(departments, { fields: [documents.departmentId], references: [departments.id] }),
}));

export const faqsRelations = relations(faqs, ({ one }) => ({
  tenant: one(tenants, { fields: [faqs.tenantId], references: [tenants.id] }),
  department: one(departments, { fields: [faqs.departmentId], references: [departments.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [conversations.tenantId], references: [tenants.id] }),
  department: one(departments, { fields: [conversations.departmentId], references: [departments.id] }),
  messages: many(messages),
  notes: many(internalNotes),
  conversationDepartments: many(conversationDepartments),
}));

export const conversationDepartmentsRelations = relations(conversationDepartments, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationDepartments.conversationId],
    references: [conversations.id],
  }),
  department: one(departments, {
    fields: [conversationDepartments.departmentId],
    references: [departments.id],
  }),
}));

export const internalNotesRelations = relations(internalNotes, ({ one }) => ({
  conversation: one(conversations, {
    fields: [internalNotes.conversationId],
    references: [conversations.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const macrosRelations = relations(macros, ({ one }) => ({
  tenant: one(tenants, { fields: [macros.tenantId], references: [tenants.id] }),
}));

// ── Inferred types ────────────────────────────────────────────────────────────

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type FAQ = typeof faqs.$inferSelect;
export type NewFAQ = typeof faqs.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type InternalNote = typeof internalNotes.$inferSelect;
export type NewInternalNote = typeof internalNotes.$inferInsert;
export type MacroRow = typeof macros.$inferSelect;
export type NewMacro = typeof macros.$inferInsert;
export type ConversationDepartment = typeof conversationDepartments.$inferSelect;
export type NewConversationDepartment = typeof conversationDepartments.$inferInsert;

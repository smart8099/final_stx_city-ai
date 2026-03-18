/**
 * Conversation persistence service.
 *
 * Conversations group messages under a (tenantId, sessionId) pair.
 * Only used when PERSIST_CHAT_MESSAGES=true.
 */
import { eq, and } from "drizzle-orm";
import type { DB } from "@/server/db";
import {
  conversations,
  messages,
  type Conversation,
  type Message,
} from "@/server/db/schema";

/**
 * Finds the conversation for a (tenantId, sessionId) pair, creating it if needed.
 *
 * @param db - Drizzle database client.
 * @param tenantId - Tenant UUID.
 * @param sessionId - Browser session ID.
 * @returns The existing or newly created conversation row.
 */
export async function getOrCreateConversation(
  db: DB,
  tenantId: string,
  sessionId: string,
): Promise<Conversation> {
  const existing = await db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.tenantId, tenantId), eq(conversations.sessionId, sessionId)),
    )
    .limit(1);

  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(conversations)
    .values({ tenantId, sessionId })
    .returning();
  return created!;
}

/**
 * Appends a single message to a conversation.
 *
 * @param db - Drizzle database client.
 * @param conversationId - UUID of the parent conversation.
 * @param role - "user" or "assistant".
 * @param content - Raw message text.
 * @returns The inserted message row.
 */
/**
 * Updates a conversation's status and optionally marks it as escalated.
 */
export async function updateConversationStatus(
  db: DB,
  conversationId: string,
  status: "new" | "open" | "resolved" | "escalated",
  wasEscalated?: boolean,
): Promise<void> {
  const now = new Date();
  const set: Record<string, unknown> = { status, updatedAt: now };
  if (wasEscalated) set.wasEscalated = true;

  // SLA timestamp tracking
  if (status === "resolved") set.resolvedAt = now;
  if (status === "escalated") set.escalatedAt = now;

  await db
    .update(conversations)
    .set(set)
    .where(eq(conversations.id, conversationId));
}

export async function logMessage(
  db: DB,
  conversationId: string,
  role: "user" | "assistant",
  content: string,
): Promise<Message> {
  const [msg] = await db
    .insert(messages)
    .values({ conversationId, role, content })
    .returning();

  // Track first response time for SLA
  if (role === "assistant") {
    const conv = await db
      .select({ firstResponseAt: conversations.firstResponseAt })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    if (conv[0] && !conv[0].firstResponseAt) {
      await db
        .update(conversations)
        .set({ firstResponseAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }
  }

  return msg!;
}

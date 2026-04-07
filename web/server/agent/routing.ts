/**
 * LLM-based department routing and escalation detection for CityAssist.
 *
 * Exports two classifiers that share the same LLM (controlled by `ROUTING_MODEL`):
 * - `detectDepartments` — identifies relevant city departments for a message.
 * - `detectEscalation` — determines if the assistant's response warrants
 *   escalation to a human staff member.
 *
 * History (last 3 turns) is included in each LLM prompt so follow-up messages
 * are evaluated in context. Both functions are fire-and-forget safe: they
 * never throw and never block the main response path.
 */
import { z } from "zod";
import { ChatGroq } from "@langchain/groq";
import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseMessage } from "@langchain/core/messages";
import { env } from "@/server/config";
import { routingLog } from "@/server/logger";
import type { Tenant, Department } from "@/server/db/schema";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * A single department matched by the routing classifier.
 */
export interface RoutingMatch {
  /** Department UUID. */
  id: string;
  /** Brief explanation from the LLM about why this department was matched. */
  reason: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Returns the LLM instance for routing and escalation classification.
 *
 * Uses `ROUTING_MODEL` env var (default: llama-3.3-70b-versatile) so the
 * model can be tuned per environment without a code change.
 * - Groq: reads `ROUTING_MODEL` env var
 * - Anthropic: claude-haiku-4-5
 *
 * @param apiKey - Optional per-tenant API key override.
 * @returns A LangChain chat model instance.
 */
function getLlmForRouting(apiKey?: string) {
  const provider = env.LLM_PROVIDER;

  if (provider === "anthropic") {
    return new ChatAnthropic({
      model: "claude-haiku-4-5",
      temperature: 0,
      maxTokens: 256,
      anthropicApiKey: apiKey ?? env.ANTHROPIC_API_KEY,
    });
  }

  // Default: groq
  return new ChatGroq({
    model: env.ROUTING_MODEL,
    temperature: 0,
    maxTokens: 256,
    apiKey: apiKey ?? env.GROQ_API_KEY,
  });
}

/**
 * Extracts token usage from a raw LangChain AIMessage response_metadata.
 *
 * Returns null fields when usage data is unavailable (e.g. non-Groq providers
 * or models that don't report usage).
 *
 * @param raw - The raw AIMessage returned by withStructuredOutput({ includeRaw: true }).
 * @returns Object with inputTokens, outputTokens, totalTokens (all nullable).
 */
function extractUsage(raw: unknown): {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
} {
  try {
    const meta = (raw as { response_metadata?: { usage?: Record<string, number> } })
      ?.response_metadata?.usage;
    if (!meta) return { inputTokens: null, outputTokens: null, totalTokens: null };
    return {
      inputTokens: meta["prompt_tokens"] ?? meta["input_tokens"] ?? null,
      outputTokens: meta["completion_tokens"] ?? meta["output_tokens"] ?? null,
      totalTokens: meta["total_tokens"] ?? null,
    };
  } catch {
    return { inputTokens: null, outputTokens: null, totalTokens: null };
  }
}

/**
 * Extracts the last `n` messages from history as a plain text transcript.
 *
 * @param history - Prior conversation messages.
 * @param n - Maximum number of messages to include.
 * @returns Formatted transcript string.
 */
function formatHistory(history: BaseMessage[], n: number): string {
  return history
    .slice(-n)
    .map((m) => {
      const role = m._getType() === "human" ? "USER" : "ASSISTANT";
      return `${role}: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`;
    })
    .join("\n");
}

/**
 * Result returned by the escalation classifier.
 */
export interface EscalationResult {
  /** Whether the conversation should be escalated to a human staff member. */
  shouldEscalate: boolean;
  /** Brief explanation from the LLM about why escalation was or was not triggered. */
  reason: string;
}

// ── Main exports ──────────────────────────────────────────────────────────────

/**
 * Detects which departments are relevant to the current conversation turn.
 *
 * Every message goes to the LLM with the last 3 history turns for context.
 * No keyword gate and no cache — ensures routing is always accurate and
 * never serves a stale result from a different conversation context.
 *
 * Never throws — returns [] on any error.
 *
 * @param tenant - Current tenant (for API key resolution).
 * @param departments - All departments for this tenant.
 * @param history - Prior BaseMessage[] (last 3 turns used for context).
 * @param userMessage - The current user message.
 * @returns Matched departments, may be empty.
 */
export async function detectDepartments(
  tenant: Tenant,
  departments: Department[],
  history: BaseMessage[],
  userMessage: string,
): Promise<RoutingMatch[]> {
  const log = routingLog.child({ tenant: tenant.slug });

  // Short-circuit: no departments configured
  if (departments.length === 0) {
    log.debug("Routing skipped — tenant has no departments");
    return [];
  }

  const departmentIds = departments.map((d) => d.id) as [string, ...string[]];

  // z.enum requires at least one value — already guaranteed by length check above
  const schema = z.object({
    departments: z.array(
      z.object({
        id: z.enum(departmentIds),
        reason: z.string(),
      }),
    ),
  });

  const deptList = departments
    .map((d) => `- [id: ${d.id}] ${d.name}: ${(d.keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean).join(", ")}`)
    .join("\n");

  const systemPrompt = `You are a department routing classifier for a civic chatbot.
Given a conversation, identify which city departments (if any) are relevant to the CURRENT user message or the topic being actively discussed.

Rules:
- Only select a department if its keywords DIRECTLY match the topic of the current message or recent conversation context.
- You MUST provide a specific, non-empty reason for every department you select, citing which keyword matched and why.
- If you cannot provide a clear reason, do NOT include the department.
- Generic greetings, acknowledgements, or off-topic messages should return an empty list.
- When in doubt, return an empty list — it is better to miss a match than to produce a false positive.

Available departments:
${deptList}`;

  const historyTranscript = formatHistory(history, 3);
  const humanPrompt = historyTranscript
    ? `${historyTranscript}\nUSER: ${userMessage}`
    : `USER: ${userMessage}`;

  log.info(
    { userMessage, depts: departments.map((d) => d.name) },
    "Routing LLM call starting",
  );
  const t0 = Date.now();

  try {
    const llm = getLlmForRouting(tenant.llmApiKey ?? undefined);
    const structured = llm.withStructuredOutput(schema, { includeRaw: true });
    const { raw, parsed } = await structured.invoke([
      { role: "system", content: systemPrompt },
      { role: "human", content: humanPrompt },
    ]);

    const durationMs = Date.now() - t0;
    const usage = extractUsage(raw);

    // Defensive filter: only keep IDs that actually exist in our dept list,
    // and drop any match where the LLM produced no reason (empty reason = hallucinated match).
    const validIds = new Set(departments.map((d) => d.id));
    const matches: RoutingMatch[] = parsed.departments.filter((d) =>
      validIds.has(d.id) && d.reason.trim().length > 0,
    );

    const filtered = parsed.departments.length - matches.length;

    log.info(
      {
        durationMs,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        matched: matches.map((m) => ({
          id: m.id,
          name: departments.find((d) => d.id === m.id)?.name ?? "unknown",
          reason: m.reason,
        })),
        filteredHallucinations: filtered,
      },
      filtered > 0
        ? "Routing LLM call complete — hallucinated IDs dropped"
        : matches.length > 0
          ? "Routing LLM call complete — departments matched"
          : "Routing LLM call complete — no departments matched",
    );

    return matches;
  } catch (err) {
    const durationMs = Date.now() - t0;
    routingLog.warn({ err, tenant: tenant.slug, durationMs }, "Routing LLM call failed — skipping");
    return [];
  }
}

/**
 * Determines whether the assistant's response indicates the conversation
 * should be escalated to a human staff member.
 *
 * Uses the same LLM as `detectDepartments` (controlled by `ROUTING_MODEL`).
 * Includes the last 3 history turns for context so follow-up messages are
 * evaluated correctly.
 *
 * Never throws — returns `{ shouldEscalate: false, reason: "" }` on any error.
 *
 * @param tenant - Current tenant (for API key resolution).
 * @param userMessage - The current user message.
 * @param assistantAnswer - The assistant's response to evaluate.
 * @param history - Prior BaseMessage[] (last 3 turns used for context).
 * @returns Escalation decision and reason.
 */
export async function detectEscalation(
  tenant: Tenant,
  userMessage: string,
  assistantAnswer: string,
  history: BaseMessage[],
): Promise<EscalationResult> {
  const log = routingLog.child({ tenant: tenant.slug });

  const schema = z.object({
    shouldEscalate: z.boolean(),
    reason: z.string(),
  });

  const systemPrompt = `You are an escalation classifier for a civic chatbot.
Determine whether this conversation requires a human staff member to follow up
with the resident directly (e.g. phone call or email from the city).

Escalate ONLY if BOTH of these are true:
- The user has explicitly expressed that their issue is NOT resolved or they are
  dissatisfied with the answer they received.
- The assistant was unable to provide a satisfactory resolution — either because
  it lacks the necessary information, the issue is too complex, or the user has
  repeated their dissatisfaction after already receiving an answer.

Do NOT escalate for:
- Questions the assistant answered fully, even if the answer includes department
  contact details as supplemental context.
- First-time expressions of frustration that the assistant has not yet attempted
  to address.
- Greetings, clarifying questions, off-topic messages, or successful Q&A exchanges.
- Cases where the assistant provided step-by-step instructions or resolved the query.

Return shouldEscalate: true only when there is clear evidence the resident needs
a human to follow up because the AI could not resolve their concern.
When in doubt, return false.`;

  const historyTranscript = formatHistory(history, 3);
  const humanPrompt = [
    historyTranscript ? historyTranscript + "\n" : "",
    `USER: ${userMessage}`,
    `ASSISTANT: ${assistantAnswer}`,
  ]
    .filter(Boolean)
    .join("\n");

  const t0 = Date.now();

  try {
    const llm = getLlmForRouting(tenant.llmApiKey ?? undefined);
    const structured = llm.withStructuredOutput(schema, { includeRaw: true });
    const { raw, parsed } = await structured.invoke([
      { role: "system", content: systemPrompt },
      { role: "human", content: humanPrompt },
    ]);

    const durationMs = Date.now() - t0;
    const usage = extractUsage(raw);
    log.info(
      {
        durationMs,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        shouldEscalate: parsed.shouldEscalate,
        reason: parsed.reason,
      },
      parsed.shouldEscalate
        ? "Escalation detection complete — escalation triggered"
        : "Escalation detection complete — no escalation",
    );

    return parsed;
  } catch (err) {
    const durationMs = Date.now() - t0;
    log.warn({ err, durationMs }, "Escalation detection failed — skipping");
    return { shouldEscalate: false, reason: "" };
  }
}

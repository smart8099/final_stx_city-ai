/**
 * Custom Next.js server with WebSocket support.
 *
 * Next.js HTTP on PORT (default 3000).
 * WebSocket server on WS_PORT (default 3001) — separate server so Next.js
 * dev mode's internal upgrade handler never interferes.
 */
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer, type WebSocket } from "ws";
import { db } from "./server/db/index";
import { getRedis } from "./server/redis";
import { getTenantByApiKey } from "./server/services/tenant_service";
import { streamAgent } from "./server/agent/executor";
import { setCurrentTenant } from "./server/agent/tools/web_search";
import { SessionMemoryManager } from "./server/memory/session";
import { listDepartments } from "./server/services/department_service";
import {
  getOrCreateConversation,
  logMessage,
  updateConversationStatus,
  addRoutedDepartments,
} from "./server/services/conversation_service";
import { detectDepartments, detectEscalation } from "./server/agent/routing";
import { env } from "./server/config";
import { wsLog } from "./server/logger";

// ── Conversation status detection ─────────────────────────────────────────────

const RESOLVED_PATTERNS = /\b(thank(?:s| you)|got it|that(?:'s| is) helpful|perfect|awesome|great(?:,| )thanks|appreciate it|problem solved|that works|all set|no more questions)\b/i;

/**
 * Returns true if the user's message looks like a resolution acknowledgement.
 *
 * @param userMessage - The user's latest message.
 * @returns Whether the conversation appears resolved.
 */
function detectResolved(userMessage: string): boolean {
  return RESOLVED_PATTERNS.test(userMessage);
}

const dev = env.APP_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

interface WSFrame {
  type: string;
  [key: string]: unknown;
}

async function handleWebSocket(ws: WebSocket) {
  const redis = getRedis();
  const memManager = new SessionMemoryManager(redis);

  wsLog.info("Client connected");

  // Auth handshake (10s timeout)
  const rawAuth = await new Promise<string | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), 10_000);
    ws.once("message", (data) => {
      clearTimeout(timer);
      resolve(data.toString());
    });
  });

  if (!rawAuth) {
    wsLog.warn("Auth timeout — closing connection");
    ws.close(4001, "Auth timeout");
    return;
  }

  let authFrame: WSFrame;
  try { authFrame = JSON.parse(rawAuth) as WSFrame; }
  catch {
    wsLog.warn("Invalid auth frame — closing connection");
    ws.close(4001, "Invalid auth frame");
    return;
  }

  const apiKey = authFrame.api_key as string | undefined;
  const sessionId = (authFrame.session_id as string | undefined) ?? "";

  const tenant = apiKey ? await getTenantByApiKey(db, apiKey, redis) : null;
  if (!tenant || !tenant.isActive) {
    wsLog.warn({ apiKey: apiKey?.slice(0, 8) + "…" }, "Invalid API key — closing connection");
    ws.close(4001, "Invalid API key");
    return;
  }

  const log = wsLog.child({ tenant: tenant.slug, sessionId });
  log.info("Auth OK");

  ws.send(JSON.stringify({ type: "auth_ok" }));

  ws.on("close", (code, reason) => {
    log.info({ code, reason: reason.toString() }, "Client disconnected");
  });

  ws.on("message", async (data) => {
    let frame: WSFrame;
    try { frame = JSON.parse(data.toString()) as WSFrame; }
    catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }

    if (frame.type !== "message") return;
    const userMessage = ((frame.content as string) ?? "").trim();
    if (!userMessage) return;

    log.info({ userMessage }, "User message received");
    const t0 = Date.now();

    try {
      const history = await memManager.load(sessionId);
      const sessionIsNew = history.length === 0;
      const departments = await listDepartments(db, tenant.id, redis);

      await setCurrentTenant(tenant, async () => {
        let conv: Awaited<ReturnType<typeof getOrCreateConversation>> | null = null;

        let userMsgRowId: string | null = null;
        if (env.PERSIST_CHAT_MESSAGES) {
          conv = await getOrCreateConversation(db, tenant.id, sessionId, sessionIsNew);
          const userMsgRow = await logMessage(db, conv.id, "user", userMessage);
          userMsgRowId = userMsgRow.id;

          // Mark as open on first real message
          if (conv.status === "new") {
            await updateConversationStatus(db, conv.id, "open");
          }

          // Check if user is expressing gratitude → resolved
          if (detectResolved(userMessage)) {
            await updateConversationStatus(db, conv.id, "resolved");
            log.info("Conversation auto-marked as resolved");
          }
        }

        let finalAnswer = "";
        let finalSources: { title: string; url: string }[] = [];

        for await (const event of streamAgent(tenant, history, userMessage, departments)) {
          if (event.type === "token") {
            ws.send(JSON.stringify({ type: "token", token: event.token }));
          } else {
            finalAnswer = event.answer;
            finalSources = event.sources;
          }
        }

        if (env.PERSIST_CHAT_MESSAGES && conv) {
          const assistantMsgRow = await logMessage(db, conv.id, "assistant", finalAnswer);
          void assistantMsgRow; // consumed by routing block below

          // Routing + escalation — fire and forget, never blocks response
          void (async () => {
            try {
              const [matches, escalation] = await Promise.all([
                detectDepartments(tenant, departments, history, userMessage),
                detectEscalation(tenant, userMessage, finalAnswer, history),
              ]);
              if (matches.length > 0 && userMsgRowId) {
                await addRoutedDepartments(db, conv!.id, matches, userMsgRowId);
              }
              if (escalation.shouldEscalate) {
                await updateConversationStatus(db, conv!.id, "escalated", true);
                log.info({ reason: escalation.reason }, "Conversation auto-marked as escalated");
              }
            } catch (err) {
              log.warn({ err }, "Post-response classification failed — skipping");
            }
          })();
        }

        await memManager.save(sessionId, history, userMessage, finalAnswer);

        log.info(
          { durationMs: Date.now() - t0, sources: finalSources.length, answer: finalAnswer },
          "Response sent",
        );

        ws.send(JSON.stringify({ type: "done", sources: finalSources }));
      });
    } catch (err) {
      log.error({ err }, "Error handling message");
      ws.send(JSON.stringify({ type: "error", message: String(err) }));
    }
  });
}

app.prepare().then(() => {
  // ── Next.js HTTP server (port 3000) ──────────────────────────────────────
  const httpPort = parseInt(process.env.PORT ?? "3000", 10);
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    void handle(req, res, parsedUrl);
  });
  server.listen(httpPort, () => {
    console.log(`> CityAssist ready on http://localhost:${httpPort}`);
  });

  // ── WebSocket server (port 3001) — isolated from Next.js ─────────────────
  const wsPort = parseInt(process.env.WS_PORT ?? "3001", 10);
  const wsHttpServer = createServer();
  const wss = new WebSocketServer({ server: wsHttpServer });
  wss.on("connection", (ws) => { void handleWebSocket(ws); });
  wsHttpServer.listen(wsPort, () => {
    console.log(`> WebSocket ready on ws://localhost:${wsPort}`);
  });
});

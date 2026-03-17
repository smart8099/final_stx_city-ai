import { env } from "@/server/config";
import { onGroqResponse, rateLimitState } from "./groq_rate_limiter";
import { llmLog } from "@/server/logger";

// LRU-like cache: api_key → LLM instance (bounded at 64)
const _llmCache = new Map<string, ReturnType<typeof _createLlm>>();
const LLM_CACHE_MAX = 64;

function _createLlm(apiKey?: string) {
  const provider = env.LLM_PROVIDER;

  if (provider === "anthropic") {
    const { ChatAnthropic } = require("@langchain/anthropic");
    return new ChatAnthropic({
      model: env.LLM_MODEL,
      temperature: env.LLM_TEMPERATURE,
      maxTokens: env.LLM_MAX_TOKENS,
      anthropicApiKey: apiKey ?? env.ANTHROPIC_API_KEY,
    });
  }

  if (provider === "groq") {
    const { ChatGroq } = require("@langchain/groq");
    return new ChatGroq({
      model: env.LLM_MODEL,
      temperature: env.LLM_TEMPERATURE,
      maxTokens: env.LLM_MAX_TOKENS,
      apiKey: apiKey ?? env.GROQ_API_KEY,
      // Groq SDK uses custom fetch — we intercept via callbacks
      callbacks: [
        {
          handleLLMEnd: (_output: unknown, _runId: string, _parentRunId: string, tags: string[] | undefined) => {
            // Rate limit headers are captured at the HTTP layer; this is a no-op fallback
            void tags;
          },
        },
      ],
    });
  }

  throw new Error(`Unsupported LLM_PROVIDER: "${provider}". Supported: groq, anthropic`);
}

export function getLlm(apiKey?: string): ReturnType<typeof _createLlm> {
  const cacheKey = apiKey ?? "__default__";
  const cached = _llmCache.get(cacheKey);
  if (cached) return cached;

  const llm = _createLlm(apiKey);
  llmLog.info(
    { provider: env.LLM_PROVIDER, model: env.LLM_MODEL, cached: false },
    "LLM instance created",
  );

  if (_llmCache.size >= LLM_CACHE_MAX) {
    const firstKey = _llmCache.keys().next().value;
    if (firstKey !== undefined) _llmCache.delete(firstKey);
  }

  _llmCache.set(cacheKey, llm);
  return llm;
}

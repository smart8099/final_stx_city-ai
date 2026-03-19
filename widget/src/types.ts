/**
 * Shared TypeScript types for the CityAssist widget.
 *
 * These interfaces describe the data contracts between the widget and the
 * backend: tenant config, chat messages, WebSocket frames, and sources.
 */

/** Configuration returned by GET /tenants/{slug}/config */
export interface TenantConfig {
  slug: string;
  name: string;
  website_domain: string;
  api_key: string;
  /** Primary brand colour (hex, e.g. "#1a56db"). Defaults to blue. */
  brand_color?: string;
  /** Greeting shown on widget open. */
  greeting?: string;
  /** Display name override (from widget settings). */
  city_name?: string;
  /** Logo image URL. */
  logo_url?: string;
  /** Auto-open the widget on page load. */
  auto_open?: boolean;
  /** Widget position: "bottom-right" | "bottom-left" | "top-right" | "top-left". */
  position?: string;
}

/** A single message displayed in the chat UI. */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Streaming: true while tokens are still arriving. */
  streaming?: boolean;
}

/** Source link returned in the `done` frame. */
export interface Source {
  title: string;
  url: string;
}

/** WebSocket frames sent by the server. */
export type WSMessage =
  | { type: 'token'; token: string }
  | { type: 'done'; sources: Source[] }
  | { type: 'escalate'; department: { name: string; phone: string | null; email: string | null } }
  | { type: 'error'; message: string }
  | { type: 'auth_ok' };

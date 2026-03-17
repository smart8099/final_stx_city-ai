/**
 * Session ID management for the CityAssist widget.
 *
 * Persists a UUID v4 session ID in localStorage so conversations survive
 * page reloads.  Falls back to an in-memory ID when localStorage is
 * unavailable (private browsing, sandboxed iframes).
 */
const SESSION_KEY = 'cityassist_session_id';

/**
 * Returns the persisted session ID for this browser, or generates and stores
 * a new UUID v4 if none exists.
 */
export function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
  } catch {
    // localStorage unavailable (private browsing / iframe sandbox)
    return _generateId();
  }

  const id = _generateId();
  try {
    localStorage.setItem(SESSION_KEY, id);
  } catch {
    // Ignore write failures.
  }
  return id;
}

/**
 * Generates a UUID v4 using the Web Crypto API, with a legacy fallback.
 *
 * @returns A UUID v4 string.
 */
function _generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments.
  return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

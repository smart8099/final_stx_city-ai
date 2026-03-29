/**
 * CityAssist Widget — entry point.
 *
 * Embed via:
 *   <script src="https://api.cityassist.ai/static/widget.js"
 *           data-tenant="city-of-x"
 *           async></script>
 *
 * Optional data attributes:
 *   data-api-url  — Backend URL (default: https://api.cityassist.ai)
 *   data-ws-url   — WebSocket URL override
 */

import { CityAssistWidget } from './widget';

(function bootstrap() {
  // Find the <script> tag that loaded this bundle.
  const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-tenant]');
  if (scripts.length === 0) {
    console.warn('[CityAssist] No <script data-tenant="..."> tag found.');
    return;
  }

  // Use the last matching script tag.
  const scriptTag = scripts[scripts.length - 1];
  const tenantSlug = scriptTag.getAttribute('data-tenant');
  if (!tenantSlug) {
    console.warn('[CityAssist] data-tenant attribute is empty.');
    return;
  }

  const apiUrl =
    scriptTag.getAttribute('data-api-url') ?? 'https://api.cityassist.ai';
  const wsUrl = scriptTag.getAttribute('data-ws-url') || undefined;

  const widget = new CityAssistWidget({ tenantSlug, apiUrl, ...(wsUrl ? { wsUrl } : {}) });

  const run = () => {
    void widget.init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

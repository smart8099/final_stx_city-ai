import type { Source } from './types';

export interface ChatUIOptions {
  brandColor: string;
  cityName: string;
  logoUrl: string;
  greeting: string;
  autoOpen?: boolean;
  position?: string; // "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

const STYLES = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 15px;
    line-height: 1.5;
    color: #111827;
  }

  #launcher {
    position: fixed;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--ca-brand, #1a56db);
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease;
    z-index: 2147483647;
  }
  #launcher:hover { transform: scale(1.08); }
  #launcher svg { width: 26px; height: 26px; fill: #fff; }

  /* Position variants */
  :host([data-pos="bottom-right"]) #launcher { bottom: 24px; right: 24px; }
  :host([data-pos="bottom-left"])  #launcher { bottom: 24px; left: 24px; }
  :host([data-pos="top-right"])    #launcher { top: 24px; right: 24px; }
  :host([data-pos="top-left"])     #launcher { top: 24px; left: 24px; }

  #panel {
    position: fixed;
    width: 360px;
    max-height: 560px;
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.18);
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 2147483646;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  :host([data-pos="bottom-right"]) #panel { bottom: 92px; right: 24px; }
  :host([data-pos="bottom-left"])  #panel { bottom: 92px; left: 24px; }
  :host([data-pos="top-right"])    #panel { top: 92px; right: 24px; }
  :host([data-pos="top-left"])     #panel { top: 92px; left: 24px; }

  #panel.hidden { opacity: 0; pointer-events: none; transform: translateY(12px); }
  :host([data-pos="top-right"]) #panel.hidden,
  :host([data-pos="top-left"])  #panel.hidden { transform: translateY(-12px); }

  #header {
    padding: 12px 16px;
    background: var(--ca-brand, #1a56db);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  #header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  #header-logo {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    object-fit: contain;
    background: rgba(255,255,255,0.15);
  }
  #header-text {
    display: flex;
    flex-direction: column;
  }
  #header-title { font-weight: 600; font-size: 14px; line-height: 1.2; }
  #header-subtitle { font-size: 11px; opacity: 0.8; line-height: 1.2; }
  #header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  #close-btn {
    background: none; border: none; color: #fff; cursor: pointer;
    padding: 2px; line-height: 1;
    font-size: 14px; opacity: 0.6;
  }
  #close-btn:hover { opacity: 1; }

  #messages {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #f9fafb;
  }

  #greeting-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 16px 12px;
    color: #9ca3af;
  }
  #greeting-icon {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: #9ca3af;
    stroke-width: 2;
    margin-bottom: 8px;
  }
  #greeting-text {
    font-size: 12px;
    text-align: center;
    max-width: 220px;
    line-height: 1.5;
    color: #9ca3af;
  }

  .msg {
    max-width: 82%;
    padding: 8px 12px;
    border-radius: 12px;
    font-size: 13px;
    word-break: break-word;
    white-space: pre-wrap;
  }
  .msg.user {
    align-self: flex-end;
    background: var(--ca-brand, #1a56db);
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .msg.assistant {
    align-self: flex-start;
    background: #fff;
    color: #374151;
    border: 1px solid #e5e7eb;
    border-bottom-left-radius: 4px;
  }
  .msg.streaming::after {
    content: '\\258B';
    animation: blink 0.8s step-start infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }

  .sources {
    margin-top: 6px;
    font-size: 11px;
  }
  .sources a { color: var(--ca-brand, #1a56db); text-decoration: underline; display: block; }

  #input-row {
    display: flex;
    gap: 8px;
    padding: 10px 12px;
    border-top: 1px solid #e5e7eb;
    background: #fff;
    align-items: center;
  }
  #input {
    flex: 1;
    border: none;
    border-radius: 20px;
    padding: 8px 14px;
    font-size: 12px;
    outline: none;
    font-family: inherit;
    resize: none;
    max-height: 80px;
    background: #f3f4f6;
    color: #374151;
  }
  #input::placeholder { color: #9ca3af; }
  #input:focus { background: #f3f4f6; }
  #send-btn {
    width: 28px;
    height: 28px;
    min-width: 28px;
    background: var(--ca-brand, #1a56db);
    color: #fff;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    flex-shrink: 0;
  }
  #send-btn svg { width: 12px; height: 12px; fill: none; stroke: #fff; stroke-width: 2; }
  #send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const CHAT_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
</svg>`;

const MESSAGE_CIRCLE_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
</svg>`;

const SEND_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="22" y1="2" x2="11" y2="13"></line>
  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
</svg>`;

export class ChatUI {
  private shadow: ShadowRoot;
  private panel!: HTMLElement;
  private messagesContainer!: HTMLElement;
  private input!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;
  private isOpen = false;
  private currentStreamEl: HTMLElement | null = null;
  private onSend: ((text: string) => void) | null = null;
  private opts: ChatUIOptions;

  constructor(host: HTMLElement, opts: ChatUIOptions) {
    this.opts = opts;
    // Set position attribute on host for CSS :host() selectors
    const pos = opts.position || 'bottom-right';
    host.setAttribute('data-pos', pos);
    this.shadow = host.attachShadow({ mode: 'open' });
    this._build();
    if (opts.autoOpen) {
      this._open();
    }
  }

  setOnSend(handler: (text: string) => void): void {
    this.onSend = handler;
  }

  appendUserMessage(text: string): void {
    const el = this._msgEl('user');
    el.textContent = text;
    this.messagesContainer.appendChild(el);
    this._scrollToBottom();
  }

  startAssistantMessage(): void {
    const el = this._msgEl('assistant');
    el.classList.add('streaming');
    this.messagesContainer.appendChild(el);
    this.currentStreamEl = el;
    this._scrollToBottom();
  }

  appendToken(token: string): void {
    if (!this.currentStreamEl) this.startAssistantMessage();
    this.currentStreamEl!.textContent = (this.currentStreamEl!.textContent ?? '') + token;
    this._scrollToBottom();
  }

  finalizeMessage(sources: Source[]): void {
    if (this.currentStreamEl) {
      this.currentStreamEl.classList.remove('streaming');
      if (sources.length > 0) {
        const sourcesEl = document.createElement('div');
        sourcesEl.className = 'sources';
        sources.forEach((s) => {
          const a = document.createElement('a');
          a.href = s.url;
          a.textContent = s.title || s.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          sourcesEl.appendChild(a);
        });
        this.currentStreamEl.appendChild(sourcesEl);
      }
      this.currentStreamEl = null;
    }
    this.sendBtn.disabled = false;
    this.input.disabled = false;
    this.input.focus();
  }

  showError(message: string): void {
    const el = this._msgEl('assistant');
    el.textContent = `\u26A0\uFE0F ${message}`;
    el.style.color = '#dc2626';
    this.messagesContainer.appendChild(el);
    this.currentStreamEl = null;
    this.sendBtn.disabled = false;
    this.input.disabled = false;
    this._scrollToBottom();
  }

  private _build(): void {
    const style = document.createElement('style');
    style.textContent = STYLES;

    // Launcher button
    const launcher = document.createElement('button');
    launcher.id = 'launcher';
    launcher.innerHTML = CHAT_ICON;
    launcher.setAttribute('aria-label', `Open ${this.opts.cityName} chat assistant`);
    launcher.style.setProperty('--ca-brand', this.opts.brandColor);
    launcher.addEventListener('click', () => this._toggle());

    // Panel
    this.panel = document.createElement('div');
    this.panel.id = 'panel';
    this.panel.classList.add('hidden');
    this.panel.style.setProperty('--ca-brand', this.opts.brandColor);

    // Header — matches settings preview layout
    const header = document.createElement('div');
    header.id = 'header';

    const headerLeft = document.createElement('div');
    headerLeft.id = 'header-left';

    if (this.opts.logoUrl) {
      const logo = document.createElement('img');
      logo.id = 'header-logo';
      logo.src = this.opts.logoUrl;
      logo.alt = 'Logo';
      headerLeft.appendChild(logo);
    }

    const headerText = document.createElement('div');
    headerText.id = 'header-text';
    const title = document.createElement('span');
    title.id = 'header-title';
    title.textContent = this.opts.cityName;
    const subtitle = document.createElement('span');
    subtitle.id = 'header-subtitle';
    subtitle.textContent = 'Ask about city services';
    headerText.appendChild(title);
    headerText.appendChild(subtitle);
    headerLeft.appendChild(headerText);

    const headerRight = document.createElement('div');
    headerRight.id = 'header-right';
    const closeBtn = document.createElement('button');
    closeBtn.id = 'close-btn';
    closeBtn.textContent = '\u2715';
    closeBtn.setAttribute('aria-label', 'Close chat');
    closeBtn.addEventListener('click', () => this._close());
    headerRight.appendChild(closeBtn);

    header.appendChild(headerLeft);
    header.appendChild(headerRight);

    // Messages
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.id = 'messages';
    this.messagesContainer.setAttribute('role', 'log');
    this.messagesContainer.setAttribute('aria-live', 'polite');

    // Greeting area — centered with icon, matching settings preview
    const greetingArea = document.createElement('div');
    greetingArea.id = 'greeting-area';
    const greetingIcon = document.createElement('span');
    greetingIcon.innerHTML = MESSAGE_CIRCLE_ICON.replace('viewBox', 'id="greeting-icon" viewBox');
    const greetingText = document.createElement('div');
    greetingText.id = 'greeting-text';
    greetingText.textContent = this.opts.greeting;
    greetingArea.appendChild(greetingIcon);
    greetingArea.appendChild(greetingText);
    this.messagesContainer.appendChild(greetingArea);

    // Input row
    const inputRow = document.createElement('div');
    inputRow.id = 'input-row';

    this.input = document.createElement('textarea');
    this.input.id = 'input';
    this.input.placeholder = 'Type your question...';
    this.input.rows = 1;
    this.input.setAttribute('aria-label', 'Chat message');
    this.input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._submitInput();
      }
    });

    this.sendBtn = document.createElement('button');
    this.sendBtn.id = 'send-btn';
    this.sendBtn.innerHTML = SEND_ICON;
    this.sendBtn.setAttribute('aria-label', 'Send message');
    this.sendBtn.addEventListener('click', () => this._submitInput());

    inputRow.appendChild(this.input);
    inputRow.appendChild(this.sendBtn);

    this.panel.appendChild(header);
    this.panel.appendChild(this.messagesContainer);
    this.panel.appendChild(inputRow);

    this.shadow.appendChild(style);
    this.shadow.appendChild(launcher);
    this.shadow.appendChild(this.panel);
  }

  private _submitInput(): void {
    const text = this.input.value.trim();
    if (!text || this.sendBtn.disabled) return;
    this.input.value = '';
    this.sendBtn.disabled = true;
    this.input.disabled = true;
    this.onSend?.(text);
  }

  private _toggle(): void {
    if (this.isOpen) {
      this._close();
    } else {
      this._open();
    }
  }

  private _open(): void {
    this.isOpen = true;
    this.panel.classList.remove('hidden');
    this.input.focus();
  }

  private _close(): void {
    this.isOpen = false;
    this.panel.classList.add('hidden');
  }

  private _msgEl(role: 'user' | 'assistant'): HTMLElement {
    const el = document.createElement('div');
    el.className = `msg ${role}`;
    return el;
  }

  private _scrollToBottom(): void {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}

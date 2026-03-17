import type { Source } from './types';

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
    bottom: 24px;
    right: 24px;
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

  #panel {
    position: fixed;
    bottom: 92px;
    right: 24px;
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
  #panel.hidden { opacity: 0; pointer-events: none; transform: translateY(12px); }

  #header {
    padding: 14px 16px;
    background: var(--ca-brand, #1a56db);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  #header-title { font-weight: 600; font-size: 15px; }
  #close-btn {
    background: none; border: none; color: #fff; cursor: pointer;
    padding: 4px; border-radius: 4px; line-height: 1;
    font-size: 18px;
  }

  #messages {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .msg {
    max-width: 82%;
    padding: 9px 12px;
    border-radius: 12px;
    font-size: 14px;
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
    background: #f3f4f6;
    color: #111827;
    border-bottom-left-radius: 4px;
  }
  .msg.streaming::after {
    content: '▋';
    animation: blink 0.8s step-start infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }

  .sources {
    margin-top: 6px;
    font-size: 12px;
  }
  .sources a { color: var(--ca-brand, #1a56db); text-decoration: underline; display: block; }

  #input-row {
    display: flex;
    gap: 8px;
    padding: 10px 12px;
    border-top: 1px solid #e5e7eb;
  }
  #input {
    flex: 1;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 14px;
    outline: none;
    font-family: inherit;
    resize: none;
    max-height: 80px;
  }
  #input:focus { border-color: var(--ca-brand, #1a56db); }
  #send-btn {
    background: var(--ca-brand, #1a56db);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 14px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
  }
  #send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const CHAT_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
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
  private brandColor: string;
  private cityName: string;

  constructor(host: HTMLElement, brandColor: string, cityName: string) {
    this.brandColor = brandColor;
    this.cityName = cityName;
    this.shadow = host.attachShadow({ mode: 'open' });
    this._build();
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
    el.textContent = `⚠️ ${message}`;
    el.style.color = '#dc2626';
    this.messagesContainer.appendChild(el);
    this.currentStreamEl = null;
    this.sendBtn.disabled = false;
    this.input.disabled = false;
    this._scrollToBottom();
  }

  showGreeting(text: string): void {
    const el = this._msgEl('assistant');
    el.textContent = text;
    this.messagesContainer.appendChild(el);
  }

  private _build(): void {
    const style = document.createElement('style');
    style.textContent = STYLES;

    // Launcher button
    const launcher = document.createElement('button');
    launcher.id = 'launcher';
    launcher.innerHTML = CHAT_ICON;
    launcher.setAttribute('aria-label', `Open ${this.cityName} chat assistant`);
    launcher.style.setProperty('--ca-brand', this.brandColor);
    launcher.addEventListener('click', () => this._toggle());

    // Panel
    this.panel = document.createElement('div');
    this.panel.id = 'panel';
    this.panel.classList.add('hidden');
    this.panel.style.setProperty('--ca-brand', this.brandColor);

    // Header
    const header = document.createElement('div');
    header.id = 'header';
    const title = document.createElement('span');
    title.id = 'header-title';
    title.textContent = this.cityName;
    const closeBtn = document.createElement('button');
    closeBtn.id = 'close-btn';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Close chat');
    closeBtn.addEventListener('click', () => this._close());
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Messages
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.id = 'messages';
    this.messagesContainer.setAttribute('role', 'log');
    this.messagesContainer.setAttribute('aria-live', 'polite');

    // Input row
    const inputRow = document.createElement('div');
    inputRow.id = 'input-row';

    this.input = document.createElement('textarea');
    this.input.id = 'input';
    this.input.placeholder = 'Ask about city services…';
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
    this.sendBtn.textContent = 'Send';
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

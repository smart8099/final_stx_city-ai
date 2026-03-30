(function(){"use strict";const m=`
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
  .sources a { color: var(--ca-brand, #1a56db); text-decoration: underline; display: block; font-weight: 600; }
  .msg.assistant a { color: var(--ca-brand, #1a56db); text-decoration: underline; font-weight: 600; }
  .msg.assistant strong { font-weight: 700; }

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
`,f=`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
</svg>`,x=`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
</svg>`,b=`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="22" y1="2" x2="11" y2="13"></line>
  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
</svg>`;function y(o,t){const e=/\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(https?:\/\/\S+)/g;let n=0,s;for(;(s=e.exec(o))!==null;){if(s.index>n&&t.appendChild(document.createTextNode(o.slice(n,s.index))),s[1]!==void 0){const i=document.createElement("strong");i.textContent=s[1],t.appendChild(i)}else if(s[2]!==void 0){const i=document.createElement("a");i.href=s[3],i.textContent=s[2],i.target="_blank",i.rel="noopener noreferrer",t.appendChild(i)}else{const i=document.createElement("a");i.href=s[4],i.textContent=s[4],i.target="_blank",i.rel="noopener noreferrer",t.appendChild(i)}n=e.lastIndex}n<o.length&&t.appendChild(document.createTextNode(o.slice(n)))}function w(o){const t=document.createDocumentFragment(),e=o.split(`
`);for(let n=0;n<e.length;n++)n>0&&t.appendChild(document.createElement("br")),y(e[n],t);return t}class C{constructor(t,e){this.isOpen=!1,this.currentStreamEl=null,this.currentStreamText="",this.onSend=null,this.opts=e;const n=e.position||"bottom-right";t.setAttribute("data-pos",n),this.shadow=t.attachShadow({mode:"open"}),this._build(),e.autoOpen&&this._open()}setOnSend(t){this.onSend=t}appendUserMessage(t){const e=this._msgEl("user");e.textContent=t,this.messagesContainer.appendChild(e),this._scrollToBottom()}startAssistantMessage(){const t=this._msgEl("assistant");t.classList.add("streaming"),this.messagesContainer.appendChild(t),this.currentStreamEl=t,this.currentStreamText="",this._scrollToBottom()}appendToken(t){this.currentStreamEl||this.startAssistantMessage(),this.currentStreamText+=t,this.currentStreamEl.textContent=this.currentStreamText,this._scrollToBottom()}finalizeMessage(t){if(this.currentStreamEl){for(this.currentStreamEl.classList.remove("streaming");this.currentStreamEl.firstChild;)this.currentStreamEl.removeChild(this.currentStreamEl.firstChild);if(this.currentStreamEl.appendChild(w(this.currentStreamText)),this.currentStreamText="",t.length>0){const e=document.createElement("div");e.className="sources",t.forEach(n=>{const s=document.createElement("a");s.href=n.url,s.textContent=n.title||n.url,s.target="_blank",s.rel="noopener noreferrer",e.appendChild(s)}),this.currentStreamEl.appendChild(e)}this.currentStreamEl=null}this.sendBtn.disabled=!1,this.input.disabled=!1,this.input.focus()}showError(t){const e=this._msgEl("assistant");e.textContent=`⚠️ ${t}`,e.style.color="#dc2626",this.messagesContainer.appendChild(e),this.currentStreamEl=null,this.sendBtn.disabled=!1,this.input.disabled=!1,this._scrollToBottom()}_build(){const t=document.createElement("style");t.textContent=m;const e=document.createElement("button");e.id="launcher",e.innerHTML=f,e.setAttribute("aria-label",`Open ${this.opts.cityName} chat assistant`),e.style.setProperty("--ca-brand",this.opts.brandColor),e.addEventListener("click",()=>this._toggle()),this.panel=document.createElement("div"),this.panel.id="panel",this.panel.classList.add("hidden"),this.panel.style.setProperty("--ca-brand",this.opts.brandColor);const n=document.createElement("div");n.id="header";const s=document.createElement("div");if(s.id="header-left",this.opts.logoUrl){const a=document.createElement("img");a.id="header-logo",a.src=this.opts.logoUrl,a.alt="Logo",s.appendChild(a)}const i=document.createElement("div");i.id="header-text";const r=document.createElement("span");r.id="header-title",r.textContent=this.opts.cityName;const l=document.createElement("span");l.id="header-subtitle",l.textContent="Ask about city services",i.appendChild(r),i.appendChild(l),s.appendChild(i);const p=document.createElement("div");p.id="header-right";const d=document.createElement("button");d.id="close-btn",d.textContent="✕",d.setAttribute("aria-label","Close chat"),d.addEventListener("click",()=>this._close()),p.appendChild(d),n.appendChild(s),n.appendChild(p),this.messagesContainer=document.createElement("div"),this.messagesContainer.id="messages",this.messagesContainer.setAttribute("role","log"),this.messagesContainer.setAttribute("aria-live","polite");const h=document.createElement("div");h.id="greeting-area";const g=document.createElement("span");g.innerHTML=x.replace("viewBox",'id="greeting-icon" viewBox');const u=document.createElement("div");u.id="greeting-text",u.textContent=this.opts.greeting,h.appendChild(g),h.appendChild(u),this.messagesContainer.appendChild(h);const c=document.createElement("div");c.id="input-row",this.input=document.createElement("textarea"),this.input.id="input",this.input.placeholder="Type your question...",this.input.rows=1,this.input.setAttribute("aria-label","Chat message"),this.input.addEventListener("keydown",a=>{a.key==="Enter"&&!a.shiftKey&&(a.preventDefault(),this._submitInput())}),this.sendBtn=document.createElement("button"),this.sendBtn.id="send-btn",this.sendBtn.innerHTML=b,this.sendBtn.setAttribute("aria-label","Send message"),this.sendBtn.addEventListener("click",()=>this._submitInput()),c.appendChild(this.input),c.appendChild(this.sendBtn),this.panel.appendChild(n),this.panel.appendChild(this.messagesContainer),this.panel.appendChild(c),this.shadow.appendChild(t),this.shadow.appendChild(e),this.shadow.appendChild(this.panel)}_submitInput(){const t=this.input.value.trim();!t||this.sendBtn.disabled||(this.input.value="",this.sendBtn.disabled=!0,this.input.disabled=!0,this.onSend?.(t))}_toggle(){this.isOpen?this._close():this._open()}_open(){this.isOpen=!0,this.panel.classList.remove("hidden"),this.input.focus()}_close(){this.isOpen=!1,this.panel.classList.add("hidden")}_msgEl(t){const e=document.createElement("div");return e.className=`msg ${t}`,e}_scrollToBottom(){this.messagesContainer.scrollTop=this.messagesContainer.scrollHeight}}async function E(o,t){const e=`${o}/api/tenants/${encodeURIComponent(t)}`,n=await fetch(e);if(!n.ok)throw new Error(`Failed to load tenant config for "${t}": HTTP ${n.status}`);return n.json()}function v(){return k()}function k(){return typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():"xxxx-xxxx-4xxx-yxxx".replace(/[xy]/g,o=>{const t=Math.random()*16|0;return(o==="x"?t:t&3|8).toString(16)})}const S=1e3,_=3e4,T=6;class A{constructor(t){this.ws=null,this.reconnectAttempts=0,this.reconnectTimer=null,this.isAuthed=!1,this.messageQueue=[],this.destroyed=!1,this.options=t,this._connect()}send(t){const e=JSON.stringify({type:"message",content:t});this.isAuthed&&this.ws?.readyState===WebSocket.OPEN?this.ws.send(e):this.messageQueue.push(e)}destroy(){this.destroyed=!0,this.reconnectTimer!==null&&clearTimeout(this.reconnectTimer),this.ws?.close()}_connect(){this.destroyed||(this.ws=new WebSocket(this.options.wsUrl),this.isAuthed=!1,this.ws.onopen=()=>{this.reconnectAttempts=0,this.ws.send(JSON.stringify({type:"auth",api_key:this.options.apiKey,session_id:this.options.sessionId}))},this.ws.onmessage=t=>{let e;try{e=JSON.parse(t.data)}catch{return}if(e.type==="auth_ok"){for(this.isAuthed=!0,this.options.onReady?.();this.messageQueue.length>0;){const n=this.messageQueue.shift();n&&this.ws.send(n)}return}e.type==="token"?this.options.onToken(e.token):e.type==="done"?this.options.onDone(e.sources):e.type==="error"&&this.options.onError(e.message)},this.ws.onerror=()=>{},this.ws.onclose=t=>{if(!this.destroyed){if(t.code===4001){this.options.onError("Authentication failed. Check your API key.");return}this._scheduleReconnect()}})}_scheduleReconnect(){if(this.reconnectAttempts>=T){this.options.onError("Connection lost. Please refresh the page.");return}const t=Math.min(S*Math.pow(2,this.reconnectAttempts),_);this.reconnectAttempts++,this.reconnectTimer=setTimeout(()=>this._connect(),t)}}function B(o){return o.replace(/^http/,"ws")}class M{constructor(t){this.config=null,this.ui=null,this.wsClient=null,this.options=t,this.sessionId=v(),this.host=document.createElement("div"),this.host.id="cityassist-widget-host",document.body.appendChild(this.host)}async init(){try{this.config=await E(this.options.apiUrl,this.options.tenantSlug)}catch(r){console.error("[CityAssist] Failed to load tenant config:",r);return}const t=this.config.city_name||this.config.name,e=this.config.brand_color??"#1a56db",n=this.config.logo_url??"",s=this.config.greeting??"Hi! Ask me anything about city services.";this.ui=new C(this.host,{brandColor:e,cityName:t,logoUrl:n,greeting:s,autoOpen:this.config.auto_open??!1,position:this.config.position??"bottom-right"});const i=this.options.wsUrl??`${B(this.options.apiUrl)}/api/ws`;this.wsClient=new A({wsUrl:i,apiKey:this.config.api_key,sessionId:this.sessionId,onToken:r=>this.ui.appendToken(r),onDone:r=>this.ui.finalizeMessage(r),onError:r=>this.ui.showError(r),onReady:()=>{}}),this.ui.setOnSend(r=>{this.ui.appendUserMessage(r),this.ui.startAssistantMessage(),this.wsClient.send(r)})}destroy(){this.wsClient?.destroy(),this.host.remove()}}(function(){const t=document.querySelectorAll("script[data-tenant]");if(t.length===0){console.warn('[CityAssist] No <script data-tenant="..."> tag found.');return}const e=t[t.length-1],n=e.getAttribute("data-tenant");if(!n){console.warn("[CityAssist] data-tenant attribute is empty.");return}const s=e.getAttribute("data-api-url")??"https://api.cityassist.ai",i=e.getAttribute("data-ws-url")||void 0,r=new M({tenantSlug:n,apiUrl:s,...i?{wsUrl:i}:{}}),l=()=>{r.init()};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",l):l()})()})();

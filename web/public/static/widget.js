(function(){"use strict";const h=`
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
`,c=`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
</svg>`;class p{constructor(t,e,s){this.isOpen=!1,this.currentStreamEl=null,this.onSend=null,this.brandColor=e,this.cityName=s,this.shadow=t.attachShadow({mode:"open"}),this._build()}setOnSend(t){this.onSend=t}appendUserMessage(t){const e=this._msgEl("user");e.textContent=t,this.messagesContainer.appendChild(e),this._scrollToBottom()}startAssistantMessage(){const t=this._msgEl("assistant");t.classList.add("streaming"),this.messagesContainer.appendChild(t),this.currentStreamEl=t,this._scrollToBottom()}appendToken(t){this.currentStreamEl||this.startAssistantMessage(),this.currentStreamEl.textContent=(this.currentStreamEl.textContent??"")+t,this._scrollToBottom()}finalizeMessage(t){if(this.currentStreamEl){if(this.currentStreamEl.classList.remove("streaming"),t.length>0){const e=document.createElement("div");e.className="sources",t.forEach(s=>{const n=document.createElement("a");n.href=s.url,n.textContent=s.title||s.url,n.target="_blank",n.rel="noopener noreferrer",e.appendChild(n)}),this.currentStreamEl.appendChild(e)}this.currentStreamEl=null}this.sendBtn.disabled=!1,this.input.disabled=!1,this.input.focus()}showError(t){const e=this._msgEl("assistant");e.textContent=`⚠️ ${t}`,e.style.color="#dc2626",this.messagesContainer.appendChild(e),this.currentStreamEl=null,this.sendBtn.disabled=!1,this.input.disabled=!1,this._scrollToBottom()}showGreeting(t){const e=this._msgEl("assistant");e.textContent=t,this.messagesContainer.appendChild(e)}_build(){const t=document.createElement("style");t.textContent=h;const e=document.createElement("button");e.id="launcher",e.innerHTML=c,e.setAttribute("aria-label",`Open ${this.cityName} chat assistant`),e.style.setProperty("--ca-brand",this.brandColor),e.addEventListener("click",()=>this._toggle()),this.panel=document.createElement("div"),this.panel.id="panel",this.panel.classList.add("hidden"),this.panel.style.setProperty("--ca-brand",this.brandColor);const s=document.createElement("div");s.id="header";const n=document.createElement("span");n.id="header-title",n.textContent=this.cityName;const o=document.createElement("button");o.id="close-btn",o.textContent="✕",o.setAttribute("aria-label","Close chat"),o.addEventListener("click",()=>this._close()),s.appendChild(n),s.appendChild(o),this.messagesContainer=document.createElement("div"),this.messagesContainer.id="messages",this.messagesContainer.setAttribute("role","log"),this.messagesContainer.setAttribute("aria-live","polite");const r=document.createElement("div");r.id="input-row",this.input=document.createElement("textarea"),this.input.id="input",this.input.placeholder="Ask about city services…",this.input.rows=1,this.input.setAttribute("aria-label","Chat message"),this.input.addEventListener("keydown",a=>{a.key==="Enter"&&!a.shiftKey&&(a.preventDefault(),this._submitInput())}),this.sendBtn=document.createElement("button"),this.sendBtn.id="send-btn",this.sendBtn.textContent="Send",this.sendBtn.addEventListener("click",()=>this._submitInput()),r.appendChild(this.input),r.appendChild(this.sendBtn),this.panel.appendChild(s),this.panel.appendChild(this.messagesContainer),this.panel.appendChild(r),this.shadow.appendChild(t),this.shadow.appendChild(e),this.shadow.appendChild(this.panel)}_submitInput(){const t=this.input.value.trim();!t||this.sendBtn.disabled||(this.input.value="",this.sendBtn.disabled=!0,this.input.disabled=!0,this.onSend?.(t))}_toggle(){this.isOpen?this._close():this._open()}_open(){this.isOpen=!0,this.panel.classList.remove("hidden"),this.input.focus()}_close(){this.isOpen=!1,this.panel.classList.add("hidden")}_msgEl(t){const e=document.createElement("div");return e.className=`msg ${t}`,e}_scrollToBottom(){this.messagesContainer.scrollTop=this.messagesContainer.scrollHeight}}async function u(i,t){const e=`${i}/api/tenants/${encodeURIComponent(t)}`,s=await fetch(e);if(!s.ok)throw new Error(`Failed to load tenant config for "${t}": HTTP ${s.status}`);return s.json()}const d="cityassist_session_id";function m(){try{const t=localStorage.getItem(d);if(t)return t}catch{return l()}const i=l();try{localStorage.setItem(d,i)}catch{}return i}function l(){return typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():"xxxx-xxxx-4xxx-yxxx".replace(/[xy]/g,i=>{const t=Math.random()*16|0;return(i==="x"?t:t&3|8).toString(16)})}const f=1e3,g=3e4,x=6;class b{constructor(t){this.ws=null,this.reconnectAttempts=0,this.reconnectTimer=null,this.isAuthed=!1,this.messageQueue=[],this.destroyed=!1,this.options=t,this._connect()}send(t){const e=JSON.stringify({type:"message",content:t});this.isAuthed&&this.ws?.readyState===WebSocket.OPEN?this.ws.send(e):this.messageQueue.push(e)}destroy(){this.destroyed=!0,this.reconnectTimer!==null&&clearTimeout(this.reconnectTimer),this.ws?.close()}_connect(){this.destroyed||(this.ws=new WebSocket(this.options.wsUrl),this.isAuthed=!1,this.ws.onopen=()=>{this.reconnectAttempts=0,this.ws.send(JSON.stringify({type:"auth",api_key:this.options.apiKey,session_id:this.options.sessionId}))},this.ws.onmessage=t=>{let e;try{e=JSON.parse(t.data)}catch{return}if(e.type==="auth_ok"){for(this.isAuthed=!0,this.options.onReady?.();this.messageQueue.length>0;){const s=this.messageQueue.shift();s&&this.ws.send(s)}return}e.type==="token"?this.options.onToken(e.token):e.type==="done"?this.options.onDone(e.sources):e.type==="error"&&this.options.onError(e.message)},this.ws.onerror=()=>{},this.ws.onclose=t=>{if(!this.destroyed){if(t.code===4001){this.options.onError("Authentication failed. Check your API key.");return}this._scheduleReconnect()}})}_scheduleReconnect(){if(this.reconnectAttempts>=x){this.options.onError("Connection lost. Please refresh the page.");return}const t=Math.min(f*Math.pow(2,this.reconnectAttempts),g);this.reconnectAttempts++,this.reconnectTimer=setTimeout(()=>this._connect(),t)}}function y(i){return i.replace(/^http/,"ws")}class w{constructor(t){this.config=null,this.ui=null,this.wsClient=null,this.options=t,this.sessionId=m(),this.host=document.createElement("div"),this.host.id="cityassist-widget-host",document.body.appendChild(this.host)}async init(){try{this.config=await u(this.options.apiUrl,this.options.tenantSlug)}catch(n){console.error("[CityAssist] Failed to load tenant config:",n);return}const t=this.config.brand_color??"#1a56db";this.ui=new p(this.host,t,this.config.name);const e=this.config.greeting??`Hi! I'm the ${this.config.name} virtual assistant. How can I help you today?`;this.ui.showGreeting(e);const s=this.options.wsUrl??`${y(this.options.apiUrl)}/api/ws`;this.wsClient=new b({wsUrl:s,apiKey:this.config.api_key,sessionId:this.sessionId,onToken:n=>this.ui.appendToken(n),onDone:n=>this.ui.finalizeMessage(n),onError:n=>this.ui.showError(n),onReady:()=>{}}),this.ui.setOnSend(n=>{this.ui.appendUserMessage(n),this.ui.startAssistantMessage(),this.wsClient.send(n)})}destroy(){this.wsClient?.destroy(),this.host.remove()}}(function(){const t=document.querySelectorAll("script[data-tenant]");if(t.length===0){console.warn('[CityAssist] No <script data-tenant="..."> tag found.');return}const e=t[t.length-1],s=e.getAttribute("data-tenant");if(!s){console.warn("[CityAssist] data-tenant attribute is empty.");return}const n=e.getAttribute("data-api-url")??"https://api.cityassist.ai",o=e.getAttribute("data-ws-url")??"",r=new w({tenantSlug:s,apiUrl:n,wsUrl:o}),a=()=>{r.init()};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",a):a()})()})();

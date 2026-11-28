(() => {
  if (document.getElementById('eclipse-ai-chat')) return;

  const styles = document.createElement('style');
  styles.textContent = `
    #eclipse-ai-chat{--chat-bg:#11110f;--chat-panel:#1b1b18;--chat-text:#f3f0e9;--chat-muted:#aaa69d;--chat-gold:#c5b99e;font-family:Arial,Helvetica,sans-serif;color:var(--chat-text)}
    #eclipse-ai-chat *{box-sizing:border-box}
    #eclipse-ai-chat .chat-launcher{position:fixed;right:24px;bottom:24px;z-index:1000;min-height:52px;padding:0 20px;border:0;border-radius:999px;background:var(--chat-text);color:var(--chat-bg);cursor:pointer;font:700 13px Arial,sans-serif;box-shadow:0 6px 24px #0008}
    #eclipse-ai-chat .chat-panel{position:fixed;right:24px;bottom:88px;z-index:1000;display:flex;width:min(380px,calc(100vw - 32px));height:min(520px,calc(100dvh - 120px));flex-direction:column;overflow:hidden;border:1px solid #ffffff30;background:var(--chat-panel);box-shadow:0 12px 40px #0009}
    #eclipse-ai-chat .chat-panel[hidden]{display:none}
    #eclipse-ai-chat .chat-header{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #ffffff22}
    #eclipse-ai-chat .chat-header h2{margin:0;color:var(--chat-text);font-size:15px;letter-spacing:1px;text-transform:uppercase}
    #eclipse-ai-chat .chat-close{width:34px;height:34px;border:1px solid #ffffff33;background:transparent;color:var(--chat-text);cursor:pointer;font-size:20px}
    #eclipse-ai-chat .chat-messages{flex:1;overflow-y:auto;padding:16px}
    #eclipse-ai-chat .chat-message{max-width:90%;margin:0 0 12px;padding:11px 13px;background:#ffffff12;color:var(--chat-text);font-size:13px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
    #eclipse-ai-chat .chat-message.user{margin-left:auto;background:var(--chat-gold);color:var(--chat-bg)}
    #eclipse-ai-chat .chat-message.status{color:var(--chat-muted);font-style:italic}
    #eclipse-ai-chat .chat-form{display:flex;gap:8px;padding:12px;border-top:1px solid #ffffff22}
    #eclipse-ai-chat .chat-input{min-width:0;flex:1;padding:12px;border:1px solid #ffffff33;border-radius:0;background:var(--chat-bg);color:var(--chat-text);font:13px Arial,sans-serif}
    #eclipse-ai-chat .chat-send{padding:0 14px;border:0;background:var(--chat-text);color:var(--chat-bg);cursor:pointer;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase}
    #eclipse-ai-chat .chat-send:disabled{opacity:.5;cursor:not-allowed}
    @media(max-width:600px){#eclipse-ai-chat .chat-launcher{right:15px;bottom:15px}#eclipse-ai-chat .chat-panel{right:15px;bottom:76px}}
  `;

  const root = document.createElement('div');
  root.id = 'eclipse-ai-chat';
  root.innerHTML = `
    <section class="chat-panel" id="eclipse-chat-panel" role="dialog" aria-labelledby="eclipse-chat-title" hidden>
      <div class="chat-header"><h2 id="eclipse-chat-title">Ask Eclipse</h2><button class="chat-close" type="button" aria-label="Close chat">&times;</button></div>
      <div class="chat-messages" role="log" aria-live="polite"><div class="chat-message">Hi! Ask me about Eclipse, our collection, or an order estimate.</div></div>
      <form class="chat-form"><input class="chat-input" type="text" maxlength="1000" placeholder="Ask a question…" aria-label="Your question" required><button class="chat-send" type="submit">Send</button></form>
    </section>
    <button class="chat-launcher" type="button" aria-controls="eclipse-chat-panel" aria-expanded="false">Ask Eclipse</button>
  `;
  document.head.append(styles);
  document.body.append(root);

  const panel = root.querySelector('.chat-panel');
  const launcher = root.querySelector('.chat-launcher');
  const input = root.querySelector('.chat-input');
  const form = root.querySelector('.chat-form');
  const send = root.querySelector('.chat-send');
  const messages = root.querySelector('.chat-messages');
  const history = [];

  function addMessage(text, kind = '') {
    const item = document.createElement('div');
    item.className = `chat-message ${kind}`.trim();
    item.textContent = text;
    messages.append(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  function toggle(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) input.focus(); else launcher.focus();
  }

  launcher.addEventListener('click', () => toggle(true));
  root.querySelector('.chat-close').addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) toggle(false);
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question || send.disabled) return;

    addMessage(question, 'user');
    history.push({ role: 'user', content: question });
    input.value = '';
    send.disabled = true;
    const status = addMessage('Thinking…', 'status');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-12) })
      });
      if (!response.ok) throw new Error('Chat request failed');
      const data = await response.json();
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Invalid chat response');
      status.remove();
      addMessage(data.reply);
      history.push({ role: 'assistant', content: data.reply });
    } catch {
      status.remove();
      history.pop();
      addMessage('Sorry, chat is temporarily unavailable. Please try again later.', 'status');
    } finally {
      send.disabled = false;
      input.focus();
    }
  });
})();

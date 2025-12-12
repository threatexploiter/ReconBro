'use client';
import { useEffect, useRef, useState } from 'react';

export default function Page() {
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: 'Hey — I am your ReconBro. Ask me anything.' },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (from, text) => {
    setMessages((m) => [...m, { id: Date.now() + Math.random(), from, text }]);
  };

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    addMessage('user', text);
    setInput('');
    setIsSending(true);

    // Simple mock response (replace with real API call if you want)
    await new Promise((r) => setTimeout(r, 600));
    addMessage('bot', `Echo: ${text}`);
    setIsSending(false);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="cb-chat-wrap">
      <aside className="cb-sidebar">
        <h3>Assistant</h3>
        <p className="muted">Local demo UI — hook up your own backend if needed.</p>

        <div className="quick-prompts">
          <button onClick={() => setInput('How do I start with bug bounty?')}>Bug bounty tips</button>
          <button onClick={() => setInput('Explain CORS vulnerability.')}>CORS explanation</button>
          <button onClick={() => setInput('Show me a simple recon script in bash.')}>Recon script</button>
        </div>
      </aside>

      <section className="cb-chat-column">
        <div className="chat-header">
          <div>
            <div className="chat-title">ReconBro</div>
            <div className="muted small">Local / demo</div>
          </div>
          <div className="muted small">Model: demo</div>
        </div>

        <div className="messages" ref={scrollRef}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`msg-row ${m.from === 'user' ? 'msg-user' : 'msg-bot'}`}
            >
              <div className="msg-bubble">
                <div className="msg-text">{m.text}</div>
              </div>
            </div>
          ))}
        </div>

        <form className="composer" onSubmit={handleSend}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder="Type a message — Enter to send, Shift+Enter for newline"
          />
          <div className="composer-actions">
            <button type="button" onClick={() => setInput('')}>Clear</button>
            <button type="submit" disabled={isSending}>
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>

        <div className="tip muted small">Tip: replace mock response in <code>page.js</code> with your API call.</div>
      </section>
    </div>
  );
}

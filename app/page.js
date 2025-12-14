  'use client';
  import { useEffect, useRef, useState } from 'react';

  export default function Page() {
    const [messages, setMessages] = useState([
      { id: 1, from: 'bot', text: 'ReconBro Here' },
    ]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef(null);
    const clearChat = () => {
    setMessages([
      { id: 1, from: 'bot', text: 'ReconBro Reporting for duty' }
    ]);
  };
  async function fetchProgramAssets(programUrl) {
    const res = await fetch('/api/hackerone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programUrl })
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || 'failed');
    return j;
  }



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

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message: text })
      });
      const j = await res.json();
      if (!res.ok) {
        addMessage('bot', `Error: ${j.error || 'assistant failed'}`);
      } else {
    
        if (j.reply) addMessage('bot', j.reply);
        
        if (j.result) {
          let info = '';
          if (j.result.dir) info += `Folder: ${j.result.dir}\n`;
          if (j.result.files) info += `Files: ${Object.keys(j.result.files).filter(k => j.result.files[k]).join(', ')}\n`;
          if (j.result.warnings && j.result.warnings.length) info += `Warnings:\n- ${j.result.warnings.join('\n- ')}`;
          if (info) addMessage('bot', info);
        }
      }
    } catch (err) {
      addMessage('bot', `Network error: ${String(err)}`);
    } finally {
      setIsSending(false);
    }
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
              <p className="muted">Usage</p>

              <div className="quick-prompts">
        <button onClick={() => setInput('Do Recon on ')}>
          Do recon on 
        </button>
        <button className="danger-btn" onClick={clearChat}>
          Clear chat
        </button>
        <button
  onClick={() =>
    fetch("/api/recon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "hackerone" })
    },alert("RECON STARTED FOR HACKERONE"))
  }
>
▶ Start Recon (HackerOne)
</button>

<button
  onClick={() =>
    fetch("/api/recon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "other" })
    },alert("RECON STARTED FOR OTHER TARGETS"))
  }
>
▶ Start Recon (Other Targets)
</button>

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

          <div className="tip muted small">Only text responses,Doesn't support image creation.</div>
        </section>
      </div>
    );
  }

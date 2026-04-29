import React, { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";

export default function ChatPanel({ agent, onEmotionChange, onSend, messages = [], setMessages, sessionId, setSessionId, api }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    // welcome
    if (agent && messages.length === 0) {
      setMessages([
        { role: "agent", content: agent.personality?.welcome_message || `Hi — I'm ${agent.name}.`, emotion: "idle" },
      ]);
    }
  }, [agent]); // eslint-disable-line

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const suggestions = [
    "What do you do?",
    "Tell me more about you",
    "How much does it cost?",
    "Help me get started",
  ];

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setBusy(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    onEmotionChange && onEmotionChange("thinking");
    try {
      const res = await api.post(`/agents/${agent.agent_id}/chat`, { message: msg, session_id: sessionId });
      setSessionId(res.data.session_id);
      setMessages((m) => [...m, { role: "agent", content: res.data.reply, emotion: res.data.emotion }]);
      onEmotionChange && onEmotionChange(res.data.emotion);
      setTimeout(() => onEmotionChange && onEmotionChange("idle"), 2500);
      onSend && onSend();
    } catch (e) {
      setMessages((m) => [...m, { role: "agent", content: "Oops — I couldn't respond just now.", emotion: "idle" }]);
      onEmotionChange && onEmotionChange("idle");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bk-card h-full flex flex-col overflow-hidden" data-testid="chat-panel">
      <div className="px-5 py-4 border-b border-soft flex items-center justify-between">
        <div>
          <div className="text-xs bk-overline">Live chat</div>
          <div className="serif text-xl text-ink">{agent?.name}</div>
        </div>
        <div className="bk-chip bk-chip-secondary"><Sparkles className="w-3 h-3" /> AI</div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3" data-testid="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[#E26D5C] text-white rounded-tr-sm"
                  : "bg-surface-2 text-ink rounded-tl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-surface-2 rounded-2xl px-4 py-2.5 text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce [animation-delay:100ms]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce [animation-delay:200ms]"></span>
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="px-5 pb-3 pt-1 flex gap-2 flex-wrap">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => send(s)}
            data-testid={`chat-suggestion-${i}`}
            className="text-xs px-3 py-1.5 rounded-full border border-soft text-muted hover:bg-surface-2 hover:text-ink transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="border-t border-soft p-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          className="flex-1 bg-transparent outline-none px-3 py-2 text-sm"
          data-testid="chat-input"
        />
        <button type="submit" className="bk-btn-primary" data-testid="chat-send-btn" disabled={busy}>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { toast } from "sonner";
import {
  Send, Loader2, Bot, RotateCcw, Share2, Check,
  MessageSquare, ExternalLink, Heart, Copy as CopyIcon,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";

// ── Guest ID (persisted per browser) ─────────────────────────────────────────

function getOrCreateGuestId(): string {
  const key = "botless_guest_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function AgentAvatar({ url, name, size = "md" }: { url?: string; name: string; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "w-8 h-8 text-xs", md: "w-12 h-12 text-base", lg: "w-16 h-16 text-2xl" }[size];
  if (url) return <img src={url} alt={name} className={cn("rounded-full object-cover shrink-0", sz)} />;
  return (
    <div className={cn("rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0", sz)}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Speaking animation ────────────────────────────────────────────────────────

function SpeakingBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-[3px] bg-primary rounded-full"
          animate={active ? { height: ["4px", "16px", "4px"] } : { height: "4px" }}
          transition={active ? { duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" } : { duration: 0.2 }}
        />
      ))}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function Bubble({
  role, content, isStreaming, ts, agentAvatar, agentName,
}: {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  ts: number;
  agentAvatar?: string;
  agentName: string;
}) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {!isUser && <AgentAvatar url={agentAvatar} name={agentName} size="sm" />}
      <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser && "items-end")}>
        <div className={cn(
          "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
          isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-secondary text-foreground rounded-tl-sm"
        )}>
          {content || (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
            </span>
          )}
          {isStreaming && content && (
            <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse rounded-sm align-text-bottom" />
          )}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">{format(new Date(ts), "HH:mm")}</span>
      </div>
    </motion.div>
  );
}

// ── Share button ──────────────────────────────────────────────────────────────

function ShareButton({ agentId }: { agentId: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/agent/${agentId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleCopy} className="gap-2 cursor-pointer">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Share"}
    </Button>
  );
}

// ── Chat panel ────────────────────────────────────────────────────────────────

function ChatPanel({
  agent,
  guestId,
}: {
  agent: { _id: Id<"agents">; name: string; avatarUrl?: string; welcomeMessage?: string };
  guestId: string;
}) {
  const getOrCreate = useMutation(api.publicChat.sessions.getOrCreateSession);
  const sendUserMsg = useMutation(api.publicChat.sessions.sendUserMessage);
  const clearSession = useMutation(api.publicChat.sessions.clearSession);
  const callLLM = useAction(api.publicChat.llmAction.sendMessage);

  const [sessionId, setSessionId] = useState<Id<"publicChatSessions"> | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = useQuery(
    api.publicChat.sessions.listMessages,
    sessionId ? { sessionId, guestId } : "skip"
  );

  const isResponding = messages?.some((m) => m.role === "assistant" && m.isStreaming) ?? false;

  // Create session on mount
  useEffect(() => {
    let cancelled = false;
    getOrCreate({ agentId: agent._id, guestId }).then((id) => {
      if (!cancelled && id) setSessionId(id);
    });
    return () => { cancelled = true; };
  }, [agent._id, guestId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length, isResponding]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !sessionId) return;
    setInput("");
    setSending(true);
    try {
      const userMsgId = await sendUserMsg({ sessionId, guestId, content: text });
      if (userMsgId) {
        await callLLM({ sessionId, userMessageId: userMsgId, agentId: agent._id });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleClear = async () => {
    if (!sessionId) return;
    await clearSession({ sessionId, guestId });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  };

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {isResponding ? (
              <span className="flex items-center gap-2">Responding <SpeakingBars active /></span>
            ) : "Chat"}
          </span>
        </div>
        <button
          onClick={handleClear}
          title="Clear conversation"
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {messages === undefined ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn("flex gap-3", i % 2 ? "flex-row-reverse" : "")}>
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <Skeleton className="h-12 rounded-2xl flex-1" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center text-center py-8 gap-3">
            <AgentAvatar url={agent.avatarUrl} name={agent.name} size="lg" />
            <p className="text-base font-semibold text-foreground">{agent.name}</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {agent.welcomeMessage ?? `Hi! I'm ${agent.name}. How can I help you today?`}
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <Bubble
                  key={m._id}
                  role={m.role}
                  content={m.content}
                  isStreaming={m.isStreaming}
                  ts={m._creationTime}
                  agentAvatar={agent.avatarUrl}
                  agentName={agent.name}
                />
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex items-end gap-2 bg-secondary rounded-2xl px-4 py-3">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            className="border-0 bg-transparent p-0 min-h-[24px] max-h-[120px] resize-none focus-visible:ring-0 shadow-none text-sm"
            rows={1}
            disabled={sending}
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0 cursor-pointer"
            onClick={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-1.5">
          Shift+Enter for new line · Your session is saved locally
        </p>
      </div>
    </div>
  );
}

// ── Main share page ───────────────────────────────────────────────────────────

export default function AgentSharePage() {
  const { agentId } = useParams<{ agentId: string }>();
  const guestId = getOrCreateGuestId();

  const agent = useQuery(
    api.publicChat.agentInfo.getPublicAgentById,
    agentId ? { agentId: agentId as Id<"agents"> } : "skip"
  );

  if (agent === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent || agent.visibility !== "public") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Bot className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Agent not found</h1>
        <p className="text-muted-foreground">This agent doesn't exist or isn't publicly shared.</p>
        <Link to="/marketplace">
          <Button className="gap-2 cursor-pointer">
            <ExternalLink className="w-4 h-4" /> Browse Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-sidebar/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-foreground">Botless</span>
          </Link>
          <div className="flex items-center gap-2">
            <ShareButton agentId={agent._id} />
            <Link to="/marketplace">
              <Button size="sm" className="gap-2 cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5" /> Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left: agent profile card */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-6 text-center"
          >
            <div className="flex justify-center mb-4">
              <AgentAvatar url={agent.avatarUrl} name={agent.name} size="lg" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{agent.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">by {agent.ownerName}</p>
            {agent.tagline && (
              <p className="text-sm text-muted-foreground mt-3 italic">"{agent.tagline}"</p>
            )}
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {agent.agentType && (
                <Badge variant="secondary" className="text-xs">{agent.agentType}</Badge>
              )}
              {agent.industry && (
                <Badge variant="outline" className="text-xs">{agent.industry}</Badge>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{agent.likeCount ?? 0}</span>
              <span className="flex items-center gap-1"><CopyIcon className="w-3 h-3" />{agent.cloneCount ?? 0} clones</span>
            </div>
          </motion.div>

          {/* Description */}
          {agent.description && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">About</h3>
              <p className="text-sm text-foreground leading-relaxed">{agent.description}</p>
            </motion.div>
          )}

          {/* Tags */}
          {(agent.tags ?? []).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {(agent.tags ?? []).map((t) => (
                  <Badge key={t} variant="outline" className="text-xs text-primary/70 border-primary/20">{t}</Badge>
                ))}
              </div>
            </motion.div>
          )}

          {/* FAQs */}
          {agent.faqs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Sample Q&A</h3>
              <div className="space-y-3">
                {agent.faqs.slice(0, 4).map((faq) => (
                  <div key={faq._id} className="bg-secondary rounded-xl p-3">
                    <p className="text-xs font-medium text-foreground mb-1">Q: {faq.question}</p>
                    <p className="text-xs text-muted-foreground">A: {faq.answer}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: chat panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col"
          style={{ minHeight: 520 }}
        >
          <ChatPanel agent={agent} guestId={guestId} />
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Powered by{" "}
        <Link to="/" className="text-primary hover:underline cursor-pointer">Botless</Link>
        {" · "}
        <Link to="/marketplace" className="hover:underline cursor-pointer">Browse Marketplace</Link>
      </footer>
    </div>
  );
}

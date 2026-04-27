import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { motion, AnimatePresence } from "motion/react";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { Send, Loader2, RotateCcw, Bot } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";

// ── Guest ID ──────────────────────────────────────────────────────────────────

function getOrCreateGuestId(): string {
  const key = "botless_guest_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

function isValidConvexId(id: string): boolean {
  return /^[a-z0-9]{15,40}$/i.test(id);
}

// ── Speaking animation ────────────────────────────────────────────────────────

function SpeakingBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[2px] h-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-[2px] bg-primary rounded-full"
          animate={active ? { height: ["3px", "12px", "3px"] } : { height: "3px" }}
          transition={active ? { duration: 0.5, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" } : { duration: 0.2 }}
        />
      ))}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function AgentAvatar({ url, name, size = "sm" }: { url?: string; name: string; size?: "sm" | "xs" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-5 h-5 text-[8px]";
  if (url) return <img src={url} alt={name} className={cn("rounded-full object-cover shrink-0", sz)} />;
  return (
    <div className={cn("rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0", sz)}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function Bubble({
  role, content, isStreaming, ts, agentAvatar, agentName, compact,
}: {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  ts: number;
  agentAvatar?: string;
  agentName: string;
  compact: boolean;
}) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {!isUser && <AgentAvatar url={agentAvatar} name={agentName} size="sm" />}
      <div className={cn("flex flex-col gap-0.5 max-w-[85%]", isUser && "items-end")}>
        <div className={cn(
          "px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap break-words",
          compact ? "text-[11px]" : "text-xs",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-secondary text-foreground rounded-tl-sm"
        )}>
          {content || (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="w-2.5 h-2.5 animate-spin" /> Thinking…
            </span>
          )}
          {isStreaming && content && (
            <span className="inline-block w-1 h-3 bg-current ml-0.5 animate-pulse rounded-sm align-text-bottom" />
          )}
        </div>
        <span className="text-[9px] text-muted-foreground px-1">{format(new Date(ts), "HH:mm")}</span>
      </div>
    </motion.div>
  );
}

// ── Main embed widget ─────────────────────────────────────────────────────────

export default function EmbedPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [searchParams] = useSearchParams();
  const compact = searchParams.get("compact") === "true";
  const theme = searchParams.get("theme") ?? "dark";

  const validId = agentId && isValidConvexId(agentId);
  const guestId = getOrCreateGuestId();

  const getOrCreate = useMutation(api.publicChat.sessions.getOrCreateSession);
  const sendUserMsg = useMutation(api.publicChat.sessions.sendUserMessage);
  const clearSession = useMutation(api.publicChat.sessions.clearSession);
  const callLLM = useAction(api.publicChat.llmAction.sendMessage);

  const agent = useQuery(
    api.publicChat.agentInfo.getPublicAgentById,
    validId ? { agentId: agentId as Id<"agents"> } : "skip"
  );

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

  // Apply theme attribute on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [theme]);

  // Init session
  useEffect(() => {
    if (!validId || !agent || agent.visibility !== "public") return;
    let cancelled = false;
    getOrCreate({ agentId: agentId as Id<"agents">, guestId }).then((id) => {
      if (!cancelled && id) setSessionId(id);
    });
    return () => { cancelled = true; };
  }, [agent, agentId, guestId, validId]);

  // Scroll
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
        await callLLM({ sessionId, userMessageId: userMsgId, agentId: agentId as Id<"agents"> });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  };

  // Loading / not found states
  if (!validId) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-xs text-muted-foreground">Invalid agent ID.</p>
      </div>
    );
  }

  if (agent === undefined) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent || agent.visibility !== "public") {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4 text-center">
        <div className="space-y-2">
          <Bot className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">This agent is not publicly available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-sidebar/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <AgentAvatar url={agent.avatarUrl} name={agent.name} size="sm" />
          <div className="min-w-0">
            <p className={cn("font-semibold text-foreground truncate leading-tight", compact ? "text-xs" : "text-sm")}>
              {agent.name}
            </p>
            {!compact && agent.tagline && (
              <p className="text-[10px] text-muted-foreground truncate">{agent.tagline}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isResponding && <SpeakingBars active />}
          <button
            onClick={() => sessionId && clearSession({ sessionId, guestId })}
            title="Clear chat"
            className="w-6 h-6 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages === undefined || !sessionId ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className={cn("flex gap-2", i % 2 ? "flex-row-reverse" : "")}>
                <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                <Skeleton className="h-10 rounded-xl flex-1" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center text-center py-6 gap-2">
            <AgentAvatar url={agent.avatarUrl} name={agent.name} size="sm" />
            <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
              {agent.welcomeMessage ?? `Hi! I'm ${agent.name}. How can I help you today?`}
            </p>
          </div>
        ) : (
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
                compact={compact}
              />
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-border shrink-0">
        <div className="flex items-end gap-2 bg-secondary rounded-xl px-3 py-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="border-0 bg-transparent p-0 min-h-[20px] max-h-[80px] resize-none focus-visible:ring-0 shadow-none text-xs"
            rows={1}
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer",
              input.trim() && !sending
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[9px] text-center text-muted-foreground mt-1">
          Powered by <a href="/" target="_blank" rel="noreferrer" className="text-primary hover:underline">Botless</a>
        </p>
      </div>
    </div>
  );
}

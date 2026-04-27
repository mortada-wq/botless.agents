import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { toast } from "sonner";
import {
  Bot,
  Send,
  Trash2,
  MessageSquare,
  ChevronLeft,
  Loader2,
  Video,
  VideoOff,
  Plus,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";

// ── Agent avatar ──────────────────────────────────────────────────────────────

function AgentAvatar({
  avatarUrl,
  name,
  size = "md",
}: {
  avatarUrl?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl" };
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn("rounded-full object-cover shrink-0", sizeMap[size])}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0",
        sizeMap[size]
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Video avatar panel ────────────────────────────────────────────────────────

function VideoAvatarPanel({
  avatarUrl,
  agentName,
  isResponding,
}: {
  avatarUrl?: string;
  agentName: string;
  isResponding: boolean;
}) {
  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-secondary to-background border border-border flex items-center justify-center">
      {avatarUrl ? (
        <>
          <img
            src={avatarUrl}
            alt={agentName}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              isResponding && "brightness-110"
            )}
          />
          {/* Speaking animation overlay */}
          <AnimatePresence>
            {isResponding && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-end justify-center pb-4"
              >
                <div className="flex items-end gap-1 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-primary rounded-full"
                      animate={{ height: ["4px", "16px", "4px"] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div
              className={cn(
                "w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold transition-all",
                isResponding && "ring-4 ring-primary/40 ring-offset-2 ring-offset-background"
              )}
            >
              {agentName.charAt(0).toUpperCase()}
            </div>
            <AnimatePresence>
              {isResponding && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <div className="flex items-end gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-white rounded-full"
                        animate={{ height: ["2px", "8px", "2px"] }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.12,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className="text-sm text-muted-foreground">{agentName}</span>
        </div>
      )}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  agentAvatar,
  agentName,
}: {
  message: {
    _id: string;
    role: "user" | "assistant";
    content: string;
    isStreaming?: boolean;
    _creationTime: number;
  };
  agentAvatar?: string;
  agentName: string;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {!isUser && <AgentAvatar avatarUrl={agentAvatar} name={agentName} size="sm" />}
      <div className={cn("flex flex-col gap-1 max-w-[75%]", isUser && "items-end")}>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-secondary text-foreground rounded-tl-sm"
          )}
        >
          {message.content || (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Thinking…
            </span>
          )}
          {message.isStreaming && message.content && (
            <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse rounded-sm align-text-bottom" />
          )}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {format(new Date(message._creationTime), "HH:mm")}
        </span>
      </div>
    </motion.div>
  );
}

// ── Chat thread ───────────────────────────────────────────────────────────────

function ChatThread({
  sessionId,
  agent,
  onClear,
}: {
  sessionId: Id<"chatSessions">;
  agent: { _id: Id<"agents">; name: string; avatarUrl?: string; welcomeMessage?: string };
  onClear: () => void;
}) {
  const messages = useQuery(api.chat.messages.listMessages, { sessionId });
  const sendUserMessage = useMutation(api.chat.messages.sendUserMessage);
  const clearSession = useMutation(api.chat.messages.clearSession);
  const callLLM = useAction(api.chat.llmAction.sendMessage);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isResponding =
    messages?.some((m) => m.role === "assistant" && m.isStreaming) ?? false;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length, isResponding]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    try {
      const userMsgId = await sendUserMessage({ sessionId, content: text });
      await callLLM({ sessionId, userMessageId: userMsgId, agentId: agent._id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleClear = async () => {
    await clearSession({ sessionId });
    onClear();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <AgentAvatar avatarUrl={agent.avatarUrl} name={agent.name} size="sm" />
          <div>
            <p className="text-sm font-semibold text-foreground">{agent.name}</p>
            <p className="text-xs text-muted-foreground">
              {isResponding ? "Typing…" : "Online"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => setShowVideo((v) => !v)}
            title={showVideo ? "Hide video avatar" : "Show video avatar"}
          >
            {showVideo ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
            onClick={handleClear}
            title="Clear conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 px-4 py-4">
            {messages === undefined ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "" : "flex-row-reverse")}>
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <Skeleton className={cn("h-12 rounded-2xl", i % 2 === 0 ? "w-2/3" : "w-1/2")} />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <AgentAvatar avatarUrl={agent.avatarUrl} name={agent.name} size="lg" />
                <p className="mt-4 text-base font-semibold text-foreground">{agent.name}</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  {agent.welcomeMessage ?? `Hi! I'm ${agent.name}. How can I help you today?`}
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-2">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg._id}
                      message={msg}
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
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* Video avatar panel — right side on md+ */}
        <AnimatePresence>
          {showVideo && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="hidden lg:flex flex-col shrink-0 border-l border-border overflow-hidden"
            >
              <div className="p-3 space-y-3">
                <VideoAvatarPanel
                  avatarUrl={agent.avatarUrl}
                  agentName={agent.name}
                  isResponding={isResponding}
                />
                <p className="text-[11px] text-center text-muted-foreground">
                  {isResponding ? "Responding…" : "Ready"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Agent list sidebar ────────────────────────────────────────────────────────

function AgentSidebar({
  selectedAgentId,
  onSelect,
}: {
  selectedAgentId: Id<"agents"> | null;
  onSelect: (id: Id<"agents">) => void;
}) {
  const agents = useQuery(api.agents.listMyAgents);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Your Agents</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Select an agent to chat</p>
      </div>
      <ScrollArea className="flex-1">
        {agents === undefined ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="p-4">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Bot /></EmptyMedia>
                <EmptyTitle>No agents</EmptyTitle>
                <EmptyDescription>Create an agent first</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {agents.map((agent) => (
              <button
                key={agent._id}
                onClick={() => onSelect(agent._id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer",
                  selectedAgentId === agent._id
                    ? "bg-primary/15 text-primary"
                    : "hover:bg-secondary text-foreground"
                )}
              >
                <AgentAvatar avatarUrl={agent.avatarUrl} name={agent.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{agent.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{agent.agentType}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ── Chat session loader ───────────────────────────────────────────────────────

function ChatSessionLoader({
  agentId,
  agent,
}: {
  agentId: Id<"agents">;
  agent: { _id: Id<"agents">; name: string; avatarUrl?: string; welcomeMessage?: string };
}) {
  const getOrCreate = useMutation(api.chat.sessions.getOrCreateSession);
  const [sessionId, setSessionId] = useState<Id<"chatSessions"> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrCreate({ agentId }).then((id) => {
      if (!cancelled) setSessionId(id);
    });
    return () => { cancelled = true; };
  }, [agentId]);

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ChatThread
      sessionId={sessionId}
      agent={agent}
      onClear={() => {
        // Re-create session after clearing
        getOrCreate({ agentId }).then(setSessionId);
      }}
    />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const agents = useQuery(api.agents.listMyAgents);
  const [selectedAgentId, setSelectedAgentId] = useState<Id<"agents"> | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const selectedAgent = agents?.find((a) => a._id === selectedAgentId);

  // Auto-select first agent
  useEffect(() => {
    if (agents && agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0]._id);
    }
  }, [agents]);

  const handleSelectAgent = (id: Id<"agents">) => {
    setSelectedAgentId(id);
    setMobileShowChat(true);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] -m-6 overflow-hidden rounded-2xl border border-border bg-card">
      {/* Agent sidebar — always visible on md+ */}
      <div
        className={cn(
          "w-64 shrink-0 border-r border-border",
          mobileShowChat ? "hidden md:flex flex-col" : "flex flex-col w-full md:w-64"
        )}
      >
        <AgentSidebar selectedAgentId={selectedAgentId} onSelect={handleSelectAgent} />
      </div>

      {/* Chat area */}
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden",
          !mobileShowChat && "hidden md:flex"
        )}
      >
        {/* Mobile back button */}
        <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-border">
          <Button variant="ghost" size="sm" className="gap-1 cursor-pointer" onClick={() => setMobileShowChat(false)}>
            <ChevronLeft className="w-4 h-4" /> Agents
          </Button>
        </div>

        {selectedAgent ? (
          <ChatSessionLoader agentId={selectedAgent._id} agent={selectedAgent} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><MessageSquare /></EmptyMedia>
                <EmptyTitle>Select an agent</EmptyTitle>
                <EmptyDescription>Choose an agent from the left to start chatting</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}
      </div>
    </div>
  );
}

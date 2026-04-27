import { useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import {
  Search, Heart, Copy, MessageSquare, Bot, Filter,
  Star, ChevronDown, X, Sparkles, Globe, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

// ── Constants ─────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "All", "Technology", "Healthcare", "Finance", "Education",
  "Retail", "Legal", "Marketing", "HR", "Customer Support", "Other",
];

const AGENT_TYPES = [
  "All", "customer-support", "sales", "hr", "content", "analytics", "coding", "general",
];

const TYPE_LABELS: Record<string, string> = {
  "customer-support": "Customer Support",
  sales: "Sales",
  hr: "HR",
  content: "Content",
  analytics: "Analytics",
  coding: "Coding",
  general: "General",
};

// ── Agent avatar ──────────────────────────────────────────────────────────────

function AgentAvatar({ avatarUrl, name, size = "md" }: { avatarUrl?: string; name: string; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "w-8 h-8 text-xs", md: "w-12 h-12 text-base", lg: "w-20 h-20 text-2xl" };
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={cn("rounded-full object-cover shrink-0", sizeMap[size])} />;
  }
  return (
    <div className={cn("rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0", sizeMap[size])}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Agent card ────────────────────────────────────────────────────────────────

type PublicAgent = {
  _id: Id<"agents">;
  name: string;
  agentType: string;
  industry?: string;
  tagline?: string;
  description?: string;
  avatarUrl?: string;
  tags?: string[];
  likeCount?: number;
  cloneCount?: number;
  ownerName: string;
  ownerAvatar?: string;
  liked: boolean;
};

function AgentCard({ agent, onOpen }: { agent: PublicAgent; onOpen: (a: PublicAgent) => void }) {
  const toggleLike = useMutation(api.marketplace.toggleLike);
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const liked = optimisticLiked ?? agent.liked;
  const likeCount = (agent.likeCount ?? 0) + (optimisticLiked === true && !agent.liked ? 1 : optimisticLiked === false && agent.liked ? -1 : 0);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOptimisticLiked(!liked);
    try {
      await toggleLike({ agentId: agent._id });
    } catch {
      setOptimisticLiked(null);
      toast.error("Sign in to like agents");
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => onOpen(agent)}
      className="group rounded-2xl border border-border bg-card p-5 cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <AgentAvatar avatarUrl={agent.avatarUrl} name={agent.name} size="md" />
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{agent.name}</h3>
            <p className="text-xs text-muted-foreground">by {agent.ownerName}</p>
          </div>
        </div>
        <Authenticated>
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all cursor-pointer shrink-0",
              liked
                ? "bg-red-500/15 text-red-400"
                : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", liked && "fill-current")} />
            {likeCount}
          </button>
        </Authenticated>
      </div>

      {agent.tagline && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{agent.tagline}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        {agent.agentType && (
          <Badge variant="secondary" className="text-xs">
            {TYPE_LABELS[agent.agentType] ?? agent.agentType}
          </Badge>
        )}
        {agent.industry && agent.industry !== "Other" && (
          <Badge variant="outline" className="text-xs">{agent.industry}</Badge>
        )}
        {(agent.tags ?? []).slice(0, 2).map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs text-primary/70 border-primary/20">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Copy className="w-3 h-3" />{agent.cloneCount ?? 0} clones</span>
        </div>
        <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          View <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
}

// ── Agent detail dialog ───────────────────────────────────────────────────────

function AgentDetailDialog({
  agent,
  onClose,
}: {
  agent: PublicAgent | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const cloneAgent = useMutation(api.marketplace.cloneAgent);
  const detail = useQuery(
    api.marketplace.getPublicAgent,
    agent ? { agentId: agent._id } : "skip"
  );
  const [cloning, setCloning] = useState(false);

  const handleClone = async () => {
    if (!agent) return;
    setCloning(true);
    try {
      await cloneAgent({ agentId: agent._id });
      toast.success(`"${agent.name}" cloned to your agents!`);
      onClose();
      navigate("/dashboard/agents");
    } catch {
      toast.error("Sign in to clone agents");
    } finally {
      setCloning(false);
    }
  };

  const handleChat = () => {
    if (!agent) return;
    onClose();
    navigate("/dashboard/chat");
  };

  return (
    <Dialog open={!!agent} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
        {agent && (
          <>
            {/* Header */}
            <div className="p-6 border-b border-border shrink-0">
              <div className="flex items-start gap-4">
                <AgentAvatar avatarUrl={agent.avatarUrl} name={agent.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-xl font-bold">{agent.name}</DialogTitle>
                  <DialogDescription className="text-sm mt-0.5">
                    by {agent.ownerName}
                  </DialogDescription>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {agent.agentType && (
                      <Badge variant="secondary" className="text-xs">
                        {TYPE_LABELS[agent.agentType] ?? agent.agentType}
                      </Badge>
                    )}
                    {agent.industry && (
                      <Badge variant="outline" className="text-xs">{agent.industry}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" />{agent.likeCount ?? 0} likes</span>
                <span className="flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" />{agent.cloneCount ?? 0} clones</span>
              </div>
            </div>

            {/* Body */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-5">
                {agent.tagline && (
                  <p className="text-base font-medium text-foreground italic">"{agent.tagline}"</p>
                )}
                {agent.description && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">About</h4>
                    <p className="text-sm text-foreground leading-relaxed">{agent.description}</p>
                  </div>
                )}
                {(agent.tags ?? []).length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tags</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(agent.tags ?? []).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs text-primary/80 border-primary/25">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {/* FAQs */}
                {detail?.faqs && detail.faqs.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sample Q&A</h4>
                    <div className="space-y-3">
                      {detail.faqs.slice(0, 3).map((faq) => (
                        <div key={faq._id} className="bg-secondary rounded-xl p-3">
                          <p className="text-xs font-medium text-foreground mb-1">Q: {faq.question}</p>
                          <p className="text-xs text-muted-foreground">A: {faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-border shrink-0 flex gap-2">
              <Authenticated>
                <Button onClick={handleClone} disabled={cloning} className="flex-1 gap-2 cursor-pointer">
                  <Copy className="w-4 h-4" />
                  {cloning ? "Cloning…" : "Clone Agent"}
                </Button>
                <Button variant="secondary" onClick={handleChat} className="flex-1 gap-2 cursor-pointer">
                  <MessageSquare className="w-4 h-4" />
                  Chat Now
                </Button>
              </Authenticated>
              <Unauthenticated>
                <div className="flex-1">
                  <SignInButton className="w-full" />
                </div>
              </Unauthenticated>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main marketplace page ─────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("All");
  const [agentType, setAgentType] = useState("All");
  const [selectedAgent, setSelectedAgent] = useState<PublicAgent | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { results, status, loadMore } = usePaginatedQuery(
    api.marketplace.listPublicAgents,
    {
      industry: industry !== "All" ? industry : undefined,
      agentType: agentType !== "All" ? agentType : undefined,
      search: search.trim() || undefined,
    },
    { initialNumItems: 18 }
  );

  const hasFilters = industry !== "All" || agentType !== "All" || search.trim();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className="bg-gradient-to-b from-primary/8 to-transparent border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Agent Marketplace
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl font-bold text-foreground mb-3"
          >
            Discover AI Agents
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto mb-8"
          >
            Browse community-built agents, clone them instantly, and make them your own.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative max-w-lg mx-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents by name, description, or tags…"
              className="pl-11 pr-4 h-12 rounded-2xl bg-card border-border text-base"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all cursor-pointer",
              showFilters || hasFilters
                ? "border-primary/50 text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:border-border/80"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasFilters && (
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                {(industry !== "All" ? 1 : 0) + (agentType !== "All" ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Active filter chips */}
          {industry !== "All" && (
            <button
              onClick={() => setIndustry("All")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer"
            >
              {industry} <X className="w-3 h-3" />
            </button>
          )}
          {agentType !== "All" && (
            <button
              onClick={() => setAgentType("All")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer"
            >
              {TYPE_LABELS[agentType] ?? agentType} <X className="w-3 h-3" />
            </button>
          )}

          <span className="ml-auto text-sm text-muted-foreground">
            {status !== "LoadingFirstPage" && `${results.length}${status === "CanLoadMore" ? "+" : ""} agents`}
          </span>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Industry</p>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind}
                        onClick={() => setIndustry(ind)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer",
                          industry === ind
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Agent Type</p>
                  <div className="flex flex-wrap gap-2">
                    {AGENT_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setAgentType(t)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer",
                          agentType === t
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {t === "All" ? "All Types" : (TYPE_LABELS[t] ?? t)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        {status === "LoadingFirstPage" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Globe /></EmptyMedia>
              <EmptyTitle>No agents found</EmptyTitle>
              <EmptyDescription>
                {hasFilters
                  ? "Try adjusting your filters or search query"
                  : "Be the first to publish an agent to the marketplace!"}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {results.map((agent) => (
                  <AgentCard key={agent._id} agent={agent} onOpen={setSelectedAgent} />
                ))}
              </AnimatePresence>
            </div>
            {status === "CanLoadMore" && (
              <div className="flex justify-center mt-8">
                <Button variant="secondary" className="gap-2 cursor-pointer" onClick={() => loadMore(18)}>
                  <ChevronDown className="w-4 h-4" />
                  Load more agents
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail dialog */}
      <AgentDetailDialog agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
}

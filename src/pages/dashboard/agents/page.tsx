import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Plus, Bot, MoreVertical, Trash2, EyeOff, Globe } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
import { toast } from "sonner";
import { useState } from "react";
import { AGENT_TYPES, TONES } from "./_lib/agent-types.ts";
import { cn } from "@/lib/utils.ts";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

function AgentCard({ agent }: { agent: Doc<"agents"> }) {
  const deleteAgent = useMutation(api.agents.deleteAgent);
  const publishAgent = useMutation(api.marketplace.publishAgent);
  const unpublishAgent = useMutation(api.marketplace.unpublishAgent);
  const [menuOpen, setMenuOpen] = useState(false);

  const agentType = AGENT_TYPES.find((t) => t.id === agent.agentType);
  const tone = TONES.find((t) => t.id === agent.tone);
  const isPublic = agent.visibility === "public";

  const handleDelete = async () => {
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    try {
      await deleteAgent({ agentId: agent._id });
      toast.success("Agent deleted");
    } catch {
      toast.error("Failed to delete agent");
    }
  };

  const handleTogglePublish = async () => {
    try {
      if (isPublic) {
        await unpublishAgent({ agentId: agent._id });
        toast.success("Agent removed from marketplace");
      } else {
        await publishAgent({ agentId: agent._id });
        toast.success("Agent published to marketplace!");
      }
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-card border border-border rounded-2xl p-5 flex items-start gap-4 hover:border-border/60 transition-colors"
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
        {agent.avatarUrl ? (
          <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
        ) : (
          <Bot className="w-6 h-6 text-primary" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-bold text-foreground">{agent.name}</h3>
          <span className={cn(
            "text-[10px] font-medium px-2 py-0.5 rounded-full",
            agent.status === "active" ? "bg-green-500/15 text-green-400" : "bg-secondary text-muted-foreground"
          )}>
            {agent.status}
          </span>
          <span className={cn(
            "text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
            isPublic ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
          )}>
            {isPublic ? <><Globe className="w-2.5 h-2.5" /> Public</> : "Private"}
          </span>
        </div>
        {agent.tagline && <p className="text-sm text-muted-foreground mt-0.5">{agent.tagline}</p>}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {agentType && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {agentType.icon} {agentType.label}
            </span>
          )}
          {tone && (
            <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
              {tone.emoji} {tone.label}
            </span>
          )}
          {agent.industry && (
            <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
              {agent.industry}
            </span>
          )}
          {isPublic && (
            <span className="text-xs text-muted-foreground">
              {agent.likeCount ?? 0} likes · {agent.cloneCount ?? 0} clones
            </span>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1 rounded-lg hover:bg-secondary"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 z-20 bg-popover border border-border rounded-xl shadow-xl min-w-[180px] py-1 overflow-hidden">
              <button
                onClick={() => { void handleTogglePublish(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                {isPublic ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                {isPublic ? "Unpublish" : "Publish to Marketplace"}
              </button>
              <button
                onClick={() => { void handleDelete(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function AgentsPage() {
  const agents = useQuery(api.agents.listMyAgents);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Agents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and deploy your AI agents.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/marketplace">
            <Button variant="secondary" className="cursor-pointer gap-2">
              <Globe className="w-4 h-4" /> Marketplace
            </Button>
          </Link>
          <Link to="/dashboard/agents/new">
            <Button className="bg-primary hover:bg-primary/90 cursor-pointer gap-2">
              <Plus className="w-4 h-4" /> New Agent
            </Button>
          </Link>
        </div>
      </div>

      {agents === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Bot /></EmptyMedia>
            <EmptyTitle>No agents yet</EmptyTitle>
            <EmptyDescription>Build your first AI agent in minutes.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/dashboard/agents/new">
              <Button size="sm" className="bg-primary hover:bg-primary/90 cursor-pointer">
                <Plus className="w-4 h-4 mr-1.5" /> Create Agent
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <AgentCard key={agent._id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

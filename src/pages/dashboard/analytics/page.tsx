import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion } from "motion/react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Bot, MessageSquare, Wand2, Users, TrendingUp, Image, Film,
  CheckCircle, ChevronUp, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { format, parseISO } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────────

type AgentStat = {
  agentId: string;
  name: string;
  status: string;
  chatSessionCount: number;
  publicSessionCount: number;
  totalConversations: number;
  likeCount: number;
  cloneCount: number;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const WINDOW_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
];

function formatDate(iso: string, days: number) {
  const d = parseISO(iso);
  return days <= 7 ? format(d, "EEE") : format(d, "MMM d");
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
  delay?: number;
};

function StatCard({ label, value, icon: Icon, color, sub, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl px-4 py-3 text-xs shadow-lg">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-bold text-foreground ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Agent row ──────────────────────────────────────────────────────────────────

function AgentRow({ agent, rank }: { agent: AgentStat; rank: number }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{rank}</span>
      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{agent.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant={agent.status === "active" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
            {agent.status}
          </Badge>
          <span className="text-[11px] text-muted-foreground">{agent.publicSessionCount} public sessions</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground">{agent.totalConversations}</p>
        <p className="text-[11px] text-muted-foreground">chats</p>
      </div>
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-sm font-bold text-foreground">{agent.likeCount}</p>
        <p className="text-[11px] text-muted-foreground">likes</p>
      </div>
    </div>
  );
}

// ── Skeleton loaders ───────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4">
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const data = useQuery(api.analytics.getMyAnalytics, { days });

  const loading = data === undefined;

  // Prepare chart data with formatted labels
  const convData = (data?.conversationsByDay ?? []).map((d) => ({
    ...d,
    label: formatDate(d.date, days),
  }));
  const mediaData = (data?.mediaJobsByDay ?? []).map((d) => ({
    ...d,
    label: formatDate(d.date, days),
  }));

  const sortedAgents = [...(data?.agentStats ?? [])].sort((a, b) =>
    sortDir === "desc"
      ? b.totalConversations - a.totalConversations
      : a.totalConversations - b.totalConversations
  );

  // Check if any chart data has actual values
  const hasConvData = convData.some((d) => d.count > 0);
  const hasMediaData = mediaData.some((d) => d.count > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Track performance across your agents and media jobs.</p>
          </div>

          {/* Window selector */}
          <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 self-start sm:self-auto">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                  days === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Total Agents" value={data.agentCount} icon={Bot} color="#0A9396" delay={0} sub={`${data.activeAgentCount} active`} />
            <StatCard label="Conversations" value={data.totalConversations} icon={MessageSquare} color="#667eea" delay={0.05} sub={`${data.totalChatSessions} private · ${data.totalPublicSessions} public`} />
            <StatCard label="Media Jobs" value={data.totalMediaJobs} icon={Wand2} color="#f6ad55" delay={0.1} sub={`${data.completedMediaJobs} completed`} />
            <StatCard label="Public Reach" value={data.totalPublicSessions} icon={Users} color="#48bb78" delay={0.15} />
            <StatCard label="Images" value={data.imageJobCount} icon={Image} color="#76e4f7" delay={0.2} />
            <StatCard label="Videos" value={data.videoJobCount} icon={Film} color="#b794f4" delay={0.25} />
            <StatCard label="Success Rate" value={data.totalMediaJobs === 0 ? "—" : `${Math.round((data.completedMediaJobs / data.totalMediaJobs) * 100)}%`} icon={CheckCircle} color="#48bb78" delay={0.3} />
            <StatCard label="Active Agents" value={data.activeAgentCount} icon={Bot} color="#fc8181" delay={0.35} sub={`of ${data.agentCount} total`} />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Conversations — last {days} days
          </h2>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : !hasConvData ? (
            <div className="h-48 flex flex-col items-center justify-center text-center gap-2">
              <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No conversations yet in this period.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <AreaChart data={convData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="count" name="sessions" stroke="#667eea" strokeWidth={2} fill="url(#convGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Media jobs chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-primary" /> Media Jobs — last {days} days
          </h2>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : !hasMediaData ? (
            <div className="h-48 flex flex-col items-center justify-center text-center gap-2">
              <Wand2 className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No media jobs yet in this period.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <BarChart data={mediaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="mediaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f6ad55" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#f6ad55" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="jobs" fill="url(#mediaGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Per-agent table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" /> Agent Breakdown
          </h2>
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Sort {sortDir === "desc" ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-10" />
              </div>
            ))}
          </div>
        ) : sortedAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <Bot className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No agents yet. Create your first agent to see stats here.</p>
          </div>
        ) : (
          <div>
            {/* Header row */}
            <div className="flex items-center gap-4 pb-2 mb-1 border-b border-border text-[11px] text-muted-foreground font-medium">
              <span className="w-5 shrink-0" />
              <span className="w-8 shrink-0" />
              <span className="flex-1">Agent</span>
              <span className="w-12 text-right shrink-0">Chats</span>
              <span className="w-12 text-right shrink-0 hidden sm:block">Likes</span>
            </div>
            {sortedAgents.map((agent, i) => (
              <AgentRow key={agent.agentId} agent={agent} rank={i + 1} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

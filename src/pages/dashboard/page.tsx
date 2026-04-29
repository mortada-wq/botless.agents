import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion } from "motion/react";
import { Bot, Plus, Zap, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const user = useQuery(api.users.getCurrentUser);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-foreground">
          {user === undefined ? <Skeleton className="h-7 w-48" /> : `Hey, ${firstName} 👋`}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Here's what's happening with your agents today.</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <StatCard label="Active Agents" value={0} icon={Bot} color="#0a9396" />
        <StatCard label="Total Conversations" value={0} icon={Users} color="#667eea" />
        <StatCard label="AI Calls Today" value={0} icon={Zap} color="#48bb78" />
      </motion.div>

      {/* Empty state CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-10 flex flex-col items-center text-center gap-5"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Create your first agent</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Build a video AI agent in minutes. Pick a character, give it a personality, connect your knowledge base.
          </p>
        </div>
        <Link to="/dashboard/agents/new">
          <Button className="bg-primary hover:bg-primary/90 cursor-pointer gap-2">
            <Plus className="w-4 h-4" /> New Agent
          </Button>
        </Link>
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
          Browse marketplace <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>
    </div>
  );
}

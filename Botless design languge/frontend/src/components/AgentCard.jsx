import React from "react";
import { Link } from "react-router-dom";

export default function AgentCard({ agent, testId }) {
  const badge =
    agent.agent_type === "product" ? "bk-chip-primary" :
    agent.agent_type === "service" ? "bk-chip-secondary" :
    "bk-chip";
  const img = agent.visual?.image_url;
  return (
    <Link to={`/agents/${agent.agent_id}`} className="bk-card p-4 block group" data-testid={testId || `agent-card-${agent.agent_id}`}>
      <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-surface-2 mb-4 border border-soft">
        {img ? (
          <img src={img} alt={agent.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
        ) : (
          <div className="w-full h-full grid place-items-center serif text-5xl text-muted">{agent.name.slice(0,1)}</div>
        )}
        <span className={`absolute top-3 left-3 bk-chip ${badge}`} data-testid="agent-card-type">{agent.agent_type}</span>
        {agent.featured && <span className="absolute top-3 right-3 bk-chip bk-chip-primary">Featured</span>}
        <div className="absolute bottom-3 left-3 bk-chip bg-[var(--surface)]/90 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" /> Live
        </div>
      </div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="serif text-2xl leading-tight text-ink">{agent.name}</h3>
          <p className="text-sm text-muted line-clamp-2 mt-1">{agent.tagline}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span className="bk-overline">{agent.industry || "—"}</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-[var(--success)]" />
          {agent.conversations_count || 0} chats
        </span>
      </div>
    </Link>
  );
}

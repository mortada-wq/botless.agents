import { AGENT_TYPES, INDUSTRIES, type AgentFormData } from "../_lib/agent-types.ts";
import { cn } from "@/lib/utils.ts";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type Props = {
  data: AgentFormData;
  onChange: (updates: Partial<AgentFormData>) => void;
};

export default function StepType({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">What type of agent are you building?</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose the primary purpose of your AI agent.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AGENT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => onChange({ agentType: type.id })}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer",
              data.agentType === type.id
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary/40 hover:border-border/60 hover:bg-secondary/60"
            )}
          >
            <span className="text-2xl">{type.icon}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{type.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Industry */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Industry <span className="text-muted-foreground font-normal">(optional)</span></label>
        <div className="relative">
          <select
            value={data.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 appearance-none cursor-pointer"
          >
            <option value="">Select your industry...</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

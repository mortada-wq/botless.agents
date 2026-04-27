import { type AgentFormData, AGENT_TYPES, TONES } from "../_lib/agent-types.ts";
import { Bot, User, CheckCircle2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type Props = {
  data: AgentFormData;
  onGoToStep: (step: number) => void;
};

function ReviewRow({ label, value, onEdit, step, onGoToStep }: {
  label: string;
  value: string | undefined;
  onEdit?: boolean;
  step: number;
  onGoToStep: (step: number) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm mt-0.5", value ? "text-foreground" : "text-muted-foreground italic")}>{value || "Not set"}</p>
      </div>
      {onEdit !== false && (
        <button
          onClick={() => onGoToStep(step)}
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer mt-0.5"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default function StepReview({ data, onGoToStep }: Props) {
  const agentType = AGENT_TYPES.find((t) => t.id === data.agentType);
  const tone = TONES.find((t) => t.id === data.tone);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Review your agent</h2>
        <p className="text-sm text-muted-foreground mt-1">Everything looks good? Let's launch it.</p>
      </div>

      {/* Preview card */}
      <div className="bg-secondary/50 border border-border rounded-2xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
          {data.avatarUrl ? (
            <img src={data.avatarUrl} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <Bot className="w-8 h-8 text-primary" />
          )}
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">{data.name || "Unnamed Agent"}</h3>
          {data.tagline && <p className="text-sm text-muted-foreground">{data.tagline}</p>}
          <div className="flex items-center gap-2 mt-1.5">
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
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-card border border-border rounded-xl px-4">
        <ReviewRow label="Agent Type" value={agentType ? `${agentType.icon} ${agentType.label}` : undefined} step={0} onGoToStep={onGoToStep} />
        <ReviewRow label="Industry" value={data.industry} step={0} onGoToStep={onGoToStep} />
        <ReviewRow label="Agent Name" value={data.name} step={1} onGoToStep={onGoToStep} />
        <ReviewRow label="Tagline" value={data.tagline} step={1} onGoToStep={onGoToStep} />
        <ReviewRow label="Tone" value={tone ? `${tone.emoji} ${tone.label}` : undefined} step={2} onGoToStep={onGoToStep} />
        <ReviewRow label="Welcome Message" value={data.welcomeMessage} step={2} onGoToStep={onGoToStep} />
        <ReviewRow
          label="Knowledge Base"
          value={data.knowledgeText ? `${data.knowledgeText.slice(0, 80)}...` : undefined}
          step={3}
          onGoToStep={onGoToStep}
        />
      </div>

      {/* Ready banner */}
      <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
        <p className="text-sm text-green-300">Your agent is ready to go live. You can always edit it later from the dashboard.</p>
      </div>
    </div>
  );
}

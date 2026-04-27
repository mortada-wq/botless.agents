import { TONES, type AgentFormData } from "../_lib/agent-types.ts";
import { cn } from "@/lib/utils.ts";

type Props = {
  data: AgentFormData;
  onChange: (updates: Partial<AgentFormData>) => void;
};

export default function StepPersonality({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Define your agent's personality</h2>
        <p className="text-sm text-muted-foreground mt-1">This shapes how your agent talks and feels to users.</p>
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Tone of voice</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TONES.map((tone) => (
            <button
              key={tone.id}
              onClick={() => onChange({ tone: tone.id })}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
                data.tone === tone.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/40 hover:border-border/60"
              )}
            >
              <span className="text-xl">{tone.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{tone.label}</p>
                <p className="text-xs text-muted-foreground">{tone.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Welcome message */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Welcome message</label>
        <p className="text-xs text-muted-foreground">The first thing your agent says when a user opens a chat.</p>
        <textarea
          value={data.welcomeMessage}
          onChange={(e) => onChange({ welcomeMessage: e.target.value })}
          rows={3}
          placeholder="e.g. Hi! I'm Aurora, your personal beauty advisor. How can I help you today? ✨"
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors resize-none"
        />
      </div>

      {/* System instructions */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">System instructions <span className="text-muted-foreground font-normal">(optional)</span></label>
        <p className="text-xs text-muted-foreground">Advanced: tell your agent exactly how to behave, what to avoid, and its boundaries.</p>
        <textarea
          value={data.instructions}
          onChange={(e) => onChange({ instructions: e.target.value })}
          rows={4}
          placeholder="e.g. You are Aurora, a friendly beauty advisor for GlowSkin. Always recommend products from our catalog. Never give medical advice. Keep responses under 3 sentences."
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors resize-none"
        />
      </div>
    </div>
  );
}

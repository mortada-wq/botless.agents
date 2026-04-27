import { type AgentFormData } from "../_lib/agent-types.ts";
import { User, Upload } from "lucide-react";
import { useRef } from "react";

type Props = {
  data: AgentFormData;
  onChange: (updates: Partial<AgentFormData>) => void;
};

export default function StepIdentity({ data, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Give your agent an identity</h2>
        <p className="text-sm text-muted-foreground mt-1">Name it, describe it, and give it a face.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 rounded-2xl bg-secondary border border-border flex items-center justify-center overflow-hidden shrink-0">
          {data.avatarUrl ? (
            <img src={data.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1.5">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground hover:border-primary/50 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Upload avatar
          </button>
          <p className="text-xs text-muted-foreground">Or paste an image URL below</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                onChange({ avatarUrl: url });
              }
            }}
          />
        </div>
      </div>

      {/* Avatar URL */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Avatar URL <span className="text-muted-foreground font-normal">(optional)</span></label>
        <input
          value={data.avatarUrl}
          onChange={(e) => onChange({ avatarUrl: e.target.value })}
          placeholder="https://example.com/avatar.png"
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      {/* Agent name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Agent name <span className="text-destructive">*</span></label>
        <input
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Aurora, Max, Zara..."
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      {/* Tagline */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Tagline <span className="text-muted-foreground font-normal">(optional)</span></label>
        <input
          value={data.tagline}
          onChange={(e) => onChange({ tagline: e.target.value })}
          placeholder="e.g. Your 24/7 beauty advisor"
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          placeholder="Briefly describe what this agent does..."
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors resize-none"
        />
      </div>
    </div>
  );
}

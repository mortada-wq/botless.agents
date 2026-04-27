import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { toast } from "sonner";
import { Copy, Check, Code2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

type EmbedOptions = {
  theme: "dark" | "light";
  compact: boolean;
  width: string;
  height: string;
};

// ── Snippet generator ─────────────────────────────────────────────────────────

function buildEmbedUrl(agentId: string, opts: EmbedOptions) {
  const base = `${window.location.origin}/embed/${agentId}`;
  const params = new URLSearchParams();
  if (opts.theme !== "dark") params.set("theme", opts.theme);
  if (opts.compact) params.set("compact", "true");
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function buildSnippet(agentId: string, opts: EmbedOptions) {
  const src = buildEmbedUrl(agentId, opts);
  return `<iframe
  src="${src}"
  width="${opts.width}"
  height="${opts.height}"
  frameborder="0"
  allow="clipboard-write"
  style="border-radius:16px;border:1px solid rgba(255,255,255,0.08)"
  title="Chat with AI Agent"
></iframe>`;
}

// ── Option toggle ─────────────────────────────────────────────────────────────

function OptionBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────────

type Props = {
  agentId: Id<"agents">;
  agentName: string;
  open: boolean;
  onClose: () => void;
};

export default function EmbedDialog({ agentId, agentName, open, onClose }: Props) {
  const [opts, setOpts] = useState<EmbedOptions>({ theme: "dark", compact: false, width: "400", height: "600" });
  const [copied, setCopied] = useState(false);

  const snippet = buildSnippet(agentId, opts);
  const previewUrl = buildEmbedUrl(agentId, opts);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Embed code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const set = <K extends keyof EmbedOptions>(key: K, val: EmbedOptions[K]) =>
    setOpts((o) => ({ ...o, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            Embed Widget — <span className="text-muted-foreground font-normal">{agentName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Options */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Options</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Theme */}
              <div className="space-y-2">
                <p className="text-xs text-foreground font-medium">Theme</p>
                <div className="flex gap-1.5">
                  <OptionBtn active={opts.theme === "dark"} onClick={() => set("theme", "dark")}>Dark</OptionBtn>
                  <OptionBtn active={opts.theme === "light"} onClick={() => set("theme", "light")}>Light</OptionBtn>
                </div>
              </div>
              {/* Mode */}
              <div className="space-y-2">
                <p className="text-xs text-foreground font-medium">Mode</p>
                <div className="flex gap-1.5">
                  <OptionBtn active={!opts.compact} onClick={() => set("compact", false)}>Standard</OptionBtn>
                  <OptionBtn active={opts.compact} onClick={() => set("compact", true)}>Compact</OptionBtn>
                </div>
              </div>
              {/* Width */}
              <div className="space-y-2">
                <p className="text-xs text-foreground font-medium">Width (px)</p>
                <div className="flex gap-1.5 flex-wrap">
                  {["320", "400", "480", "100%"].map((w) => (
                    <OptionBtn key={w} active={opts.width === w} onClick={() => set("width", w)}>{w}</OptionBtn>
                  ))}
                </div>
              </div>
              {/* Height */}
              <div className="space-y-2">
                <p className="text-xs text-foreground font-medium">Height (px)</p>
                <div className="flex gap-1.5 flex-wrap">
                  {["480", "600", "700", "100vh"].map((h) => (
                    <OptionBtn key={h} active={opts.height === h} onClick={() => set("height", h)}>{h}</OptionBtn>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preview link */}
          <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-3">
            <span className="text-xs text-muted-foreground font-mono truncate flex-1">{previewUrl}</span>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              Preview <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Code block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">HTML Snippet</p>
              <Badge variant="secondary" className="text-[10px]">Copy &amp; paste anywhere</Badge>
            </div>
            <div className="relative">
              <pre className="bg-secondary rounded-xl px-4 py-4 text-[11px] text-foreground font-mono overflow-x-auto leading-relaxed whitespace-pre">
                {snippet}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] bg-background border border-border rounded-lg px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Note */}
          <p className="text-[11px] text-muted-foreground bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
            <strong className="text-foreground">Note:</strong> The agent must be set to <strong className="text-foreground">Public</strong> for the widget to work.
            Publish it from the Agents page before embedding.
          </p>

          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={onClose} className="cursor-pointer">Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

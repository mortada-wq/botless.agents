import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Save, Settings2, Sparkles, BookOpen, Code2, Zap, Wand2 } from "lucide-react";

const ICON_OPTS = [
  { v: "sparkles", Icon: Sparkles }, { v: "book", Icon: BookOpen },
  { v: "code", Icon: Code2 }, { v: "zap", Icon: Zap }, { v: "wand", Icon: Wand2 },
];

export default function LandingEditor() {
  const [cfg, setCfg] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/landing-config").then((r) => setCfg(r.data)); }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await api.put("/landing-config", cfg);
      setCfg(res.data);
      toast.success("Landing updated — refresh the home page to see it live");
    } catch {
      toast.error("Couldn't save");
    } finally { setSaving(false); }
  }

  function updateCard(idx, patch) {
    const cards = [...(cfg.cards || [])];
    cards[idx] = { ...cards[idx], ...patch };
    setCfg({ ...cfg, cards });
  }

  function addCard() {
    const cards = [...(cfg.cards || [])];
    cards.push({ id: `c_${Date.now()}`, icon: "sparkles", title: "New fact", body: "Describe this quality of your agent." });
    setCfg({ ...cfg, cards });
  }

  function removeCard(idx) {
    const cards = [...(cfg.cards || [])];
    cards.splice(idx, 1);
    setCfg({ ...cfg, cards });
  }

  function addTagline() {
    const taglines = [...(cfg.taglines || []), "new tagline."];
    setCfg({ ...cfg, taglines });
  }

  function removeTagline(idx) {
    const taglines = [...(cfg.taglines || [])];
    taglines.splice(idx, 1);
    setCfg({ ...cfg, taglines });
  }

  function updateTagline(idx, value) {
    const taglines = [...(cfg.taglines || [])];
    taglines[idx] = value;
    setCfg({ ...cfg, taglines });
  }

  if (!cfg) return null;

  return (
    <div className="bk-card p-6" data-testid="landing-editor">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between" data-testid="landing-editor-toggle">
        <div className="flex items-center gap-3">
          <Settings2 className="w-4 h-4 text-[#E26D5C]" />
          <div className="text-left">
            <div className="serif text-2xl text-ink">Landing page</div>
            <div className="text-xs text-muted">Edit what the world sees on the home page.</div>
          </div>
        </div>
        <span className="text-muted text-xs">{open ? "Collapse" : "Edit"}</span>
      </button>

      {open && (
        <div className="mt-6 space-y-6">
          {/* Headline */}
          <div className="grid md:grid-cols-3 gap-3">
            <Field label="Headline prefix">
              <input value={cfg.headline_prefix || ""} onChange={(e) => setCfg({ ...cfg, headline_prefix: e.target.value })} className="w-full border border-soft rounded-lg px-3 py-2 text-sm bk-field placeholder:text-muted" data-testid="le-h-prefix" />
            </Field>
            <Field label="Accent word(s)">
              <input value={cfg.headline_accent || ""} onChange={(e) => setCfg({ ...cfg, headline_accent: e.target.value })} className="w-full border border-soft rounded-lg px-3 py-2 text-sm bk-field placeholder:text-muted" data-testid="le-h-accent" />
            </Field>
            <Field label="Suffix">
              <input value={cfg.headline_suffix || ""} onChange={(e) => setCfg({ ...cfg, headline_suffix: e.target.value })} className="w-full border border-soft rounded-lg px-3 py-2 text-sm bk-field placeholder:text-muted" data-testid="le-h-suffix" />
            </Field>
          </div>
          <Field label="Subline">
            <input value={cfg.subline || ""} onChange={(e) => setCfg({ ...cfg, subline: e.target.value })} className="w-full border border-soft rounded-lg px-3 py-2 text-sm bk-field placeholder:text-muted" data-testid="le-subline" />
          </Field>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Prompt placeholder">
              <input value={cfg.prompt_placeholder || ""} onChange={(e) => setCfg({ ...cfg, prompt_placeholder: e.target.value })} className="w-full border border-soft rounded-lg px-3 py-2 text-sm bk-field placeholder:text-muted" data-testid="le-placeholder" />
            </Field>
            <Field label="CTA label">
              <input value={cfg.cta_label || ""} onChange={(e) => setCfg({ ...cfg, cta_label: e.target.value })} className="w-full border border-soft rounded-lg px-3 py-2 text-sm bk-field placeholder:text-muted" data-testid="le-cta" />
            </Field>
          </div>

          {/* Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="bk-overline">Card pool ({(cfg.cards || []).length}) · 4 visible, auto-rotating</div>
              <button onClick={addCard} className="text-xs bk-btn-ghost" data-testid="le-card-add">+ Add card</button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {(cfg.cards || []).map((c, i) => (
                <div key={c.id} className="border border-soft rounded-lg p-3 bg-surface-2 relative" data-testid={`le-card-${i}`}>
                  <button onClick={() => removeCard(i)} className="absolute top-2 right-2 text-xs text-muted hover:text-[#D34E4E]" data-testid={`le-card-del-${i}`}>×</button>
                  <div className="flex items-center gap-2 mb-2">
                    <select value={c.icon} onChange={(e) => updateCard(i, { icon: e.target.value })} className="text-xs border border-soft rounded px-2 py-1 bk-field" data-testid={`le-card-icon-${i}`}>
                      {ICON_OPTS.map((o) => <option key={o.v} value={o.v}>{o.v}</option>)}
                    </select>
                    <input value={c.title} onChange={(e) => updateCard(i, { title: e.target.value })} placeholder="Title" className="flex-1 border border-soft rounded px-2 py-1 text-sm bk-field placeholder:text-muted" data-testid={`le-card-title-${i}`} />
                  </div>
                  <textarea value={c.body} rows={2} onChange={(e) => updateCard(i, { body: e.target.value })} placeholder="Body" className="w-full border border-soft rounded px-2 py-1 text-xs bk-field placeholder:text-muted" data-testid={`le-card-body-${i}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Taglines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="bk-overline">Fun taglines (rotate every 2s)</div>
              <button onClick={addTagline} className="text-xs bk-btn-ghost" data-testid="le-tag-add">+ Add tagline</button>
            </div>
            <div className="grid md:grid-cols-3 gap-2">
              {(cfg.taglines || []).map((t, i) => (
                <div key={i} className="relative">
                  <input value={t} onChange={(e) => updateTagline(i, e.target.value)} className="w-full border border-soft rounded-lg px-3 py-2 text-sm bk-field placeholder:text-muted serif italic pr-8" data-testid={`le-tag-${i}`} />
                  <button onClick={() => removeTagline(i)} className="absolute top-1/2 -translate-y-1/2 right-2 text-xs text-muted hover:text-[#D34E4E]" data-testid={`le-tag-del-${i}`}>×</button>
                </div>
              ))}
            </div>
          </div>

          <button onClick={save} disabled={saving} className="bk-btn-primary" data-testid="le-save">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save landing"}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="bk-overline mb-1.5">{label}</div>
      {children}
    </div>
  );
}

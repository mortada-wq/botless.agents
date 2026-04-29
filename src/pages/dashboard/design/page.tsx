import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Palette, RotateCcw, Check, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import Logo, { type LogoVariant } from "@/components/logo.tsx";

const LOGO_STORAGE_KEY = "botless-logo-variant";

// ─── Default values (Stealth Hospital Design Language) ─────────────────────
const DEFAULTS = {
  // Core
  "--background": "#0A0A0B",
  "--foreground": "#F5F7FA",
  "--card": "#161B22",
  "--card-foreground": "#F5F7FA",
  "--popover": "#161B22",
  "--popover-foreground": "#F5F7FA",
  "--primary": "#0A9396",
  "--primary-foreground": "#ffffff",
  "--secondary": "#1C222C",
  "--secondary-foreground": "#F5F7FA",
  "--muted": "#232A36",
  "--muted-foreground": "#8A93A4",
  "--accent": "#0A9396",
  "--accent-foreground": "#ffffff",
  "--destructive": "#f87171",
  "--border": "rgba(255, 255, 255, 0.08)",
  "--input": "#232A36",
  "--ring": "#0A9396",
  // Charts
  "--chart-1": "#0A9396",
  "--chart-2": "#2BA697",
  "--chart-3": "#5E9DF2",
  "--chart-4": "#E8B341",
  "--chart-5": "#8A93A4",
  // Sidebar
  "--sidebar": "#0F1117",
  "--sidebar-foreground": "#F5F7FA",
  "--sidebar-primary": "#0A9396",
  "--sidebar-primary-foreground": "#ffffff",
  "--sidebar-accent": "#1C222C",
  "--sidebar-accent-foreground": "#F5F7FA",
  "--sidebar-border": "rgba(255, 255, 255, 0.08)",
  "--sidebar-ring": "#0A9396",
  // Gradients (stored as CSS background strings)
  "--gradient-hero": "radial-gradient(ellipse 80% 50% at 50% -20%, #0A939633, transparent)",
  "--gradient-card-glow": "radial-gradient(200px circle at 50% 0%, #0A939633, transparent)",
  "--gradient-grid-line": "#8A93A4",
} satisfies Record<string, string>;

type TokenKey = keyof typeof DEFAULTS;

const STORAGE_KEY = "botless-design-tokens";

// ─── Color groups for display ────────────────────────────────────────────────
const COLOR_GROUPS: { label: string; description: string; tokens: { key: TokenKey; label: string; isGradient?: boolean }[] }[] = [
  {
    label: "Core Colors",
    description: "Foundational palette used across the entire app",
    tokens: [
      { key: "--background", label: "Background" },
      { key: "--foreground", label: "Foreground (Text)" },
      { key: "--primary", label: "Primary / Brand" },
      { key: "--primary-foreground", label: "Primary Foreground" },
      { key: "--secondary", label: "Secondary" },
      { key: "--secondary-foreground", label: "Secondary Foreground" },
      { key: "--accent", label: "Accent" },
      { key: "--accent-foreground", label: "Accent Foreground" },
      { key: "--destructive", label: "Destructive / Error" },
    ],
  },
  {
    label: "Surface & UI",
    description: "Cards, popovers, inputs, borders, and focus rings",
    tokens: [
      { key: "--card", label: "Card Background" },
      { key: "--card-foreground", label: "Card Text" },
      { key: "--popover", label: "Popover Background" },
      { key: "--popover-foreground", label: "Popover Text" },
      { key: "--muted", label: "Muted Surface" },
      { key: "--muted-foreground", label: "Muted Text" },
      { key: "--border", label: "Border" },
      { key: "--input", label: "Input Background" },
      { key: "--ring", label: "Focus Ring" },
    ],
  },
  {
    label: "Sidebar",
    description: "Navigation sidebar specific colors",
    tokens: [
      { key: "--sidebar", label: "Sidebar Background" },
      { key: "--sidebar-foreground", label: "Sidebar Text" },
      { key: "--sidebar-primary", label: "Sidebar Primary" },
      { key: "--sidebar-primary-foreground", label: "Sidebar Primary Text" },
      { key: "--sidebar-accent", label: "Sidebar Accent" },
      { key: "--sidebar-accent-foreground", label: "Sidebar Accent Text" },
      { key: "--sidebar-border", label: "Sidebar Border" },
      { key: "--sidebar-ring", label: "Sidebar Ring" },
    ],
  },
  {
    label: "Charts",
    description: "Color palette used in analytics charts and graphs",
    tokens: [
      { key: "--chart-1", label: "Chart Color 1" },
      { key: "--chart-2", label: "Chart Color 2" },
      { key: "--chart-3", label: "Chart Color 3" },
      { key: "--chart-4", label: "Chart Color 4" },
      { key: "--chart-5", label: "Chart Color 5" },
    ],
  },
  {
    label: "Gradient Backgrounds",
    description: "Atmospheric gradients used in hero sections and card glows",
    tokens: [
      { key: "--gradient-hero", label: "Hero Background Gradient", isGradient: true },
      { key: "--gradient-card-glow", label: "Agent Card Glow Color", isGradient: true },
      { key: "--gradient-grid-line", label: "Background Grid Line Color" },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function loadTokens(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function applyTokens(tokens: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(tokens).forEach(([key, value]) => {
    // Gradient tokens are not CSS variables but used in inline styles — skip for now.
    if (!key.startsWith("--gradient-") && key !== "--gradient-grid-line") {
      root.style.setProperty(key, value);
    }
  });
}

// ─── Color Swatch Component ──────────────────────────────────────────────────
function ColorToken({
  tokenKey,
  label,
  value,
  isGradient,
  isDirty,
  onChange,
}: {
  tokenKey: string;
  label: string;
  value: string;
  isGradient?: boolean;
  isDirty: boolean;
  onChange: (key: string, val: string) => void;
}) {
  // For gradient values we show a preview swatch + a text input
  const isSimpleColor = !isGradient;

  return (
    <div className="flex items-center gap-3 py-2.5 group">
      {/* Swatch / preview */}
      <div className="relative shrink-0">
        {isSimpleColor ? (
          <label className="cursor-pointer">
            <div
              className="w-8 h-8 rounded-lg border border-border shadow-sm transition-transform group-hover:scale-110"
              style={{ backgroundColor: value }}
            />
            <input
              type="color"
              value={value.startsWith("#") ? value : "#0A9396"}
              onChange={(e) => onChange(tokenKey, e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>
        ) : (
          <div
            className="w-8 h-8 rounded-lg border border-border shadow-sm"
            style={{ background: value }}
          />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{label}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">{tokenKey}</p>
      </div>

      {/* Value input */}
      {isSimpleColor ? (
        <div className="flex items-center gap-1.5">
          {isDirty && <div className="w-1.5 h-1.5 rounded-full bg-primary" title="Modified" />}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(tokenKey, e.target.value)}
            className="w-28 text-xs font-mono bg-input border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            spellCheck={false}
          />
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          {isDirty && <div className="w-1.5 h-1.5 rounded-full bg-primary" title="Modified" />}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(tokenKey, e.target.value)}
            className="w-64 text-xs font-mono bg-input border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}

// ─── Preview Badge ───────────────────────────────────────────────────────────
function LivePreview({ tokens }: { tokens: Record<string, string> }) {
  return (
    <div
      className="rounded-2xl border border-border overflow-hidden"
      style={{ background: tokens["--background"] }}
    >
      {/* Mini sidebar */}
      <div className="flex h-40">
        <div
          className="w-24 flex flex-col gap-1 p-2 border-r"
          style={{ background: tokens["--sidebar"], borderColor: tokens["--sidebar-border"] }}
        >
          {["Home", "Agents", "Chat"].map((item, i) => (
            <div
              key={item}
              className="px-2 py-1 rounded-md text-[9px] font-medium"
              style={
                i === 0
                  ? { background: tokens["--primary"] + "22", color: tokens["--primary"] }
                  : { color: tokens["--sidebar-foreground"] + "88" }
              }
            >
              {item}
            </div>
          ))}
        </div>
        {/* Main area */}
        <div className="flex-1 p-3 flex flex-col gap-2">
          <div
            className="rounded-lg p-2 flex items-center gap-2"
            style={{ background: tokens["--card"] }}
          >
            <div
              className="w-5 h-5 rounded-md"
              style={{ background: tokens["--primary"] }}
            />
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-16 rounded" style={{ background: tokens["--foreground"] + "40" }} />
              <div className="h-1 w-10 rounded" style={{ background: tokens["--muted-foreground"] + "60" }} />
            </div>
          </div>
          <div className="flex gap-1.5">
            {["--chart-1", "--chart-2", "--chart-3"].map((k) => (
              <div key={k} className="flex-1 h-6 rounded-md" style={{ background: tokens[k] + "cc" }} />
            ))}
          </div>
          <div
            className="h-1 w-full rounded-full"
            style={{ background: tokens["--border"] }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DesignLanguagePage() {
  const [tokens, setTokens] = useState<Record<string, string>>(loadTokens);
  const [saved, setSaved] = useState<Record<string, string>>(loadTokens);
  const [showPreview, setShowPreview] = useState(true);
  const [logoVariant, setLogoVariant] = useState<LogoVariant>(
    () => (localStorage.getItem(LOGO_STORAGE_KEY) as LogoVariant | null) ?? "silver"
  );

  // Apply on mount
  useEffect(() => {
    applyTokens(tokens);
  }, []);

  // Apply live as user changes values
  const handleChange = useCallback((key: string, value: string) => {
    setTokens((prev) => {
      const next = { ...prev, [key]: value };
      applyTokens(next);
      return next;
    });
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    localStorage.setItem(LOGO_STORAGE_KEY, logoVariant);
    setSaved({ ...tokens });
    applyTokens(tokens);
    toast.success("Design language saved", { description: "Your color customizations are now active." });
  };

  const handleReset = () => {
    const defaults = { ...DEFAULTS };
    setTokens(defaults);
    applyTokens(defaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    localStorage.setItem(LOGO_STORAGE_KEY, "silver");
    setSaved(defaults);
    setLogoVariant("silver");
    toast.info("Reset to defaults", { description: "All colors have been restored to the default theme." });
  };

  const dirtyCount = Object.keys(tokens).filter(
    (k) => tokens[k] !== DEFAULTS[k as TokenKey]
  ).length;

  const hasPendingChanges = Object.keys(tokens).some((k) => tokens[k] !== saved[k]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Design Language</h1>
            {dirtyCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {dirtyCount} customized
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Customize every color token in the app. Changes apply live as you edit.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
            className="gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            className="gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasPendingChanges}
            className="gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </motion.div>

      {/* Live Preview */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm">Live Preview</CardTitle>
              </div>
              <CardDescription>See how your color choices look in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <LivePreview tokens={tokens} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Logo Variant */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Logo Style</CardTitle>
            <CardDescription>Choose the gradient color variant for the wordmark logo</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-4">
              {(["silver", "teal", "blue"] as LogoVariant[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setLogoVariant(v)}
                  className={cn(
                    "flex flex-col items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all cursor-pointer",
                    logoVariant === v
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-muted-foreground/40"
                  )}
                >
                  <div className="bg-[#111] rounded-lg px-4 py-3">
                    <Logo height={28} variant={v} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground capitalize">{v}</span>
                  {logoVariant === v && (
                    <span className="text-xs text-primary font-semibold">Active</span>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Color groups */}
      {COLOR_GROUPS.map((group, gi) => (
        <motion.div
          key={group.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: gi * 0.06 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{group.label}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border/50">
                {group.tokens.map((t) => (
                  <ColorToken
                    key={t.key}
                    tokenKey={t.key}
                    label={t.label}
                    value={tokens[t.key] ?? DEFAULTS[t.key]}
                    isGradient={t.isGradient}
                    isDirty={tokens[t.key] !== DEFAULTS[t.key]}
                    onChange={handleChange}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Bottom action bar */}
      {hasPendingChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 flex items-center justify-between bg-card border border-border rounded-2xl px-5 py-3 shadow-xl shadow-black/30"
        >
          <p className="text-sm text-muted-foreground">You have unsaved changes</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset} className="cursor-pointer">
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-2 cursor-pointer">
              <Check className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

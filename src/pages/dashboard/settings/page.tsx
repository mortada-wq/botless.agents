import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion } from "motion/react";
import { toast } from "sonner";
import { MessageSquare, Image, Video, ChevronDown, ChevronUp, ExternalLink, Key, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import {
  CHAT_PROVIDERS, IMAGE_PROVIDERS, VIDEO_PROVIDERS,
  type Provider, type ProviderCategory,
} from "./_lib/providers.ts";

type SettingsState = {
  chatProvider: string;
  chatModel: string;
  chatApiKey: string;
  imageProvider: string;
  imageModel: string;
  imageApiKey: string;
  videoProvider: string;
  videoModel: string;
  videoApiKey: string;
  siliconflowApiKey: string;
};

const DEFAULTS: SettingsState = {
  chatProvider: "openai",
  chatModel: "",
  chatApiKey: "",
  imageProvider: "siliconflow",
  imageModel: "",
  imageApiKey: "",
  videoProvider: "siliconflow",
  videoModel: "",
  videoApiKey: "",
  siliconflowApiKey: "",
};

type SectionProps = {
  category: ProviderCategory;
  icon: React.ElementType;
  label: string;
  description: string;
  providers: Provider[];
  selectedProvider: string;
  selectedModel: string;
  apiKey: string;
  siliconflowApiKey: string;
  onProviderChange: (id: string) => void;
  onModelChange: (id: string) => void;
  onApiKeyChange: (key: string) => void;
  onSiliconflowKeyChange: (key: string) => void;
};

function ProviderSection({
  category, icon: Icon, label, description, providers,
  selectedProvider, selectedModel, apiKey, siliconflowApiKey,
  onProviderChange, onModelChange, onApiKeyChange, onSiliconflowKeyChange,
}: SectionProps) {
  const [expanded, setExpanded] = useState(true);
  const active = providers.find((p) => p.id === selectedProvider) ?? providers[0];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-secondary/30 transition-colors cursor-pointer text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{label}</h3>
            <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
              {active.logo} {active.name}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-5 border-t border-border pt-5">
          {/* Provider cards */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Provider</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onProviderChange(p.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all cursor-pointer",
                    selectedProvider === p.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/40 hover:border-border/60 hover:bg-secondary/60"
                  )}
                >
                  {p.badge && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-primary text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                      {p.badge}
                    </span>
                  )}
                  <span className="text-2xl">{p.logo}</span>
                  <span className="text-xs font-medium text-foreground leading-tight">{p.name}</span>
                  {selectedProvider === p.id && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Model selector */}
          {active.models && active.models.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Model</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {active.models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onModelChange(m.id)}
                    className={cn(
                      "flex items-start gap-2 p-3 rounded-xl border text-left transition-all cursor-pointer",
                      selectedModel === m.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/40 hover:border-border/60"
                    )}
                  >
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">{m.label}</p>
                      {m.desc && <p className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</p>}
                    </div>
                    {selectedModel === m.id && <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* API Key */}
          {active.usesSharedSiliconflow ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> SiliconFlow API Key (shared)
                </p>
                {active.apiKeyLink && (
                  <a href={active.apiKeyLink} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer">
                    Get key <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="password"
                value={siliconflowApiKey}
                onChange={(e) => onSiliconflowKeyChange(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                This key is shared across all SiliconFlow services (chat, image, video).
              </p>
            </div>
          ) : active.apiKeyLabel ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> {active.apiKeyLabel}
                </p>
                {active.apiKeyLink && (
                  <a href={active.apiKeyLink} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer">
                    Get key <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="Paste your API key..."
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors font-mono"
              />
              {active.apiKeyHint && (
                <p className="text-[11px] text-muted-foreground mt-1.5">{active.apiKeyHint}</p>
              )}
            </div>
          ) : active.apiKeyHint ? (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <Check className="w-4 h-4 text-green-400 shrink-0" />
              <p className="text-sm text-green-300">{active.apiKeyHint}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const savedSettings = useQuery(api.providerSettings.getProviderSettings);
  const upsert = useMutation(api.providerSettings.upsertProviderSettings);

  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sync from DB when loaded
  useEffect(() => {
    if (savedSettings) {
      setSettings({
        chatProvider: savedSettings.chatProvider ?? DEFAULTS.chatProvider,
        chatModel: ("chatModel" in savedSettings ? savedSettings.chatModel : undefined) ?? "",
        chatApiKey: ("chatApiKey" in savedSettings ? savedSettings.chatApiKey : undefined) ?? "",
        imageProvider: savedSettings.imageProvider ?? DEFAULTS.imageProvider,
        imageModel: ("imageModel" in savedSettings ? savedSettings.imageModel : undefined) ?? "",
        imageApiKey: ("imageApiKey" in savedSettings ? savedSettings.imageApiKey : undefined) ?? "",
        videoProvider: savedSettings.videoProvider ?? DEFAULTS.videoProvider,
        videoModel: ("videoModel" in savedSettings ? savedSettings.videoModel : undefined) ?? "",
        videoApiKey: ("videoApiKey" in savedSettings ? savedSettings.videoApiKey : undefined) ?? "",
        siliconflowApiKey: ("siliconflowApiKey" in savedSettings ? savedSettings.siliconflowApiKey : undefined) ?? "",
      });
      setDirty(false);
    }
  }, [savedSettings]);

  const update = (field: keyof SettingsState) => (value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsert({
        chatProvider: settings.chatProvider,
        chatModel: settings.chatModel || undefined,
        chatApiKey: settings.chatApiKey || undefined,
        imageProvider: settings.imageProvider,
        imageModel: settings.imageModel || undefined,
        imageApiKey: settings.imageApiKey || undefined,
        videoProvider: settings.videoProvider,
        videoModel: settings.videoModel || undefined,
        videoApiKey: settings.videoApiKey || undefined,
        siliconflowApiKey: settings.siliconflowApiKey || undefined,
      });
      toast.success("Settings saved!");
      setDirty(false);
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Provider Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Choose which AI provider powers each capability.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={cn("gap-2 cursor-pointer", dirty ? "bg-primary hover:bg-primary/90" : "bg-secondary text-muted-foreground")}
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : dirty ? "Save Changes" : "Saved"}
        </Button>
      </motion.div>

      {savedSettings === undefined ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Chat/LLM */}
          <ProviderSection
            category="chat"
            icon={MessageSquare}
            label="Chat & Language Model"
            description="Powers your agent's conversations and intelligence."
            providers={CHAT_PROVIDERS}
            selectedProvider={settings.chatProvider}
            selectedModel={settings.chatModel}
            apiKey={settings.chatApiKey}
            siliconflowApiKey={settings.siliconflowApiKey}
            onProviderChange={(id) => {
              update("chatProvider")(id);
              // Auto-select first model
              const p = CHAT_PROVIDERS.find((p) => p.id === id);
              if (p?.models?.[0]) update("chatModel")(p.models[0].id);
            }}
            onModelChange={update("chatModel")}
            onApiKeyChange={update("chatApiKey")}
            onSiliconflowKeyChange={update("siliconflowApiKey")}
          />

          {/* Image */}
          <ProviderSection
            category="image"
            icon={Image}
            label="Image Generation"
            description="Generates avatar images and visual content."
            providers={IMAGE_PROVIDERS}
            selectedProvider={settings.imageProvider}
            selectedModel={settings.imageModel}
            apiKey={settings.imageApiKey}
            siliconflowApiKey={settings.siliconflowApiKey}
            onProviderChange={(id) => {
              update("imageProvider")(id);
              const p = IMAGE_PROVIDERS.find((p) => p.id === id);
              if (p?.models?.[0]) update("imageModel")(p.models[0].id);
            }}
            onModelChange={update("imageModel")}
            onApiKeyChange={update("imageApiKey")}
            onSiliconflowKeyChange={update("siliconflowApiKey")}
          />

          {/* Video */}
          <ProviderSection
            category="video"
            icon={Video}
            label="Video Generation"
            description="Animates your agent avatars into video characters."
            providers={VIDEO_PROVIDERS}
            selectedProvider={settings.videoProvider}
            selectedModel={settings.videoModel}
            apiKey={settings.videoApiKey}
            siliconflowApiKey={settings.siliconflowApiKey}
            onProviderChange={(id) => {
              update("videoProvider")(id);
              const p = VIDEO_PROVIDERS.find((p) => p.id === id);
              if (p?.models?.[0]) update("videoModel")(p.models[0].id);
            }}
            onModelChange={update("videoModel")}
            onApiKeyChange={update("videoApiKey")}
            onSiliconflowKeyChange={update("siliconflowApiKey")}
          />
        </motion.div>
      )}

      {/* Info banner */}
      <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Security note:</strong> API keys are stored encrypted in your private database. They are never shared with other users or exposed in the frontend.
      </div>
    </div>
  );
}

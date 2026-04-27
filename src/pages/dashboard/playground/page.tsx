import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import {
  MessageSquare, Image, Video, Play, Zap, Clock, Hash, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, Settings2, Sparkles, User
} from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";

// ── Provider Definitions ────────────────────────────────────────────────────

type ProviderDef = {
  id: string;
  label: string;
  baseUrl?: string;
  chatModels?: string[];
  imageModels?: string[];
  videoModels?: string[];
  apiKeyLabel: string;
};

const PROVIDERS: ProviderDef[] = [
  {
    id: "openai",
    label: "OpenAI",
    chatModels: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    imageModels: ["dall-e-3", "dall-e-2"],
    apiKeyLabel: "OpenAI API Key",
  },
  {
    id: "siliconflow",
    label: "SiliconFlow",
    baseUrl: "https://api.siliconflow.cn/v1",
    chatModels: ["Qwen/Qwen2.5-7B-Instruct", "deepseek-ai/DeepSeek-V2.5", "meta-llama/Meta-Llama-3.1-8B-Instruct"],
    imageModels: ["stabilityai/stable-diffusion-3-5-large", "black-forest-labs/FLUX.1-schnell", "Kwai-Kolors/Kolors"],
    videoModels: ["Wan-AI/Wan2.1-T2V-14B", "Wan-AI/Wan2.1-I2V-14B-720P"],
    apiKeyLabel: "SiliconFlow API Key",
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    baseUrl: "https://api.anthropic.com/v1",
    chatModels: ["claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-3-5"],
    apiKeyLabel: "Anthropic API Key",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    chatModels: ["deepseek-chat", "deepseek-coder"],
    apiKeyLabel: "DeepSeek API Key",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatBadge({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", color)}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

// ── Chat Playground Tab ───────────────────────────────────────────────────────

function ChatPlayground() {
  const testChat = useAction(api.playground.testChat);

  const [provider, setProvider] = useState("siliconflow");
  const [model, setModel] = useState("Qwen/Qwen2.5-7B-Instruct");
  const [apiKey, setApiKey] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant.");
  const [userMessage, setUserMessage] = useState("Tell me a short fun fact.");
  const [result, setResult] = useState<{ reply: string; latencyMs: number; tokenCount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  const providerDef = PROVIDERS.find((p) => p.id === provider);
  const chatModels = providerDef?.chatModels ?? [];

  const handleRun = async () => {
    if (!apiKey.trim()) { toast.error("Please enter an API key"); return; }
    if (!userMessage.trim()) { toast.error("Please enter a message"); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await testChat({
        provider,
        model,
        apiKey,
        baseUrl: providerDef?.baseUrl,
        systemPrompt,
        userMessage,
      });
      setResult(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chat test failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Config section */}
      <Card>
        <CardHeader className="pb-3">
          <button
            className="flex items-center justify-between w-full cursor-pointer"
            onClick={() => setShowSettings((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm">Provider Settings</CardTitle>
            </div>
            {showSettings ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
        </CardHeader>
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Provider</Label>
                    <Select value={provider} onValueChange={(v) => {
                      setProvider(v);
                      const def = PROVIDERS.find((p) => p.id === v);
                      setModel(def?.chatModels?.[0] ?? "");
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PROVIDERS.filter((p) => p.chatModels?.length).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {chatModels.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{providerDef?.apiKeyLabel ?? "API Key"}</Label>
                    <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>System Prompt</Label>
                  <Textarea rows={2} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Input */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <Label>User Message</Label>
          <Textarea rows={3} value={userMessage} onChange={(e) => setUserMessage(e.target.value)} placeholder="Type your test message..." />
          <Button onClick={handleRun} disabled={loading} className="w-full gap-2">
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-4 h-4" />
              </motion.div>
            ) : <Play className="w-4 h-4" />}
            {loading ? "Running..." : "Run Chat Test"}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <CardTitle className="text-sm">Response</CardTitle>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <StatBadge icon={Clock} label="Latency" value={`${result.latencyMs}ms`} color="bg-blue-500/10 text-blue-400" />
                    <StatBadge icon={Hash} label="Tokens" value={String(result.tokenCount)} color="bg-violet-500/10 text-violet-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{result.reply}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Image Playground Tab ──────────────────────────────────────────────────────

function ImagePlayground() {
  const testImage = useAction(api.playground.testImageGeneration);

  const [provider, setProvider] = useState("siliconflow");
  const [model, setModel] = useState("black-forest-labs/FLUX.1-schnell");
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("A futuristic cityscape at sunset, cinematic lighting");
  const [width, setWidth] = useState("1024");
  const [height, setHeight] = useState("1024");
  const [result, setResult] = useState<{ imageUrl: string; latencyMs: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  const providerDef = PROVIDERS.find((p) => p.id === provider);
  const imageModels = providerDef?.imageModels ?? [];

  const handleRun = async () => {
    if (!apiKey.trim()) { toast.error("Please enter an API key"); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await testImage({
        provider,
        model,
        apiKey,
        baseUrl: providerDef?.baseUrl,
        prompt,
        width: parseInt(width),
        height: parseInt(height),
      });
      setResult(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
    } finally {
      setLoading(false);
    }
  };

  const SIZE_PRESETS = ["512x512", "768x768", "1024x1024", "1024x576", "576x1024"];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <button
            className="flex items-center justify-between w-full cursor-pointer"
            onClick={() => setShowSettings((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm">Provider Settings</CardTitle>
            </div>
            {showSettings ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
        </CardHeader>
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Provider</Label>
                    <Select value={provider} onValueChange={(v) => {
                      setProvider(v);
                      const def = PROVIDERS.find((p) => p.id === v);
                      setModel(def?.imageModels?.[0] ?? "");
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PROVIDERS.filter((p) => p.imageModels?.length).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {imageModels.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{providerDef?.apiKeyLabel ?? "API Key"}</Label>
                    <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Output Size</Label>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_PRESETS.map((s) => {
                      const [w, h] = s.split("x");
                      const active = width === w && height === h;
                      return (
                        <button
                          key={s}
                          onClick={() => { setWidth(w); setHeight(h); }}
                          className={cn("px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                            active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                          )}
                        >{s}</button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-3">
          <Label>Prompt</Label>
          <Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the image..." />
          <Button onClick={handleRun} disabled={loading} className="w-full gap-2">
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-4 h-4" />
              </motion.div>
            ) : <Image className="w-4 h-4" />}
            {loading ? "Generating..." : "Generate Image"}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <CardTitle className="text-sm">Generated Image</CardTitle>
                  </div>
                  <StatBadge icon={Clock} label="Latency" value={`${(result.latencyMs / 1000).toFixed(1)}s`} color="bg-blue-500/10 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <img src={result.imageUrl} alt="Generated" className="w-full rounded-xl max-h-[480px] object-contain" />
                <a href={result.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-3 text-xs text-primary hover:underline block">Open full image</a>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Video Playground Tab ─────────────────────────────────────────────────────

function VideoPlayground() {
  const [provider] = useState("siliconflow");
  const [model, setModel] = useState("Wan-AI/Wan2.1-T2V-14B");
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("A character smiling warmly, subtle head nod, studio background");
  const [note] = useState(true);

  const VIDEO_MODELS = ["Wan-AI/Wan2.1-T2V-14B", "Wan-AI/Wan2.1-I2V-14B-720P"];

  return (
    <div className="space-y-4">
      {note && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-5">
            <div className="flex gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300">
                Video generation via SiliconFlow takes 1–3 minutes. Use the <strong>Media Studio</strong> for full job queue management.
                This tab provides a quick prompt preview for testing purposes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            Provider Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select value={provider} disabled>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="siliconflow">SiliconFlow</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">SiliconFlow is the supported video provider.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VIDEO_MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>SiliconFlow API Key</Label>
              <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sf-..." />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-3">
          <Label>Motion Prompt</Label>
          <Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the character motion..." />
          <p className="text-xs text-muted-foreground">
            Tip: Be specific — describe the character pose, expression, background, and motion style for best emotional clip results.
          </p>
          <Button
            className="w-full gap-2"
            onClick={() => {
              if (!apiKey) { toast.error("Enter API key first"); return; }
              toast.info("Submit this as a job in Media Studio → Video tab, then link the result to a character emotional state.");
            }}
          >
            <Video className="w-4 h-4" />
            Preview Prompt (submit via Media Studio)
          </Button>
        </CardContent>
      </Card>

      {/* Emotion prompt templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Emotion Prompt Templates</CardTitle>
          <CardDescription>Click to load a template into the prompt field</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Happy", prompt: "Character smiling warmly, eyes slightly squinting, gentle head nod, soft studio lighting" },
              { label: "Sad", prompt: "Character looking downward, subtle frown, slow blinking, muted warm background" },
              { label: "Surprised", prompt: "Character with wide eyes, eyebrows raised, slight open mouth, subtle backward lean" },
              { label: "Thinking", prompt: "Character gazing slightly upward, finger near chin, thoughtful expression, calm breathing" },
              { label: "Excited", prompt: "Character leaning forward, big smile, energetic slight bounce, bright studio background" },
              { label: "Neutral", prompt: "Character in neutral resting pose, calm expression, steady breath, centered frame" },
              { label: "Angry", prompt: "Character with furrowed brows, tense jaw, slight head shake, darker dramatic lighting" },
              { label: "Laughing", prompt: "Character laughing genuinely, head tilting back slightly, shoulders shaking, joyful energy" },
            ].map((t) => (
              <button
                key={t.label}
                onClick={() => setPrompt(t.prompt)}
                className="text-left p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <p className="text-xs font-semibold text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.prompt}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Characters Overview Tab ───────────────────────────────────────────────────

import CharactersManager from "./_components/characters-manager.tsx";

// ── Main Page ────────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Playground</h1>
            <p className="text-sm text-muted-foreground">Test providers, manage characters & emotional states</p>
          </div>
        </div>
      </motion.div>

      <Separator />

      <Tabs defaultValue="chat">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="chat" className="gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Chat</TabsTrigger>
          <TabsTrigger value="image" className="gap-1.5"><Image className="w-3.5 h-3.5" />Image</TabsTrigger>
          <TabsTrigger value="video" className="gap-1.5"><Video className="w-3.5 h-3.5" />Video</TabsTrigger>
          <TabsTrigger value="characters" className="gap-1.5"><User className="w-3.5 h-3.5" />Characters</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="chat"><ChatPlayground /></TabsContent>
          <TabsContent value="image"><ImagePlayground /></TabsContent>
          <TabsContent value="video"><VideoPlayground /></TabsContent>
          <TabsContent value="characters"><CharactersManager /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

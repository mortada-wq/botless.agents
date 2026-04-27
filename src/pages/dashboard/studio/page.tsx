import { useState } from "react";
import { useMutation, useQuery, usePaginatedQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { toast } from "sonner";
import { ImageIcon, VideoIcon, Trash2, Download, RefreshCw, Loader2, Wand2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { Id } from "@/convex/_generated/dataModel.js";

// ── Provider/model metadata ───────────────────────────────────────────────────

const IMAGE_MODELS = [
  { value: "stabilityai/stable-diffusion-xl-base-1.0", label: "SDXL Base 1.0" },
  { value: "stabilityai/stable-diffusion-3-5-large", label: "SD 3.5 Large" },
  { value: "black-forest-labs/FLUX.1-schnell", label: "FLUX.1 Schnell (fast)" },
  { value: "black-forest-labs/FLUX.1-dev", label: "FLUX.1 Dev" },
  { value: "Pro/black-forest-labs/FLUX.1-schnell", label: "FLUX.1 Schnell Pro" },
];

const VIDEO_MODELS = [
  { value: "Wan-AI/Wan2.1-T2V-14B", label: "Wan2.1 T2V 14B" },
  { value: "Wan-AI/Wan2.1-T2V-1.3B", label: "Wan2.1 T2V 1.3B (fast)" },
  { value: "Pro/Wan-AI/Wan2.1-T2V-14B", label: "Wan2.1 T2V 14B Pro" },
  { value: "tencent/HunyuanVideo", label: "HunyuanVideo" },
];

const IMAGE_SIZES = [
  { value: "512x512", label: "512 × 512" },
  { value: "768x768", label: "768 × 768" },
  { value: "1024x1024", label: "1024 × 1024 (default)" },
  { value: "1280x720", label: "1280 × 720 (16:9)" },
  { value: "720x1280", label: "720 × 1280 (9:16)" },
];

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400",
    running: "bg-blue-500/15 text-blue-400",
    completed: "bg-green-500/15 text-green-400",
    failed: "bg-red-500/15 text-red-400",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", variants[status] ?? "bg-muted text-muted-foreground")}>
      {status === "running" && <Loader2 className="w-3 h-3 animate-spin" />}
      {status}
    </span>
  );
}

// ── Job card ──────────────────────────────────────────────────────────────────

function JobCard({ job, onDelete }: { job: { _id: Id<"mediaJobs">; type: string; model: string; prompt: string; status: string; resultUrl?: string; errorMessage?: string; _creationTime: number }; onDelete: (id: Id<"mediaJobs">) => void }) {
  const isImage = job.type === "image";
  const isVideo = job.type === "video";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Preview area */}
      {job.status === "completed" && job.resultUrl && isImage && (
        <div className="aspect-square w-full overflow-hidden bg-secondary">
          <img src={job.resultUrl} alt={job.prompt} className="w-full h-full object-cover" />
        </div>
      )}
      {job.status === "completed" && job.resultUrl && isVideo && (
        <div className="aspect-video w-full bg-secondary">
          <video src={job.resultUrl} controls className="w-full h-full object-contain" />
        </div>
      )}
      {(job.status === "running" || job.status === "pending") && (
        <div className={cn("flex items-center justify-center bg-secondary/50", isImage ? "aspect-square" : "aspect-video")}>
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs">Generating…</span>
          </div>
        </div>
      )}
      {job.status === "failed" && (
        <div className={cn("flex items-center justify-center bg-destructive/5", isImage ? "aspect-square" : "aspect-video")}>
          <span className="text-xs text-destructive text-center px-4">{job.errorMessage ?? "Generation failed"}</span>
        </div>
      )}

      {/* Meta */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-foreground line-clamp-2 flex-1">{job.prompt}</p>
          <StatusBadge status={job.status} />
        </div>
        <p className="text-[11px] text-muted-foreground font-mono truncate">{job.model}</p>
        <div className="flex items-center gap-2">
          {job.status === "completed" && job.resultUrl && (
            <a
              href={job.resultUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
            >
              <Download className="w-3 h-3" />
              Download
            </a>
          )}
          <button
            onClick={() => onDelete(job._id)}
            className="ml-auto text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Image generation panel ────────────────────────────────────────────────────

function ImagePanel({ apiKey }: { apiKey: string }) {
  const createJob = useMutation(api.media.jobs.createJob);
  const generateImage = useAction(api.media.siliconflow.generateImage);

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [model, setModel] = useState(IMAGE_MODELS[2].value);
  const [size, setSize] = useState("1024x1024");
  const [steps, setSteps] = useState("20");
  const [loading, setLoading] = useState(false);

  const { results, status, loadMore } = usePaginatedQuery(
    api.media.jobs.listJobs,
    { type: "image" },
    { initialNumItems: 12 }
  );
  const deleteJob = useMutation(api.media.jobs.deleteJob);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (!apiKey) { toast.error("Set your SiliconFlow API key in Settings first"); return; }

    setLoading(true);
    try {
      const [w, h] = size.split("x").map(Number);
      const jobId = await createJob({
        type: "image",
        provider: "siliconflow",
        model,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        width: w,
        height: h,
        steps: parseInt(steps, 10),
      });

      toast.info("Image generation started…");
      setPrompt("");

      await generateImage({
        jobId,
        apiKey,
        model,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        width: w,
        height: h,
        steps: parseInt(steps, 10),
      });

      toast.success("Image generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" /> Image Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic city at dusk, neon lights reflecting on rain-soaked streets…"
              className="min-h-[90px] resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Negative Prompt <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blurry, low quality, watermark…"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-3 sm:col-span-1">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IMAGE_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-3 sm:col-span-1">
              <Label>Output Size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IMAGE_SIZES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-3 sm:col-span-1">
              <Label>Steps</Label>
              <Input type="number" min={10} max={50} value={steps} onChange={(e) => setSteps(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? "Generating…" : "Generate Image"}
          </Button>
        </CardContent>
      </Card>

      {/* Gallery */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Generated Images</h3>
        {results.length === 0 && status !== "LoadingFirstPage" ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><ImageIcon /></EmptyMedia>
              <EmptyTitle>No images yet</EmptyTitle>
              <EmptyDescription>Generate your first image above</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {results.length === 0
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-2xl" />
                    ))
                  : results.map((job) => (
                      <JobCard
                        key={job._id}
                        job={job}
                        onDelete={(id) => deleteJob({ jobId: id })}
                      />
                    ))}
              </AnimatePresence>
            </div>
            {status === "CanLoadMore" && (
              <div className="flex justify-center pt-2">
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => loadMore(12)}>
                  <ChevronDown className="w-4 h-4" /> Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Video generation panel ────────────────────────────────────────────────────

function VideoPanel({ apiKey }: { apiKey: string }) {
  const createJob = useMutation(api.media.jobs.createJob);
  const generateVideo = useAction(api.media.siliconflow.generateVideo);

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [model, setModel] = useState(VIDEO_MODELS[1].value);
  const [duration, setDuration] = useState("4");
  const [loading, setLoading] = useState(false);

  const { results, status, loadMore } = usePaginatedQuery(
    api.media.jobs.listJobs,
    { type: "video" },
    { initialNumItems: 8 }
  );
  const deleteJob = useMutation(api.media.jobs.deleteJob);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (!apiKey) { toast.error("Set your SiliconFlow API key in Settings first"); return; }

    setLoading(true);
    try {
      const jobId = await createJob({
        type: "video",
        provider: "siliconflow",
        model,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        duration: parseInt(duration, 10),
        fps: 8,
      });

      toast.info("Video generation started — this may take a few minutes…");
      setPrompt("");

      await generateVideo({
        jobId,
        apiKey,
        model,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        duration: parseInt(duration, 10),
        fps: 8,
      });

      toast.success("Video generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <VideoIcon className="w-4 h-4 text-primary" /> Video Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-400">
            Video generation can take 1–3 minutes. The page will update automatically when ready.
          </div>
          <div className="space-y-1.5">
            <Label>Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A panda walking through a bamboo forest at golden hour, cinematic…"
              className="min-h-[90px] resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Negative Prompt <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blurry, distorted, watermark…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VIDEO_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label>Duration (seconds)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["2", "4", "6", "8"].map((d) => (
                    <SelectItem key={d} value={d}>{d}s</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <VideoIcon className="w-4 h-4" />}
            {loading ? "Generating (may take a few minutes)…" : "Generate Video"}
          </Button>
        </CardContent>
      </Card>

      {/* Gallery */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Generated Videos</h3>
        {results.length === 0 && status !== "LoadingFirstPage" ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><VideoIcon /></EmptyMedia>
              <EmptyTitle>No videos yet</EmptyTitle>
              <EmptyDescription>Generate your first video above</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {results.length === 0
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-video rounded-2xl" />
                    ))
                  : results.map((job) => (
                      <JobCard
                        key={job._id}
                        job={job}
                        onDelete={(id) => deleteJob({ jobId: id })}
                      />
                    ))}
              </AnimatePresence>
            </div>
            {status === "CanLoadMore" && (
              <div className="flex justify-center pt-2">
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => loadMore(8)}>
                  <ChevronDown className="w-4 h-4" /> Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const settings = useQuery(api.providerSettings.getProviderSettings);
  const apiKey = (settings && "siliconflowApiKey" in settings ? settings.siliconflowApiKey : undefined) ?? "";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Media Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate images and videos using SiliconFlow AI models
        </p>
      </div>

      {/* API key warning */}
      {!apiKey && (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-sm text-yellow-400">
          No SiliconFlow API key configured.{" "}
          <a href="/dashboard/settings" className="underline cursor-pointer">
            Go to Settings
          </a>{" "}
          to add your key before generating media.
        </div>
      )}

      <Tabs defaultValue="image">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="image" className="gap-2 cursor-pointer">
            <ImageIcon className="w-4 h-4" /> Images
          </TabsTrigger>
          <TabsTrigger value="video" className="gap-2 cursor-pointer">
            <VideoIcon className="w-4 h-4" /> Videos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="mt-6">
          <ImagePanel apiKey={apiKey} />
        </TabsContent>

        <TabsContent value="video" className="mt-6">
          <VideoPanel apiKey={apiKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

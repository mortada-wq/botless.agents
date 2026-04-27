import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import {
  Upload, Film, Image, Loader2, CheckCircle2, AlertCircle,
  Scissors, Sparkles, RefreshCw, Info
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import {
  removeImageBackground,
  videoToWebm,
  videoToGif,
  getFileCategory,
  formatBytes,
} from "@/lib/media-processing.ts";

const EMOTIONS = [
  "happy", "sad", "angry", "surprised", "neutral", "excited",
  "thinking", "laughing", "confused", "nervous", "proud", "bored",
  "fearful", "disgusted", "loving", "embarrassed", "sleepy", "content",
  "frustrated", "hopeful",
];

type OutputFormat = "webm" | "gif" | "original";
type ProcessingStep =
  | { id: string; label: string; status: "pending" | "running" | "done" | "error"; detail?: string };

interface UploadStateCardProps {
  characterId: Id<"characters">;
  onUploaded?: () => void;
}

export default function UploadStateCard({ characterId, onUploaded }: UploadStateCardProps) {
  const generateUploadUrl = useMutation(api.characters.generateUploadUrl);
  const addEmotionalState = useMutation(api.characters.addEmotionalState);

  const fileRef = useRef<HTMLInputElement>(null);
  const [emotion, setEmotion] = useState("happy");
  const [label, setLabel] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileCategory, setFileCategory] = useState<ReturnType<typeof getFileCategory> | null>(null);

  // Processing options
  const [removeBg, setRemoveBg] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("webm");

  // Processing state
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [bgProgress, setBgProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const updateStep = useCallback((id: string, patch: Partial<ProcessingStep>) => {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    setDone(false);
    setSteps([]);

    const cat = getFileCategory(f);
    setFileCategory(cat);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));

    // Auto-set sensible defaults per file type
    if (cat === "image") { setRemoveBg(true); setOutputFormat("original"); }
    else if (cat === "video" || cat === "gif") { setOutputFormat("webm"); }
    else if (cat === "lottie") { setOutputFormat("original"); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      const dt = new DataTransfer();
      dt.items.add(f);
      if (fileRef.current) fileRef.current.files = dt.files;
      handleFileSelect({ target: { files: dt.files } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) { toast.error("Select a file first"); return; }

    setProcessing(true);
    setDone(false);
    setBgProgress(0);

    const cat = fileCategory ?? getFileCategory(selectedFile);
    const isVideo = cat === "video";
    const isImage = cat === "image";
    const isGif = cat === "gif";
    const isLottie = cat === "lottie";

    // Build pipeline steps
    const pipeline: ProcessingStep[] = [];
    if (isImage && removeBg) pipeline.push({ id: "bg", label: "Remove background", status: "pending" });
    if (isVideo && outputFormat === "webm") pipeline.push({ id: "conv", label: "Convert to WebM", status: "pending" });
    if ((isVideo || isGif) && outputFormat === "gif") pipeline.push({ id: "conv", label: "Convert to GIF", status: "pending" });
    pipeline.push({ id: "upload", label: "Upload to storage", status: "pending" });
    pipeline.push({ id: "save", label: "Save emotional state", status: "pending" });

    setSteps(pipeline);

    let processedBlob: Blob = selectedFile;
    let finalFormat: OutputFormat = outputFormat;

    try {
      // ── Step: Background Removal ──────────────────────────────────────
      if (isImage && removeBg) {
        updateStep("bg", { status: "running" });
        try {
          processedBlob = await removeImageBackground(selectedFile, (pct) => setBgProgress(pct));
          finalFormat = "original";
          updateStep("bg", { status: "done", detail: "Background removed" });
        } catch (e) {
          updateStep("bg", { status: "error", detail: String(e) });
          toast.error("Background removal failed — uploading original.");
          processedBlob = selectedFile;
        }
      }

      // ── Step: Video conversion ────────────────────────────────────────
      if (isVideo || isGif) {
        updateStep("conv", { status: "running" });
        try {
          if (outputFormat === "webm") {
            processedBlob = await videoToWebm(selectedFile, { fps: 25, maxDurationSec: 10 });
            finalFormat = "webm";
            updateStep("conv", { status: "done", detail: `WebM ready (${formatBytes(processedBlob.size)})` });
          } else if (outputFormat === "gif") {
            processedBlob = await videoToGif(selectedFile, { fps: 10, width: 320, maxDurationSec: 6 });
            finalFormat = "gif";
            updateStep("conv", { status: "done", detail: `GIF ready (${formatBytes(processedBlob.size)})` });
          }
        } catch (e) {
          updateStep("conv", { status: "error", detail: String(e) });
          toast.error("Conversion failed — uploading original.");
          processedBlob = selectedFile;
          finalFormat = "original";
        }
      }

      // ── Step: Upload ───────────────────────────────────────────────────
      updateStep("upload", { status: "running" });
      const uploadUrl = await generateUploadUrl();
      const contentType = finalFormat === "webm"
        ? "video/webm"
        : finalFormat === "gif"
          ? "image/gif"
          : processedBlob.type || "application/octet-stream";

      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: processedBlob,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      updateStep("upload", { status: "done", detail: formatBytes(processedBlob.size) });

      // Build preview URL for stored result
      const resultPreviewUrl = URL.createObjectURL(processedBlob);

      // ── Step: Save ─────────────────────────────────────────────────────
      updateStep("save", { status: "running" });
      await addEmotionalState({
        characterId,
        emotion,
        label: label.trim() || undefined,
        storageId,
        processedFormat: finalFormat,
        processedUrl: resultPreviewUrl,
        isDefault: false,
      });
      updateStep("save", { status: "done" });

      setDone(true);
      toast.success(`${emotion} clip ready!`);

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setLabel("");
      setSteps([]);
      if (fileRef.current) fileRef.current.value = "";
      onUploaded?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const showConvertOption = fileCategory === "video" || fileCategory === "gif";
  const showBgRemoveOption = fileCategory === "image";

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Add Emotional State Clip
        </CardTitle>
        <CardDescription className="text-xs">
          Upload any image, video (mp4/webm), or GIF. Automatic background removal and format conversion included.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Emotion + Label row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Emotion</Label>
            <Select value={emotion} onValueChange={setEmotion}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EMOTIONS.map((e) => (
                  <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Label (optional)</Label>
            <Input className="h-8 text-xs" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Custom label..." />
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !processing && fileRef.current?.click()}
          className={cn(
            "relative border border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all min-h-[110px]",
            processing ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/50",
            selectedFile ? "border-primary/40" : "border-border"
          )}
        >
          {previewUrl && selectedFile ? (
            <div className="flex flex-col items-center gap-1.5 w-full">
              {fileCategory === "video" || fileCategory === "gif" ? (
                <video src={previewUrl} autoPlay loop muted playsInline className="max-h-20 rounded-lg mx-auto" />
              ) : fileCategory === "lottie" ? (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-primary" />
                  Lottie JSON: {selectedFile.name}
                </div>
              ) : (
                <img src={previewUrl} alt="preview" className="max-h-20 rounded-lg mx-auto object-contain" />
              )}
              <p className="text-xs text-muted-foreground">{selectedFile.name} · {formatBytes(selectedFile.size)}</p>
            </div>
          ) : (
            <>
              <div className="flex gap-3 text-muted-foreground">
                <Image className="w-5 h-5" />
                <Film className="w-5 h-5" />
              </div>
              <p className="text-xs text-muted-foreground text-center">Drop or click to upload image, video (mp4/webm), GIF, or Lottie JSON</p>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*,application/json,.json" className="hidden" onChange={handleFileSelect} />
        </div>

        {/* Processing Options */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="rounded-xl border border-border bg-card/50 p-3 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Processing Options</p>

                {/* Background removal */}
                {showBgRemoveOption && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs font-medium">Remove Background</p>
                        <p className="text-xs text-muted-foreground">AI-powered cutout — runs in browser</p>
                      </div>
                    </div>
                    <Switch checked={removeBg} onCheckedChange={setRemoveBg} />
                  </div>
                )}

                {/* Format conversion */}
                {showConvertOption && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs font-medium">Output Format</p>
                        <p className="text-xs text-muted-foreground">Lightweight format for chat avatars</p>
                      </div>
                    </div>
                    <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as OutputFormat)}>
                      <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webm">WebM</SelectItem>
                        <SelectItem value="gif">GIF</SelectItem>
                        <SelectItem value="original">Original</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!showBgRemoveOption && !showConvertOption && fileCategory === "lottie" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    Lottie JSON will be stored as-is and played natively in chat.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pipeline steps */}
        <AnimatePresence>
          {steps.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2 text-xs">
                  {step.status === "pending" && <div className="w-4 h-4 rounded-full border border-border shrink-0" />}
                  {step.status === "running" && <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
                  {step.status === "done" && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                  {step.status === "error" && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
                  <span className={cn(
                    "font-medium",
                    step.status === "done" ? "text-muted-foreground line-through" : "text-foreground"
                  )}>{step.label}</span>
                  {step.detail && <span className="text-muted-foreground">{step.detail}</span>}
                </div>
              ))}

              {/* BG removal progress bar */}
              {steps.find((s) => s.id === "bg" && s.status === "running") && (
                <div className="space-y-1">
                  <Progress value={bgProgress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground text-right">{bgProgress}%</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          size="sm"
          className="w-full gap-2"
          onClick={handleProcess}
          disabled={!selectedFile || processing}
        >
          {processing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : done ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {processing ? "Processing..." : done ? "Done!" : "Process & Upload"}
        </Button>
      </CardContent>
    </Card>
  );
}

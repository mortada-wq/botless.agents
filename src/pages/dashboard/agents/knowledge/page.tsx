import { useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { toast } from "sonner";
import {
  Upload, Trash2, FileText, File, ArrowLeft,
  Loader2, BookOpen, CheckCircle, AlertCircle, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

// ── Helpers ────────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ACCEPTED_EXT = ".txt,.md,.csv,.json,.pdf,.doc,.docx";
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string) {
  if (type.includes("pdf")) return <FileText className="w-4 h-4 text-red-400" />;
  if (type.includes("json") || type.includes("csv")) return <FileText className="w-4 h-4 text-yellow-400" />;
  if (type.includes("word") || type.includes("docx")) return <FileText className="w-4 h-4 text-blue-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

// Read a plain-text file as string
function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// For PDFs and binary formats we just extract text if possible, otherwise leave blank
async function extractText(file: File): Promise<string> {
  const textTypes = ["text/plain", "text/markdown", "text/csv", "application/json"];
  if (textTypes.includes(file.type)) {
    return await readAsText(file);
  }
  // For PDFs/Word, return empty — user can add text manually via agent notes
  return "";
}

// ── Upload zone ────────────────────────────────────────────────────────────────

type UploadState = "idle" | "uploading" | "done" | "error";

function DropZone({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onFilesSelected(files);
  }, [onFilesSelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onFilesSelected(Array.from(e.target.files));
    e.target.value = "";
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer select-none",
        dragging ? "border-primary bg-primary/8" : "border-border hover:border-primary/50 hover:bg-secondary/50"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXT}
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", dragging ? "bg-primary/20" : "bg-secondary")}>
          <Upload className={cn("w-6 h-6 transition-colors", dragging ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {dragging ? "Drop files here" : "Drag & drop files, or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            TXT, MD, CSV, JSON, PDF, DOC, DOCX · max {MAX_SIZE_MB} MB each
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Upload queue item ──────────────────────────────────────────────────────────

type QueueItem = { file: File; state: UploadState; error?: string };

function QueueRow({ item }: { item: QueueItem }) {
  const icon = {
    idle: <Loader2 className="w-3.5 h-3.5 text-muted-foreground" />,
    uploading: <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />,
    done: <CheckCircle className="w-3.5 h-3.5 text-green-500" />,
    error: <AlertCircle className="w-3.5 h-3.5 text-destructive" />,
  }[item.state];

  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      {fileIcon(item.file.type)}
      <span className="flex-1 text-sm text-foreground truncate">{item.file.name}</span>
      <span className="text-xs text-muted-foreground shrink-0">{formatBytes(item.file.size)}</span>
      {icon}
    </div>
  );
}

// ── File card ──────────────────────────────────────────────────────────────────

type KnowledgeFile = Doc<"knowledgeFiles"> & { url: string | null };

function FileCard({ file, onDelete }: { file: KnowledgeFile; onDelete: () => void }) {
  const [showText, setShowText] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          {fileIcon(file.fileType)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{file.fileName}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground">{formatBytes(file.fileSize)}</span>
            <span className="text-[11px] text-muted-foreground">·</span>
            <span className="text-[11px] text-muted-foreground">{format(new Date(file._creationTime), "MMM d, yyyy")}</span>
            {file.extractedText ? (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-1">
                <CheckCircle className="w-2.5 h-2.5" /> Text extracted
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-muted-foreground">
                No text
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {file.extractedText && (
            <button
              onClick={() => setShowText((v) => !v)}
              className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Preview extracted text"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          {file.url && (
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Download file"
            >
              <ArrowLeft className="w-3.5 h-3.5 rotate-[225deg]" />
            </a>
          )}
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            title="Delete file"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Extracted text preview */}
      <AnimatePresence>
        {showText && file.extractedText && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <pre className="mt-3 text-xs text-muted-foreground bg-secondary rounded-xl p-3 whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-mono">
              {file.extractedText.slice(0, 2000)}{file.extractedText.length > 2000 ? "\n…(truncated)" : ""}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function KnowledgeBasePage() {
  const { agentId } = useParams<{ agentId: string }>();
  const validId = agentId && /^[a-z0-9]{15,40}$/i.test(agentId);

  const generateUploadUrl = useMutation(api.knowledge.generateUploadUrl);
  const saveFile = useMutation(api.knowledge.saveKnowledgeFile);
  const updateText = useMutation(api.knowledge.updateExtractedText);
  const deleteFile = useMutation(api.knowledge.deleteKnowledgeFile);

  const files = useQuery(
    api.knowledge.listKnowledgeFiles,
    validId ? { agentId: agentId as Id<"agents"> } : "skip"
  );

  // Get agent name for the breadcrumb
  const agent = useQuery(
    api.agents.getAgent,
    validId ? { agentId: agentId as Id<"agents"> } : "skip"
  );

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFilesSelected = async (incoming: File[]) => {
    if (!validId || !agentId) return;

    // Validate
    const valid: File[] = [];
    for (const f of incoming) {
      if (f.size > MAX_SIZE_BYTES) {
        toast.error(`${f.name} exceeds ${MAX_SIZE_MB} MB limit`);
        continue;
      }
      valid.push(f);
    }
    if (!valid.length) return;

    const newItems: QueueItem[] = valid.map((f) => ({ file: f, state: "idle" as UploadState }));
    setQueue((q) => [...q, ...newItems]);
    setUploading(true);

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      // Mark uploading
      setQueue((q) => q.map((qi) => qi.file === item.file ? { ...qi, state: "uploading" } : qi));
      try {
        // 1. Get upload URL
        const uploadUrl = await generateUploadUrl();
        // 2. POST file
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": item.file.type || "application/octet-stream" },
          body: item.file,
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
        const { storageId } = await res.json() as { storageId: Id<"_storage"> };

        // 3. Extract text (client-side for text files)
        const extractedText = await extractText(item.file);

        // 4. Save record
        const fileId = await saveFile({
          agentId: agentId as Id<"agents">,
          storageId,
          fileName: item.file.name,
          fileType: item.file.type || "application/octet-stream",
          fileSize: item.file.size,
          extractedText: extractedText || undefined,
        });

        // 5. If extracted text was long, update it separately
        if (extractedText && extractedText.length > 100) {
          await updateText({ fileId, extractedText });
        }

        setQueue((q) => q.map((qi) => qi.file === item.file ? { ...qi, state: "done" } : qi));
      } catch (err) {
        setQueue((q) => q.map((qi) => qi.file === item.file
          ? { ...qi, state: "error", error: err instanceof Error ? err.message : "Upload failed" }
          : qi
        ));
        toast.error(`Failed to upload ${item.file.name}`);
      }
    }

    setUploading(false);
    toast.success("Upload complete!");
    // Clear queue after 3s
    setTimeout(() => setQueue([]), 3000);
  };

  const handleDelete = async (fileId: Id<"knowledgeFiles">) => {
    try {
      await deleteFile({ fileId });
      toast.success("File deleted");
    } catch {
      toast.error("Failed to delete file");
    }
  };

  const agentName = agent?.name ?? "Agent";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/dashboard/agents"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Agents
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Knowledge Base</h1>
            {agent === undefined ? (
              <Skeleton className="h-3.5 w-32 mt-1" />
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">
                Files attached to <span className="text-foreground font-medium">{agentName}</span>
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-primary/8 border border-primary/20 rounded-2xl px-5 py-4 flex gap-3"
      >
        <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-foreground font-medium">How knowledge files work</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Text extracted from your files is injected into the agent's system prompt during every chat session. Plain-text files (TXT, MD, CSV, JSON) are extracted automatically. PDFs and Word docs are stored but require copy-pasting content into the agent's "Knowledge Text" field for full extraction.
          </p>
        </div>
      </motion.div>

      {/* Drop zone */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DropZone onFilesSelected={handleFilesSelected} />
      </motion.div>

      {/* Upload queue */}
      <AnimatePresence>
        {queue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              )}
              <span className="text-xs font-semibold text-foreground">
                {uploading ? "Uploading…" : "Upload complete"}
              </span>
            </div>
            {queue.map((item, i) => <QueueRow key={i} item={item} />)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Uploaded Files{files !== undefined && ` (${files.length})`}
          </h2>
          {files !== undefined && files.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {files.reduce((s, f) => s + f.fileSize, 0) > 0 && formatBytes(files.reduce((s, f) => s + f.fileSize, 0))} total
            </span>
          )}
        </div>

        {files === undefined ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-10 text-center">
            <File className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Drop files above to get started.</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {files.map((file) => (
                <FileCard
                  key={file._id}
                  file={file as KnowledgeFile}
                  onDelete={() => handleDelete(file._id)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

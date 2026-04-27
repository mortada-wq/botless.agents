import { useState } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  Zap, CheckCircle2, AlertCircle, Loader2, Clock, RefreshCw, Trash2,
  BarChart3, HardDrive, TrendingDown, ImageIcon, Film, Scissors, Minimize2,
  ChevronDown, Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { formatBytes } from "@/lib/media-processing.ts";

type PipelineJob = Doc<"pipelineJobs">;
type StatusFilter = "all" | "queued" | "running" | "done" | "failed";

// ── Job type metadata ─────────────────────────────────────────────────────────

const JOB_TYPE_META = {
  bg_removal:    { label: "Background Removal", icon: Scissors,   color: "bg-violet-500/15 text-violet-400" },
  video_to_webm: { label: "Video → WebM",       icon: Film,       color: "bg-blue-500/15 text-blue-400" },
  video_to_gif:  { label: "Video → GIF",        icon: Film,       color: "bg-pink-500/15 text-pink-400" },
  image_optimize:{ label: "Image Optimize",     icon: Minimize2,  color: "bg-emerald-500/15 text-emerald-400" },
} as const;

const STATUS_META = {
  queued:  { label: "Queued",  color: "bg-yellow-500/15 text-yellow-400", icon: Clock },
  running: { label: "Running", color: "bg-blue-500/15 text-blue-400",     icon: Loader2 },
  done:    { label: "Done",    color: "bg-green-500/15 text-green-400",   icon: CheckCircle2 },
  failed:  { label: "Failed",  color: "bg-red-500/15 text-red-400",       icon: AlertCircle },
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", color)}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Job row ───────────────────────────────────────────────────────────────────

function JobRow({ job }: { job: PipelineJob }) {
  const retryJob = useMutation(api.pipeline.jobs.retryJob);
  const deleteJob = useMutation(api.pipeline.jobs.deleteJob);
  const [expanded, setExpanded] = useState(false);

  const typeMeta = JOB_TYPE_META[job.jobType] ?? { label: job.jobType, icon: Zap, color: "bg-primary/15 text-primary" };
  const statusMeta = STATUS_META[job.status];
  const StatusIcon = statusMeta.icon;
  const TypeIcon = typeMeta.icon;

  const savings = job.inputBytes && job.outputBytes
    ? job.inputBytes - job.outputBytes
    : null;
  const savingsPct = savings && job.inputBytes
    ? Math.round((savings / job.inputBytes) * 100)
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Type icon */}
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", typeMeta.color)}>
          <TypeIcon className="w-4 h-4" />
        </div>

        {/* Label + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{typeMeta.label}</span>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1", statusMeta.color)}>
              <StatusIcon className={cn("w-3 h-3", job.status === "running" && "animate-spin")} />
              {statusMeta.label}
            </span>
            {job.attempts > 1 && (
              <span className="text-xs text-muted-foreground">attempt {job.attempts}</span>
            )}
          </div>
          {/* Size info */}
          {(job.inputBytes || job.outputBytes) && (
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              {job.inputBytes && <span>In: {formatBytes(job.inputBytes)}</span>}
              {job.outputBytes && <span>Out: {formatBytes(job.outputBytes)}</span>}
              {savings !== null && savings > 0 && (
                <span className="text-green-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" />
                  {formatBytes(savings)} saved ({savingsPct}%)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Time */}
        <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
          {job.startedAt
            ? new Date(job.startedAt).toLocaleTimeString()
            : new Date(job._creationTime).toLocaleTimeString()}
        </span>

        {/* Actions */}
        <div className="flex gap-1 shrink-0">
          {job.status === "failed" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 text-primary hover:text-primary"
              title="Retry"
              onClick={() => retryJob({ jobId: job._id }).catch(() => toast.error("Retry failed"))}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            title="Delete"
            onClick={() => deleteJob({ jobId: job._id }).catch(() => toast.error("Delete failed"))}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
          </Button>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border pt-3 space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground mb-1 font-medium">Input URL</p>
                  <a href={job.inputUrl} target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline break-all line-clamp-2">
                    {job.inputUrl}
                  </a>
                </div>
                {job.outputUrl && (
                  <div>
                    <p className="text-muted-foreground mb-1 font-medium">Output URL</p>
                    <a href={job.outputUrl} target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:underline break-all line-clamp-2">
                      {job.outputUrl}
                    </a>
                    {/* Preview */}
                    {(job.outputFormat === "webm" || job.outputFormat === "gif") ? (
                      <video src={job.outputUrl} autoPlay loop muted playsInline
                        className="mt-2 max-h-24 rounded-lg" />
                    ) : (
                      <img src={job.outputUrl} alt="output"
                        className="mt-2 max-h-24 rounded-lg object-contain" />
                    )}
                  </div>
                )}
              </div>

              {job.errorMessage && (
                <div className="flex gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-2">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-destructive">{job.errorMessage}</p>
                </div>
              )}

              <div className="flex gap-4 text-muted-foreground">
                {job.startedAt && <span>Started: {new Date(job.startedAt).toLocaleString()}</span>}
                {job.completedAt && <span>Finished: {new Date(job.completedAt).toLocaleString()}</span>}
                <span>Attempts: {job.attempts}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Pipeline Queue (enqueue manually) ────────────────────────────────────────

function ManualEnqueuePanel() {
  const enqueue = useMutation(api.pipeline.jobs.enqueueJob);
  const [url, setUrl] = useState("");
  const [jobType, setJobType] = useState<"bg_removal" | "video_to_webm" | "video_to_gif" | "image_optimize">("bg_removal");
  const [loading, setLoading] = useState(false);

  const handleEnqueue = async () => {
    if (!url.trim()) { toast.error("Enter a URL"); return; }
    setLoading(true);
    try {
      await enqueue({ jobType, inputUrl: url.trim() });
      toast.success("Job queued!");
      setUrl("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to queue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Manual Job Enqueue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {(Object.entries(JOB_TYPE_META) as [typeof jobType, typeof JOB_TYPE_META[typeof jobType]][]).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setJobType(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                jobType === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              <meta.icon className="w-3.5 h-3.5" />
              {meta.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://... (image or video URL)"
            className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button size="sm" onClick={handleEnqueue} disabled={loading} className="gap-1.5 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Queue
          </Button>
        </div>
        <div className="flex gap-2 items-center text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            Background removal requires a <strong>REMOVEBG_API_KEY</strong> secret. Without it, the job stores the original image unchanged.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Pipeline Page ────────────────────────────────────────────────────────

export default function PipelinePage() {
  const stats = useQuery(api.pipeline.jobs.getStats);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { results, status: loadStatus, loadMore } = usePaginatedQuery(
    api.pipeline.jobs.listJobs,
    statusFilter === "all" ? {} : { status: statusFilter as Exclude<StatusFilter, "all"> },
    { initialNumItems: 20 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Media Pipeline</h1>
            <p className="text-sm text-muted-foreground">Automated background removal, video conversion, and optimization</p>
          </div>
        </div>
      </motion.div>

      <Separator />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Jobs" value={stats.total} icon={BarChart3} color="bg-primary/15 text-primary" />
          <StatCard label="Queued" value={stats.queued} icon={Clock} color="bg-yellow-500/15 text-yellow-400" />
          <StatCard label="Running" value={stats.running} icon={Loader2} color="bg-blue-500/15 text-blue-400" />
          <StatCard label="Done" value={stats.done} icon={CheckCircle2} color="bg-green-500/15 text-green-400" />
          <StatCard label="Failed" value={stats.failed} icon={AlertCircle} color="bg-red-500/15 text-red-400" />
          <StatCard
            label="Bytes Saved"
            value={stats.bytesSaved > 0 ? formatBytes(stats.bytesSaved) : "—"}
            icon={TrendingDown}
            color="bg-emerald-500/15 text-emerald-400"
          />
        </div>
      )}

      {/* Manual enqueue */}
      <ManualEnqueuePanel />

      <Separator />

      {/* Jobs list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-foreground">Job Queue</h2>
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <TabsList className="h-8">
              {(["all", "queued", "running", "done", "failed"] as StatusFilter[]).map((s) => (
                <TabsTrigger key={s} value={s} className="text-xs h-7 capitalize">{s}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {loadStatus === "LoadingFirstPage" ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="pt-10 pb-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium">No jobs yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Jobs are created automatically when you upload emotional state clips. You can also queue them manually above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {results.map((job) => (
                <JobRow key={job._id} job={job} />
              ))}
            </AnimatePresence>
            {loadStatus === "CanLoadMore" && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => loadMore(20)}
              >
                Load more
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

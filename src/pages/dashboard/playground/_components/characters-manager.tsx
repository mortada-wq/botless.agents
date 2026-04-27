import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { motion, AnimatePresence } from "motion/react";
import Lottie from "lottie-react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Card as UICard } from "@/components/ui/card.tsx";
import {
  Plus, Trash2, Star, StarOff, ChevronRight, User, Film,
  Loader2, AlertCircle, X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import UploadStateCard from "./upload-state-card.tsx";

const EMOTION_COLORS: Record<string, string> = {
  happy: "bg-yellow-500/15 text-yellow-400",
  sad: "bg-blue-500/15 text-blue-400",
  angry: "bg-red-500/15 text-red-400",
  surprised: "bg-orange-500/15 text-orange-400",
  neutral: "bg-zinc-500/15 text-zinc-400",
  excited: "bg-pink-500/15 text-pink-400",
  thinking: "bg-purple-500/15 text-purple-400",
  laughing: "bg-yellow-400/15 text-yellow-300",
  confused: "bg-amber-500/15 text-amber-400",
  nervous: "bg-teal-500/15 text-teal-400",
  proud: "bg-indigo-500/15 text-indigo-400",
  bored: "bg-slate-500/15 text-slate-400",
  fearful: "bg-violet-500/15 text-violet-400",
  disgusted: "bg-green-600/15 text-green-400",
  loving: "bg-rose-500/15 text-rose-400",
  embarrassed: "bg-red-300/15 text-red-300",
  sleepy: "bg-sky-500/15 text-sky-400",
  content: "bg-emerald-500/15 text-emerald-400",
  frustrated: "bg-orange-600/15 text-orange-500",
  hopeful: "bg-cyan-500/15 text-cyan-400",
};

function EmotionBadge({ emotion }: { emotion: string }) {
  const color = EMOTION_COLORS[emotion] ?? "bg-primary/15 text-primary";
  return <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", color)}>{emotion}</span>;
}

// ── Add Character Dialog ─────────────────────────────────────────────────────

function AddCharacterDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createCharacter = useMutation(api.characters.createCharacter);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Name required"); return; }
    setLoading(true);
    try {
      await createCharacter({ name: name.trim(), description: description.trim() || undefined });
      toast.success("Character created");
      setName(""); setDescription("");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create character");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Character</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex the Advisor" />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description..." />
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Character
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Lottie URL loader ────────────────────────────────────────────────────────

function LottiePlayer({ url }: { url: string }) {
  const [data, setData] = useState<object | null>(null);
  const [error, setError] = useState(false);

  if (!data && !error) {
    fetch(url)
      .then((r) => r.json())
      .then((j: object) => setData(j))
      .catch(() => setError(true));
  }

  if (error) return <div className="text-xs text-muted-foreground">Invalid Lottie</div>;
  if (!data) return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
  return <Lottie animationData={data} loop className="w-full h-full" />;
}

// ── State Card ────────────────────────────────────────────────────────────────

type EmotionalState = {
  _id: Id<"emotionalStates">;
  emotion: string;
  label?: string;
  processedUrl?: string;
  processedFormat?: "webm" | "gif" | "lottie" | "original";
  processingStatus: string;
  isDefault?: boolean;
  thumbnailUrl?: string;
};

function StateCard({ state, characterId }: { state: EmotionalState; characterId: Id<"characters"> }) {
  const deleteState = useMutation(api.characters.deleteEmotionalState);
  const setDefault = useMutation(api.characters.setDefaultState);

  const fmt = state.processedFormat;
  const url = state.processedUrl ?? state.thumbnailUrl;
  const isVideo = fmt === "webm";
  const isGif = fmt === "gif";
  const isLottie = fmt === "lottie";
  const isImage = fmt === "original" && url;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "rounded-xl border p-3 space-y-2 transition-all",
        state.isDefault ? "border-primary/50 bg-primary/5" : "border-border bg-card"
      )}
    >
      {/* Preview */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
        {isVideo && url ? (
          <video src={url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
        ) : isGif && url ? (
          <img src={url} alt={state.emotion} className="w-full h-full object-cover" />
        ) : isLottie && url ? (
          <div className="w-full h-full flex items-center justify-center p-1">
            <LottiePlayer url={url} />
          </div>
        ) : isImage ? (
          <img src={url} alt={state.emotion} className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Film className="w-5 h-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No preview</p>
          </div>
        )}

        {/* Format badge */}
        {fmt && fmt !== "original" && (
          <div className="absolute bottom-1 right-1 bg-black/60 rounded px-1.5 py-0.5 text-xs text-white font-mono uppercase">
            {fmt}
          </div>
        )}

        {/* Default badge */}
        {state.isDefault && (
          <div className="absolute top-1 left-1 bg-primary rounded px-1.5 py-0.5 text-xs text-white font-bold flex items-center gap-1">
            <Star className="w-2.5 h-2.5" />default
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <EmotionBadge emotion={state.emotion} />
        {state.label && <p className="text-xs text-muted-foreground truncate">{state.label}</p>}
      </div>

      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 h-7 text-xs gap-1"
          onClick={() => setDefault({ characterId, stateId: state._id }).catch(() => toast.error("Failed"))}
        >
          {state.isDefault ? <StarOff className="w-3 h-3" /> : <Star className="w-3 h-3" />}
          {state.isDefault ? "Unset" : "Default"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => deleteState({ stateId: state._id }).catch(() => toast.error("Failed to delete"))}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

// ── Character Detail ──────────────────────────────────────────────────────────

function CharacterDetail({ characterId, onBack }: { characterId: Id<"characters">; onBack: () => void }) {
  const data = useQuery(api.characters.getCharacter, { characterId });
  const deleteCharacter = useMutation(api.characters.deleteCharacter);

  if (data === undefined) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
  if (data === null) return (
    <div className="text-center py-10 text-muted-foreground text-sm">Character not found.</div>
  );

  const states = data.states ?? [];
  const stateCount = states.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground">
          <X className="w-4 h-4" /> Back
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <h2 className="text-lg font-semibold">{data.name}</h2>
        <Badge variant="secondary" className={cn(stateCount < 4 ? "border-amber-500/50" : "")}>
          {stateCount} / 20 states
          {stateCount < 4 ? ` (need ${4 - stateCount} more)` : ""}
        </Badge>
        <div className="ml-auto">
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive gap-1"
            onClick={async () => {
              try {
                await deleteCharacter({ characterId });
                onBack();
                toast.success("Character deleted");
              } catch {
                toast.error("Failed to delete");
              }
            }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Character
          </Button>
        </div>
      </div>

      {data.description && <p className="text-sm text-muted-foreground">{data.description}</p>}

      {/* Pipeline info banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground flex flex-wrap gap-4">
        <span className="flex items-center gap-1.5">📷 <strong>Images</strong> → AI background removal → transparent PNG</span>
        <span className="flex items-center gap-1.5">🎬 <strong>MP4/AVI</strong> → WebM or GIF (browser-side, no upload limit)</span>
        <span className="flex items-center gap-1.5">✨ <strong>Lottie JSON</strong> → native animated playback</span>
      </div>

      {/* Upload form or cap warning */}
      {stateCount < 20 ? (
        <UploadStateCard characterId={characterId} onUploaded={() => {}} />
      ) : (
        <UICard className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-5">
            <div className="flex gap-2 items-center text-sm text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Maximum of 20 emotional states reached for this character.
            </div>
          </CardContent>
        </UICard>
      )}

      {/* States grid */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Emotional States
          {stateCount > 0 && <span className="text-muted-foreground font-normal ml-2 text-xs">Hover to play videos</span>}
        </h3>
        {states.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No states yet — upload your first emotion clip above.
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            <AnimatePresence>
              {states.map((s) => (
                <StateCard key={s._id} state={s as EmotionalState} characterId={characterId} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Main Characters Manager ───────────────────────────────────────────────────

export default function CharactersManager() {
  const characters = useQuery(api.characters.listCharacters);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"characters"> | null>(null);

  if (selectedId) {
    return <CharacterDetail characterId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Characters</h2>
          <p className="text-xs text-muted-foreground">Each character needs 4–20 emotional state clips. Upload images, videos, GIFs, or Lottie JSON.</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Character
        </Button>
      </div>

      <AddCharacterDialog open={addOpen} onClose={() => setAddOpen(false)} />

      {characters === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : characters.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium">No characters yet</p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">Create a character and assign 4–20 emotional state clips — images, videos, GIFs, or Lottie animations.</p>
            <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1">
              <Plus className="w-4 h-4" /> Create First Character
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((c) => (
            <motion.div key={c._id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Card
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedId(c._id)}
              >
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{c.name}</p>
                      {c.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.description}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          <Film className="w-3 h-3 mr-1" />
                          {c.stateCount} / 20 states
                        </Badge>
                        {c.stateCount < 4 && (
                          <Badge className="text-xs bg-amber-500/15 text-amber-400 border-0">
                            Need {4 - c.stateCount} more
                          </Badge>
                        )}
                        {c.stateCount >= 4 && (
                          <Badge className="text-xs bg-green-500/15 text-green-400 border-0">
                            Ready
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

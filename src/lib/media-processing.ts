/**
 * Browser-side media processing utilities.
 * - Background removal from images (using @imgly/background-removal)
 * - Video → WebM (via MediaRecorder + canvas capture)
 * - Video / GIF → GIF (via gif.js frame extraction)
 * - Lottie JSON passthrough
 */

// ── Background Removal ────────────────────────────────────────────────────────

export async function removeImageBackground(
  file: File,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal");

  const blob = await removeBackground(file, {
    progress: (_key: string, current: number, total: number) => {
      if (onProgress && total > 0) onProgress(Math.round((current / total) * 100));
    },
  });
  return blob;
}

// ── Video → WebM (canvas re-capture) ─────────────────────────────────────────

export function videoToWebm(
  file: File,
  options: { fps?: number; maxDurationSec?: number } = {}
): Promise<Blob> {
  const { fps = 25, maxDurationSec = 10 } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    video.onloadedmetadata = () => {
      const duration = Math.min(video.duration, maxDurationSec);
      const width = video.videoWidth || 512;
      const height = video.videoHeight || 512;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No 2D context")); return; }

      // Pick best supported codec
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? "video/webm;codecs=vp8"
          : "video/webm";

      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        URL.revokeObjectURL(video.src);
        resolve(new Blob(chunks, { type: "video/webm" }));
      };

      recorder.start();
      video.currentTime = 0;
      video.play().catch(reject);

      const interval = setInterval(() => {
        ctx.drawImage(video, 0, 0, width, height);
      }, 1000 / fps);

      setTimeout(() => {
        clearInterval(interval);
        recorder.stop();
        video.pause();
      }, duration * 1000 + 200);
    };

    video.onerror = () => reject(new Error("Failed to load video"));
  });
}

// ── Create an inline Blob URL for gif.worker so no external file is needed ─────

async function getGifWorkerBlobUrl(): Promise<string> {
  const GIF_MODULE = await import("gif.js");
  // gif.js bundles its own worker — retrieve the worker script source from
  // the package. We create a Blob URL so no static file copy is required.
  const resp = await fetch(
    new URL("gif.js/dist/gif.worker.js", import.meta.url).href
  ).catch(() => null);
  if (resp && resp.ok) {
    const src = await resp.text();
    return URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
  }
  // Fallback: use the GIF class itself to determine worker path
  void GIF_MODULE; // ensure module is loaded
  return "/gif.worker.js";
}

// ── Video → GIF ───────────────────────────────────────────────────────────────

export function videoToGif(
  file: File,
  options: { fps?: number; width?: number; maxDurationSec?: number; quality?: number } = {}
): Promise<Blob> {
  const { fps = 10, width = 320, maxDurationSec = 6, quality = 10 } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    video.onloadedmetadata = async () => {
      const duration = Math.min(video.duration, maxDurationSec);
      const aspectRatio = video.videoHeight / video.videoWidth;
      const height = Math.round(width * aspectRatio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No 2D context")); return; }

      const GIF = (await import("gif.js")).default;
      const workerScript = await getGifWorkerBlobUrl();

      const gif = new GIF({
        workers: 2,
        quality,
        width,
        height,
        workerScript,
      });

      const frameInterval = 1 / fps;
      const totalFrames = Math.floor(duration * fps);
      const delay = Math.round(1000 / fps);

      // Seek and capture each frame
      const captureFrame = (frameIndex: number): Promise<void> => {
        return new Promise((res) => {
          if (frameIndex >= totalFrames) { res(); return; }
          video.currentTime = frameIndex * frameInterval;
          const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked);
            ctx.drawImage(video, 0, 0, width, height);
            gif.addFrame(ctx, { copy: true, delay });
            res();
          };
          video.addEventListener("seeked", onSeeked);
        });
      };

      // Capture all frames sequentially
      for (let i = 0; i < totalFrames; i++) {
        await captureFrame(i);
      }

      gif.on("finished", (blob: Blob) => {
        URL.revokeObjectURL(video.src);
        resolve(blob);
      });

      gif.render();
    };

    video.onerror = () => reject(new Error("Failed to load video"));
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getFileCategory(file: File): "image" | "video" | "gif" | "lottie" | "unknown" {
  if (file.type === "image/gif") return "gif";
  if (file.type === "application/json" || file.name.endsWith(".json")) return "lottie";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "unknown";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

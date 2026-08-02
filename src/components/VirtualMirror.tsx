"use client";

import { useEffect, useRef, useState } from "react";
import {
  getFaceTrackerError,
  getVideoFaceLandmarker,
  loadGlassesSprite,
  poseFromLandmarks,
  preloadVideoFaceLandmarker,
  type LiveGlassesPose,
} from "@/lib/live-face";
import {
  detectFaceAnchor,
  metricFrameWidthFraction,
} from "@/lib/face-landmarks";
import type { Frame } from "@/lib/types";

type MirrorMode = "live" | "photo";

interface VirtualMirrorProps {
  frame: Frame;
}

/**
 * Lentiamo-style virtual mirror:
 * live webcam + real product frame (cut-out) tracked onto the eyes.
 */
export function VirtualMirror({ frame }: VirtualMirrorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const glassesRef = useRef<HTMLImageElement | null>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);
  const poseRef = useRef<LiveGlassesPose | null>(null);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const frameRef = useRef(frame);
  frameRef.current = frame;

  const [mode, setMode] = useState<MirrorMode>("live");
  const [status, setStatus] = useState("Starting camera…");
  const [ready, setReady] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [glassesReady, setGlassesReady] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Load the real product sprite (transparent cut-out).
  useEffect(() => {
    let cancelled = false;
    setGlassesReady(false);
    glassesRef.current = null;
    preloadVideoFaceLandmarker();

    void loadGlassesSprite(frame.image)
      .then((img) => {
        if (cancelled) return;
        glassesRef.current = img;
        setGlassesReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setGlassesReady(false);
          setStatus("Could not load this frame’s product image.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [frame.image]);

  // Open webcam for live mode.
  useEffect(() => {
    if (mode !== "live") return;
    let cancelled = false;

    async function start() {
      setStatus("Allow camera access for the live try-on…");
      setReady(false);
      setTracking(false);
      poseRef.current = null;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setReady(true);
        setStatus("Looking for your face…");
      } catch {
        setStatus("Camera blocked. Allow access, or upload a photo.");
        setReady(false);
      }
    }

    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [mode]);

  // Main render + tracking loop (canvas compositor — not React pose state).
  useEffect(() => {
    if (!ready) return;
    let active = true;
    let sawFace = false;

    async function run() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const landmarker =
        mode === "live" ? await getVideoFaceLandmarker() : null;
      if (mode === "live" && !landmarker) {
        setStatus(
          `Face tracker failed (${getFaceTrackerError() ?? "unknown"}). Try upload photo.`,
        );
        return;
      }
      if (mode === "live") {
        setStatus("Live try-on — centre your face");
      }

      const paint = () => {
        if (!active) return;
        const video = videoRef.current;
        const glasses = glassesRef.current;
        const photo = photoRef.current;
        const product = frameRef.current;

        if (mode === "live" && video && video.readyState >= 2) {
          const w = video.videoWidth;
          const h = video.videoHeight;
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }

          // Mirror like a real fitting-room mirror / Lentiamo.
          ctx.save();
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, w, h);
          ctx.restore();

          if (landmarker) {
            try {
              const now = performance.now();
              const ts =
                now <= lastTsRef.current ? lastTsRef.current + 1 : now;
              lastTsRef.current = ts;
              const result = landmarker.detectForVideo(video, ts);
              const face = result.faceLandmarks?.[0];
              if (face?.length) {
                const mirrored = face.map((p) => ({ ...p, x: 1 - p.x }));
                const pose = poseFromLandmarks(mirrored, product);
                poseRef.current = pose.ok ? pose : null;
                if (pose.ok !== sawFace) {
                  sawFace = pose.ok;
                  setTracking(pose.ok);
                }
              } else if (sawFace) {
                sawFace = false;
                poseRef.current = null;
                setTracking(false);
              }
            } catch (error) {
              console.warn("detectForVideo", error);
            }
          }
        } else if (mode === "photo" && photo && photo.naturalWidth) {
          const w = photo.naturalWidth;
          const h = photo.naturalHeight;
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }
          ctx.drawImage(photo, 0, 0, w, h);
        }

        const pose = poseRef.current;
        if (pose?.ok && glasses && glasses.naturalWidth > 0) {
          drawRealGlasses(ctx, canvas.width, canvas.height, pose, glasses);
        }

        rafRef.current = requestAnimationFrame(paint);
      };

      rafRef.current = requestAnimationFrame(paint);
    }

    void run();
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [ready, mode, glassesReady]);

  async function onUpload(file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      photoRef.current = img;
      setPhotoUrl(url);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setMode("photo");
      setReady(true);
      setStatus("Placing the frame on your photo…");
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const cctx = c.getContext("2d");
        if (!cctx) throw new Error("canvas");
        cctx.drawImage(img, 0, 0);
        const anchor = await detectFaceAnchor(c.toDataURL("image/jpeg", 0.92));
        poseRef.current = {
          cx: anchor.cx,
          cy: anchor.cy,
          width: metricFrameWidthFraction(anchor, frame),
          rotation: anchor.rotation,
          ok: true,
        };
        setTracking(true);
        setStatus("Photo try-on — switch frames or go back to live camera");
      } catch {
        poseRef.current = null;
        setTracking(false);
        setStatus("No face found in that photo. Try another.");
      }
    };
    img.src = url;
  }

  return (
    <div className="virtual-mirror">
      <div className="virtual-mirror-stage">
        <video
          ref={videoRef}
          className="virtual-mirror-video"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="virtual-mirror-canvas" />
        {!ready ? (
          <div className="virtual-mirror-overlay-msg">{status}</div>
        ) : null}
        {ready && !tracking ? (
          <div className="virtual-mirror-hint">
            Centre your face — the real frame appears on your eyes
          </div>
        ) : null}
      </div>

      <div className="virtual-mirror-bar">
        <p className="meta-sub">
          {status}
          {tracking ? " · Frame on face" : ""}
          {glassesReady ? "" : " · Loading frame…"}
        </p>
        <div className="cta-row">
          <button
            type="button"
            className="btn btn-gold"
            onClick={() => {
              if (photoUrl) URL.revokeObjectURL(photoUrl);
              setPhotoUrl(null);
              photoRef.current = null;
              poseRef.current = null;
              setTracking(false);
              setMode("live");
              setStatus("Starting camera…");
            }}
          >
            Live camera
          </button>
          <label className="btn btn-ghost virtual-mirror-upload">
            Upload photo
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

/** Draw the real product cut-out onto the face pose (Lentiamo-style). */
function drawRealGlasses(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pose: LiveGlassesPose,
  glasses: HTMLImageElement,
) {
  const widthPx = pose.width * w;
  const aspect = glasses.naturalHeight / Math.max(1, glasses.naturalWidth);
  // Packshots are often square; keep lenses from becoming huge vertically.
  const heightPx = widthPx * Math.min(Math.max(aspect, 0.3), 0.7);
  const x = pose.cx * w;
  const y = pose.cy * h;
  const rad = (pose.rotation * Math.PI) / 180;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rad);
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  ctx.drawImage(glasses, -widthPx / 2, -heightPx / 2, widthPx, heightPx);
  ctx.restore();
}

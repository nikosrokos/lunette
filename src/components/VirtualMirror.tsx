"use client";

import { useEffect, useRef, useState } from "react";
import {
  frameCutoutUrl,
  getVideoFaceLandmarker,
  poseFromLandmarks,
  preloadVideoFaceLandmarker,
  type LiveGlassesPose,
} from "@/lib/live-face";
import { frameColors, layoutFromFrame } from "@/lib/glasses-geometry";
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
 * Lentiamo-style virtual mirror: live webcam (or uploaded photo) with
 * product glasses tracked onto the eyes in real time.
 */
export function VirtualMirror({ frame }: VirtualMirrorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);
  const glassesRef = useRef<HTMLImageElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const photoPoseRef = useRef<LiveGlassesPose | null>(null);
  const faceFoundRef = useRef(false);
  const [mode, setMode] = useState<MirrorMode>("live");
  const [status, setStatus] = useState("Starting camera…");
  const [ready, setReady] = useState(false);
  const [faceFound, setFaceFound] = useState(false);
  const [cutoutOk, setCutoutOk] = useState(false);

  function updateFaceFound(next: boolean) {
    if (faceFoundRef.current === next) return;
    faceFoundRef.current = next;
    setFaceFound(next);
  }

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      glassesRef.current = img;
      setCutoutOk(true);
    };
    img.onerror = () => {
      glassesRef.current = null;
      setCutoutOk(false);
    };
    img.src = frameCutoutUrl(frame.image);
    preloadVideoFaceLandmarker();
  }, [frame.image]);

  useEffect(() => {
    if (mode !== "live") return;
    let cancelled = false;

    async function start() {
      setStatus("Allow camera access to try on…");
      setReady(false);
      photoPoseRef.current = null;
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
        setStatus("Live mirror — move your head like on Lentiamo");
      } catch {
        setStatus("Camera blocked. Allow access, or upload a photo instead.");
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

  useEffect(() => {
    let active = true;
    let timer = 0;

    async function loop() {
      const landmarker = await getVideoFaceLandmarker();
      const canvas = canvasRef.current;
      if (!canvas || !active) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const tick = () => {
        if (!active) return;

        if (mode === "live") {
          const video = videoRef.current;
          if (!video || video.readyState < 2) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
          const sourceW = video.videoWidth;
          const sourceH = video.videoHeight;
          if (canvas.width !== sourceW || canvas.height !== sourceH) {
            canvas.width = sourceW;
            canvas.height = sourceH;
          }

          // Draw mirrored video (real mirror).
          ctx.save();
          ctx.translate(sourceW, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, sourceW, sourceH);
          ctx.restore();

          if (landmarker) {
            const result = landmarker.detectForVideo(video, performance.now());
            const face = result.faceLandmarks?.[0];
            if (face?.length) {
              const mirrored = face.map((p) => ({ ...p, x: 1 - p.x }));
              const pose = poseFromLandmarks(mirrored, frame);
              updateFaceFound(pose.ok);
              if (pose.ok) {
                drawGlasses(
                  ctx,
                  sourceW,
                  sourceH,
                  pose,
                  frame,
                  glassesRef.current,
                );
              }
            } else {
              updateFaceFound(false);
            }
          }
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        // Photo mode — static composite, refresh lightly for late cutout.
        const photo = photoRef.current;
        const pose = photoPoseRef.current;
        if (photo && photo.naturalWidth) {
          const sourceW = photo.naturalWidth;
          const sourceH = photo.naturalHeight;
          if (canvas.width !== sourceW || canvas.height !== sourceH) {
            canvas.width = sourceW;
            canvas.height = sourceH;
          }
          ctx.drawImage(photo, 0, 0, sourceW, sourceH);
          if (pose?.ok) {
            drawGlasses(
              ctx,
              sourceW,
              sourceH,
              pose,
              frame,
              glassesRef.current,
            );
            updateFaceFound(true);
          } else {
            updateFaceFound(false);
          }
        }
        timer = window.setTimeout(() => {
          rafRef.current = requestAnimationFrame(tick);
        }, 250);
      };

      rafRef.current = requestAnimationFrame(tick);
    }

    void loop();
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(timer);
    };
  }, [mode, frame, ready, cutoutOk]);

  async function onUpload(file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      photoRef.current = img;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setMode("photo");
      setReady(true);
      setStatus("Reading your face in the photo…");
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const cctx = c.getContext("2d");
        if (!cctx) throw new Error("canvas");
        cctx.drawImage(img, 0, 0);
        const anchor = await detectFaceAnchor(c.toDataURL("image/jpeg", 0.9));
        photoPoseRef.current = {
          cx: anchor.cx,
          cy: anchor.cy,
          width: metricFrameWidthFraction(anchor, frame),
          rotation: anchor.rotation,
          ok: true,
        };
        setStatus("Photo try-on — upload another or switch to live camera");
        setFaceFound(true);
      } catch {
        photoPoseRef.current = null;
        setStatus("Could not find a face in that photo. Try another.");
        setFaceFound(false);
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
          aria-hidden="true"
        />
        <canvas ref={canvasRef} className="virtual-mirror-canvas" />
        {!ready ? (
          <div className="virtual-mirror-overlay-msg">{status}</div>
        ) : null}
        {ready && !faceFound ? (
          <div className="virtual-mirror-hint">Centre your face in the frame</div>
        ) : null}
      </div>

      <div className="virtual-mirror-bar">
        <p className="meta-sub">
          {status}
          {faceFound ? " · Tracking" : ""}
        </p>
        <div className="cta-row">
          <button
            type="button"
            className="btn btn-gold"
            onClick={() => {
              photoRef.current = null;
              photoPoseRef.current = null;
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

function drawGlasses(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pose: LiveGlassesPose,
  frame: Frame,
  cutout: HTMLImageElement | null,
) {
  const widthPx = pose.width * w;
  const x = pose.cx * w;
  const y = pose.cy * h;
  const rad = (pose.rotation * Math.PI) / 180;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rad);
  ctx.shadowColor = "rgba(28, 26, 23, 0.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  if (cutout && cutout.naturalWidth > 0) {
    const aspect = cutout.naturalHeight / cutout.naturalWidth;
    // Product packshots are often square; clamp height so lenses don't dominate.
    const heightPx = widthPx * Math.min(Math.max(aspect, 0.28), 0.62);
    ctx.drawImage(cutout, -widthPx / 2, -heightPx / 2, widthPx, heightPx);
  } else {
    drawParametricFront(ctx, widthPx, frame);
  }
  ctx.restore();
}

function drawParametricFront(
  ctx: CanvasRenderingContext2D,
  widthPx: number,
  frame: Frame,
) {
  const layout = layoutFromFrame(frame);
  const colors = frameColors(frame.material);
  const scale = widthPx / layout.frameWidth;
  const lw = layout.lensWidth * scale;
  const lh = layout.lensHeight * scale;
  const bridge = layout.bridge * scale;
  const rim = Math.max(2, layout.rim * scale);
  const cx = bridge / 2 + lw / 2;

  ctx.lineWidth = rim;
  ctx.strokeStyle = colors.rim;
  ctx.fillStyle = colors.lens;

  roundLens(ctx, -cx, 0, lw, lh, frame.shape);
  roundLens(ctx, cx, 0, lw, lh, frame.shape);

  ctx.beginPath();
  ctx.moveTo(-bridge / 2, -lh * 0.05);
  ctx.lineTo(bridge / 2, -lh * 0.05);
  ctx.stroke();
}

function roundLens(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  lw: number,
  lh: number,
  shape: Frame["shape"],
) {
  ctx.beginPath();
  if (shape === "round" || shape === "aviator") {
    ctx.ellipse(
      cx,
      cy + (shape === "aviator" ? lh * 0.06 : 0),
      lw / 2,
      lh / 2,
      0,
      0,
      Math.PI * 2,
    );
  } else {
    const x = cx - lw / 2;
    const y = cy - lh / 2;
    const r = Math.min(lw, lh) * 0.18;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + lw, y, x + lw, y + lh, r);
    ctx.arcTo(x + lw, y + lh, x, y + lh, r);
    ctx.arcTo(x, y + lh, x, y, r);
    ctx.arcTo(x, y, x + lw, y, r);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
}

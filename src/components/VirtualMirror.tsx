"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
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

const EMPTY_POSE: LiveGlassesPose = {
  cx: 0.5,
  cy: 0.42,
  width: 0.42,
  rotation: 0,
  ok: false,
};

/**
 * Live virtual mirror: webcam (or photo) with glasses tracked on the eyes.
 */
export function VirtualMirror({ frame }: VirtualMirrorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const faceFoundRef = useRef(false);
  const poseRafRef = useRef(0);

  const [mode, setMode] = useState<MirrorMode>("live");
  const [status, setStatus] = useState("Starting camera…");
  const [ready, setReady] = useState(false);
  const [trackerReady, setTrackerReady] = useState(false);
  const [faceFound, setFaceFound] = useState(false);
  const [pose, setPose] = useState<LiveGlassesPose>(EMPTY_POSE);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [aspect, setAspect] = useState(4 / 3);

  function updateFaceFound(next: boolean) {
    if (faceFoundRef.current === next) return;
    faceFoundRef.current = next;
    setFaceFound(next);
  }

  // Throttle React pose updates so the overlay stays smooth.
  function publishPose(next: LiveGlassesPose) {
    cancelAnimationFrame(poseRafRef.current);
    poseRafRef.current = requestAnimationFrame(() => setPose(next));
  }

  useEffect(() => {
    let cancelled = false;
    preloadVideoFaceLandmarker();
    void getVideoFaceLandmarker().then((lm) => {
      if (!cancelled) setTrackerReady(Boolean(lm));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== "live") return;
    let cancelled = false;

    async function start() {
      setStatus("Allow camera access to try on…");
      setReady(false);
      publishPose(EMPTY_POSE);
      updateFaceFound(false);
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
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setAspect(video.videoWidth / video.videoHeight);
        }
        setReady(true);
        setStatus("Camera on — loading face tracker…");
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
    if (mode === "live" && ready && trackerReady) {
      setStatus("Live mirror — centre your face");
    }
  }, [mode, ready, trackerReady]);

  useEffect(() => {
    if (mode !== "live" || !ready) return;
    let active = true;

    async function loop() {
      const landmarker = await getVideoFaceLandmarker();
      if (!landmarker || !active) {
        if (active) {
          setTrackerReady(false);
          setStatus(
            "Face tracker failed to load. Try upload photo, or refresh.",
          );
        }
        return;
      }
      setTrackerReady(true);
      setStatus("Live mirror — centre your face");

      const tick = () => {
        if (!active) return;
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        try {
          const now = performance.now();
          const ts = now <= lastTsRef.current ? lastTsRef.current + 1 : now;
          lastTsRef.current = ts;
          const result = landmarker.detectForVideo(video, ts);
          const face = result.faceLandmarks?.[0];
          if (face?.length) {
            // Video is CSS-mirrored; flip X so overlay matches the mirror.
            const mirrored = face.map((p) => ({ ...p, x: 1 - p.x }));
            const next = poseFromLandmarks(mirrored, frame);
            updateFaceFound(next.ok);
            if (next.ok) publishPose(next);
          } else {
            updateFaceFound(false);
          }
        } catch (error) {
          console.warn("detectForVideo", error);
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    }

    void loop();
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(poseRafRef.current);
    };
  }, [mode, ready, frame]);

  async function onUpload(file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      setPhotoUrl(url);
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setAspect(img.naturalWidth / img.naturalHeight);
      }
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
        const next: LiveGlassesPose = {
          cx: anchor.cx,
          cy: anchor.cy,
          width: metricFrameWidthFraction(anchor, frame),
          rotation: anchor.rotation,
          ok: true,
        };
        publishPose(next);
        updateFaceFound(true);
        setStatus("Photo try-on ready");
      } catch {
        publishPose(EMPTY_POSE);
        updateFaceFound(false);
        setStatus("Could not find a face in that photo. Try another.");
      }
    };
    img.src = url;
  }

  const glassesStyle: CSSProperties = {
    left: `${pose.cx * 100}%`,
    top: `${pose.cy * 100}%`,
    width: `${Math.max(pose.width * 100, 28)}%`,
    transform: `translate(-50%, -50%) rotate(${pose.rotation}deg)`,
    opacity: pose.ok ? 1 : 0,
  };

  return (
    <div className="virtual-mirror">
      <div
        className="virtual-mirror-stage"
        style={{ aspectRatio: `${aspect}` }}
      >
        {mode === "live" ? (
          <video
            ref={videoRef}
            className="virtual-mirror-video is-visible"
            playsInline
            muted
            autoPlay
          />
        ) : photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Your photo" className="virtual-mirror-photo" />
        ) : null}

        <div
          className={`virtual-mirror-glasses${pose.ok ? " is-on" : ""}`}
          style={glassesStyle}
          aria-hidden="true"
        >
          <ParametricGlasses frame={frame} />
        </div>

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
              if (photoUrl) URL.revokeObjectURL(photoUrl);
              setPhotoUrl(null);
              publishPose(EMPTY_POSE);
              updateFaceFound(false);
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

/** SVG glasses from product millimetre sizes — always drawable, no image deps. */
function ParametricGlasses({ frame }: { frame: Frame }) {
  const layout = layoutFromFrame(frame);
  const colors = frameColors(frame.material);
  const { lensWidth, lensHeight, bridge, frameWidth } = layout;
  const viewW = frameWidth;
  const viewH = Math.max(lensHeight * 1.4, 64);
  const cy = viewH / 2;
  const leftCx = viewW / 2 - bridge / 2 - lensWidth / 2;
  const rightCx = viewW / 2 + bridge / 2 + lensWidth / 2;
  const rx = lensWidth / 2;
  const ry = lensHeight / 2;

  return (
    <svg
      className="virtual-mirror-svg"
      viewBox={`0 0 ${viewW} ${viewH}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse
        cx={leftCx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={colors.lens}
        stroke={colors.rim}
        strokeWidth={layout.rim}
      />
      <ellipse
        cx={rightCx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={colors.lens}
        stroke={colors.rim}
        strokeWidth={layout.rim}
      />
      <path
        d={`M ${leftCx + rx} ${cy - ry * 0.08} H ${rightCx - rx}`}
        stroke={colors.rim}
        strokeWidth={layout.rim * 0.95}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

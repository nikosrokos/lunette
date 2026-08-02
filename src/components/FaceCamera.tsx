"use client";

import { useEffect, useRef, useState } from "react";

export interface FaceCaptureResult {
  dataUrl: string;
  imageData: ImageData;
}

interface FaceCameraProps {
  onCaptured: (result: FaceCaptureResult) => void;
  busy?: boolean;
}

type CameraState = "idle" | "requesting" | "live" | "error";

export function FaceCamera({ onCaptured, busy }: FaceCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  async function startCamera() {
    setState("requesting");
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setError("Camera is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setState("live");
    } catch (err) {
      setState("error");
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError("Camera permission denied. Allow camera access and try again.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Could not open the camera. Check permissions and try again.");
      }
    }
  }

  function capture() {
    if (state !== "live" || busy) return;
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("Camera is not ready yet. Wait a moment and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Could not capture frame from camera.");
      return;
    }

    // Mirror to match preview
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    onCaptured({ dataUrl, imageData });
  }

  return (
    <div className="face-camera">
      <div className={`face-camera-stage${state === "live" ? " is-live" : ""}`}>
        <video
          ref={videoRef}
          className="face-camera-video"
          playsInline
          muted
          autoPlay
          aria-label="Face camera preview"
        />
        <div className="face-guide face-guide-overlay" aria-hidden="true" />
        {state !== "live" ? (
          <div className="face-camera-placeholder">
            <p>
              {state === "requesting"
                ? "Starting camera…"
                : "Enable your camera to scan your face"}
            </p>
          </div>
        ) : null}
      </div>

      {error ? <p className="face-camera-error">{error}</p> : null}

      <div className="cta-row" style={{ justifyContent: "center", marginTop: "1.25rem" }}>
        {state !== "live" ? (
          <button
            type="button"
            className="btn btn-gold"
            onClick={startCamera}
            disabled={state === "requesting" || busy}
          >
            {state === "requesting" ? "Opening camera…" : "Enable camera"}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-gold"
            onClick={capture}
            disabled={busy}
          >
            {busy ? "Reading face…" : "Capture"}
          </button>
        )}
      </div>
    </div>
  );
}

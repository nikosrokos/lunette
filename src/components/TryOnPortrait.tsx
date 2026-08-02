"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { fallbackFaceAnchor } from "@/lib/face-landmarks";
import { createGlassesMesh } from "@/lib/glasses-mesh";
import { applyGlassesPose } from "@/lib/glasses-pose";
import type { FaceAnchor, Frame } from "@/lib/types";

interface TryOnPortraitProps {
  faceCapture: string;
  frame: Frame;
  faceAnchor?: FaceAnchor | null;
  label?: string;
  compact?: boolean;
}

export function TryOnPortrait({
  faceCapture,
  frame,
  faceAnchor,
  label,
  compact,
}: TryOnPortraitProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [aspect, setAspect] = useState(
    () => faceAnchor?.aspect ?? 3 / 4,
  );

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled || !img.naturalWidth) return;
      setAspect(img.naturalWidth / img.naturalHeight);
    };
    img.src = faceCapture;
    return () => {
      cancelled = true;
    };
  }, [faceCapture]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    let disposed = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let glasses: THREE.Group | null = null;
    const anchor = faceAnchor ?? fallbackFaceAnchor(aspect);

    const scene = new THREE.Scene();
    // Match MediaPipe image coords: x 0–1 left→right, y 0–1 top→bottom.
    // top=0, bottom=1 → Y increases downward, matching MediaPipe image space.
    const camera = new THREE.OrthographicCamera(0, 1, 0, 1, 0.01, 10);
    camera.position.set(0, 0, 1);

    const key = new THREE.DirectionalLight(0xfff2d8, 1.15);
    key.position.set(0.2, 0.2, 1.2);
    scene.add(key);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } catch {
      setStatus("error");
      return;
    }

    glasses = createGlassesMesh(frame);
    applyGlassesPose(glasses, anchor, frame);
    scene.add(glasses);

    function resize() {
      if (!stage || !renderer) return;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (w < 2 || h < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.left = 0;
      camera.right = 1;
      camera.top = 0;
      camera.bottom = 1;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }

    resize();
    if (!disposed) setStatus("ready");

    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    // Soft idle motion so the 3D frame reads as dimensional.
    let raf = 0;
    const t0 = performance.now();
    const baseMatrix = glasses.matrix.clone();
    function tick(now: number) {
      if (disposed || !renderer || !glasses) return;
      const t = (now - t0) / 1000;
      const wobble = new THREE.Matrix4().makeRotationY(Math.sin(t * 1.2) * 0.035);
      glasses.matrix.copy(baseMatrix).multiply(wobble);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (glasses) scene.remove(glasses);
      glasses?.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
      renderer?.dispose();
    };
  }, [faceCapture, frame, faceAnchor, aspect]);

  return (
    <div className={`tryon-portrait${compact ? " is-compact" : ""}`}>
      <div
        className="tryon-portrait-stage"
        ref={stageRef}
        style={{ aspectRatio: `${aspect}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={faceCapture} alt="Your face scan" className="tryon-face" />
        <canvas
          ref={canvasRef}
          className={`tryon-webgl${status === "ready" ? " is-ready" : ""}`}
          aria-hidden="true"
        />
        {status === "loading" ? (
          <p className="tryon-status">Building 3D frame…</p>
        ) : null}
        {status === "error" ? (
          <p className="tryon-cutout-error">
            3D try-on could not start on this device. Rescan and try again.
          </p>
        ) : null}
      </div>
      {label ? <p className="meta-sub tryon-portrait-label">{label}</p> : null}
    </div>
  );
}

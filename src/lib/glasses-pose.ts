import * as THREE from "three";
import type { FaceAnchor, Frame } from "./types";
import { unitsPerMm } from "./glasses-geometry";
import { cross, dist2, length, mid, normalize, sub, type Vec3 } from "./vec3";

/**
 * Place a millimetre-space glasses mesh onto MediaPipe image landmarks.
 * Coordinate system: x right, y down (image), z toward camera (MediaPipe).
 */
export function applyGlassesPose(
  glasses: THREE.Object3D,
  anchor: FaceAnchor,
  frame: Frame,
) {
  const pose = anchor.pose3d;
  if (!pose) {
    // 2D fallback: centre + rotate in image plane
    glasses.position.set(anchor.cx, anchor.cy, -0.02);
    glasses.rotation.set(0, 0, (anchor.rotation * Math.PI) / 180);
    const approx = (anchor.width * MEAN_FALLBACK) / Math.max(1, frame.frameWidth);
    glasses.scale.setScalar(approx);
    return;
  }

  const leftIris = pose.leftIris as Vec3;
  const rightIris = pose.rightIris as Vec3;
  const leftOuter = pose.leftOuter as Vec3;
  const rightOuter = pose.rightOuter as Vec3;
  const bridge = pose.bridge as Vec3;
  const leftCheek = pose.leftCheek as Vec3;
  const rightCheek = pose.rightCheek as Vec3;

  const pd = dist2(leftIris, rightIris);
  const outer = dist2(leftOuter, rightOuter);
  const scale = unitsPerMm(pd > 1e-6 ? pd : null, outer);

  // Basis from eyes + face depth
  const xAxis = normalize(sub(rightOuter, leftOuter));
  const cheekMid = mid(leftCheek, rightCheek);
  const downGuess = normalize(sub(cheekMid, bridge));
  // Image Y is down; keep a stable "down" on the face.
  let yAxis = downGuess;
  if (length(yAxis) < 1e-6 || Math.abs(yAxis.x * xAxis.x + yAxis.y * xAxis.y) > 0.95) {
    yAxis = { x: 0, y: 1, z: 0 };
  }
  // Re-orthogonalize
  let zAxis = normalize(cross(xAxis, yAxis));
  // MediaPipe: nose tip is usually more negative z (closer). Temples go +z (away).
  // We want glasses front facing camera → local -Z of mesh should point toward camera (smaller z in image space?).
  // Our mesh temples extend +Z; we want that toward ears (into the head / larger depth away from camera).
  // Face forward (toward camera) ≈ -zAxis if zAxis points into the head.
  const eyeMid = mid(leftIris, rightIris);
  // Prefer z pointing from eye mid toward cheek mid depth (into face)
  const intoFace = sub(
    { x: cheekMid.x, y: eyeMid.y, z: (leftCheek.z + rightCheek.z) / 2 },
    { x: eyeMid.x, y: eyeMid.y, z: eyeMid.z },
  );
  if (intoFace.z * zAxis.z + intoFace.x * zAxis.x + intoFace.y * zAxis.y < 0) {
    zAxis = { x: -zAxis.x, y: -zAxis.y, z: -zAxis.z };
  }
  yAxis = normalize(cross(zAxis, xAxis));
  zAxis = normalize(cross(xAxis, yAxis));

  // Rest on the nose: a touch below the iris line, at bridge depth.
  const origin = {
    x: bridge.x,
    y: eyeMid.y + outer * 0.04,
    z: (bridge.z + eyeMid.z) / 2,
  };

  const m = new THREE.Matrix4();
  m.makeBasis(
    new THREE.Vector3(xAxis.x, xAxis.y, xAxis.z),
    new THREE.Vector3(yAxis.x, yAxis.y, yAxis.z),
    new THREE.Vector3(zAxis.x, zAxis.y, zAxis.z),
  );
  m.scale(new THREE.Vector3(scale, scale, scale));
  m.setPosition(origin.x, origin.y, origin.z);

  glasses.matrixAutoUpdate = false;
  glasses.matrix.copy(m);
}

const MEAN_FALLBACK = 0.01;

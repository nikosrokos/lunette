import * as THREE from "three";
import type { Frame } from "./types";
import {
  frameColors,
  layoutFromFrame,
  lensCentersX,
  type GlassesLayoutMm,
} from "./glasses-geometry";

/** Build a parametric sunglasses Group in millimetre local space. */
export function createGlassesMesh(frame: Frame): THREE.Group {
  const layout = layoutFromFrame(frame);
  const colors = frameColors(frame.material);
  const group = new THREE.Group();
  group.name = `glasses-${frame.id}`;

  const rimMat = new THREE.MeshStandardMaterial({
    color: colors.rim,
    metalness: frame.material === "metal" || frame.material === "titanium" ? 0.75 : 0.08,
    roughness: frame.material === "acetate" ? 0.55 : 0.35,
  });
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: colors.lens,
    transparent: true,
    opacity: 0.72,
    metalness: 0.05,
    roughness: 0.2,
    transmission: 0.15,
    thickness: 1.2,
    side: THREE.DoubleSide,
  });
  const templeMat = new THREE.MeshStandardMaterial({
    color: colors.temple,
    metalness: rimMat.metalness,
    roughness: rimMat.roughness,
  });

  const { left, right } = lensCentersX(layout);
  group.add(makeLensAssembly(left, layout, rimMat, lensMat));
  group.add(makeLensAssembly(right, layout, rimMat, lensMat));
  group.add(makeBridge(layout, rimMat));
  group.add(makeTemple(left - layout.lensWidth / 2, -1, layout, templeMat));
  group.add(makeTemple(right + layout.lensWidth / 2, 1, layout, templeMat));

  return group;
}

function makeLensAssembly(
  cx: number,
  layout: GlassesLayoutMm,
  rimMat: THREE.Material,
  lensMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(cx, 0, 0);

  const shape = lensShape(layout);
  const lensGeom = new THREE.ShapeGeometry(shape, 24);
  const lens = new THREE.Mesh(lensGeom, lensMat);
  lens.position.z = 0.4;
  g.add(lens);

  const rimPath = new THREE.Path(shape.getPoints(48));
  // Extrude a thin rim from a stroked outline via tube on curve.
  const pts = shape.getPoints(64).map((p) => new THREE.Vector3(p.x, p.y, 0));
  // Close loop
  if (pts.length > 1) pts.push(pts[0].clone());
  const curve = new THREE.CatmullRomCurve3(pts, true);
  const rim = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 96, layout.rim * 0.5, 8, true),
    rimMat,
  );
  g.add(rim);

  // Subtle brow bar thickening for wayfarer / acetate look
  if (layout.shape === "wayfarer" || layout.shape === "square") {
    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(layout.lensWidth * 0.92, layout.rim * 1.1, layout.rim),
      rimMat,
    );
    brow.position.set(0, layout.lensHeight * 0.42, 0.2);
    g.add(brow);
  }

  void rimPath;
  return g;
}

function makeBridge(layout: GlassesLayoutMm, mat: THREE.Material): THREE.Mesh {
  const width = layout.bridge * 0.95;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, layout.rim * 1.15, layout.rim * 0.9),
    mat,
  );
  mesh.position.set(0, layout.lensHeight * 0.12, 0.15);
  return mesh;
}

function makeTemple(
  attachX: number,
  side: 1 | -1,
  layout: GlassesLayoutMm,
  mat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  const hinge = new THREE.Mesh(
    new THREE.SphereGeometry(layout.rim * 0.55, 10, 10),
    mat,
  );
  hinge.position.set(attachX, layout.lensHeight * 0.08, 0);
  g.add(hinge);

  // Visible front portion of temple sweeping back in +Z (toward ears / away from camera in our face space we flip later).
  const length = Math.min(42, layout.templeLength * 0.28);
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(layout.rim * 0.85, layout.rim * 0.7, length),
    mat,
  );
  arm.position.set(
    attachX + side * layout.rim * 0.2,
    layout.lensHeight * 0.08,
    length / 2 + 1.2,
  );
  // Slight outward flare
  arm.rotation.y = side * -0.18;
  g.add(arm);
  return g;
}

function lensShape(layout: GlassesLayoutMm): THREE.Shape {
  const hw = layout.lensWidth / 2;
  const hh = layout.lensHeight / 2;
  const shape = new THREE.Shape();

  switch (layout.shape) {
    case "round": {
      shape.absellipse(0, 0, hw, hh, 0, Math.PI * 2, false, 0);
      break;
    }
    case "aviator": {
      // Teardrop-ish: wider top, pointed bottom
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 48; i++) {
        const t = (i / 48) * Math.PI * 2;
        const squash = 0.75 + 0.25 * Math.cos(t);
        const drop = t > Math.PI ? 1.15 : 0.92;
        pts.push(
          new THREE.Vector2(
            Math.cos(t) * hw * squash,
            Math.sin(t) * hh * drop - hh * 0.08,
          ),
        );
      }
      shape.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].y);
      shape.closePath();
      break;
    }
    case "cat-eye": {
      shape.moveTo(-hw, -hh * 0.35);
      shape.bezierCurveTo(-hw, hh * 0.2, -hw * 0.4, hh, -hw * 0.05, hh * 0.85);
      shape.bezierCurveTo(hw * 0.15, hh * 1.05, hw * 0.75, hh * 0.95, hw, hh * 0.55);
      shape.bezierCurveTo(hw * 1.02, 0, hw * 0.85, -hh * 0.7, hw * 0.2, -hh * 0.75);
      shape.bezierCurveTo(-hw * 0.35, -hh * 0.8, -hw * 0.95, -hh * 0.55, -hw, -hh * 0.35);
      break;
    }
    case "rectangle": {
      roundedRect(shape, -hw, -hh * 0.85, layout.lensWidth, layout.lensHeight * 0.85, hw * 0.18);
      break;
    }
    case "square": {
      roundedRect(shape, -hw, -hh, layout.lensWidth, layout.lensHeight, hw * 0.16);
      break;
    }
    case "wayfarer":
    default: {
      // Trapezoid: wider bottom than classic wayfarer inverted — classic is wider top
      shape.moveTo(-hw * 0.92, hh * 0.85);
      shape.lineTo(hw * 0.92, hh * 0.85);
      shape.lineTo(hw, -hh * 0.75);
      shape.quadraticCurveTo(0, -hh * 0.95, -hw, -hh * 0.75);
      shape.closePath();
      break;
    }
  }
  return shape;
}

function roundedRect(
  shape: THREE.Shape,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  shape.moveTo(x + radius, y);
  shape.lineTo(x + w - radius, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + radius);
  shape.lineTo(x + w, y + h - radius);
  shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  shape.lineTo(x + radius, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
}

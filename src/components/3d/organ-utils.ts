import * as THREE from 'three';
import type { RiskLevel } from '@/lib/health-types';

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#4ade80',
  moderate: '#facc15',
  high: '#f97316',
  critical: '#ef4444',
};

export const ORGAN_LABELS: Record<string, string> = {
  brain: 'Brain',
  heart: 'Heart',
  lungs: 'Lungs',
  liver: 'Liver',
  kidneys: 'Kidneys',
  'body-fat': 'Body Comp',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Healthy',
  moderate: 'Mild strain',
  high: 'At risk',
  critical: 'Critical',
};

export function getEmissiveIntensity(risk: RiskLevel, hovered: boolean): number {
  const base = risk === 'critical' ? 4.0 : risk === 'high' ? 3.0 : risk === 'moderate' ? 2.0 : 1.2;
  return hovered ? base * 1.8 : base;
}

export function getPulseAmount(risk: RiskLevel): number {
  return risk === 'critical' ? 0.08 : risk === 'high' ? 0.04 : 0.02;
}

/** Create a smooth brain-like surface using perturbed sphere */
export function createBrainGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 32, 24);
  const pos = geo.attributes.position;
  const normal = geo.attributes.normal;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Create sulci (grooves) using sine waves
    const fold1 = Math.sin(y * 8) * 0.06;
    const fold2 = Math.sin(x * 6 + z * 4) * 0.04;
    const fold3 = Math.cos(y * 12 + x * 3) * 0.03;
    const bump = fold1 + fold2 + fold3;

    // Flatten bottom slightly
    const flattenY = y < -0.3 ? (1 + (y + 0.3) * 0.5) : 1;

    // Create hemisphere split (longitudinal fissure)
    const fissure = Math.exp(-Math.pow(x * 8, 2)) * 0.08;

    const nx = normal.getX(i);
    const ny = normal.getY(i);
    const nz = normal.getZ(i);

    pos.setXYZ(
      i,
      x + nx * (bump - fissure) * flattenY,
      y * flattenY + ny * bump * 0.5,
      z + nz * bump * flattenY,
    );
  }

  geo.computeVertexNormals();
  return geo;
}

/** Create anatomical heart shape with ventricles */
export function createHeartGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  // Heart outline using bezier curves
  shape.moveTo(0, -0.6);
  shape.bezierCurveTo(0, -0.8, -0.5, -1.0, -0.5, -0.6);
  shape.bezierCurveTo(-0.5, -0.2, 0, 0.1, 0, 0.4);
  shape.bezierCurveTo(0, 0.1, 0.5, -0.2, 0.5, -0.6);
  shape.bezierCurveTo(0.5, -1.0, 0, -0.8, 0, -0.6);

  const extrudeSettings = {
    depth: 0.5,
    bevelEnabled: true,
    bevelSegments: 6,
    steps: 2,
    bevelSize: 0.15,
    bevelThickness: 0.15,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

/** Create a lung lobe shape */
export function createLungGeometry(side: 'left' | 'right'): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 20, 16);
  const pos = geo.attributes.position;
  const normal = geo.attributes.normal;
  const mirror = side === 'left' ? 1 : -1;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Flatten the medial side (where heart sits)
    const medialFlatten = x * mirror > 0 ? 1 : 0.6 + 0.4 * Math.abs(x);

    // Create lobe divisions with horizontal grooves
    const upperLobe = y > 0.2 ? Math.sin((y - 0.2) * 4) * 0.05 : 0;
    const lowerLobe = y < -0.1 ? Math.sin((y + 0.1) * 3) * 0.04 : 0;
    // Right lung has 3 lobes, left has 2
    const middleLobe = side === 'right' && y > -0.1 && y < 0.2
      ? -Math.exp(-Math.pow((y - 0.05) * 6, 2)) * 0.12
      : 0;

    // Taper top
    const taper = y > 0.6 ? 1 - (y - 0.6) * 0.8 : 1;

    // Rounded bottom
    const bottom = y < -0.7 ? 1 - Math.pow((y + 0.7) * 2, 2) * 0.3 : 1;

    // Slight concavity on inner side for heart
    const heartSpace = x * mirror < -0.2 && Math.abs(y + 0.1) < 0.4
      ? 1 + x * mirror * 0.3
      : 1;

    const nx = normal.getX(i);
    const nz = normal.getZ(i);

    pos.setXYZ(
      i,
      x * medialFlatten * taper * bottom * heartSpace + nx * (upperLobe + lowerLobe + middleLobe),
      y,
      z * taper * bottom * 0.7 + nz * (upperLobe + lowerLobe),
    );
  }

  geo.computeVertexNormals();
  return geo;
}

/** Create liver wedge shape */
export function createLiverGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 20, 16);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Flatten vertically (liver is flat)
    y *= 0.35;

    // Wider on right side, tapers to left
    const widthMod = 1 + x * 0.4;

    // Slight dome on top
    if (y > 0) {
      y *= 1 + (1 - Math.abs(x)) * 0.3;
    }

    // Concave bottom surface
    if (y < 0) {
      y *= 0.8;
    }

    // Create two lobes with a notch
    const notch = Math.exp(-Math.pow((x + 0.3) * 5, 2)) * 0.15;

    pos.setXYZ(i, x * widthMod, y - notch, z * 0.65);
  }

  geo.computeVertexNormals();
  return geo;
}

/** Create kidney bean shape */
export function createKidneyGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 18, 14);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    const z = pos.getZ(i);

    // Elongate vertically
    y *= 1.4;

    // Create bean indent on one side
    const indent = Math.exp(-Math.pow(y * 2, 2)) * 0.35;
    if (x > 0) {
      x -= indent;
    }

    // Flatten front-to-back
    pos.setXYZ(i, x, y, z * 0.55);
  }

  geo.computeVertexNormals();
  return geo;
}

/** Create torso geometry with elliptical cross-sections */
export function createTorsoGeometry(
  slices: { y: number; rx: number; rz: number; zOff?: number }[],
  radialSegs = 24,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s < slices.length; s++) {
    const { y, rx, rz, zOff = 0 } = slices[s];
    for (let r = 0; r <= radialSegs; r++) {
      const theta = (r / radialSegs) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      positions.push(cos * rx, y, sin * rz + zOff);
      const nx = cos / rx;
      const nz = sin / rz;
      const len = Math.sqrt(nx * nx + nz * nz) || 1;
      normals.push(nx / len, 0, nz / len);
    }
  }

  const vertsPerSlice = radialSegs + 1;
  for (let s = 0; s < slices.length - 1; s++) {
    for (let r = 0; r < radialSegs; r++) {
      const a = s * vertsPerSlice + r;
      const b = a + 1;
      const c = a + vertsPerSlice;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

export function createLatheBody(profile: [number, number][], segments = 32): THREE.LatheGeometry {
  const points = profile.map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(points, segments);
}

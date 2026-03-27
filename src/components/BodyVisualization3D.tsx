import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { OrganRisk, RiskLevel } from '@/lib/health-types';

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#4ade80',
  moderate: '#facc15',
  high: '#f97316',
  critical: '#ef4444',
};

const ORGAN_LABELS: Record<string, string> = {
  brain: 'Brain',
  heart: 'Heart',
  lungs: 'Lungs',
  liver: 'Liver',
  kidneys: 'Kidneys',
  'body-fat': 'Body Comp',
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Healthy',
  moderate: 'Mild strain',
  high: 'At risk',
  critical: 'Critical',
};

function createLatheBody(profile: [number, number][], segments = 32): THREE.LatheGeometry {
  const points = profile.map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(points, segments);
}

function createTorsoGeometry(
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

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/* ── Floating Particles ── */
function Particles({ count = 40 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 1.2;
      arr[i * 3 + 1] = Math.random() * 2.2 - 0.2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    return g;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const y = pos.getY(i);
      pos.setY(i, y + 0.001 + Math.sin(state.clock.elapsedTime + i) * 0.0003);
      if (pos.getY(i) > 2.2) pos.setY(i, -0.2);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.008} color="#c4b5fd" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

/* ── Human Body ── */
function HumanBody() {
  const wc = '#9b8ec7';

  const headGeo = useMemo(() => createLatheBody([
    [0, 0.24], [0.06, 0.22], [0.12, 0.18], [0.16, 0.12], [0.17, 0.06],
    [0.17, 0], [0.16, -0.06], [0.14, -0.1], [0.13, -0.14], [0.11, -0.17],
    [0.10, -0.19], [0, -0.19],
  ], 24), []);

  const torsoGeo = useMemo(() => createTorsoGeometry([
    { y: 0.44, rx: 0.07, rz: 0.06 },
    { y: 0.40, rx: 0.10, rz: 0.07 },
    { y: 0.35, rx: 0.18, rz: 0.09 },
    { y: 0.30, rx: 0.28, rz: 0.11, zOff: 0.01 },
    { y: 0.24, rx: 0.32, rz: 0.13, zOff: 0.02 },
    { y: 0.18, rx: 0.33, rz: 0.15, zOff: 0.03 },
    { y: 0.12, rx: 0.32, rz: 0.14, zOff: 0.02 },
    { y: 0.06, rx: 0.30, rz: 0.13, zOff: 0.01 },
    { y: 0.00, rx: 0.28, rz: 0.12 },
    { y: -0.06, rx: 0.25, rz: 0.11 },
    { y: -0.12, rx: 0.24, rz: 0.10 },
    { y: -0.18, rx: 0.23, rz: 0.10 },
    { y: -0.24, rx: 0.25, rz: 0.11 },
    { y: -0.30, rx: 0.28, rz: 0.12, zOff: -0.01 },
    { y: -0.36, rx: 0.27, rz: 0.13, zOff: -0.01 },
    { y: -0.40, rx: 0.22, rz: 0.11 },
    { y: -0.44, rx: 0.15, rz: 0.08 },
  ], 24), []);

  /* Breathing animation for torso */
  const torsoRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!torsoRef.current) return;
    const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.008;
    torsoRef.current.scale.set(breathe, 1, breathe);
  });

  const renderLimb = (
    pos: [number, number, number],
    rot: [number, number, number],
    segments: { rTop: number; rBot: number; len: number }[],
  ) => {
    let ly = 0;
    return (
      <group position={pos} rotation={rot as unknown as THREE.Euler}>
        {segments.map((seg, idx) => {
          const my = ly - seg.len / 2;
          ly -= seg.len;
          return (
            <group key={idx}>
              <mesh position={[0, my, 0]}>
                <cylinderGeometry args={[seg.rTop, seg.rBot, seg.len, 14, 1, true]} />
                <meshStandardMaterial color="#ddd5e8" transparent opacity={0.07} roughness={0.9} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, my, 0]}>
                <cylinderGeometry args={[seg.rTop, seg.rBot, seg.len, 14, 1, true]} />
                <meshBasicMaterial color={wc} wireframe transparent opacity={0.22} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  };

  return (
    <group>
      <group position={[0, 1.78, 0]}>
        <mesh geometry={headGeo}>
          <meshStandardMaterial color="#ddd5e8" transparent opacity={0.07} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={headGeo}>
          <meshBasicMaterial color={wc} wireframe transparent opacity={0.25} />
        </mesh>
        {[-0.065, 0.065].map((ex) => (
          <mesh key={ex} position={[ex, 0.02, 0.14]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#7c6fc4" emissive="#7c6fc4" emissiveIntensity={1} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>

      <mesh position={[0, 1.54, 0]}>
        <cylinderGeometry args={[0.065, 0.08, 0.1, 14, 1, true]} />
        <meshBasicMaterial color={wc} wireframe transparent opacity={0.2} />
      </mesh>
      <mesh position={[0, 1.54, 0]}>
        <cylinderGeometry args={[0.065, 0.08, 0.1, 14, 1, true]} />
        <meshStandardMaterial color="#ddd5e8" transparent opacity={0.05} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      <group ref={torsoRef} position={[0, 1.06, 0]}>
        <mesh geometry={torsoGeo}>
          <meshStandardMaterial color="#ddd5e8" transparent opacity={0.06} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={torsoGeo}>
          <meshBasicMaterial color={wc} wireframe transparent opacity={0.22} />
        </mesh>
      </group>

      {renderLimb([-0.35, 1.36, 0], [0, 0, Math.PI / 2 + 0.15], [
        { rTop: 0.07, rBot: 0.065, len: 0.28 },
        { rTop: 0.06, rBot: 0.05, len: 0.26 },
        { rTop: 0.045, rBot: 0.03, len: 0.12 },
      ])}
      {renderLimb([0.35, 1.36, 0], [0, 0, -(Math.PI / 2 + 0.15)], [
        { rTop: 0.07, rBot: 0.065, len: 0.28 },
        { rTop: 0.06, rBot: 0.05, len: 0.26 },
        { rTop: 0.045, rBot: 0.03, len: 0.12 },
      ])}
      {renderLimb([-0.13, 0.64, 0], [0, 0, 0.03], [
        { rTop: 0.10, rBot: 0.08, len: 0.38 },
        { rTop: 0.075, rBot: 0.06, len: 0.36 },
        { rTop: 0.055, rBot: 0.05, len: 0.1 },
      ])}
      {renderLimb([0.13, 0.64, 0], [0, 0, -0.03], [
        { rTop: 0.10, rBot: 0.08, len: 0.38 },
        { rTop: 0.075, rBot: 0.06, len: 0.36 },
        { rTop: 0.055, rBot: 0.05, len: 0.1 },
      ])}

      {[-0.13, 0.13].map((fx) => (
        <mesh key={fx} position={[fx, -0.18, 0.04]} scale={[0.055, 0.025, 0.09]}>
          <boxGeometry args={[1, 1, 1, 3, 1, 3]} />
          <meshBasicMaterial color={wc} wireframe transparent opacity={0.18} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Organ Tooltip ── */
function OrganTooltip({ risk, visible }: { risk: OrganRisk; visible: boolean }) {
  if (!visible) return null;
  return (
    <Html center distanceFactor={3} style={{ pointerEvents: 'none' }}>
      <div
        className="px-3 py-2 rounded-xl text-[11px] font-medium whitespace-nowrap shadow-lg border backdrop-blur-sm"
        style={{
          background: 'rgba(255,255,255,0.92)',
          borderColor: RISK_COLORS[risk.risk],
          color: '#1a1a2e',
          transform: 'translateY(-24px)',
        }}
      >
        <span style={{ color: RISK_COLORS[risk.risk] }}>●</span>{' '}
        {ORGAN_LABELS[risk.organ] || risk.label}: {RISK_LABELS[risk.risk]}
        <span className="ml-1.5 opacity-60">{risk.score}%</span>
      </div>
    </Html>
  );
}

/* ── Organ: Lungs ── */
function LungShape({ risk, side, onClick }: { risk: OrganRisk; side: 'left' | 'right'; onClick?: (r: OrganRisk) => void }) {
  const x = side === 'left' ? -0.15 : 0.15;
  const c = RISK_COLORS[risk.risk];
  const bi = risk.risk === 'critical' ? 2.5 : risk.risk === 'high' ? 1.8 : risk.risk === 'moderate' ? 1.2 : 0.5;
  const [h, setH] = useState(false);
  const i = h ? bi * 1.6 : bi;
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    // Breathing animation
    const breathe = 1 + Math.sin(s.clock.elapsedTime * 0.8) * 0.04;
    ref.current.scale.setScalar(breathe);
  });

  return (
    <group ref={ref} position={[x, 1.22, 0.02]}
      onClick={(e) => { e.stopPropagation(); onClick?.(risk); }}
      onPointerOver={(e) => { e.stopPropagation(); setH(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setH(false); document.body.style.cursor = 'default'; }}>
      {side === 'left' && <OrganTooltip risk={risk} visible={h} />}
      <mesh scale={[0.10, 0.16, 0.08]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={i} transparent opacity={h ? 0.75 : 0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.08, 0.01]} scale={[0.07, 0.09, 0.06]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={i * 0.7} transparent opacity={h ? 0.6 : 0.45} roughness={0.4} />
      </mesh>
      {/* Outer glow shell */}
      <mesh scale={[0.13, 0.19, 0.11]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={c} transparent opacity={h ? 0.15 : 0.06} />
      </mesh>
    </group>
  );
}

/* ── Organ: Heart ── */
function HeartShape({ risk, onClick }: { risk: OrganRisk; onClick?: (r: OrganRisk) => void }) {
  const c = RISK_COLORS[risk.risk];
  const bi = risk.risk === 'critical' ? 2.5 : risk.risk === 'high' ? 1.8 : risk.risk === 'moderate' ? 1.2 : 0.5;
  const [h, setH] = useState(false);
  const i = h ? bi * 1.6 : bi;
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const bpm = risk.risk === 'critical' ? 5 : risk.risk === 'high' ? 4 : 3;
    ref.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * bpm) * 0.06 * (risk.risk === 'critical' ? 2 : 1));
  });

  return (
    <group ref={ref} position={[-0.05, 1.15, 0.1]}
      onClick={(e) => { e.stopPropagation(); onClick?.(risk); }}
      onPointerOver={(e) => { e.stopPropagation(); setH(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setH(false); document.body.style.cursor = 'default'; }}>
      <OrganTooltip risk={risk} visible={h} />
      <mesh position={[-0.025, 0.015, 0]} scale={[0.04, 0.05, 0.035]}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={i} transparent opacity={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0.025, 0.015, 0]} scale={[0.04, 0.05, 0.035]}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={i} transparent opacity={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.03, 0]} scale={[0.03, 0.04, 0.028]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[1, 1.5, 12]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={i * 0.9} transparent opacity={0.8} roughness={0.3} />
      </mesh>
      {/* Glow halo */}
      <mesh scale={[0.08, 0.08, 0.06]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={c} transparent opacity={h ? 0.18 : 0.08} />
      </mesh>
    </group>
  );
}

/* ── Generic glowing organ ── */
function GlowOrgan({ risk, position, scale, rotation, onClick, showTooltip = true }: {
  risk: OrganRisk; position: [number, number, number]; scale: [number, number, number];
  rotation?: [number, number, number]; onClick?: (r: OrganRisk) => void; showTooltip?: boolean;
}) {
  const c = RISK_COLORS[risk.risk];
  const bi = risk.risk === 'critical' ? 2.5 : risk.risk === 'high' ? 1.8 : risk.risk === 'moderate' ? 1.2 : 0.5;
  const [h, setH] = useState(false);
  const i = h ? bi * 1.6 : bi;
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const p = risk.risk === 'critical' ? 0.08 : risk.risk === 'high' ? 0.04 : 0.02;
    const sc = 1 + Math.sin(s.clock.elapsedTime * 1.5) * p;
    ref.current.scale.set(scale[0] * sc, scale[1] * sc, scale[2] * sc);
    if (glowRef.current) {
      const gsc = 1 + Math.sin(s.clock.elapsedTime * 1.5 + Math.PI) * p * 1.5;
      glowRef.current.scale.set(scale[0] * 1.4 * gsc, scale[1] * 1.4 * gsc, scale[2] * 1.4 * gsc);
    }
  });

  return (
    <group>
      <mesh ref={ref} position={position} rotation={rotation as unknown as THREE.Euler} scale={scale}
        onClick={(e) => { e.stopPropagation(); onClick?.(risk); }}
        onPointerOver={(e) => { e.stopPropagation(); setH(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setH(false); document.body.style.cursor = 'default'; }}>
        {showTooltip && <OrganTooltip risk={risk} visible={h} />}
        <sphereGeometry args={[1, 18, 18]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={i} transparent opacity={h ? 0.85 : 0.6} roughness={0.35} />
      </mesh>
      {/* Outer glow */}
      <mesh ref={glowRef} position={position} rotation={rotation as unknown as THREE.Euler} scale={scale.map(s => s * 1.4) as [number, number, number]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={c} transparent opacity={h ? 0.15 : 0.05} />
      </mesh>
    </group>
  );
}

/* ── Scene ── */
function Scene({ risks, onOrganClick }: { risks: OrganRisk[]; onOrganClick?: (organ: OrganRisk) => void }) {
  const get = (id: string) => risks.find((r) => r.organ === id)!;

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 5, 5]} intensity={0.55} />
      <directionalLight position={[-3, 4, -2]} intensity={0.25} color="#c4b5fd" />
      <pointLight position={[0, 2.5, 3]} intensity={0.4} color="#f0abfc" />
      <pointLight position={[0, -0.5, 2]} intensity={0.15} color="#67e8f9" />

      <Float speed={0.3} rotationIntensity={0.008} floatIntensity={0.06}>
        <group position={[0, -0.8, 0]}>
          <HumanBody />
          <Particles count={50} />

          <GlowOrgan risk={get('brain')} position={[0, 1.78, 0]} scale={[0.12, 0.14, 0.13]} onClick={onOrganClick} />
          <LungShape risk={get('lungs')} side="left" onClick={onOrganClick} />
          <LungShape risk={get('lungs')} side="right" onClick={onOrganClick} />
          <HeartShape risk={get('heart')} onClick={onOrganClick} />
          <GlowOrgan risk={get('liver')} position={[0.12, 0.98, 0.06]} scale={[0.10, 0.06, 0.055]} rotation={[0, 0, -0.3]} onClick={onOrganClick} />
          <GlowOrgan risk={get('kidneys')} position={[-0.14, 0.92, -0.04]} scale={[0.045, 0.06, 0.035]} onClick={onOrganClick} />
          <GlowOrgan risk={get('kidneys')} position={[0.14, 0.92, -0.04]} scale={[0.045, 0.06, 0.035]} showTooltip={false} onClick={onOrganClick} />
          <GlowOrgan risk={get('body-fat')} position={[0, 0.82, 0.1]} scale={[0.18, 0.09, 0.09]} onClick={onOrganClick} />
        </group>
      </Float>

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={1.5}
        maxDistance={5}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.9}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </>
  );
}

/* ── Export ── */
export default function BodyVisualization3D({ risks, onOrganClick }: { risks: OrganRisk[]; onOrganClick?: (organ: OrganRisk) => void }) {
  return (
    <div className="w-full h-full min-h-[460px] relative">
      <Canvas camera={{ position: [0, 1, 3], fov: 36 }} style={{ background: 'transparent' }} gl={{ antialias: true, alpha: true }}>
        <Scene risks={risks} onOrganClick={onOrganClick} />
      </Canvas>
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-primary/20 rounded-tl-md pointer-events-none" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-primary/20 rounded-tr-md pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-primary/20 rounded-bl-md pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-primary/20 rounded-br-md pointer-events-none" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/50 pointer-events-none">
        Drag to rotate · Scroll to zoom · Hover organs for details
      </div>
    </div>
  );
}

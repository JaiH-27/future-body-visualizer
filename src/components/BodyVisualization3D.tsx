import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { OrganRisk } from '@/lib/health-types';
import { createLatheBody, createTorsoGeometry } from './3d/organ-utils';
import { BrainOrgan } from './3d/BrainOrgan';
import { HeartOrgan } from './3d/HeartOrgan';
import { LungOrgan } from './3d/LungOrgan';
import { LiverOrgan } from './3d/LiverOrgan';
import { KidneyOrgan } from './3d/KidneyOrgan';
import { BodyFatOrgan } from './3d/BodyFatOrgan';

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

/* ── Human Body (wireframe shell) ── */
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

          <BrainOrgan risk={get('brain')} onClick={onOrganClick} />
          <LungOrgan risk={get('lungs')} side="left" onClick={onOrganClick} />
          <LungOrgan risk={get('lungs')} side="right" onClick={onOrganClick} />
          <HeartOrgan risk={get('heart')} onClick={onOrganClick} />
          <LiverOrgan risk={get('liver')} onClick={onOrganClick} />
          <KidneyOrgan risk={get('kidneys')} side="left" onClick={onOrganClick} />
          <KidneyOrgan risk={get('kidneys')} side="right" onClick={onOrganClick} />
          <BodyFatOrgan risk={get('body-fat')} onClick={onOrganClick} />
        </group>
      </Float>

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={1.2}
        maxDistance={4}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
        autoRotate
        autoRotateSpeed={0.3}
        target={[0, 0.2, 0]}
      />
    </>
  );
}

/* ── Export ── */
export default function BodyVisualization3D({ risks, onOrganClick, highlightedOrgan }: {
  risks: OrganRisk[];
  onOrganClick?: (organ: OrganRisk) => void;
  highlightedOrgan?: string | null;
}) {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        camera={{ position: [0.3, 1.1, 2.2], fov: 40 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene risks={risks} onOrganClick={onOrganClick} />
      </Canvas>
      <div className="absolute bottom-3 right-3 text-[9px] text-muted-foreground/40 pointer-events-none font-mono">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}

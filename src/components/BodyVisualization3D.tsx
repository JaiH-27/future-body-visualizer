import { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, MeshTransmissionMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { OrganRisk, RiskLevel } from '@/lib/health-types';

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#4ade80',
  moderate: '#facc15',
  high: '#f97316',
  critical: '#ef4444',
};

// ─── Organ Component ───
function Organ({
  risk,
  position,
  geometry,
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  onClick,
}: {
  risk: OrganRisk;
  position: [number, number, number];
  geometry: 'sphere' | 'capsule' | 'torus' | 'box' | 'custom';
  scale?: [number, number, number];
  rotation?: [number, number, number];
  onClick?: (risk: OrganRisk) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = RISK_COLORS[risk.risk];
  const intensity = risk.risk === 'critical' ? 2.5 : risk.risk === 'high' ? 1.8 : risk.risk === 'moderate' ? 1.2 : 0.6;

  useFrame((state) => {
    if (!meshRef.current) return;
    const pulse = risk.risk === 'critical' ? 0.06 : risk.risk === 'high' ? 0.04 : 0.02;
    const s = 1 + Math.sin(state.clock.elapsedTime * (risk.risk === 'critical' ? 3 : 1.5)) * pulse;
    meshRef.current.scale.set(scale[0] * s, scale[1] * s, scale[2] * s);
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(risk);
  }, [onClick, risk]);

  const geo = useMemo(() => {
    switch (geometry) {
      case 'sphere': return new THREE.SphereGeometry(1, 32, 32);
      case 'capsule': return new THREE.CapsuleGeometry(0.5, 1, 16, 32);
      case 'torus': return new THREE.TorusGeometry(0.5, 0.2, 16, 32);
      case 'box': return new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);
      default: return new THREE.SphereGeometry(1, 32, 32);
    }
  }, [geometry]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation as unknown as THREE.Euler}
      geometry={geo}
      scale={scale}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? intensity * 1.5 : intensity}
        transparent
        opacity={hovered ? 0.95 : 0.75}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
}

// ─── Lung shape from multiple spheres ───
function LungShape({
  risk,
  side,
  onClick,
}: {
  risk: OrganRisk;
  side: 'left' | 'right';
  onClick?: (risk: OrganRisk) => void;
}) {
  const x = side === 'left' ? -0.45 : 0.45;
  const color = RISK_COLORS[risk.risk];
  const intensity = risk.risk === 'critical' ? 2.5 : risk.risk === 'high' ? 1.8 : risk.risk === 'moderate' ? 1.2 : 0.6;
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const breathe = Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
    groupRef.current.scale.setScalar(1 + breathe);
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(risk);
  }, [onClick, risk]);

  return (
    <group
      ref={groupRef}
      position={[x, 0.55, 0]}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {/* Main lobe */}
      <mesh position={[0, 0, 0]} scale={[0.28, 0.4, 0.22]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? intensity * 1.5 : intensity} transparent opacity={0.65} roughness={0.4} />
      </mesh>
      {/* Upper lobe */}
      <mesh position={[0, 0.25, 0.02]} scale={[0.22, 0.25, 0.18]}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? intensity * 1.3 : intensity * 0.8} transparent opacity={0.55} roughness={0.5} />
      </mesh>
      {/* Lower lobe */}
      <mesh position={[side === 'left' ? -0.05 : 0.05, -0.2, 0.02]} scale={[0.24, 0.22, 0.19]}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? intensity * 1.3 : intensity * 0.8} transparent opacity={0.55} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ─── Heart shape ───
function HeartShape({ risk, onClick }: { risk: OrganRisk; onClick?: (risk: OrganRisk) => void }) {
  const color = RISK_COLORS[risk.risk];
  const intensity = risk.risk === 'critical' ? 2.5 : risk.risk === 'high' ? 1.8 : risk.risk === 'moderate' ? 1.2 : 0.6;
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const beat = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05 * (risk.risk === 'critical' ? 2 : 1);
    groupRef.current.scale.setScalar(beat);
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(risk);
  }, [onClick, risk]);

  return (
    <group
      ref={groupRef}
      position={[-0.12, 0.35, 0.12]}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {/* Left ventricle */}
      <mesh position={[-0.06, 0.04, 0]} scale={[0.1, 0.12, 0.09]}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? intensity * 1.5 : intensity} transparent opacity={0.85} roughness={0.3} />
      </mesh>
      {/* Right ventricle */}
      <mesh position={[0.06, 0.04, 0]} scale={[0.1, 0.12, 0.09]}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? intensity * 1.5 : intensity} transparent opacity={0.85} roughness={0.3} />
      </mesh>
      {/* Bottom point */}
      <mesh position={[0, -0.08, 0]} scale={[0.08, 0.1, 0.07]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[1, 1.5, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? intensity * 1.3 : intensity * 0.9} transparent opacity={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ─── Body Shell ───
function BodyShell() {
  return (
    <group>
      {/* Torso */}
      <mesh position={[0, 0.2, 0]} scale={[0.55, 0.75, 0.3]}>
        <capsuleGeometry args={[1, 0.5, 16, 32]} />
        <meshStandardMaterial color="#e8ddd5" transparent opacity={0.12} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.35, 0]} scale={[0.22, 0.28, 0.24]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#e8ddd5" transparent opacity={0.15} roughness={0.7} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.05, 0]} scale={[0.1, 0.12, 0.1]}>
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshStandardMaterial color="#e8ddd5" transparent opacity={0.1} roughness={0.8} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.7, 0.45, 0]} scale={[0.09, 0.45, 0.09]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[1, 1.5, 8, 16]} />
        <meshStandardMaterial color="#e8ddd5" transparent opacity={0.08} roughness={0.8} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.7, 0.45, 0]} scale={[0.09, 0.45, 0.09]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[1, 1.5, 8, 16]} />
        <meshStandardMaterial color="#e8ddd5" transparent opacity={0.08} roughness={0.8} />
      </mesh>
      {/* Left leg */}
      <mesh position={[-0.2, -1.0, 0]} scale={[0.12, 0.55, 0.12]}>
        <capsuleGeometry args={[1, 1.5, 8, 16]} />
        <meshStandardMaterial color="#e8ddd5" transparent opacity={0.08} roughness={0.8} />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.2, -1.0, 0]} scale={[0.12, 0.55, 0.12]}>
        <capsuleGeometry args={[1, 1.5, 8, 16]} />
        <meshStandardMaterial color="#e8ddd5" transparent opacity={0.08} roughness={0.8} />
      </mesh>
      {/* Pelvis */}
      <mesh position={[0, -0.35, 0]} scale={[0.45, 0.2, 0.28]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#e8ddd5" transparent opacity={0.08} roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── Scene ───
function Scene({ risks, onOrganClick }: { risks: OrganRisk[]; onOrganClick?: (organ: OrganRisk) => void }) {
  const getRisk = (id: string) => risks.find((r) => r.organ === id)!;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-3, 3, -3]} intensity={0.3} color="#c4b5fd" />
      <pointLight position={[0, 2, 3]} intensity={0.5} color="#f0abfc" />

      <Float speed={0.5} rotationIntensity={0.02} floatIntensity={0.1}>
        <group position={[0, -0.2, 0]}>
          <BodyShell />

          {/* Brain */}
          <Organ
            risk={getRisk('brain')}
            position={[0, 1.35, 0]}
            geometry="sphere"
            scale={[0.18, 0.2, 0.2]}
            onClick={onOrganClick}
          />

          {/* Lungs */}
          <LungShape risk={getRisk('lungs')} side="left" onClick={onOrganClick} />
          <LungShape risk={getRisk('lungs')} side="right" onClick={onOrganClick} />

          {/* Heart */}
          <HeartShape risk={getRisk('heart')} onClick={onOrganClick} />

          {/* Liver */}
          <Organ
            risk={getRisk('liver')}
            position={[0.25, -0.05, 0.08]}
            geometry="sphere"
            scale={[0.22, 0.15, 0.13]}
            rotation={[0, 0, -0.3]}
            onClick={onOrganClick}
          />

          {/* Body Fat / Stomach area */}
          <Organ
            risk={getRisk('body-fat')}
            position={[0, -0.2, 0.15]}
            geometry="sphere"
            scale={[0.35, 0.2, 0.18]}
            onClick={onOrganClick}
          />
        </group>
      </Float>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={5}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

// ─── Main Export ───
interface BodyVisualization3DProps {
  risks: OrganRisk[];
  onOrganClick?: (organ: OrganRisk) => void;
}

export default function BodyVisualization3D({ risks, onOrganClick }: BodyVisualization3DProps) {
  return (
    <div className="w-full h-full min-h-[420px] relative">
      <Canvas
        camera={{ position: [0, 0.5, 3.2], fov: 40 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene risks={risks} onOrganClick={onOrganClick} />
      </Canvas>

      {/* Corner accents */}
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-primary/20 rounded-tl-md pointer-events-none" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-primary/20 rounded-tr-md pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-primary/20 rounded-bl-md pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-primary/20 rounded-br-md pointer-events-none" />

      {/* Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/60 pointer-events-none">
        Drag to rotate · Scroll to zoom · Click organs
      </div>
    </div>
  );
}

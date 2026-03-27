import { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { OrganRisk, RiskLevel } from '@/lib/health-types';

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#4ade80',
  moderate: '#facc15',
  high: '#f97316',
  critical: '#ef4444',
};

/* ── Clickable organ ── */
function Organ({
  risk, position, scale = [1,1,1], rotation = [0,0,0], onClick, children,
}: {
  risk: OrganRisk;
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  onClick?: (r: OrganRisk) => void;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const color = RISK_COLORS[risk.risk];
  const baseIntensity = risk.risk === 'critical' ? 2.5 : risk.risk === 'high' ? 1.8 : risk.risk === 'moderate' ? 1.2 : 0.5;
  const intensity = hovered ? baseIntensity * 1.6 : baseIntensity;

  useFrame((state) => {
    if (!groupRef.current) return;
    const pulse = risk.risk === 'critical' ? 0.06 : risk.risk === 'high' ? 0.04 : 0.02;
    const s = 1 + Math.sin(state.clock.elapsedTime * (risk.organ === 'heart' ? 4 : 1.5)) * pulse;
    groupRef.current.scale.set(scale[0] * s, scale[1] * s, scale[2] * s);
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(risk);
  }, [onClick, risk]);

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation as unknown as THREE.Euler}
      scale={scale}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {/* Wrap children to inject material props */}
      <OrganMeshes color={color} intensity={intensity} hovered={hovered} />
      {children}
    </group>
  );
}

function OrganMeshes({ color, intensity, hovered }: { color: string; intensity: number; hovered: boolean }) {
  return null; // placeholder, actual meshes are passed as children
}

function OrganMesh({ color, intensity, opacity = 0.75 }: { color: string; intensity: number; opacity?: number }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={intensity}
      transparent
      opacity={opacity}
      roughness={0.3}
      metalness={0.1}
    />
  );
}

/* ── Wireframe Human Body (T-Pose) ── */
function HumanBody() {
  const wireColor = '#8b7fc7';
  const solidColor = '#d4cfe8';

  return (
    <group>
      {/* === HEAD === */}
      <group position={[0, 1.65, 0]}>
        {/* Cranium */}
        <mesh scale={[0.18, 0.22, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={solidColor} transparent opacity={0.08} roughness={0.9} />
        </mesh>
        <mesh scale={[0.18, 0.22, 0.2]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.2} />
        </mesh>
        {/* Jaw */}
        <mesh position={[0, -0.14, 0.03]} scale={[0.14, 0.08, 0.13]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.15} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.065, 0.03, 0.15]} scale={[0.035, 0.03, 0.02]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#7c6fc4" emissive="#7c6fc4" emissiveIntensity={0.8} transparent opacity={0.6} />
        </mesh>
        <mesh position={[0.065, 0.03, 0.15]} scale={[0.035, 0.03, 0.02]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#7c6fc4" emissive="#7c6fc4" emissiveIntensity={0.8} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* === NECK === */}
      <mesh position={[0, 1.38, 0]} scale={[0.08, 0.08, 0.07]}>
        <cylinderGeometry args={[1, 1.1, 1, 12]} />
        <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.18} />
      </mesh>

      {/* === TORSO === */}
      <group position={[0, 0.85, 0]}>
        {/* Upper chest */}
        <mesh position={[0, 0.25, 0]} scale={[0.38, 0.22, 0.2]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color={solidColor} transparent opacity={0.06} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.25, 0]} scale={[0.38, 0.22, 0.2]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.2} />
        </mesh>
        {/* Mid torso */}
        <mesh position={[0, -0.05, 0]} scale={[0.32, 0.22, 0.18]}>
          <cylinderGeometry args={[1, 0.9, 1, 16]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.18} />
        </mesh>
        {/* Lower torso / abdomen */}
        <mesh position={[0, -0.3, 0]} scale={[0.28, 0.18, 0.16]}>
          <cylinderGeometry args={[1.1, 1, 1, 16]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.16} />
        </mesh>
      </group>

      {/* === SHOULDERS === */}
      <mesh position={[-0.38, 1.22, 0]} scale={[0.1, 0.08, 0.09]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.2} />
      </mesh>
      <mesh position={[0.38, 1.22, 0]} scale={[0.1, 0.08, 0.09]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.2} />
      </mesh>

      {/* === LEFT ARM === */}
      <group>
        {/* Upper arm */}
        <mesh position={[-0.62, 1.22, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.07, 0.2, 0.07]}>
          <cylinderGeometry args={[1, 0.85, 1, 10]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.18} />
        </mesh>
        {/* Elbow */}
        <mesh position={[-0.85, 1.22, 0]} scale={[0.065, 0.065, 0.065]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.15} />
        </mesh>
        {/* Forearm */}
        <mesh position={[-1.08, 1.22, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.055, 0.2, 0.055]}>
          <cylinderGeometry args={[0.9, 0.7, 1, 10]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.16} />
        </mesh>
        {/* Hand */}
        <mesh position={[-1.3, 1.22, 0]} scale={[0.06, 0.04, 0.03]}>
          <boxGeometry args={[1, 1, 1, 4, 3, 2]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.15} />
        </mesh>
      </group>

      {/* === RIGHT ARM === */}
      <group>
        <mesh position={[0.62, 1.22, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.07, 0.2, 0.07]}>
          <cylinderGeometry args={[1, 0.85, 1, 10]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.18} />
        </mesh>
        <mesh position={[0.85, 1.22, 0]} scale={[0.065, 0.065, 0.065]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.15} />
        </mesh>
        <mesh position={[1.08, 1.22, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.055, 0.2, 0.055]}>
          <cylinderGeometry args={[0.9, 0.7, 1, 10]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.16} />
        </mesh>
        <mesh position={[1.3, 1.22, 0]} scale={[0.06, 0.04, 0.03]}>
          <boxGeometry args={[1, 1, 1, 4, 3, 2]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.15} />
        </mesh>
      </group>

      {/* === HIPS === */}
      <mesh position={[0, 0.42, 0]} scale={[0.3, 0.12, 0.18]}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.18} />
      </mesh>

      {/* === LEFT LEG === */}
      <group>
        {/* Thigh */}
        <mesh position={[-0.14, 0.08, 0]} scale={[0.1, 0.25, 0.1]}>
          <cylinderGeometry args={[1, 0.8, 1, 12]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.17} />
        </mesh>
        {/* Knee */}
        <mesh position={[-0.14, -0.2, 0]} scale={[0.075, 0.06, 0.075]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.15} />
        </mesh>
        {/* Shin */}
        <mesh position={[-0.14, -0.52, 0]} scale={[0.07, 0.28, 0.07]}>
          <cylinderGeometry args={[0.85, 0.7, 1, 10]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.16} />
        </mesh>
        {/* Foot */}
        <mesh position={[-0.14, -0.82, 0.04]} scale={[0.065, 0.03, 0.1]}>
          <boxGeometry args={[1, 1, 1, 3, 2, 4]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.14} />
        </mesh>
      </group>

      {/* === RIGHT LEG === */}
      <group>
        <mesh position={[0.14, 0.08, 0]} scale={[0.1, 0.25, 0.1]}>
          <cylinderGeometry args={[1, 0.8, 1, 12]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.17} />
        </mesh>
        <mesh position={[0.14, -0.2, 0]} scale={[0.075, 0.06, 0.075]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.15} />
        </mesh>
        <mesh position={[0.14, -0.52, 0]} scale={[0.07, 0.28, 0.07]}>
          <cylinderGeometry args={[0.85, 0.7, 1, 10]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.16} />
        </mesh>
        <mesh position={[0.14, -0.82, 0.04]} scale={[0.065, 0.03, 0.1]}>
          <boxGeometry args={[1, 1, 1, 3, 2, 4]} />
          <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.14} />
        </mesh>
      </group>
    </group>
  );
}

/* ── Lung cluster ── */
function LungShape({ risk, side, onClick }: { risk: OrganRisk; side: 'left' | 'right'; onClick?: (r: OrganRisk) => void }) {
  const x = side === 'left' ? -0.18 : 0.18;
  const color = RISK_COLORS[risk.risk];
  const baseI = risk.risk === 'critical' ? 2.5 : risk.risk === 'high' ? 1.8 : risk.risk === 'moderate' ? 1.2 : 0.5;
  const [hovered, setHovered] = useState(false);
  const intensity = hovered ? baseI * 1.6 : baseI;
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.03);
  });

  return (
    <group
      ref={groupRef}
      position={[x, 0.95, 0.02]}
      onClick={(e) => { e.stopPropagation(); onClick?.(risk); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      <mesh scale={[0.12, 0.18, 0.1]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} transparent opacity={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.1, 0.01]} scale={[0.09, 0.1, 0.08]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity * 0.8} transparent opacity={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[side === 'left' ? -0.02 : 0.02, -0.08, 0.01]} scale={[0.1, 0.09, 0.08]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity * 0.8} transparent opacity={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ── Heart ── */
function HeartShape({ risk, onClick }: { risk: OrganRisk; onClick?: (r: OrganRisk) => void }) {
  const color = RISK_COLORS[risk.risk];
  const baseI = risk.risk === 'critical' ? 2.5 : risk.risk === 'high' ? 1.8 : risk.risk === 'moderate' ? 1.2 : 0.5;
  const [hovered, setHovered] = useState(false);
  const intensity = hovered ? baseI * 1.6 : baseI;
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.05 * (risk.risk === 'critical' ? 2 : 1));
  });

  return (
    <group
      ref={groupRef}
      position={[-0.06, 0.82, 0.1]}
      onClick={(e) => { e.stopPropagation(); onClick?.(risk); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      <mesh position={[-0.03, 0.02, 0]} scale={[0.05, 0.06, 0.045]}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} transparent opacity={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0.03, 0.02, 0]} scale={[0.05, 0.06, 0.045]}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} transparent opacity={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.04, 0]} scale={[0.04, 0.05, 0.035]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[1, 1.5, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity * 0.9} transparent opacity={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ── Scene ── */
function Scene({ risks, onOrganClick }: { risks: OrganRisk[]; onOrganClick?: (organ: OrganRisk) => void }) {
  const getRisk = (id: string) => risks.find((r) => r.organ === id)!;
  const brainRisk = getRisk('brain');
  const liverRisk = getRisk('liver');
  const fatRisk = getRisk('body-fat');

  const brainColor = RISK_COLORS[brainRisk.risk];
  const liverColor = RISK_COLORS[liverRisk.risk];
  const fatColor = RISK_COLORS[fatRisk.risk];
  const brainI = brainRisk.risk === 'critical' ? 2.5 : brainRisk.risk === 'high' ? 1.8 : brainRisk.risk === 'moderate' ? 1.2 : 0.5;
  const liverI = liverRisk.risk === 'critical' ? 2.5 : liverRisk.risk === 'high' ? 1.8 : liverRisk.risk === 'moderate' ? 1.2 : 0.5;
  const fatI = fatRisk.risk === 'critical' ? 2.5 : fatRisk.risk === 'high' ? 1.8 : fatRisk.risk === 'moderate' ? 1.2 : 0.5;

  const [hBrain, setHBrain] = useState(false);
  const [hLiver, setHLiver] = useState(false);
  const [hFat, setHFat] = useState(false);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} />
      <directionalLight position={[-3, 3, -3]} intensity={0.3} color="#c4b5fd" />
      <pointLight position={[0, 2, 3]} intensity={0.4} color="#f0abfc" />
      <pointLight position={[0, -1, 2]} intensity={0.2} color="#67e8f9" />

      <Float speed={0.4} rotationIntensity={0.01} floatIntensity={0.08}>
        <group position={[0, -0.4, 0]}>
          <HumanBody />

          {/* Brain */}
          <group
            position={[0, 1.65, 0]}
            onClick={(e) => { e.stopPropagation(); onOrganClick?.(brainRisk); }}
            onPointerOver={(e) => { e.stopPropagation(); setHBrain(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHBrain(false); document.body.style.cursor = 'default'; }}
          >
            <mesh scale={[0.14, 0.16, 0.15]}>
              <sphereGeometry args={[1, 20, 20]} />
              <meshStandardMaterial color={brainColor} emissive={brainColor} emissiveIntensity={hBrain ? brainI * 1.6 : brainI} transparent opacity={0.6} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.02, 0]} scale={[0.12, 0.13, 0.12]}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color={brainColor} emissive={brainColor} emissiveIntensity={hBrain ? brainI : brainI * 0.5} transparent opacity={0.3} roughness={0.4} />
            </mesh>
          </group>

          {/* Lungs */}
          <LungShape risk={getRisk('lungs')} side="left" onClick={onOrganClick} />
          <LungShape risk={getRisk('lungs')} side="right" onClick={onOrganClick} />

          {/* Heart */}
          <HeartShape risk={getRisk('heart')} onClick={onOrganClick} />

          {/* Liver */}
          <group
            position={[0.14, 0.68, 0.06]}
            rotation={[0, 0, -0.3]}
            onClick={(e) => { e.stopPropagation(); onOrganClick?.(liverRisk); }}
            onPointerOver={(e) => { e.stopPropagation(); setHLiver(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHLiver(false); document.body.style.cursor = 'default'; }}
          >
            <mesh scale={[0.12, 0.07, 0.06]}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color={liverColor} emissive={liverColor} emissiveIntensity={hLiver ? liverI * 1.6 : liverI} transparent opacity={0.65} roughness={0.35} />
            </mesh>
            <mesh position={[-0.04, -0.02, 0]} scale={[0.08, 0.05, 0.05]}>
              <sphereGeometry args={[1, 12, 10]} />
              <meshStandardMaterial color={liverColor} emissive={liverColor} emissiveIntensity={hLiver ? liverI : liverI * 0.6} transparent opacity={0.45} roughness={0.4} />
            </mesh>
          </group>

          {/* Body Fat / Abdomen */}
          <group
            position={[0, 0.58, 0.08]}
            onClick={(e) => { e.stopPropagation(); onOrganClick?.(fatRisk); }}
            onPointerOver={(e) => { e.stopPropagation(); setHFat(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHFat(false); document.body.style.cursor = 'default'; }}
          >
            <mesh scale={[0.2, 0.1, 0.1]}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color={fatColor} emissive={fatColor} emissiveIntensity={hFat ? fatI * 1.6 : fatI} transparent opacity={0.4} roughness={0.5} />
            </mesh>
          </group>
        </group>
      </Float>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={1.8}
        maxDistance={5}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </>
  );
}

/* ── Main Export ── */
interface BodyVisualization3DProps {
  risks: OrganRisk[];
  onOrganClick?: (organ: OrganRisk) => void;
}

export default function BodyVisualization3D({ risks, onOrganClick }: BodyVisualization3DProps) {
  return (
    <div className="w-full h-full min-h-[450px] relative">
      <Canvas
        camera={{ position: [0, 0.8, 3], fov: 38 }}
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

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/50 pointer-events-none">
        Drag to rotate · Scroll to zoom · Click organs
      </div>
    </div>
  );
}

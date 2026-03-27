import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrganRisk } from '@/lib/health-types';
import { RISK_COLORS, getEmissiveIntensity, getPulseAmount, createBrainGeometry } from './organ-utils';
import { OrganTooltip } from './OrganTooltip';

export function BrainOrgan({ risk, onClick }: { risk: OrganRisk; onClick?: (r: OrganRisk) => void }) {
  const c = RISK_COLORS[risk.risk];
  const [h, setH] = useState(false);
  const ei = getEmissiveIntensity(risk.risk, h);
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => createBrainGeometry(), []);

  useFrame((s) => {
    if (!ref.current) return;
    const p = getPulseAmount(risk.risk);
    const sc = 1 + Math.sin(s.clock.elapsedTime * 1.2) * p;
    ref.current.scale.setScalar(sc);
  });

  return (
    <group ref={ref} position={[0, 1.82, 0]}
      onClick={(e) => { e.stopPropagation(); onClick?.(risk); }}
      onPointerOver={(e) => { e.stopPropagation(); setH(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setH(false); document.body.style.cursor = 'default'; }}>
      <OrganTooltip risk={risk} visible={h} />
      {/* Main brain */}
      <mesh geometry={geo} scale={[0.11, 0.10, 0.12]} rotation={[0.1, 0, 0]}>
        <meshStandardMaterial
          color={c} emissive={c} emissiveIntensity={ei}
          transparent opacity={h ? 0.85 : 0.7}
          roughness={0.6} metalness={0.1}
        />
      </mesh>
      {/* Brain stem */}
      <mesh position={[0, -0.1, -0.02]} scale={[0.025, 0.05, 0.025]}>
        <cylinderGeometry args={[1, 0.7, 1, 8]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={ei * 0.6} transparent opacity={0.6} roughness={0.5} />
      </mesh>
      {/* Cerebellum */}
      <mesh position={[0, -0.06, -0.08]} scale={[0.07, 0.05, 0.05]}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={ei * 0.8} transparent opacity={h ? 0.75 : 0.6} roughness={0.65} />
      </mesh>
      {/* Outer glow */}
      <mesh scale={[0.15, 0.14, 0.16]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={c} transparent opacity={h ? 0.15 : 0.05} />
      </mesh>
    </group>
  );
}

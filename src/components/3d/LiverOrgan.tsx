import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrganRisk } from '@/lib/health-types';
import { RISK_COLORS, getEmissiveIntensity, getPulseAmount, createLiverGeometry } from './organ-utils';
import { OrganTooltip } from './OrganTooltip';

export function LiverOrgan({ risk, onClick }: { risk: OrganRisk; onClick?: (r: OrganRisk) => void }) {
  const c = RISK_COLORS[risk.risk];
  const [h, setH] = useState(false);
  const ei = getEmissiveIntensity(risk.risk, h);
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => createLiverGeometry(), []);

  useFrame((s) => {
    if (!ref.current) return;
    const p = getPulseAmount(risk.risk);
    const sc = 1 + Math.sin(s.clock.elapsedTime * 1.5) * p;
    ref.current.scale.setScalar(sc);
  });

  return (
    <group ref={ref} position={[0.12, 0.98, 0.06]}
      onClick={(e) => { e.stopPropagation(); onClick?.(risk); }}
      onPointerOver={(e) => { e.stopPropagation(); setH(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setH(false); document.body.style.cursor = 'default'; }}>
      <OrganTooltip risk={risk} visible={h} />
      <mesh geometry={geo} scale={[0.12, 0.08, 0.07]} rotation={[0, -0.3, -0.15]}>
        <meshStandardMaterial
          color={c} emissive={c} emissiveIntensity={ei}
          transparent opacity={h ? 0.85 : 0.65}
          roughness={0.45} metalness={0.1}
        />
      </mesh>
      {/* Gallbladder */}
      <mesh position={[-0.04, -0.03, 0.03]} scale={[0.015, 0.035, 0.015]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={ei * 0.6} transparent opacity={0.5} roughness={0.5} />
      </mesh>
      {/* Glow */}
      <mesh scale={[0.16, 0.10, 0.10]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={c} transparent opacity={h ? 0.15 : 0.05} />
      </mesh>
    </group>
  );
}

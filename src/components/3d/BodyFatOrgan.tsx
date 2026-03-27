import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrganRisk } from '@/lib/health-types';
import { RISK_COLORS, getEmissiveIntensity, getPulseAmount } from './organ-utils';
import { OrganTooltip } from './OrganTooltip';

export function BodyFatOrgan({ risk, onClick }: { risk: OrganRisk; onClick?: (r: OrganRisk) => void }) {
  const c = RISK_COLORS[risk.risk];
  const [h, setH] = useState(false);
  const ei = getEmissiveIntensity(risk.risk, h);
  const ref = useRef<THREE.Group>(null);

  useFrame((s) => {
    if (!ref.current) return;
    const p = getPulseAmount(risk.risk);
    const sc = 1 + Math.sin(s.clock.elapsedTime * 1.5) * p;
    ref.current.scale.setScalar(sc);
  });

  return (
    <group ref={ref} position={[0, 0.82, 0.1]}
      onClick={(e) => { e.stopPropagation(); onClick?.(risk); }}
      onPointerOver={(e) => { e.stopPropagation(); setH(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setH(false); document.body.style.cursor = 'default'; }}>
      <OrganTooltip risk={risk} visible={h} />
      {/* Adipose tissue layer - flattened torus-like shape */}
      <mesh scale={[0.18, 0.06, 0.12]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[0.5, 0.4, 10, 16]} />
        <meshStandardMaterial
          color={c} emissive={c} emissiveIntensity={ei}
          transparent opacity={h ? 0.75 : 0.55}
          roughness={0.6} metalness={0.05}
        />
      </mesh>
      {/* Secondary layer */}
      <mesh position={[0, 0.02, 0.02]} scale={[0.14, 0.04, 0.09]}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={ei * 0.6} transparent opacity={h ? 0.5 : 0.35} roughness={0.7} />
      </mesh>
      {/* Glow */}
      <mesh scale={[0.22, 0.10, 0.14]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={c} transparent opacity={h ? 0.12 : 0.04} />
      </mesh>
    </group>
  );
}

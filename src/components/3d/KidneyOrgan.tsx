import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrganRisk } from '@/lib/health-types';
import { RISK_COLORS, getEmissiveIntensity, getPulseAmount, createKidneyGeometry } from './organ-utils';
import { OrganTooltip } from './OrganTooltip';

export function KidneyOrgan({ risk, side, onClick }: { risk: OrganRisk; side: 'left' | 'right'; onClick?: (r: OrganRisk) => void }) {
  const x = side === 'left' ? -0.14 : 0.14;
  const c = RISK_COLORS[risk.risk];
  const [h, setH] = useState(false);
  const ei = getEmissiveIntensity(risk.risk, h);
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => createKidneyGeometry(), []);

  useFrame((s) => {
    if (!ref.current) return;
    const p = getPulseAmount(risk.risk);
    const sc = 1 + Math.sin(s.clock.elapsedTime * 1.5) * p;
    ref.current.scale.setScalar(sc);
  });

  return (
    <group ref={ref} position={[x, 0.92, -0.04]}
      onClick={(e) => { e.stopPropagation(); onClick?.(risk); }}
      onPointerOver={(e) => { e.stopPropagation(); setH(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setH(false); document.body.style.cursor = 'default'; }}>
      {side === 'left' && <OrganTooltip risk={risk} visible={h} />}
      <mesh geometry={geo} scale={[0.04, 0.055, 0.03]}
        rotation={[0, side === 'left' ? 0.3 : -0.3, 0]}>
        <meshStandardMaterial
          color={c} emissive={c} emissiveIntensity={ei}
          transparent opacity={h ? 0.85 : 0.65}
          roughness={0.4} metalness={0.1}
        />
      </mesh>
      {/* Ureter tube */}
      <mesh position={[side === 'left' ? 0.01 : -0.01, -0.06, 0]}>
        <tubeGeometry args={[
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(side === 'left' ? 0.01 : -0.01, -0.06, 0.02),
            new THREE.Vector3(0, -0.12, 0.03),
          ]),
          6, 0.003, 4, false
        ]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={ei * 0.4} transparent opacity={0.4} roughness={0.5} />
      </mesh>
      {/* Glow */}
      <mesh scale={[0.06, 0.08, 0.05]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={c} transparent opacity={h ? 0.15 : 0.05} />
      </mesh>
    </group>
  );
}

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrganRisk } from '@/lib/health-types';
import { RISK_COLORS, getEmissiveIntensity, createLungGeometry } from './organ-utils';
import { OrganTooltip } from './OrganTooltip';

export function LungOrgan({ risk, side, onClick }: { risk: OrganRisk; side: 'left' | 'right'; onClick?: (r: OrganRisk) => void }) {
  const x = side === 'left' ? -0.15 : 0.15;
  const c = RISK_COLORS[risk.risk];
  const [h, setH] = useState(false);
  const ei = getEmissiveIntensity(risk.risk, h);
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => createLungGeometry(side), [side]);

  useFrame((s) => {
    if (!ref.current) return;
    const breathe = 1 + Math.sin(s.clock.elapsedTime * 0.8) * 0.04;
    ref.current.scale.setScalar(breathe);
  });

  return (
    <group ref={ref} position={[side === 'left' ? -0.18 : 0.18, 1.22, 0.14]}
      onClick={(e) => { e.stopPropagation(); onClick?.(risk); }}
      onPointerOver={(e) => { e.stopPropagation(); setH(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setH(false); document.body.style.cursor = 'default'; }}>
      {side === 'left' && <OrganTooltip risk={risk} visible={h} />}
      {/* Main lung lobe */}
      <mesh geometry={geo} scale={[0.125, 0.2, 0.11]} renderOrder={12}>
        <meshStandardMaterial
          color={c} emissive={c} emissiveIntensity={ei}
          transparent opacity={h ? 0.75 : 0.6}
          roughness={0.35} metalness={0.05} depthWrite={false} side={THREE.DoubleSide}
        />
      </mesh>
      {/* Bronchi tubes */}
      <mesh position={[side === 'left' ? 0.04 : -0.04, 0.12, 0]} renderOrder={13}>
        <tubeGeometry args={[
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(side === 'left' ? 0.02 : -0.02, 0.03, 0),
            new THREE.Vector3(side === 'left' ? 0.04 : -0.04, 0.05, -0.01),
          ]),
          6, 0.006, 5, false
        ]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={ei * 0.5} transparent opacity={0.5} roughness={0.4} depthWrite={false} />
      </mesh>
      {/* Secondary bronchi */}
      <mesh position={[side === 'left' ? 0.03 : -0.03, 0.04, 0.01]} renderOrder={13}>
        <tubeGeometry args={[
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(side === 'left' ? -0.02 : 0.02, -0.03, 0.01),
            new THREE.Vector3(side === 'left' ? -0.01 : 0.01, -0.06, 0.02),
          ]),
          5, 0.004, 4, false
        ]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={ei * 0.4} transparent opacity={0.4} roughness={0.5} depthWrite={false} />
      </mesh>
      {/* Outer glow */}
      <mesh scale={[0.17, 0.25, 0.14]} renderOrder={11}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={c} transparent opacity={h ? 0.2 : 0.1} depthWrite={false} />
      </mesh>
    </group>
  );
}

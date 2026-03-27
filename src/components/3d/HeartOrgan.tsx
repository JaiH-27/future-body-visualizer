import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrganRisk } from '@/lib/health-types';
import { RISK_COLORS, getEmissiveIntensity, createHeartGeometry } from './organ-utils';
import { OrganTooltip } from './OrganTooltip';

export function HeartOrgan({ risk, onClick }: { risk: OrganRisk; onClick?: (r: OrganRisk) => void }) {
  const c = RISK_COLORS[risk.risk];
  const [h, setH] = useState(false);
  const ei = getEmissiveIntensity(risk.risk, h);
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => createHeartGeometry(), []);

  useFrame((s) => {
    if (!ref.current) return;
    const bpm = risk.risk === 'critical' ? 5 : risk.risk === 'high' ? 4 : 3;
    const beat = 1 + Math.sin(s.clock.elapsedTime * bpm) * 0.06 * (risk.risk === 'critical' ? 2 : 1);
    ref.current.scale.setScalar(beat);
  });

  return (
    <group ref={ref} position={[-0.05, 1.15, 0.08]}
      onClick={(e) => { e.stopPropagation(); onClick?.(risk); }}
      onPointerOver={(e) => { e.stopPropagation(); setH(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setH(false); document.body.style.cursor = 'default'; }}>
      <OrganTooltip risk={risk} visible={h} />
      {/* Main heart mesh */}
      <mesh geometry={geo} scale={[0.055, 0.05, 0.045]} rotation={[Math.PI, 0, 0]}>
        <meshStandardMaterial
          color={c} emissive={c} emissiveIntensity={ei}
          transparent opacity={h ? 0.9 : 0.75}
          roughness={0.35} metalness={0.15}
        />
      </mesh>
      {/* Aorta - main vessel going up */}
      <mesh position={[0.01, 0.06, -0.01]} rotation={[0.2, 0, -0.15]}>
        <tubeGeometry args={[
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.01, 0.03, -0.01),
            new THREE.Vector3(-0.01, 0.06, -0.02),
          ]),
          8, 0.008, 6, false
        ]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={ei * 0.7} transparent opacity={0.65} roughness={0.4} />
      </mesh>
      {/* Pulmonary arteries */}
      <mesh position={[-0.02, 0.05, 0.01]}>
        <tubeGeometry args={[
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(-0.02, 0.02, 0.01),
            new THREE.Vector3(-0.04, 0.03, 0.0),
          ]),
          6, 0.005, 5, false
        ]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={ei * 0.5} transparent opacity={0.55} roughness={0.4} />
      </mesh>
      {/* Glow halo */}
      <mesh scale={[0.08, 0.08, 0.065]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={c} transparent opacity={h ? 0.18 : 0.08} />
      </mesh>
    </group>
  );
}

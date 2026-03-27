import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { OrganRisk } from '@/lib/health-types';
import { BrainOrgan } from './3d/BrainOrgan';
import { HeartOrgan } from './3d/HeartOrgan';
import { LungOrgan } from './3d/LungOrgan';
import { LiverOrgan } from './3d/LiverOrgan';
import { KidneyOrgan } from './3d/KidneyOrgan';
import { BodyFatOrgan } from './3d/BodyFatOrgan';
import { HumanBody } from './3d/HumanBody';

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



/* ── Scene ── */
function Scene({ risks, onOrganClick }: { risks: OrganRisk[]; onOrganClick?: (organ: OrganRisk) => void }) {
  const get = (id: string) => risks.find((r) => r.organ === id)!;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} color="#fff5ee" />
      <directionalLight position={[-3, 4, -2]} intensity={0.3} color="#ffe4d4" />
      <pointLight position={[0, 2.5, 3]} intensity={0.5} color="#ffd4c4" />
      <pointLight position={[0, -0.5, 2]} intensity={0.2} color="#e8d8f0" />
      <pointLight position={[2, 1, -2]} intensity={0.15} color="#ffeedd" />

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

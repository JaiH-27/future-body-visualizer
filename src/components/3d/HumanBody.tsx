import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createLatheBody, createTorsoGeometry } from './organ-utils';

const SKIN = '#e8beac';
const SKIN_DARK = '#d4a08a';
const MUSCLE = '#c47a6a';

/**
 * Builds a smooth lathe profile with subsurface-style shading
 * for a realistic semi-transparent anatomical body.
 */
export function HumanBody() {
  /* ── Head ── */
  const headGeo = useMemo(() => {
    const geo = createLatheBody([
      [0, 0.24], [0.06, 0.22], [0.12, 0.18], [0.16, 0.12], [0.17, 0.06],
      [0.17, 0], [0.16, -0.06], [0.14, -0.1], [0.13, -0.14], [0.11, -0.17],
      [0.10, -0.19], [0, -0.19],
    ], 24);
    return geo;
  }, []);

  /* ── Torso ── */
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

  /* ── Ribcage lines ── */
  const ribCurves = useMemo(() => {
    const curves: THREE.CatmullRomCurve3[] = [];
    for (let i = 0; i < 6; i++) {
      const y = 0.35 - i * 0.06;
      const rx = 0.24 + Math.sin(i * 0.5) * 0.04;
      const rz = 0.10 + Math.sin(i * 0.5) * 0.02;
      const pts: THREE.Vector3[] = [];
      for (let a = -Math.PI * 0.8; a <= Math.PI * 0.8; a += 0.2) {
        pts.push(new THREE.Vector3(
          Math.sin(a) * rx,
          y + Math.cos(a) * 0.01,
          Math.cos(a) * rz + 0.02,
        ));
      }
      curves.push(new THREE.CatmullRomCurve3(pts));
    }
    return curves;
  }, []);

  /* ── Spine ── */
  const spineCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.44, -0.06),
    new THREE.Vector3(0, 0.30, -0.09),
    new THREE.Vector3(0, 0.15, -0.12),
    new THREE.Vector3(0, 0.00, -0.10),
    new THREE.Vector3(0, -0.15, -0.08),
    new THREE.Vector3(0, -0.30, -0.10),
    new THREE.Vector3(0, -0.44, -0.07),
  ]), []);

  /* ── Breathing ── */
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
              {/* Skin layer */}
              <mesh position={[0, my, 0]}>
                <cylinderGeometry args={[seg.rTop, seg.rBot, seg.len, 16, 1, false]} />
                <meshPhysicalMaterial
                  color={SKIN}
                  roughness={0.55}
                  metalness={0.02}
                  transparent
                  opacity={0.35}
                  side={THREE.DoubleSide}
                  transmission={0.15}
                  thickness={0.5}
                />
              </mesh>
              {/* Muscle/inner layer */}
              <mesh position={[0, my, 0]}>
                <cylinderGeometry args={[seg.rTop * 0.85, seg.rBot * 0.85, seg.len * 0.98, 12, 1, false]} />
                <meshStandardMaterial
                  color={MUSCLE}
                  transparent
                  opacity={0.12}
                  roughness={0.7}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Subtle vein lines */}
              {idx === 0 && (
                <mesh position={[0, my, 0]}>
                  <cylinderGeometry args={[seg.rTop * 1.01, seg.rBot * 1.01, seg.len, 16, 1, true]} />
                  <meshBasicMaterial color="#8b6c7a" wireframe transparent opacity={0.06} />
                </mesh>
              )}
            </group>
          );
        })}
      </group>
    );
  };

  return (
    <group>
      {/* ── Head ── */}
      <group position={[0, 1.78, 0]}>
        {/* Skin */}
        <mesh geometry={headGeo}>
          <meshPhysicalMaterial
            color={SKIN}
            roughness={0.5}
            metalness={0.02}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            transmission={0.1}
            thickness={0.5}
          />
        </mesh>
        {/* Subsurface glow */}
        <mesh geometry={headGeo} scale={0.98}>
          <meshStandardMaterial color={SKIN_DARK} transparent opacity={0.1} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        {/* Eyes */}
        {[-0.065, 0.065].map((ex) => (
          <group key={ex}>
            {/* Eye white */}
            <mesh position={[ex, 0.02, 0.14]}>
              <sphereGeometry args={[0.028, 10, 10]} />
              <meshStandardMaterial color="#f0ebe6" roughness={0.3} transparent opacity={0.85} />
            </mesh>
            {/* Iris */}
            <mesh position={[ex, 0.02, 0.16]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <meshStandardMaterial color="#5a7c9e" emissive="#3a5c7e" emissiveIntensity={0.3} roughness={0.2} />
            </mesh>
            {/* Pupil */}
            <mesh position={[ex, 0.02, 0.17]}>
              <sphereGeometry args={[0.007, 6, 6]} />
              <meshStandardMaterial color="#1a1a2e" roughness={0.1} />
            </mesh>
          </group>
        ))}
        {/* Nose */}
        <mesh position={[0, -0.02, 0.16]} rotation={[0.3, 0, 0]}>
          <coneGeometry args={[0.025, 0.06, 6]} />
          <meshPhysicalMaterial color={SKIN_DARK} roughness={0.6} transparent opacity={0.3} />
        </mesh>
        {/* Mouth line */}
        <mesh position={[0, -0.08, 0.145]} scale={[0.05, 0.005, 0.01]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#c47a6a" transparent opacity={0.35} roughness={0.5} />
        </mesh>
        {/* Ears */}
        {[-0.175, 0.175].map((ex) => (
          <mesh key={`ear-${ex}`} position={[ex, 0.0, 0]} scale={[0.02, 0.04, 0.015]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshPhysicalMaterial color={SKIN_DARK} roughness={0.6} transparent opacity={0.35} />
          </mesh>
        ))}
      </group>

      {/* ── Neck ── */}
      <group position={[0, 1.54, 0]}>
        <mesh>
          <cylinderGeometry args={[0.065, 0.08, 0.1, 16, 1, false]} />
          <meshPhysicalMaterial color={SKIN} roughness={0.55} transparent opacity={0.35} side={THREE.DoubleSide} transmission={0.1} thickness={0.3} />
        </mesh>
        {/* Neck muscles */}
        <mesh>
          <cylinderGeometry args={[0.06, 0.075, 0.1, 12, 1, false]} />
          <meshStandardMaterial color={MUSCLE} transparent opacity={0.08} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ── Torso ── */}
      <group ref={torsoRef} position={[0, 1.06, 0]}>
        {/* Skin layer */}
        <mesh geometry={torsoGeo}>
          <meshPhysicalMaterial
            color={SKIN}
            roughness={0.5}
            metalness={0.02}
            transparent
            opacity={0.32}
            side={THREE.DoubleSide}
            transmission={0.15}
            thickness={0.8}
          />
        </mesh>
        {/* Muscle/tissue underneath */}
        <mesh geometry={torsoGeo} scale={[0.95, 1, 0.95]}>
          <meshStandardMaterial color={MUSCLE} transparent opacity={0.08} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>

        {/* Ribcage */}
        {ribCurves.map((curve, i) => (
          <mesh key={`rib-${i}`}>
            <tubeGeometry args={[curve, 16, 0.004, 5, false]} />
            <meshStandardMaterial color="#e8ddd4" transparent opacity={0.15} roughness={0.4} />
          </mesh>
        ))}

        {/* Spine */}
        <mesh>
          <tubeGeometry args={[spineCurve, 20, 0.008, 6, false]} />
          <meshStandardMaterial color="#e8ddd4" transparent opacity={0.18} roughness={0.4} />
        </mesh>

        {/* Sternum */}
        <mesh position={[0, 0.25, 0.12]}>
          <tubeGeometry args={[
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(0, 0.1, 0),
              new THREE.Vector3(0, 0, 0.01),
              new THREE.Vector3(0, -0.15, 0.01),
              new THREE.Vector3(0, -0.22, 0),
            ]),
            10, 0.005, 5, false
          ]} />
          <meshStandardMaterial color="#e8ddd4" transparent opacity={0.15} roughness={0.4} />
        </mesh>

        {/* Pectoral definition */}
        {[-0.1, 0.1].map((px) => (
          <mesh key={`pec-${px}`} position={[px, 0.28, 0.12]} scale={[0.12, 0.08, 0.04]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color={MUSCLE} transparent opacity={0.06} roughness={0.6} />
          </mesh>
        ))}

        {/* Abs definition */}
        {[0.08, 0.0, -0.08, -0.16].map((ay) => (
          <group key={`abs-${ay}`}>
            {[-0.05, 0.05].map((ax) => (
              <mesh key={`ab-${ax}-${ay}`} position={[ax, ay, 0.12]} scale={[0.04, 0.03, 0.02]}>
                <sphereGeometry args={[1, 6, 6]} />
                <meshStandardMaterial color={MUSCLE} transparent opacity={0.05} roughness={0.7} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* ── Arms ── */}
      {renderLimb([-0.35, 1.36, 0], [0, 0, Math.PI / 2 + 0.15], [
        { rTop: 0.075, rBot: 0.068, len: 0.28 },
        { rTop: 0.063, rBot: 0.052, len: 0.26 },
        { rTop: 0.048, rBot: 0.032, len: 0.12 },
      ])}
      {renderLimb([0.35, 1.36, 0], [0, 0, -(Math.PI / 2 + 0.15)], [
        { rTop: 0.075, rBot: 0.068, len: 0.28 },
        { rTop: 0.063, rBot: 0.052, len: 0.26 },
        { rTop: 0.048, rBot: 0.032, len: 0.12 },
      ])}

      {/* ── Shoulder caps ── */}
      {[-0.33, 0.33].map((sx) => (
        <mesh key={`shoulder-${sx}`} position={[sx, 1.38, 0]} scale={[0.08, 0.05, 0.06]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshPhysicalMaterial color={SKIN} roughness={0.5} transparent opacity={0.3} transmission={0.1} />
        </mesh>
      ))}

      {/* ── Legs ── */}
      {renderLimb([-0.13, 0.64, 0], [0, 0, 0.03], [
        { rTop: 0.105, rBot: 0.085, len: 0.38 },
        { rTop: 0.078, rBot: 0.062, len: 0.36 },
        { rTop: 0.058, rBot: 0.052, len: 0.1 },
      ])}
      {renderLimb([0.13, 0.64, 0], [0, 0, -0.03], [
        { rTop: 0.105, rBot: 0.085, len: 0.38 },
        { rTop: 0.078, rBot: 0.062, len: 0.36 },
        { rTop: 0.058, rBot: 0.052, len: 0.1 },
      ])}

      {/* ── Kneecaps ── */}
      {[-0.13, 0.13].map((kx) => (
        <mesh key={`knee-${kx}`} position={[kx, 0.28, 0.06]} scale={[0.035, 0.03, 0.025]}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshPhysicalMaterial color={SKIN_DARK} roughness={0.5} transparent opacity={0.2} />
        </mesh>
      ))}

      {/* ── Feet ── */}
      {[-0.13, 0.13].map((fx) => (
        <group key={`foot-${fx}`}>
          <mesh position={[fx, -0.18, 0.04]} scale={[0.055, 0.025, 0.09]}>
            <boxGeometry args={[1, 1, 1, 3, 1, 3]} />
            <meshPhysicalMaterial color={SKIN_DARK} roughness={0.6} transparent opacity={0.3} />
          </mesh>
          {/* Ankle */}
          <mesh position={[fx, -0.14, 0]} scale={[0.04, 0.03, 0.04]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshPhysicalMaterial color={SKIN} roughness={0.55} transparent opacity={0.25} />
          </mesh>
        </group>
      ))}

      {/* ── Pelvis / Hip bones ── */}
      <mesh position={[0, 0.68, 0]} scale={[0.22, 0.06, 0.10]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#e8ddd4" transparent opacity={0.1} roughness={0.5} />
      </mesh>
    </group>
  );
}

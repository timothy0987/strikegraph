import React, { Suspense, useMemo, useEffect } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const PitchInner = () => {
  const [colorMap, normalMap] = useTexture([
    '/grass.jpg',
    '/grass_normal.jpg'
  ]);

  useEffect(() => {
    [colorMap, normalMap].forEach((texture) => {
      if (texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(24, 24);
        texture.anisotropy = 8;
      }
    });
  }, [colorMap, normalMap]);

  // Broadcast-style mowing stripes: alternating light/dark bands across the field
  const mowStripes = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.14)';
      ctx.fillRect(0, (i / 16) * 512, 8, 512 / 16);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  const pitchLinesTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const W = canvas.width;
    const H = canvas.height;

    // Helper functions to map 3D coordinates [-20, 20] to canvas [0, 1024]
    const getX = (x3d) => ((x3d + 20) / 40) * W;
    const getZ = (z3d) => ((z3d + 20) / 40) * H;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Goal Line
    ctx.beginPath();
    ctx.moveTo(getX(-20), getZ(-5));
    ctx.lineTo(getX(20), getZ(-5));
    ctx.stroke();

    // 2. Penalty Box (18-yard box)
    ctx.beginPath();
    ctx.strokeRect(getX(-14.65), getZ(-5), getX(14.65) - getX(-14.65), getZ(7) - getZ(-5));

    // 3. Goal Area (6-yard box)
    ctx.beginPath();
    ctx.strokeRect(getX(-6.65), getZ(-5), getX(6.65) - getX(-6.65), getZ(-1) - getZ(-5));

    // 4. Penalty Spot (Z = 3)
    ctx.beginPath();
    ctx.arc(getX(0), getZ(3), 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 5. Penalty Arc (D-arc)
    const radius = (6.65 / 40) * W;
    const angleStart = Math.acos(4 / 6.65);
    const angleEnd = Math.PI - angleStart;

    ctx.beginPath();
    ctx.arc(getX(0), getZ(3), radius, angleStart, angleEnd);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      if (pitchLinesTexture) pitchLinesTexture.dispose();
      if (mowStripes) mowStripes.dispose();
    };
  }, [pitchLinesTexture, mowStripes]);

  return (
    <group position={[0, 0, 0]}>
      {/* Ground plane with PBR grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMap}
          normalScale={[0.6, 0.6]}
          color="#5f7e3d"
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Mowing stripes overlay */}
      {mowStripes && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshBasicMaterial map={mowStripes} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      )}

      {/* Pitch markings overlay */}
      {pitchLinesTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial
            map={pitchLinesTexture}
            transparent
            opacity={0.92}
            roughness={0.7}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
};

export const Pitch = () => (
  <Suspense fallback={null}>
    <PitchInner />
  </Suspense>
);

// Procedural goal-net texture: fine diagonal mesh, transparent between strands
const useNetTexture = () => useMemo(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  const step = 18;
  for (let i = -256; i < 256; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 256, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i + 256, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}, []);

const NetMaterial = ({ repeatX = 6, repeatY = 3 }) => {
  const tex = useNetTexture();
  useEffect(() => {
    if (tex) tex.repeat.set(repeatX, repeatY);
  }, [tex, repeatX, repeatY]);
  return (
    <meshStandardMaterial
      map={tex}
      transparent
      opacity={0.8}
      alphaTest={0.02}
      side={THREE.DoubleSide}
      depthWrite={false}
      roughness={0.9}
    />
  );
};

const PostMat = () => (
  <meshStandardMaterial color="#f4f4f4" roughness={0.35} metalness={0.05} emissive="#ffffff" emissiveIntensity={0.08} />
);

export const Goalpost = () => {
  const depth = 1.6; // how far back the net cage extends

  return (
    <group position={[0, 0, -5]}>
      {/* Left post */}
      <mesh position={[-3.1, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 3, 16]} />
        <PostMat />
      </mesh>
      {/* Right post */}
      <mesh position={[3.1, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 3, 16]} />
        <PostMat />
      </mesh>
      {/* Crossbar */}
      <mesh position={[0, 3.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 6.34, 16]} />
        <PostMat />
      </mesh>

      {/* Back stanchions */}
      <mesh position={[-3.1, 0.9, -depth]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, depth * 2, 12]} />
        <PostMat />
      </mesh>
      <mesh position={[3.1, 0.9, -depth]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, depth * 2, 12]} />
        <PostMat />
      </mesh>

      {/* Net cage — back, roof, two sides */}
      <mesh position={[0, 1.5, -depth]}>
        <planeGeometry args={[6.2, 3]} />
        <NetMaterial repeatX={7} repeatY={3.5} />
      </mesh>
      <mesh position={[0, 3.0, -depth / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.2, depth]} />
        <NetMaterial repeatX={7} repeatY={2} />
      </mesh>
      <mesh position={[-3.1, 1.5, -depth / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, 3]} />
        <NetMaterial repeatX={2} repeatY={3.5} />
      </mesh>
      <mesh position={[3.1, 1.5, -depth / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, 3]} />
        <NetMaterial repeatX={2} repeatY={3.5} />
      </mesh>
    </group>
  );
};

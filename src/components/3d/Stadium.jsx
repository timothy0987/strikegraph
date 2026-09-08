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

  // Broadcast-style mowing stripes: alternating light/dark bands running goal-ward
  const mowStripes = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.20)';
      ctx.fillRect((i / 12) * 512, 0, 512 / 12, 8);
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
          normalScale={[0.5, 0.5]}
          color="#6f9d49"
          emissive="#132a10"
          emissiveIntensity={0.55}
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Mowing stripes overlay — bands run toward the goal */}
      {mowStripes && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          <planeGeometry args={[44, 52]} />
          <meshBasicMaterial map={mowStripes} transparent opacity={0.7} depthWrite={false} />
        </mesh>
      )}

      {/* Pitch markings overlay */}
      {pitchLinesTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial
            map={pitchLinesTexture}
            transparent
            opacity={1}
            emissive="#ffffff"
            emissiveIntensity={0.18}
            roughness={0.6}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
};

// ---------------------------------------------------------------------------
//  Stadium surround: dark apron, LED perimeter boards, tiered crowd stands
// ---------------------------------------------------------------------------
const useCrowdTexture = () =>
  useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#161c28';
    ctx.fillRect(0, 0, 256, 128);
    const tints = ['#ffffff', '#a9c8ff', '#ffe1b0', '#c6f7cf', '#ffb4de', '#39FF14'];
    for (let i = 0; i < 2600; i += 1) {
      ctx.fillStyle = tints[(Math.random() * tints.length) | 0];
      ctx.globalAlpha = 0.4 + Math.random() * 0.55;
      ctx.fillRect(Math.random() * 256, Math.random() * 128, 1.8, 1.8);
    }
    ctx.globalAlpha = 1;
    // vignette so the deck darkens toward the top / edges
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, 'rgba(6,9,15,0.75)');
    grad.addColorStop(0.45, 'rgba(6,9,15,0.1)');
    grad.addColorStop(1, 'rgba(6,9,15,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

const Board = ({ position, size, rotation = [0, 0, 0], color = '#39FF14' }) => (
  <group position={position} rotation={rotation}>
    <mesh castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#0c1016" roughness={0.6} metalness={0.15} />
    </mesh>
    {/* glowing LED strip along the top */}
    <mesh position={[0, size[1] / 2 - 0.06, size[2] / 2 + 0.005]}>
      <planeGeometry args={[size[0] * 0.98, 0.16]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  </group>
);

const Stand = ({ position, rotation, width, height = 12, depth = 10 }) => {
  const crowd = useCrowdTexture();
  useEffect(() => {
    if (crowd) crowd.repeat.set(Math.max(2, width / 6), 4);
  }, [crowd, width]);
  return (
    <group position={position} rotation={rotation}>
      {/* raked seating deck */}
      <mesh position={[0, height / 2, -depth / 2]} rotation={[-0.42, 0, 0]} receiveShadow>
        <planeGeometry args={[width, Math.hypot(height, depth)]} />
        <meshStandardMaterial
          map={crowd}
          emissiveMap={crowd}
          color="#2a3346"
          emissive="#5a6f9a"
          emissiveIntensity={0.7}
          roughness={1}
        />
      </mesh>
      {/* dark stand roof + back wall so no void shows through */}
      <mesh position={[0, height, -depth]} rotation={[0.5, 0, 0]}>
        <planeGeometry args={[width, depth * 0.7]} />
        <meshStandardMaterial color="#0c111b" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, height * 0.6, -depth - 0.3]}>
        <planeGeometry args={[width, height * 1.6]} />
        <meshStandardMaterial color="#0a0f18" roughness={1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const Pylon = ({ x, z }) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, 6, 0]}>
      <cylinderGeometry args={[0.12, 0.18, 12, 10]} />
      <meshStandardMaterial color="#141821" roughness={0.7} />
    </mesh>
    <mesh position={[0, 12.4, 0]}>
      <boxGeometry args={[2.6, 1.1, 0.4]} />
      <meshStandardMaterial color="#0c1016" roughness={0.6} />
    </mesh>
    <mesh position={[0, 12.4, 0.3]}>
      <planeGeometry args={[2.4, 0.9]} />
      <meshBasicMaterial color="#dfeaff" toneMapped={false} />
    </mesh>
    <pointLight position={[0, 13, 2]} color="#eaf2ff" intensity={4} distance={34} decay={2} />
  </group>
);

export const StadiumSurround = () => (
  <group>
    {/* dark apron that swallows the horizon under the fog */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -8]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color="#05070a" roughness={1} />
    </mesh>

    {/* LED perimeter boards around the play area */}
    <Board position={[0, 0.5, -7.6]} size={[34, 1.0, 0.3]} color="#2bd10f" />
    <Board position={[-17.5, 0.5, 4]} size={[0.3, 1.0, 23]} color="#00c8e0" />
    <Board position={[17.5, 0.5, 4]} size={[0.3, 1.0, 23]} color="#00c8e0" />
    <Board position={[0, 0.5, 16]} size={[34, 1.0, 0.3]} color="#d40fbf" />

    {/* stands: behind the goal + both touchlines */}
    <Stand position={[0, 0, -11]} rotation={[0, 0, 0]} width={54} height={13} depth={12} />
    <Stand position={[-24, 0, 4]} rotation={[0, Math.PI / 2, 0]} width={46} height={11} depth={11} />
    <Stand position={[24, 0, 4]} rotation={[0, -Math.PI / 2, 0]} width={46} height={11} depth={11} />

    <Pylon x={-20} z={-11} />
    <Pylon x={20} z={-11} />
  </group>
);

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

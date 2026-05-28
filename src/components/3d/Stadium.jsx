import React, { Suspense, useMemo, useEffect } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const PitchInner = () => {
  const [colorMap, normalMap, roughnessMap] = useTexture([
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/textures/grass/color.jpg',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/textures/grass/normal.jpg',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/textures/grass/roughness.jpg'
  ]);

  useEffect(() => {
    [colorMap, normalMap, roughnessMap].forEach((texture) => {
      if (texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(24, 24);
      }
    });
  }, [colorMap, normalMap, roughnessMap]);

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
    // Width = 29.3 units, Depth = from Z=-5 to Z=7
    ctx.beginPath();
    ctx.strokeRect(getX(-14.65), getZ(-5), getX(14.65) - getX(-14.65), getZ(7) - getZ(-5));

    // 3. Goal Area (6-yard box)
    // Width = 13.3 units, Depth = from Z=-5 to Z=-1
    ctx.beginPath();
    ctx.strokeRect(getX(-6.65), getZ(-5), getX(6.65) - getX(-6.65), getZ(-1) - getZ(-5));

    // 4. Penalty Spot (Z = 3)
    ctx.beginPath();
    ctx.arc(getX(0), getZ(3), 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 5. Penalty Arc (D-arc)
    // Radius = 6.65 units, Centered at [0, 3], extending from Z=7 to Z=9.65
    const radius = (6.65 / 40) * W;
    const angleStart = Math.acos(4 / 6.65);
    const angleEnd = Math.PI - angleStart;

    ctx.beginPath();
    ctx.arc(getX(0), getZ(3), radius, angleStart, angleEnd);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      if (pitchLinesTexture) pitchLinesTexture.dispose();
    };
  }, [pitchLinesTexture]);

  return (
    <group position={[0, 0, 0]}>
      {/* Ground plane with PBR Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          roughness={0.8}
        />
      </mesh>

      {/* Pitch markings transparent overlay */}
      {pitchLinesTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial
            map={pitchLinesTexture}
            transparent
            opacity={0.9}
            roughness={0.8}
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

export const Goalpost = () => (
  <group position={[0, 0, -5]}>
    {/* Left Post */}
    <mesh position={[-3.1, 1.5, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, 3]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
    </mesh>
    {/* Right Post */}
    <mesh position={[3.1, 1.5, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, 3]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
    </mesh>
    {/* Crossbar */}
    <mesh position={[0, 3.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, 6.2]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
    </mesh>
    {/* Goal net / back lines */}
    <mesh position={[0, 1.5, -1]} castShadow>
      <boxGeometry args={[6.2, 3, 2]} />
      <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={0.5} wireframe transparent opacity={0.3} />
    </mesh>
  </group>
);

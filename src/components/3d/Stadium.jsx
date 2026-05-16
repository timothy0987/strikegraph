import React from 'react';

export const Pitch = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -2]} receiveShadow>
    <planeGeometry args={[30, 40]} />
    <meshStandardMaterial color="#050505" />
    {/* Penalty box lines */}
    <mesh position={[0, -2.5, 0.01]}>
      <planeGeometry args={[12, 10]} />
      <meshBasicMaterial color="#39FF14" wireframe />
    </mesh>
    {/* Center line */}
    <mesh position={[0, 15, 0.01]}>
      <planeGeometry args={[30, 0.1]} />
      <meshBasicMaterial color="#39FF14" />
    </mesh>
  </mesh>
);

export const Goalpost = () => (
  <group position={[0, 0, -5]}>
    {/* Left Post */}
    <mesh position={[-3.1, 1.5, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, 3]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} wireframe />
    </mesh>
    {/* Right Post */}
    <mesh position={[3.1, 1.5, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, 3]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} wireframe />
    </mesh>
    {/* Crossbar */}
    <mesh position={[0, 3.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, 6.4]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} wireframe />
    </mesh>
  </group>
);

import React from 'react';
import { Ring } from '@react-three/drei';

export const Pitch = () => (
  <group position={[0, 0, 0]}>
    {/* Dark tech floor */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#020510" roughness={0.2} metalness={0.8} />
    </mesh>

    {/* E-Football Grid Helper */}
    <gridHelper args={[100, 100, '#103060', '#0a1530']} position={[0, 0, 0]} />

    {/* Glowing Rings around the Penalty Spot (Z=3) */}
    <group position={[0, 0.01, 3]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Center Spot */}
      <mesh>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="#00FFFF" />
      </mesh>
      
      {/* Concentric rings */}
      <Ring args={[1.5, 1.55, 64]}>
        <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={2} transparent opacity={0.8} side={2} />
      </Ring>
      <Ring args={[3.0, 3.05, 64]}>
        <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={1} transparent opacity={0.5} side={2} />
      </Ring>
      <Ring args={[4.5, 4.55, 64]}>
        <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={0.5} transparent opacity={0.2} side={2} />
      </Ring>
    </group>

    {/* Pitch Boundary Lines */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -2]}>
      <planeGeometry args={[30, 40]} />
      <meshBasicMaterial color="#00FFFF" wireframe transparent opacity={0.3} />
    </mesh>
    
    {/* Penalty Box Line */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -2.5]}>
      <planeGeometry args={[12, 10]} />
      <meshBasicMaterial color="#00FFFF" wireframe />
    </mesh>
  </group>
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

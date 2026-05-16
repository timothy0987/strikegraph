import React from 'react';
import { Box, Capsule, Sphere, Cylinder, Text } from '@react-three/drei';

const PlayerNFT = ({ nftUrl }) => {
  // Common Materials
  const armorMaterial = (
    <meshStandardMaterial 
      color="#111111" 
      roughness={0.3} 
      metalness={0.9} 
    />
  );
  
  const neonMaterial = (
    <meshStandardMaterial 
      color="#00FFFF" 
      emissive="#00FFFF" 
      emissiveIntensity={2} 
    />
  );

  const polyAlloyMaterial = (
    <meshStandardMaterial
      color="#222222"
      transparent={true}
      opacity={0.7}
      roughness={0.1}
      metalness={0.8}
    />
  );

  return (
    <group position={[0, 0, 4]}>
      {/* Torso */}
      <Box args={[0.6, 0.8, 0.4]} position={[0, 1.4, 0]} castShadow>
        {armorMaterial}
      </Box>
      
      {/* Synthetics/Stomach */}
      <Box args={[0.5, 0.4, 0.35]} position={[0, 0.8, 0]} castShadow>
        {polyAlloyMaterial}
      </Box>

      {/* Glowing Number */}
      <Text
        position={[0, 1.4, -0.21]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.25}
        color="#00FFFF"
        anchorX="center"
        anchorY="middle"
      >
        HBAR-7
      </Text>

      {/* Head */}
      <Sphere args={[0.25, 32, 32]} position={[0, 2.1, 0]} castShadow>
        {armorMaterial}
      </Sphere>

      {/* Visor */}
      <Box args={[0.3, 0.1, 0.2]} position={[0, 2.1, 0.15]}>
        {neonMaterial}
      </Box>

      {/* Left Arm */}
      <group position={[-0.45, 1.6, 0]}>
        {/* Shoulder Joint */}
        <Sphere args={[0.15, 16, 16]}>{neonMaterial}</Sphere>
        {/* Upper Arm */}
        <Capsule args={[0.12, 0.4, 4, 16]} position={[-0.1, -0.3, 0]} rotation={[0, 0, 0.2]} castShadow>{armorMaterial}</Capsule>
        {/* Elbow Joint */}
        <Sphere args={[0.1, 16, 16]} position={[-0.2, -0.6, 0]}>{neonMaterial}</Sphere>
        {/* Lower Arm */}
        <Capsule args={[0.1, 0.4, 4, 16]} position={[-0.2, -0.9, 0.1]} rotation={[-0.2, 0, 0]} castShadow>{armorMaterial}</Capsule>
      </group>

      {/* Right Arm (Mid-Kick pose context) */}
      <group position={[0.45, 1.6, 0]}>
        <Sphere args={[0.15, 16, 16]}>{neonMaterial}</Sphere>
        <Capsule args={[0.12, 0.4, 4, 16]} position={[0.1, -0.3, -0.1]} rotation={[0.2, 0, -0.2]} castShadow>{armorMaterial}</Capsule>
        <Sphere args={[0.1, 16, 16]} position={[0.2, -0.6, -0.2]}>{neonMaterial}</Sphere>
        <Capsule args={[0.1, 0.4, 4, 16]} position={[0.3, -0.8, -0.3]} rotation={[0.5, 0, -0.2]} castShadow>{armorMaterial}</Capsule>
      </group>

      {/* Left Leg (Planted foot) */}
      <group position={[-0.2, 0.6, 0]}>
        <Sphere args={[0.15, 16, 16]}>{neonMaterial}</Sphere>
        <Capsule args={[0.15, 0.5, 4, 16]} position={[0, -0.3, 0]} castShadow>{armorMaterial}</Capsule>
        {/* Knee Joint */}
        <Sphere args={[0.12, 16, 16]} position={[0, -0.65, 0]}>{neonMaterial}</Sphere>
        <Capsule args={[0.12, 0.5, 4, 16]} position={[0, -1, 0]} castShadow>{armorMaterial}</Capsule>
        {/* Thruster Boot */}
        <Box args={[0.2, 0.15, 0.3]} position={[0, -1.35, 0.05]} castShadow>{armorMaterial}</Box>
        <Cylinder args={[0.05, 0.08, 0.1]} position={[0, -1.45, -0.05]}>{neonMaterial}</Cylinder>
      </group>

      {/* Right Leg (Kicking foot context, raised slightly) */}
      <group position={[0.2, 0.6, 0]}>
        <Sphere args={[0.15, 16, 16]}>{neonMaterial}</Sphere>
        <Capsule args={[0.15, 0.5, 4, 16]} position={[0, -0.2, -0.2]} rotation={[0.5, 0, 0]} castShadow>{armorMaterial}</Capsule>
        <Sphere args={[0.12, 16, 16]} position={[0, -0.45, -0.45]}>{neonMaterial}</Sphere>
        <Capsule args={[0.12, 0.5, 4, 16]} position={[0, -0.8, -0.3]} rotation={[-0.2, 0, 0]} castShadow>{armorMaterial}</Capsule>
        <Box args={[0.2, 0.15, 0.3]} position={[0, -1.15, -0.15]} rotation={[-0.2, 0, 0]} castShadow>{armorMaterial}</Box>
        <Cylinder args={[0.05, 0.08, 0.1]} position={[0, -1.25, -0.25]} rotation={[-0.2, 0, 0]}>{neonMaterial}</Cylinder>
      </group>
    </group>
  );
};

export default PlayerNFT;

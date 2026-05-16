import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

const KeeperNFT = ({ keeperTarget, gameState, nftUrl }) => {
  const ref = useRef();
  const startPos = new THREE.Vector3(0, 1, -4.5);
  const targetPos = useRef(new THREE.Vector3(0, 1, -4.5));

  useEffect(() => {
    if (gameState === 'aiming') {
      targetPos.current.copy(startPos);
      ref.current.position.copy(startPos);
    }
    if (gameState === 'kicking' && keeperTarget) {
      targetPos.current.set(keeperTarget.position[0], keeperTarget.position[1], -4.5);
    }
  }, [gameState, keeperTarget]);

  useFrame((state, delta) => {
    if (gameState === 'kicking' || gameState === 'result') {
      ref.current.position.lerp(targetPos.current, 5 * delta);
    }
  });

  const pointsMaterial = (
    <pointsMaterial 
      color="#FF3300" 
      size={0.03} 
      transparent={true} 
      opacity={0.8} 
      sizeAttenuation={true} 
    />
  );

  const shieldMaterial = (
    <meshStandardMaterial 
      color="#FF5500" 
      emissive="#FF5500" 
      emissiveIntensity={2} 
      transparent={true} 
      opacity={0.3} 
      wireframe={true} 
    />
  );

  return (
    <group ref={ref} position={[0, 1, -4.5]}>
      {/* Head - Hexagonal Array */}
      <points position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.4, 6, 4]} />
        {pointsMaterial}
      </points>

      {/* Torso */}
      <points position={[0, 0.4, 0]}>
        <boxGeometry args={[0.8, 1.0, 0.5, 10, 10, 5]} />
        {pointsMaterial}
      </points>

      {/* AI Shield Icon */}
      <Cylinder args={[0.2, 0.2, 0.05, 6]} position={[0, 0.5, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#FFAA00" />
      </Cylinder>

      {/* Chest Energy Shield */}
      <Box args={[0.85, 1.05, 0.55]} position={[0, 0.4, 0]}>
        {shieldMaterial}
      </Box>

      {/* Left Arm (Lunging pose) */}
      <group position={[-0.6, 0.6, 0]} rotation={[0, 0, 0.4]}>
        <points position={[0, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2, 3, 10, 3]} />
          {pointsMaterial}
        </points>
        {/* Left Glove Energy Shield */}
        <Box args={[0.3, 0.4, 0.3]} position={[0, -0.9, 0]}>
          {shieldMaterial}
        </Box>
      </group>

      {/* Right Arm (Lunging pose) */}
      <group position={[0.6, 0.6, 0]} rotation={[0, 0, -0.4]}>
        <points position={[0, -0.4, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2, 3, 10, 3]} />
          {pointsMaterial}
        </points>
        {/* Right Glove Energy Shield */}
        <Box args={[0.3, 0.4, 0.3]} position={[0, -0.9, 0]}>
          {shieldMaterial}
        </Box>
      </group>

      {/* Left Leg */}
      <group position={[-0.3, -0.1, 0]} rotation={[0, 0, 0.2]}>
        <points position={[0, -0.5, 0]}>
          <boxGeometry args={[0.25, 1.0, 0.25, 4, 10, 4]} />
          {pointsMaterial}
        </points>
      </group>

      {/* Right Leg */}
      <group position={[0.3, -0.1, 0]} rotation={[0, 0, -0.2]}>
        <points position={[0, -0.5, 0]}>
          <boxGeometry args={[0.25, 1.0, 0.25, 4, 10, 4]} />
          {pointsMaterial}
        </points>
      </group>
    </group>
  );
};

export default KeeperNFT;

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Capsule } from '@react-three/drei';
import * as THREE from 'three';

const KeeperNFT = ({ keeperTarget, gameState, nftUrl }) => {
  const ref = useRef();
  // Requested start position: [0, 1, -4.5]
  const startPos = new THREE.Vector3(0, 1, -4.5);
  const targetPos = useRef(new THREE.Vector3(0, 1, -4.5));

  useEffect(() => {
    if (gameState === 'aiming') {
      targetPos.current.copy(startPos);
      ref.current.position.copy(startPos);
    }
    if (gameState === 'kicking' && keeperTarget) {
      // Modify target to stay on the goal line (Z = -4.5) while matching X and Y
      targetPos.current.set(keeperTarget.position[0], keeperTarget.position[1], -4.5);
    }
  }, [gameState, keeperTarget]);

  useFrame((state, delta) => {
    if (gameState === 'kicking' || gameState === 'result') {
      ref.current.position.lerp(targetPos.current, 5 * delta);
    }
  });

  return (
    <mesh ref={ref} position={[0, 1, -4.5]} castShadow>
      <Capsule args={[0.4, 1, 4, 16]}>
        <meshStandardMaterial 
          color="#FF10F0" 
          emissive="#FF10F0" 
          emissiveIntensity={1.5} 
          wireframe={true}
        />
      </Capsule>
    </mesh>
  );
};

export default KeeperNFT;

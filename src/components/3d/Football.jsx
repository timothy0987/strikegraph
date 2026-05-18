import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Icosahedron } from '@react-three/drei';
import * as THREE from 'three';

const Football = ({ targetZone, gameState, onKickComplete, power = 1.0 }) => {
  const ref = useRef();
  // Requested start position: [0, 0.5, 3]
  const startPos = new THREE.Vector3(0, 0.5, 3);
  const targetPos = useRef(new THREE.Vector3(0, 0.5, 3));
  const progress = useRef(0);

  useEffect(() => {
    if (gameState === 'aiming' || gameState === 'menu') {
      ref.current.position.copy(startPos);
      targetPos.current.copy(startPos);
      progress.current = 0;
    }
    if (gameState === 'kicking' && targetZone) {
      targetPos.current.copy(targetZone.position);
    }
  }, [gameState, targetZone]);

  useFrame((state, delta) => {
    if (gameState === 'kicking') {
      progress.current += delta * 2 * power; // Speed scaled by power
      if (progress.current > 1) progress.current = 1;
      
      // Arc the ball slightly
      const currentPos = new THREE.Vector3().lerpVectors(startPos, targetPos.current, progress.current);
      currentPos.y += Math.sin(progress.current * Math.PI) * 1.5; // Arcing over the player

      ref.current.position.copy(currentPos);

      // Spin the ball
      ref.current.rotation.x -= delta * 15;
      ref.current.rotation.y += delta * 10;

      if (progress.current >= 1) {
        onKickComplete();
      }
    }
  });

  return (
    <mesh ref={ref} position={[0, 0.5, 3]} castShadow>
      <Icosahedron args={[0.25, 1]}>
        <meshStandardMaterial 
          color="#39FF14" 
          emissive="#39FF14" 
          emissiveIntensity={2} 
          wireframe={true} 
        />
      </Icosahedron>
    </mesh>
  );
};

export default Football;

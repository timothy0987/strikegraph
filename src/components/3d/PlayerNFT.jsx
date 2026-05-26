import React, { Suspense, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const PlayerModel = ({ gameState, selectedPlayer }) => {
  const { scene, animations } = useGLTF('/player1.glb');
  const { ref, actions } = useAnimations(animations);

  useEffect(() => {
    if (!scene || !selectedPlayer?.color) return;
    
    // Create the color object ONCE outside the traverse loop
    const targetColor = new THREE.Color(selectedPlayer.color);
    
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          // Safely mutate the existing material, DO NOT clone it
          child.material.emissive = targetColor;
          child.material.emissiveIntensity = 0.5;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [scene, selectedPlayer?.color]); // STRICT dependencies to prevent infinite loops

  useEffect(() => {
    if (!animations || !animations.length || !actions) return;
    const animName = animations[0].name;
    const action = actions[animName];

    if (gameState === 'aiming') {
      // Play the animation but instantly pause it on the first frame to act as a ready stance
      action.reset().play();
      action.paused = true; 
      action.time = 0; 
    } else if (gameState === 'kicking') {
      // Unpause and play through once
      action.paused = false;
      action.reset().setLoop(THREE.LoopOnce).clampWhenFinished = true;
      action.play();
    }
  }, [gameState, actions, animations]);

  return <primitive ref={ref} object={scene} scale={[1, 1, 1]} />;
};

const PlayerNFT = ({ gameState, selectedPlayer }) => {
  return (
    <group position={[0, 0, 4]} rotation={[0, Math.PI, 0]}>
      <Suspense fallback={null}>
        <PlayerModel gameState={gameState} selectedPlayer={selectedPlayer} />
      </Suspense>
    </group>
  );
};

useGLTF.preload('/player1.glb');

export default PlayerNFT;

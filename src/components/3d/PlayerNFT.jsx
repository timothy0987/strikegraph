import React, { Suspense, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const PlayerModel = ({ gameState, selectedPlayer }) => {
  const { scene, animations } = useGLTF('/player1.glb');
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    scene.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        if (selectedPlayer && selectedPlayer.color) {
          object.material.emissive = new THREE.Color(selectedPlayer.color);
          object.material.emissiveIntensity = 0.5;
        }
      }
    });
  }, [scene, selectedPlayer]);

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

  return <primitive object={scene} scale={[1, 1, 1]} />;
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

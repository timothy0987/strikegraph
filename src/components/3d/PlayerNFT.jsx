import React, { Suspense, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const PlayerModel = ({ gameState }) => {
  const { scene, animations } = useGLTF('/player1.glb');
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    scene.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [scene]);

  useEffect(() => {
    if (!animations || animations.length === 0) return;
    if (!actions || Object.keys(actions).length === 0) return;
    
    // Stop all actions first
    Object.values(actions).forEach(action => action?.fadeOut(0.2));

    const kickAnimName = animations[0].name;

    if (gameState === 'kicking') {
      actions[kickAnimName].reset().fadeIn(0.2).setLoop(THREE.LoopOnce, 1);
      actions[kickAnimName].clampWhenFinished = true;
      actions[kickAnimName].play();
    } else {
      actions[kickAnimName].reset().fadeIn(0.2).play();
    }
  }, [gameState, actions, animations]);

  return <primitive object={scene} scale={[1, 1, 1]} />;
};

const PlayerNFT = ({ gameState }) => {
  return (
    <group position={[0, 0, 4]} rotation={[0, Math.PI, 0]}>
      <Suspense fallback={null}>
        <PlayerModel gameState={gameState} />
      </Suspense>
    </group>
  );
};

useGLTF.preload('/player1.glb');

export default PlayerNFT;

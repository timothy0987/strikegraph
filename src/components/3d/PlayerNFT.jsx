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
    if (!actions) return;
    
    // Stop all actions first
    Object.values(actions).forEach(action => action?.fadeOut(0.2));

    const idleAnim = actions['Idle'] || actions['idle'] || actions[Object.keys(actions)[0]];
    const kickAnim = actions['PenaltyKick'] || actions['penaltykick'] || actions[Object.keys(actions)[1]] || idleAnim;

    if (gameState === 'aiming' && idleAnim) {
      idleAnim.reset().fadeIn(0.2).play();
    } else if (gameState === 'kicking' && kickAnim) {
      const kickAction = kickAnim.reset().fadeIn(0.2).play();
      kickAction.setLoop(THREE.LoopOnce, 1);
      kickAction.clampWhenFinished = true;
    }
  }, [gameState, actions]);

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

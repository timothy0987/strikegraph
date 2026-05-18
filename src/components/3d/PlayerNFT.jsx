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
    if (!actions || Object.keys(actions).length === 0) return;
    
    console.log('Player Actions:', Object.keys(actions));
    
    // Stop all actions first
    Object.values(actions).forEach(action => action?.fadeOut(0.2));

    let idleAnim = actions['Idle'] || actions['idle'];
    if (!idleAnim && Object.keys(actions).length > 0) {
      idleAnim = actions[Object.keys(actions)[0]];
    }

    let kickAnim = actions['PenaltyKick'] || actions['penaltykick'];
    if (!kickAnim && Object.keys(actions).length > 1) {
      kickAnim = actions[Object.keys(actions)[1]];
    }
    if (!kickAnim) kickAnim = idleAnim;

    if (gameState === 'kicking' && kickAnim) {
      const kickAction = kickAnim.reset().fadeIn(0.2).play();
      kickAction.setLoop(THREE.LoopOnce, 1);
      kickAction.clampWhenFinished = true;
    } else if (idleAnim) {
      idleAnim.reset().fadeIn(0.2).play();
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

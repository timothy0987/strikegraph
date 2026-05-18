import React, { useRef, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const KeeperModel = ({ gameState, keeperTarget }) => {
  const { scene, animations } = useGLTF('/keeper1.glb');
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
    
    console.log('Keeper Actions:', Object.keys(actions));

    Object.values(actions).forEach(action => action?.fadeOut(0.2));

    let idleAnim = actions['Idle'] || actions['idle'];
    if (!idleAnim && Object.keys(actions).length > 0) {
      idleAnim = actions[Object.keys(actions)[0]];
    }

    if (gameState === 'kicking' && keeperTarget) {
      const isDivingLeft = keeperTarget.position[0] > 0;
      const diveAnimName = isDivingLeft ? 'DiveLeft' : 'DiveRight';
      
      let diveAction = actions[diveAnimName] || actions['DiveLeft'] || actions['DiveRight'];
      if (!diveAction && Object.keys(actions).length > 1) {
         diveAction = actions[Object.keys(actions)[1]];
      }
      if (!diveAction) diveAction = idleAnim;

      if (diveAction) {
        diveAction.reset().fadeIn(0.2).play();
        diveAction.setLoop(THREE.LoopOnce, 1);
        diveAction.clampWhenFinished = true;
      }
    } else if (idleAnim) {
      idleAnim.reset().fadeIn(0.2).play();
    }
  }, [gameState, actions, keeperTarget]);

  return <primitive object={scene} scale={[1, 1, 1]} />;
};

const KeeperNFT = ({ keeperTarget, gameState, nftUrl }) => {
  const ref = useRef();
  const startPos = new THREE.Vector3(0, 0, -4.5);
  const targetPos = useRef(new THREE.Vector3(0, 0, -4.5));

  useEffect(() => {
    if (gameState === 'aiming') {
      targetPos.current.copy(startPos);
      ref.current.position.copy(startPos);
    }
    if (gameState === 'kicking' && keeperTarget) {
      targetPos.current.set(keeperTarget.position[0], 0, -4.5);
    }
  }, [gameState, keeperTarget]);

  useFrame((state, delta) => {
    if (gameState === 'kicking' || gameState === 'result') {
      ref.current.position.lerp(targetPos.current, 5 * delta);
    }
  });

  return (
    <group ref={ref} position={[0, 0, -4.5]} rotation={[0, 0, 0]}>
      <Suspense fallback={null}>
        <KeeperModel gameState={gameState} keeperTarget={keeperTarget} />
      </Suspense>
    </group>
  );
};

useGLTF.preload('/keeper1.glb');

export default KeeperNFT;

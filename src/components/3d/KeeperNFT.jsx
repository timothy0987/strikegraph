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
    if (!animations || animations.length === 0) return;
    if (!actions || Object.keys(actions).length === 0) return;

    Object.values(actions).forEach(action => action?.fadeOut(0.2));

    const diveAnimName = animations[0].name;

    if (gameState === 'kicking') {
      actions[diveAnimName].reset().fadeIn(0.2).setLoop(THREE.LoopOnce, 1);
      actions[diveAnimName].clampWhenFinished = true;
      actions[diveAnimName].play();
    } else {
      actions[diveAnimName].reset().fadeIn(0.2).play();
    }
  }, [gameState, actions, animations, keeperTarget]);

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

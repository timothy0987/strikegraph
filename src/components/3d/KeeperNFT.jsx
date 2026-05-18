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
    if (!animations || !animations.length || !actions) return;
    const animName = animations[0].name;
    const action = actions[animName];

    if (gameState === 'aiming') {
      action.reset().play();
      action.paused = true; 
      action.time = 0; 
    } else if (gameState === 'kicking') {
      action.paused = false;
      action.reset().setLoop(THREE.LoopOnce).clampWhenFinished = true;
      action.play();
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

import React, { useRef, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const KeeperModel = ({ gameState, keeperTarget, keeperRef }) => {
  const { scene, animations, nodes } = useGLTF('/keeper2.glb');
  const { ref, actions } = useAnimations(animations);

  // Expose nodes and scene so other components can access the bone world coordinates
  useEffect(() => {
    if (nodes && keeperRef) {
      keeperRef.current = { nodes, scene };
    }
  }, [nodes, scene, keeperRef]);

  // Play the first animation sequence on loop when component mounts
  useEffect(() => {
    if (!animations || !animations.length || !actions) return;
    const animName = animations[0].name;
    const action = actions[animName];
    if (action) {
      action.reset().setLoop(THREE.LoopRepeat).play();
    }
  }, [actions, animations]);

  useEffect(() => {
    scene.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [scene]);

  const bonesRef = useRef({});

  useEffect(() => {
    if (!nodes) return;
    const findBone = (suffix) => {
      const key = Object.keys(nodes).find(
        (k) => k.toLowerCase().endsWith(suffix.toLowerCase())
      );
      return key ? nodes[key] : null;
    };
    bonesRef.current = {
      leftArm: findBone('leftarm'),
      rightArm: findBone('rightarm'),
      leftShoulder: findBone('leftshoulder'),
      rightShoulder: findBone('rightshoulder'),
    };
  }, [nodes]);

  useFrame(() => {
    const { leftArm, rightArm, leftShoulder, rightShoulder } = bonesRef.current;
    
    // Apply downward rotations (Z-axis rotation for T-pose lowering)
    if (leftArm) {
      leftArm.rotation.z = -Math.PI / 3;
    }
    if (rightArm) {
      rightArm.rotation.z = Math.PI / 3;
    }

    // Minor downward rotation for shoulders to look natural
    if (leftShoulder) {
      leftShoulder.rotation.z = -Math.PI / 18;
    }
    if (rightShoulder) {
      rightShoulder.rotation.z = Math.PI / 18;
    }
  });

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

  return <primitive ref={ref} object={scene} scale={[1, 1, 1]} />;
};

const KeeperNFT = ({ keeperTarget, gameState, power = 1.0, keeperRef }) => {
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
      ref.current.position.lerp(targetPos.current, 5 * power * delta);
    }
  });

  return (
    <group ref={ref} position={[0, 0, -4.5]} rotation={[0, 0, 0]}>
      <Suspense fallback={null}>
        <KeeperModel gameState={gameState} keeperTarget={keeperTarget} keeperRef={keeperRef} />
      </Suspense>
    </group>
  );
};

useGLTF.preload('/keeper2.glb');

export default KeeperNFT;

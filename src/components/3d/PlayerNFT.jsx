import React, { Suspense, useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Jersey from './Jersey';

const PlayerModel = ({ gameState, selectedPlayer }) => {
  const { scene, animations, nodes } = useGLTF('/player2.glb');
  const { ref, actions } = useAnimations(animations);

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
    if (!scene || !selectedPlayer?.color) return;
    
    // Create the color object ONCE outside the traverse loop
    const targetColor = new THREE.Color(selectedPlayer.color);
    
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            // Body tint backs up the jersey so the kicker reads in its colour
            mat.emissive = targetColor;
            mat.emissiveIntensity = 0.22;
            mat.needsUpdate = true;
          });
        }
      }
    });
  }, [scene, selectedPlayer?.color]); // STRICT dependencies to prevent infinite loops

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
      spine: findBone('spine1') || findBone('spine'),
      head: findBone('head'),
    };
  }, [nodes]);

  useFrame((state, delta) => {
    const { leftArm, rightArm, leftShoulder, rightShoulder, spine, head } = bonesRef.current;
    const t = state.clock.elapsedTime;
    const idle = gameState === 'menu' || gameState === 'aiming';

    // In idle stances the baked clip is paused, so ease the arms down out of the
    // T-pose. During the run-up / strike the animation drives them untouched.
    if (idle) {
      const d = Math.min(delta * 6, 1);
      if (leftArm) leftArm.rotation.z += (-Math.PI / 3 - leftArm.rotation.z) * d;
      if (rightArm) rightArm.rotation.z += (Math.PI / 3 - rightArm.rotation.z) * d;
      if (leftShoulder) leftShoulder.rotation.z += (-Math.PI / 18 - leftShoulder.rotation.z) * d;
      if (rightShoulder) rightShoulder.rotation.z += (Math.PI / 18 - rightShoulder.rotation.z) * d;

      // Breathing + idle head movement so the ready stance isn't a statue
      if (spine) spine.rotation.x = Math.sin(t * 1.6) * 0.035;
      if (head) head.rotation.y = Math.sin(t * 0.7) * 0.08;
    }
  });

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

  return (
    <>
      <primitive ref={ref} object={scene} scale={[1, 1, 1]} />
      <Jersey nodes={nodes} color={selectedPlayer?.color || '#00FFFF'} scale={0.73} bulk={1.28} glow={0.95} />
    </>
  );
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

useGLTF.preload('/player2.glb');

export default PlayerNFT;

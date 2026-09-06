import React, { useRef, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const KeeperModel = ({ gameState, keeperTarget, keeperRef, resetTrigger }) => {
  const { scene, animations, nodes } = useGLTF('/keeper2.glb');
  const { ref, actions } = useAnimations(animations);
  const lastResetTrigger = useRef(0);

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
        // The keeper is mirror-scaled on dives; render both faces so lighting
        // stays correct when the winding order flips.
        const mats = Array.isArray(object.material) ? object.material : [object.material];
        mats.forEach((m) => { if (m) m.side = THREE.DoubleSide; });
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
      spine: findBone('spine1') || findBone('spine'),
      head: findBone('head'),
    };
  }, [nodes]);

  useFrame((state, delta) => {
    const { leftArm, rightArm, leftShoulder, rightShoulder, spine, head } = bonesRef.current;
    const t = state.clock.elapsedTime;
    const idle = gameState === 'menu' || gameState === 'aiming';

    // Only shape the ready stance while idle — let the dive clip own the arms
    // during 'kicking' / 'result' so the save doesn't look robotic.
    if (idle) {
      const d = Math.min(delta * 6, 1);
      // Arms held out and slightly forward, with a subtle alert bounce
      const bob = Math.sin(t * 3.2) * 0.06;
      if (leftArm) leftArm.rotation.z += (-Math.PI / 4 + bob - leftArm.rotation.z) * d;
      if (rightArm) rightArm.rotation.z += (Math.PI / 4 - bob - rightArm.rotation.z) * d;
      if (leftShoulder) leftShoulder.rotation.z += (-Math.PI / 14 - leftShoulder.rotation.z) * d;
      if (rightShoulder) rightShoulder.rotation.z += (Math.PI / 14 - rightShoulder.rotation.z) * d;
      if (spine) spine.rotation.x = 0.12 + Math.sin(t * 2.1) * 0.03; // crouched, breathing
      if (head) head.rotation.y = Math.sin(t * 1.1) * 0.06;
    }
  });

  useEffect(() => {
    if (!animations || !animations.length || !actions) return;
    const animName = animations[0].name;
    const action = actions[animName];

    let shouldReset = false;
    if (resetTrigger > lastResetTrigger.current) {
      lastResetTrigger.current = resetTrigger;
      shouldReset = true;
    }
    if (gameState === 'aiming') {
      shouldReset = true;
    }

    if (shouldReset) {
      action.reset().play();
      action.paused = true; 
      action.time = 0; 
    } else if (gameState === 'kicking') {
      action.paused = false;
      action.reset().setLoop(THREE.LoopOnce).clampWhenFinished = true;
      action.play();
    }
  }, [gameState, actions, animations, keeperTarget, resetTrigger]);

  const scaleX = keeperTarget && keeperTarget.position[0] < 0 ? -1 : 1;
  return <primitive ref={ref} object={scene} scale={[scaleX, 1, 1]} />;
};

const KeeperNFT = ({ keeperTarget, gameState, power = 1.0, keeperRef, resetTrigger }) => {
  const ref = useRef();
  const startPos = new THREE.Vector3(0, 0, -4.5);
  const targetPos = useRef(new THREE.Vector3(0, 0, -4.5));
  const lastResetTrigger = useRef(0);

  useEffect(() => {
    let shouldReset = false;
    if (resetTrigger > lastResetTrigger.current) {
      lastResetTrigger.current = resetTrigger;
      shouldReset = true;
    }
    if (gameState === 'aiming') {
      shouldReset = true;
    }

    if (shouldReset) {
      targetPos.current.copy(startPos);
      ref.current.position.copy(startPos);
    }
    if (gameState === 'kicking' && keeperTarget) {
      targetPos.current.set(keeperTarget.position[0], 0, -4.5);
    }
  }, [gameState, keeperTarget, resetTrigger]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    if (gameState === 'kicking' || gameState === 'result') {
      ref.current.position.lerp(targetPos.current, 5 * power * delta);
    } else if (gameState === 'aiming' || gameState === 'menu') {
      // Alert shuffle along the line + a light bounce on the spot
      const t = state.clock.elapsedTime;
      const goalX = Math.sin(t * 0.9) * 0.5 + Math.sin(t * 2.3) * 0.12;
      ref.current.position.x += (goalX - ref.current.position.x) * Math.min(delta * 3, 1);
      ref.current.position.y = Math.abs(Math.sin(t * 3.2)) * 0.05;
    }
  });

  return (
    <group ref={ref} position={[0, 0, -4.5]} rotation={[0, 0, 0]}>
      <Suspense fallback={null}>
        <KeeperModel gameState={gameState} keeperTarget={keeperTarget} keeperRef={keeperRef} resetTrigger={resetTrigger} />
      </Suspense>
    </group>
  );
};

useGLTF.preload('/keeper2.glb');

export default KeeperNFT;

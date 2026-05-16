import React, { useRef, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Capsule } from '@react-three/drei';
import * as THREE from 'three';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const KeeperModel = ({ gameState, keeperTarget }) => {
  const { scene, animations } = useGLTF('/models/keeper.glb');
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    if (!actions) return;
    
    // Stop all actions first
    Object.values(actions).forEach(action => action?.fadeOut(0.2));

    if (gameState === 'aiming' && actions['Idle']) {
      actions['Idle'].reset().fadeIn(0.2).play();
    } else if (gameState === 'kicking' && keeperTarget) {
      // Keeper is facing Z positive, its left is positive X, its right is negative X
      const isDivingLeft = keeperTarget.position[0] > 0;
      const diveAnimName = isDivingLeft ? 'DiveLeft' : 'DiveRight';
      
      const diveAction = actions[diveAnimName] || actions['DiveLeft'] || actions['DiveRight'];
      if (diveAction) {
        diveAction.reset().fadeIn(0.2).play();
        diveAction.setLoop(THREE.LoopOnce, 1);
        diveAction.clampWhenFinished = true;
      }
    }
  }, [gameState, actions, keeperTarget]);

  return <primitive object={scene} />;
};

const FallbackKeeper = () => (
  <mesh position={[0, 1, 0]} castShadow>
    <Capsule args={[0.4, 1, 4, 16]}>
      <meshStandardMaterial color="#FF10F0" emissive="#FF10F0" emissiveIntensity={1.5} wireframe={true} />
    </Capsule>
  </mesh>
);

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
    <group ref={ref} position={[0, 0, -4.5]}>
      <ErrorBoundary fallback={<FallbackKeeper />}>
        <Suspense fallback={<FallbackKeeper />}>
          <KeeperModel gameState={gameState} keeperTarget={keeperTarget} />
        </Suspense>
      </ErrorBoundary>
    </group>
  );
};

export default KeeperNFT;

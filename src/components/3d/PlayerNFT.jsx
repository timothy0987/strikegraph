import React, { Suspense, useEffect } from 'react';
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

const PlayerModel = ({ gameState }) => {
  const { scene, animations } = useGLTF('/models/player.glb');
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    if (!actions) return;
    
    // Stop all actions first
    Object.values(actions).forEach(action => action?.fadeOut(0.2));

    if (gameState === 'aiming' && actions['Idle']) {
      actions['Idle'].reset().fadeIn(0.2).play();
    } else if (gameState === 'kicking' && actions['PenaltyKick']) {
      const kickAction = actions['PenaltyKick'].reset().fadeIn(0.2).play();
      kickAction.setLoop(THREE.LoopOnce, 1);
      kickAction.clampWhenFinished = true;
    }
  }, [gameState, actions]);

  return <primitive object={scene} />;
};

const FallbackAvatar = () => (
  <mesh position={[0, 1, 0]} castShadow>
    <Capsule args={[0.4, 1, 4, 16]}>
      <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={1.5} wireframe={true} />
    </Capsule>
  </mesh>
);

const PlayerNFT = ({ gameState, nftUrl }) => {
  return (
    <group position={[0, 0, 4]}>
      <ErrorBoundary fallback={<FallbackAvatar />}>
        <Suspense fallback={<FallbackAvatar />}>
          <PlayerModel gameState={gameState} />
        </Suspense>
      </ErrorBoundary>
    </group>
  );
};

export default PlayerNFT;

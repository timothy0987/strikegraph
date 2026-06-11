import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, OrbitControls, Ring } from '@react-three/drei';
import { useGame } from '../context/GameContext';
import { useXP } from '../hooks/useXP';
import * as THREE from 'three';

import Football from './3d/Football';
import PlayerNFT from './3d/PlayerNFT';
import KeeperNFT from './3d/KeeperNFT';
import { Pitch, Goalpost } from './3d/Stadium';

const KEEPER_SAVE_STAT = 60;

const AimingReticle = ({ aimX }) => {
  const materialRef = useRef();

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 2 + Math.sin(clock.elapsedTime * 5);
    }
  });

  return (
    <mesh position={[aimX, 0.03, -4.5]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.4, 32]} />
      <meshStandardMaterial 
        ref={materialRef} 
        color="#39FF14" 
        emissive="#39FF14" 
        emissiveIntensity={2} 
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

// Cinematic Camera Director that interpolates between default and action replay angles
const CameraDirector = ({ gameState, isGoal, targetZone }) => {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 3, 8));
  const lookAtTarget = useRef(new THREE.Vector3(0, 1, -4.5));
  const currentLookAt = useRef(new THREE.Vector3(0, 1, -4.5));

  useFrame((state, delta) => {
    if (gameState === 'kicking' || gameState === 'result') {
      const targetAimX = targetZone?.position[0] || 0;
      
      if (gameState === 'kicking') {
        // Broadcast camera: low angle, side view tracking the shot path
        targetPos.current.set(targetAimX + (targetAimX > 0 ? -1.8 : 1.8), 0.8, 1.2);
        lookAtTarget.current.set(targetAimX, 0.7, -4.5);
      } else if (gameState === 'result') {
        // Replay resolution camera
        if (isGoal) {
          // View of the ball in the net from inside the goal frame
          targetPos.current.set(targetAimX * 0.5, 1.6, -3.2);
          lookAtTarget.current.set(targetAimX, 0.4, -5.0);
        } else {
          // Close-up on the keeper catching the ball
          targetPos.current.set(targetAimX * 0.8, 1.0, -2.6);
          lookAtTarget.current.set(targetAimX, 0.8, -4.5);
        }
      }
      
      camera.position.lerp(targetPos.current, 3.5 * delta);
      currentLookAt.current.lerp(lookAtTarget.current, 5 * delta);
      camera.lookAt(currentLookAt.current);
    } else {
      // Reset targets for default view
      targetPos.current.set(0, 3, 8);
      lookAtTarget.current.set(0, 1, -4.5);
      currentLookAt.current.set(0, 1, -4.5);
    }
  });

  return null;
};

const GameScene = () => {
  const { gameState, setGameState, selectedPlayer, setResult, resetTrigger } = useGame();
  const { addXP } = useXP();
  
  const [aimX, setAimX] = useState(0);
  const [targetZone, setTargetZone] = useState(null);
  const [keeperTarget, setKeeperTarget] = useState(null);
  const [isGoal, setIsGoal] = useState(false);
  const keeperRef = useRef();
  const lastResetTrigger = useRef(0);

  useEffect(() => {
    if (resetTrigger > lastResetTrigger.current) {
      lastResetTrigger.current = resetTrigger;
      setTargetZone(null);
      setKeeperTarget(null);
      setAimX(0);
    }
  }, [resetTrigger]);

  useEffect(() => {
    if (gameState !== 'aiming') return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setAimX((prev) => Math.max(prev - 0.2, -2.5));
      } else if (e.key === 'ArrowRight') {
        setAimX((prev) => Math.min(prev + 0.2, 2.5));
      } else if (e.key === ' ') {
        triggerKick();
      }
    };

    let startX = 0;
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
    };
    const handleTouchMove = (e) => {
      const deltaX = e.touches[0].clientX - startX;
      setAimX((prev) => {
        let newX = prev + deltaX * 0.01;
        return Math.max(Math.min(newX, 2.5), -2.5);
      });
      startX = e.touches[0].clientX; // update for smooth dragging
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameState, aimX]);

  const triggerKick = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (gameState !== 'aiming') return;
    
    const variance = (Math.random() - 0.5) * 1.5; // +/- 0.75 spread max
    const reducedVariance = variance / (selectedPlayer?.accuracy || 1.0);
    let finalAimX = aimX + reducedVariance;
    finalAimX = Math.max(Math.min(finalAimX, 2.5), -2.5); // clamp

    // Determine goal/save outcome based on economy rate
    const baseWinChance = 0.30;
    const finalWinChance = baseWinChance * (selectedPlayer?.accuracy || 1.0);
    const isGoalOutcome = Math.random() < finalWinChance;
    setIsGoal(isGoalOutcome);

    // Set target zone object for Football.jsx
    setTargetZone({ position: [finalAimX, 0.5, -4.5] });
    
    // Choose keeper's X position based on the outcome
    let keeperX;
    if (isGoalOutcome) {
      // Dive away: if ball is on left, dive right; if ball is on right, dive left
      // If the shot is dead center, pick left or right randomly
      if (Math.abs(finalAimX) < 0.2) {
        keeperX = Math.random() < 0.5 ? (0.9 + Math.random() * 1.6) : (-0.9 - Math.random() * 1.6);
      } else if (finalAimX < 0) {
        keeperX = 0.9 + Math.random() * 1.6;
      } else {
        keeperX = -0.9 - Math.random() * 1.6;
      }
    } else {
      // Dive to the same spot to save it
      keeperX = finalAimX;
    }
    
    setKeeperTarget({ position: [keeperX, 0.5, -4.5] });
    setGameState('kicking');
  };

  const handleKickComplete = () => {
    if (gameState !== 'kicking') return;
    
    addXP(50);
    setResult(isGoal ? 'GOAL' : 'SAVED');
    setGameState('result');
  };

  return (
    <>
      <Canvas shadows style={{ background: '#050505', touchAction: 'none' }}>
        <PerspectiveCamera makeDefault position={[0, 3, 8]} fov={60} />
        <CameraDirector gameState={gameState} isGoal={isGoal} targetZone={targetZone} />
        
        {(gameState === 'aiming' || gameState === 'menu') && (
          <OrbitControls 
            enablePan={false}
            enableZoom={false}
            maxPolarAngle={Math.PI / 2 - 0.1}
            minAzimuthAngle={-Math.PI / 4}
            maxAzimuthAngle={Math.PI / 4}
          />
        )}

        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={2} castShadow shadow-mapSize={1024} />
        <pointLight position={[0, 2, -4]} color="#39FF14" intensity={5} distance={10} />
        <pointLight position={[0, 2, 2]} color="#FF10F0" intensity={3} distance={8} />

        <Pitch />
        <Goalpost />
        
        <PlayerNFT selectedPlayer={selectedPlayer} gameState={gameState} />
        <KeeperNFT keeperTarget={keeperTarget} gameState={gameState} power={selectedPlayer?.power || 1.0} keeperRef={keeperRef} resetTrigger={resetTrigger} />
        <Football targetZone={targetZone} gameState={gameState} onKickComplete={handleKickComplete} power={selectedPlayer?.power || 1.0} isGoal={isGoal} keeperRef={keeperRef} resetTrigger={resetTrigger} />

        {gameState === 'aiming' && <AimingReticle aimX={aimX} />}
        
        <Environment preset="night" />
      </Canvas>
      {gameState === 'aiming' && (
        <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}>
          <button 
            style={{ pointerEvents: 'auto', padding: '15px 40px', fontSize: '24px', fontWeight: 'bold', background: 'rgba(57, 255, 20, 0.8)', color: '#000', border: '2px solid #39FF14', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 0 20px #39FF14' }} 
            onClick={triggerKick}
            onTouchStart={triggerKick}
          >
            SHOOT
          </button>
        </div>
      )}
    </>
  );
};

export default GameScene;

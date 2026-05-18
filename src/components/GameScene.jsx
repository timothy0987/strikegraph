import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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

const GameScene = () => {
  const { gameState, setGameState, selectedPlayer, setResult } = useGame();
  const { addXP } = useXP();
  
  const [aimX, setAimX] = useState(0);
  const [targetZone, setTargetZone] = useState(null);
  const [keeperTarget, setKeeperTarget] = useState(null);

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

  const triggerKick = () => {
    if (gameState !== 'aiming') return;
    
    // Calculate variance based on accuracy
    const variance = (Math.random() - 0.5) * 1.5; // +/- 0.75 spread max
    const reducedVariance = variance / selectedPlayer.accuracy;
    let finalAimX = aimX + reducedVariance;
    finalAimX = Math.max(Math.min(finalAimX, 2.5), -2.5); // clamp

    // Set target zone object for Football.jsx
    setTargetZone({ position: [finalAimX, 0.5, -4.5] });
    
    // AI Keeper decides randomly between -2.5 and 2.5
    const keeperRandomX = (Math.random() * 5) - 2.5;
    setKeeperTarget({ position: [keeperRandomX, 0.5, -4.5] });
    
    setGameState('kicking');
  };

  const handleKickComplete = () => {
    if (gameState !== 'kicking') return;
    
    let isGoal = false;
    
    const dist = Math.abs(targetZone.position[0] - keeperTarget.position[0]);
    if (dist > 0.8) { 
      isGoal = true;
    } else {
      // If keeper is close, chance to save based on power (more power = less likely to save)
      const saveChance = KEEPER_SAVE_STAT / selectedPlayer.power;
      const roll = Math.random() * 100;
      if (roll > saveChance) {
        isGoal = true;
      } else {
        isGoal = false;
      }
    }

    addXP(50);
    setResult(isGoal ? 'GOAL' : 'SAVED');
    setGameState('result');
  };

  return (
    <>
      <Canvas shadows style={{ background: '#050505', touchAction: 'none' }}>
        <PerspectiveCamera makeDefault position={[0, 3, 8]} fov={60} />
        
        <OrbitControls 
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
        />

        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={2} castShadow shadow-mapSize={1024} />
        <pointLight position={[0, 2, -4]} color="#39FF14" intensity={5} distance={10} />
        <pointLight position={[0, 2, 2]} color="#FF10F0" intensity={3} distance={8} />

        <Pitch />
        <Goalpost />
        
        <PlayerNFT selectedPlayer={selectedPlayer} gameState={gameState} />
        <KeeperNFT keeperTarget={keeperTarget} gameState={gameState} power={selectedPlayer.power} />
        <Football targetZone={targetZone} gameState={gameState} onKickComplete={handleKickComplete} power={selectedPlayer.power} />

        {gameState === 'aiming' && <AimingReticle aimX={aimX} />}
        
        <Environment preset="night" />
      </Canvas>
      {gameState === 'aiming' && (
        <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}>
          <button 
            style={{ pointerEvents: 'auto', padding: '15px 40px', fontSize: '24px', fontWeight: 'bold', background: 'rgba(57, 255, 20, 0.8)', color: '#000', border: '2px solid #39FF14', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 0 20px #39FF14' }} 
            onClick={triggerKick}
          >
            SHOOT
          </button>
        </div>
      )}
    </>
  );
};

export default GameScene;

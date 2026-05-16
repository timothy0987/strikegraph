import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, OrbitControls, Ring } from '@react-three/drei';
import { useGame } from '../context/GameContext';
import { useXP } from '../hooks/useXP';
import * as THREE from 'three';

import Football from './3d/Football';
import PlayerNFT from './3d/PlayerNFT';
import KeeperNFT from './3d/KeeperNFT';
import { Pitch, Goalpost } from './3d/Stadium';

const KEEPER_SAVE_STAT = 60;

const GameScene = () => {
  const { gameState, setGameState, currentKicker, setResult } = useGame();
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
    
    // Set target zone object for Football.jsx backward compatibility
    setTargetZone({ position: [aimX, 0.5, -4.5] });
    
    // AI Keeper decides randomly between -2.5 and 2.5
    const keeperRandomX = (Math.random() * 5) - 2.5;
    setKeeperTarget({ position: [keeperRandomX, 0.5, -4.5] });
    
    setGameState('kicking');
  };

  const handleKickComplete = () => {
    if (gameState !== 'kicking') return;
    
    let isGoal = false;
    
    // Distance check to see if keeper saved it
    const dist = Math.abs(targetZone.position[0] - keeperTarget.position[0]);
    if (dist > 1.0) { // Keeper missed the zone by more than 1 unit
      isGoal = true;
    } else {
      // RNG Check if keeper was close enough
      const accScore = (currentKicker.accuracy * 0.6) + (Math.random() * 40);
      if (accScore > KEEPER_SAVE_STAT) {
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
        
        <PlayerNFT nftUrl={null} gameState={gameState} />
        <KeeperNFT keeperTarget={keeperTarget} gameState={gameState} nftUrl={null} />
        <Football targetZone={targetZone} gameState={gameState} onKickComplete={handleKickComplete} />

        {gameState === 'aiming' && (
          <mesh position={[aimX, 0.03, -4.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.4, 32]} />
            <meshStandardMaterial color="#39FF14" emissive="#39FF14" emissiveIntensity={2} />
          </mesh>
        )}
        
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

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, OrbitControls } from '@react-three/drei';
import { useGame } from '../context/GameContext';
import { useXP } from '../hooks/useXP';

import Football from './3d/Football';
import PlayerNFT from './3d/PlayerNFT';
import KeeperNFT from './3d/KeeperNFT';
import { Pitch, Goalpost } from './3d/Stadium';

const KEEPER_SAVE_STAT = 60;
const ZONES = [
  { id: 'top-left', position: [-2, 1.5, -4.5] },
  { id: 'bottom-left', position: [-2, 0.5, -4.5] },
  { id: 'center', position: [0, 1.0, -4.5] },
  { id: 'top-right', position: [2, 1.5, -4.5] },
  { id: 'bottom-right', position: [2, 0.5, -4.5] },
];

const TargetZone = ({ zone, onClick, active }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <mesh 
      position={zone.position} 
      onClick={() => active && onClick(zone)}
      onPointerOver={() => active && setHovered(true)}
      onPointerOut={() => active && setHovered(false)}
    >
      <boxGeometry args={[1.5, 1, 0.5]} />
      <meshBasicMaterial 
        color="#39FF14" 
        transparent 
        opacity={active ? (hovered ? 0.3 : 0.1) : 0} 
        wireframe={active}
      />
    </mesh>
  );
};

const GameScene = () => {
  const { gameState, setGameState, currentKicker, setResult } = useGame();
  const { addXP } = useXP();
  
  const [targetZone, setTargetZone] = useState(null);
  const [keeperTarget, setKeeperTarget] = useState(null);

  const handleTargetClick = (zone) => {
    if (gameState !== 'aiming') return;
    
    setTargetZone(zone);
    
    // AI Keeper decides randomly
    const randomZone = ZONES[Math.floor(Math.random() * ZONES.length)];
    setKeeperTarget(randomZone);
    
    setGameState('kicking');
  };

  const handleKickComplete = () => {
    if (gameState !== 'kicking') return;
    
    let isGoal = false;
    
    if (targetZone.id !== keeperTarget.id) {
      isGoal = true;
    } else {
      // RNG Check
      const accScore = (currentKicker.accuracy * 0.6) + (Math.random() * 40);
      if (accScore > KEEPER_SAVE_STAT) {
        isGoal = true;
      } else {
        isGoal = false;
      }
    }

    // Award 50 XP for every kick
    addXP(50);

    setResult(isGoal ? 'GOAL' : 'SAVED');
    setGameState('result');
  };

  return (
    <Canvas shadows style={{ background: '#050505' }}>
      <PerspectiveCamera makeDefault position={[0, 3, 8]} fov={60} />
      
      <OrbitControls 
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going under floor
        minAzimuthAngle={-Math.PI / 4} // Limit rotation left
        maxAzimuthAngle={Math.PI / 4}  // Limit rotation right
      />

      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={2} 
        castShadow 
        shadow-mapSize={1024}
      />
      
      {/* Neon Accents */}
      <pointLight position={[0, 2, -4]} color="#39FF14" intensity={5} distance={10} />
      <pointLight position={[0, 2, 2]} color="#FF10F0" intensity={3} distance={8} />

      <Pitch />
      <Goalpost />
      
      <PlayerNFT nftUrl={null} />
      <KeeperNFT keeperTarget={keeperTarget} gameState={gameState} nftUrl={null} />
      <Football targetZone={targetZone} gameState={gameState} onKickComplete={handleKickComplete} />

      {ZONES.map(zone => (
        <TargetZone 
          key={zone.id} 
          zone={zone} 
          onClick={handleTargetClick} 
          active={gameState === 'aiming'} 
        />
      ))}
      
      <Environment preset="night" />
    </Canvas>
  );
};

export default GameScene;

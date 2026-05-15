import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../context/GameContext';

const KEEPER_SAVE_STAT = 60;
const ZONES = [
  { id: 'top-left', position: [-2, 1.5, -9] },
  { id: 'bottom-left', position: [-2, 0.5, -9] },
  { id: 'center', position: [0, 1.0, -9] },
  { id: 'top-right', position: [2, 1.5, -9] },
  { id: 'bottom-right', position: [2, 0.5, -9] },
];

const Pitch = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -5]} receiveShadow>
    <planeGeometry args={[30, 40]} />
    <meshStandardMaterial color="#0B2915" />
    {/* Penalty box lines */}
    <mesh position={[0, -5, 0.01]}>
      <planeGeometry args={[12, 10]} />
      <meshBasicMaterial color="#ffffff" wireframe />
    </mesh>
  </mesh>
);

const Goalpost = () => (
  <group position={[0, 0, -10]}>
    {/* Left Post */}
    <mesh position={[-3.1, 1.5, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.1, 3]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
    </mesh>
    {/* Right Post */}
    <mesh position={[3.1, 1.5, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.1, 3]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
    </mesh>
    {/* Crossbar */}
    <mesh position={[0, 3.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.1, 0.1, 6.4]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
    </mesh>
  </group>
);

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

const Goalkeeper = ({ keeperTarget, gameState }) => {
  const ref = useRef();
  const startPos = new THREE.Vector3(0, 1, -9.5);
  const targetPos = useRef(new THREE.Vector3(0, 1, -9.5));

  useEffect(() => {
    if (gameState === 'aiming') {
      targetPos.current.copy(startPos);
      ref.current.position.copy(startPos);
    }
    if (gameState === 'kicking' && keeperTarget) {
      targetPos.current.copy(keeperTarget.position);
    }
  }, [gameState, keeperTarget]);

  useFrame((state, delta) => {
    if (gameState === 'kicking' || gameState === 'result') {
      ref.current.position.lerp(targetPos.current, 5 * delta);
    }
  });

  return (
    <mesh ref={ref} position={[0, 1, -9.5]} castShadow>
      <boxGeometry args={[1, 2, 0.5]} />
      <meshStandardMaterial color="#FF10F0" emissive="#FF10F0" emissiveIntensity={0.5} />
    </mesh>
  );
};

const Ball = ({ targetZone, gameState, onKickComplete }) => {
  const ref = useRef();
  const startPos = new THREE.Vector3(0, 0.2, 0); // Penalty spot
  const targetPos = useRef(new THREE.Vector3(0, 0.2, 0));
  const progress = useRef(0);

  useEffect(() => {
    if (gameState === 'aiming' || gameState === 'menu') {
      ref.current.position.copy(startPos);
      targetPos.current.copy(startPos);
      progress.current = 0;
    }
    if (gameState === 'kicking' && targetZone) {
      targetPos.current.copy(targetZone.position);
    }
  }, [gameState, targetZone]);

  useFrame((state, delta) => {
    if (gameState === 'kicking') {
      progress.current += delta * 2; // Speed
      if (progress.current > 1) progress.current = 1;
      
      // Arc the ball slightly
      const currentPos = new THREE.Vector3().lerpVectors(startPos, targetPos.current, progress.current);
      currentPos.y += Math.sin(progress.current * Math.PI) * 0.5; // simple arc

      ref.current.position.copy(currentPos);

      // Spin the ball
      ref.current.rotation.x -= delta * 10;
      ref.current.rotation.y += delta * 5;

      if (progress.current >= 1) {
        onKickComplete();
      }
    }
  });

  return (
    <mesh ref={ref} position={[0, 0.2, 0]} castShadow>
      <sphereGeometry args={[0.2, 32, 32]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
};

const ThreeGame = () => {
  const { gameState, setGameState, currentKicker, setResult } = useGame();
  
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

    setResult(isGoal ? 'GOAL' : 'SAVED');
    setGameState('result');
  };

  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={60} />
      
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={2} 
        castShadow 
        shadow-mapSize={1024}
      />
      
      {/* Neon Accents */}
      <pointLight position={[0, 5, -10]} color="#39FF14" intensity={5} distance={20} />
      <pointLight position={[0, 5, 0]} color="#FF10F0" intensity={2} distance={10} />

      <Pitch />
      <Goalpost />
      
      <Goalkeeper keeperTarget={keeperTarget} gameState={gameState} />
      <Ball targetZone={targetZone} gameState={gameState} onKickComplete={handleKickComplete} />

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

export default ThreeGame;

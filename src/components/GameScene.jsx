import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { useGame } from '../context/GameContext';
import { useXP } from '../hooks/useXP';
import * as THREE from 'three';

import Football from './3d/Football';
import PlayerNFT from './3d/PlayerNFT';
import KeeperNFT from './3d/KeeperNFT';
import { Pitch, Goalpost } from './3d/Stadium';

const KEEPER_SAVE_STAT = 60;

const AimingReticle = ({ targetPos }) => {
  const materialRef = useRef();

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 2 + Math.sin(clock.elapsedTime * 5);
    }
  });

  return (
    <mesh position={[targetPos.x, targetPos.y, targetPos.z + 0.1]} rotation={[0, 0, 0]}>
      <ringGeometry args={[0.2, 0.25, 32]} />
      <meshStandardMaterial 
        ref={materialRef} 
        color="#39FF14" 
        emissive="#39FF14" 
        emissiveIntensity={3} 
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </mesh>
  );
};

// Cinematic Camera Director that interpolates between default and action replay angles
const CameraDirector = ({ gameState, isGoal, targetZone }) => {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 4, 10));
  const lookAtTarget = useRef(new THREE.Vector3(0, 1.5, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.5, 0));
  const targetFov = useRef(60);
  const shake = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (gameState === 'kicking' || gameState === 'result') {
      const targetAimX = targetZone?.position[0] || 0;

      if (gameState === 'kicking') {
        // Broadcast camera: low angle, side view tracking the shot path
        targetPos.current.set(targetAimX + (targetAimX > 0 ? -1.8 : 1.8), 0.8, 1.2);
        lookAtTarget.current.set(targetAimX, 0.7, -4.5);
        targetFov.current = 58;
        shake.current = 0.5;
      } else if (gameState === 'result') {
        if (isGoal) {
          // View of the ball in the net from inside the goal frame — punch in
          targetPos.current.set(targetAimX * 0.5, 1.6, -3.2);
          lookAtTarget.current.set(targetAimX, 0.4, -5.0);
          targetFov.current = 46;
          shake.current = 1;
        } else {
          // Close-up on the keeper catching the ball
          targetPos.current.set(targetAimX * 0.8, 1.0, -2.6);
          lookAtTarget.current.set(targetAimX, 0.8, -4.5);
          targetFov.current = 50;
          shake.current = 0.7;
        }
      }

      camera.position.lerp(targetPos.current, 3.5 * delta);
      currentLookAt.current.lerp(lookAtTarget.current, 5 * delta);

      // Subtle handheld broadcast wobble
      const amp = shake.current * 0.03;
      const look = currentLookAt.current.clone();
      look.x += Math.sin(t * 8.3) * amp;
      look.y += Math.cos(t * 6.7) * amp * 0.6;
      camera.lookAt(look);
      shake.current = THREE.MathUtils.damp(shake.current, 0, 1.5, delta);
    } else {
      // Reset targets for default view
      targetPos.current.set(0, 4, 10);
      lookAtTarget.current.set(0, 1.5, 0);
      currentLookAt.current.set(0, 1.5, 0);
      targetFov.current = 60;
      camera.lookAt(currentLookAt.current);
    }

    // Smooth focal-length changes for a cinematic "zoom" feel
    if (Math.abs(camera.fov - targetFov.current) > 0.01) {
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov.current, 4, delta);
      camera.updateProjectionMatrix();
    }
  });

  return null;
};

const GameScene = () => {
  const { gameState, setGameState, selectedPlayer, setResult, resetTrigger } = useGame();
  const { addXP } = useXP();
  
  const defaultCenterPos = useMemo(() => new THREE.Vector3(0, 1.5, -5.0), []);
  const [targetPos, setTargetPos] = useState(defaultCenterPos);
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
      setTargetPos(defaultCenterPos.clone());
    }
  }, [resetTrigger, defaultCenterPos]);

  useEffect(() => {
    if (gameState !== 'aiming') return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setTargetPos((prev) => new THREE.Vector3(Math.max(prev.x - 0.2, -3.1), prev.y, prev.z));
      } else if (e.key === 'ArrowRight') {
        setTargetPos((prev) => new THREE.Vector3(Math.min(prev.x + 0.2, 3.1), prev.y, prev.z));
      } else if (e.key === 'ArrowUp') {
        setTargetPos((prev) => new THREE.Vector3(prev.x, Math.min(prev.y + 0.2, 3.0), prev.z));
      } else if (e.key === 'ArrowDown') {
        setTargetPos((prev) => new THREE.Vector3(prev.x, Math.max(prev.y - 0.2, 0.1), prev.z));
      } else if (e.key === ' ') {
        triggerKick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);

  const triggerKick = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (gameState !== 'aiming') return;
    
    const accuracy = selectedPlayer?.accuracy || 1.0;
    const varianceX = (Math.random() - 0.5) * 1.5;
    const varianceY = (Math.random() - 0.5) * 1.0;
    const reducedVarianceX = varianceX / accuracy;
    const reducedVarianceY = varianceY / accuracy;

    let finalAimX = targetPos.x + reducedVarianceX;
    let finalAimY = targetPos.y + reducedVarianceY;

    // Clamp values so shot remains inside goal mouth bounds
    finalAimX = Math.max(Math.min(finalAimX, 3.1), -3.1);
    finalAimY = Math.max(Math.min(finalAimY, 3.0), 0.1);

    // Determine goal/save outcome based on accuracy
    const baseWinChance = 0.30;
    const finalWinChance = baseWinChance * accuracy;
    const isGoalOutcome = Math.random() < finalWinChance;
    setIsGoal(isGoalOutcome);

    // Set target zone object for Football.jsx
    setTargetZone({ position: [finalAimX, finalAimY, -5.0] });
    
    // Choose keeper's X position based on the outcome
    let keeperX;
    if (isGoalOutcome) {
      // Dive away: if ball is on left, dive right; if ball is on right, dive left
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
    
    setKeeperTarget({ position: [keeperX, finalAimY, -5.0] });
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
      <div style={{ width: '100vw', height: '100dvh' }}>
        <Canvas
          dpr={[1, 2]}
          shadows
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
          style={{ background: '#070b10', touchAction: 'none' }}
        >
          <PerspectiveCamera makeDefault position={[0, 4, 10]} fov={60} />
          <CameraDirector gameState={gameState} isGoal={isGoal} targetZone={targetZone} />

          <fog attach="fog" args={['#0a1119', 26, 72]} />

          {(gameState === 'aiming' || gameState === 'menu') && (
            <OrbitControls
              target={[0, 1.5, 0]}
              enablePan={false}
              enableZoom={false}
              maxPolarAngle={Math.PI / 2 - 0.1}
              minAzimuthAngle={-Math.PI / 4}
              maxAzimuthAngle={Math.PI / 4}
            />
          )}

          {/* Stadium lighting rig: sky/ground fill + warm key + cool rim + floodlights */}
          <hemisphereLight args={['#b9d5ff', '#2b3320', 0.42]} />
          <directionalLight
            position={[7, 13, 6]}
            intensity={2.7}
            color="#fff4e2"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0004}
            shadow-normalBias={0.02}
          >
            <orthographicCamera attach="shadow-camera" args={[-16, 16, 16, -16, 0.1, 60]} />
          </directionalLight>
          <directionalLight position={[-9, 7, -11]} intensity={1.15} color="#9ec2ff" />
          <spotLight position={[-10, 16, -2]} angle={0.5} penumbra={0.7} intensity={2.2} color="#eaf2ff" distance={45} />
          <spotLight position={[10, 16, -2]} angle={0.5} penumbra={0.7} intensity={2.2} color="#eaf2ff" distance={45} />
          {/* Brand-green key behind the goal — a tint, not a wash */}
          <pointLight position={[0, 2.4, -6]} color="#5b9d07" intensity={1.6} distance={14} />
          {/* Soft front fill so the keeper reads against the dark net */}
          <pointLight position={[0, 3.2, -1]} color="#eef4ff" intensity={1.3} distance={9} />

          <Pitch />
          <Goalpost />

          <ContactShadows
            position={[0, 0.012, -1]}
            scale={26}
            resolution={1024}
            blur={2.6}
            opacity={0.5}
            far={10}
            color="#05070a"
          />

          <PlayerNFT selectedPlayer={selectedPlayer} gameState={gameState} />
          <KeeperNFT keeperTarget={keeperTarget} gameState={gameState} power={selectedPlayer?.power || 1.0} keeperRef={keeperRef} resetTrigger={resetTrigger} />
          <Football targetZone={targetZone} gameState={gameState} onKickComplete={handleKickComplete} power={selectedPlayer?.power || 1.0} isGoal={isGoal} keeperRef={keeperRef} resetTrigger={resetTrigger} />

          {gameState === 'aiming' && <AimingReticle targetPos={targetPos} />}

          {gameState === 'aiming' && (
            <mesh 
              visible={false} 
              position={[0, 1.5, -5.0]} 
              onPointerDown={(e) => {
                e.stopPropagation();
                setTargetPos(e.point.clone());
              }}
              onPointerMove={(e) => {
                if (e.buttons === 1) {
                  e.stopPropagation();
                  setTargetPos(e.point.clone());
                }
              }}
            >
              <planeGeometry args={[8, 4]} />
              <meshBasicMaterial />
            </mesh>
          )}
          
          <Environment preset="night" />
        </Canvas>
      </div>
      {gameState === 'aiming' && (
        <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'auto' }}>
          <button 
            style={{ pointerEvents: 'auto', padding: '15px 40px', fontSize: '24px', fontWeight: 'bold', background: 'rgba(57, 255, 20, 0.8)', color: '#000', border: '2px solid #39FF14', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 0 20px #39FF14' }} 
            onClick={(e) => { e.stopPropagation(); triggerKick(e); }}
            onTouchStart={(e) => { e.stopPropagation(); triggerKick(e); }}
          >
            SHOOT
          </button>
        </div>
      )}
    </>
  );
};

export default GameScene;

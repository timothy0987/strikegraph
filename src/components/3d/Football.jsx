import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural soccer ball texture generator using spherical math on a 2D canvas
const createSoccerBallTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  const imgData = ctx.createImageData(canvas.width, canvas.height);
  const data = imgData.data;
  
  // Define the 12 icosahedron vertices (pentagon centers)
  const t = (1 + Math.sqrt(5)) / 2;
  const pentagonsRaw = [
    [-1,  t,  0], [ 1,  t,  0], [-1, -t,  0], [ 1, -t,  0],
    [ 0, -1,  t], [ 0,  1,  t], [ 0, -1, -t], [ 0,  1, -t],
    [ t,  0, -1], [ t,  0,  1], [-t,  0, -1], [-t,  0,  1]
  ];
  const pentagons = pentagonsRaw.map(v => {
    const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    return [v[0]/len, v[1]/len, v[2]/len];
  });
  
  // Define the 20 dodecahedron vertices (hexagon centers)
  const invT = 1 / t;
  const hexagonsRaw = [];
  // Standard (+=1, +=1, +=1) combinations
  for (let x of [-1, 1]) {
    for (let y of [-1, 1]) {
      for (let z of [-1, 1]) {
        hexagonsRaw.push([x, y, z]);
      }
    }
  }
  // (0, +=invT, +=t) and permutations
  for (let y of [-1, 1]) {
    for (let z of [-1, 1]) {
      hexagonsRaw.push([0, y * invT, z * t]);
      hexagonsRaw.push([y * invT, z * t, 0]);
      hexagonsRaw.push([z * t, 0, y * invT]);
    }
  }
  const hexagons = hexagonsRaw.map(v => {
    const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    return [v[0]/len, v[1]/len, v[2]/len];
  });
  
  // Map each canvas pixel (X, Y) to spherical coordinates, then to 3D point on unit sphere
  for (let y = 0; y < canvas.height; y++) {
    const phi = Math.PI * (0.5 - y / canvas.height); // latitude (-pi/2 to pi/2)
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    
    for (let x = 0; x < canvas.width; x++) {
      const theta = 2 * Math.PI * (x / canvas.width - 0.5); // longitude (-pi to pi)
      
      // Compute 3D direction vector
      const px = cosPhi * Math.sin(theta);
      const py = sinPhi;
      const pz = cosPhi * Math.cos(theta);
      
      let minDist1 = Infinity;
      let isPentagon1 = false;
      let minDist2 = Infinity;
      
      // Find closest and second-closest pentagon centers
      for (let i = 0; i < pentagons.length; i++) {
        const c = pentagons[i];
        const dx = px - c[0];
        const dy = py - c[1];
        const dz = pz - c[2];
        const dist = dx*dx + dy*dy + dz*dz; // squared distance
        if (dist < minDist1) {
          minDist2 = minDist1;
          minDist1 = dist;
          isPentagon1 = true;
        } else if (dist < minDist2) {
          minDist2 = dist;
        }
      }
      
      // Find closest and second-closest hexagon centers
      for (let i = 0; i < hexagons.length; i++) {
        const c = hexagons[i];
        const dx = px - c[0];
        const dy = py - c[1];
        const dz = pz - c[2];
        const dist = dx*dx + dy*dy + dz*dz;
        if (dist < minDist1) {
          minDist2 = minDist1;
          minDist1 = dist;
          isPentagon1 = false;
        } else if (dist < minDist2) {
          minDist2 = dist;
        }
      }
      
      // Convert squared distances to actual angular arc lengths
      const d1 = Math.acos(Math.max(-1, Math.min(1, 1 - minDist1 / 2)));
      const d2 = Math.acos(Math.max(-1, Math.min(1, 1 - minDist2 / 2)));
      
      // Drawing logic
      const seamWidth = 0.035;
      let r, g, b;
      
      if (d2 - d1 < seamWidth) {
        // Seams: thin dark gray/black borders between panels
        const tVal = (d2 - d1) / seamWidth;
        const seamIntensity = 0.15 + tVal * 0.35;
        r = g = b = Math.floor(seamIntensity * 255);
      } else if (isPentagon1) {
        // Pentagons: black panels
        r = g = b = 25;
      } else {
        // Hexagons: white panels
        r = g = b = 240;
      }
      
      const idx = (y * canvas.width + x) * 4;
      data[idx] = r;
      data[idx+1] = g;
      data[idx+2] = b;
      data[idx+3] = 255;
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  return canvas;
};

const Football = ({ targetZone, gameState, onKickComplete, power = 1.0, isGoal = false, keeperRef, resetTrigger }) => {
  const ref = useRef();
  const startPos = new THREE.Vector3(0, 0.5, 3);
  const targetPos = useRef(new THREE.Vector3(0, 0.5, 3));
  const progress = useRef(0);
  const lastResetTrigger = useRef(0);

  // Generate procedural texture once and clean it up on unmount
  const ballTexture = useMemo(() => {
    const canvas = createSoccerBallTexture();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      ballTexture.dispose();
    };
  }, [ballTexture]);

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
      ref.current.position.copy(startPos);
      targetPos.current.copy(startPos);
      progress.current = 0;
      // Reset rotation
      ref.current.rotation.set(0, 0, 0);
    }

    if (gameState === 'kicking' && targetZone) {
      // For goals, let the ball fly past the keeper to Z = -5.2 (deep inside the net)
      // For saves, target the keeper's depth at Z = -4.5
      const targetZ = isGoal ? -5.2 : -4.5;
      targetPos.current.set(targetZone.position[0], targetZone.position[1], targetZ);
    }
  }, [gameState, targetZone, isGoal, resetTrigger]);

  useFrame((state, delta) => {
    const isSaved = !isGoal;

    if (gameState === 'kicking') {
      // If a save occurs and the ball has reached near the keeper (progress >= 0.85), attach it to the keeper's hands
      if (isSaved && progress.current >= 0.85) {
        let hand = null;
        const leftHand = keeperRef.current?.nodes['mixamorig:LeftHand'];
        const rightHand = keeperRef.current?.nodes['mixamorig:RightHand'];
        
        if (leftHand && rightHand) {
          leftHand.updateMatrixWorld(true);
          rightHand.updateMatrixWorld(true);
          const leftPos = new THREE.Vector3();
          const rightPos = new THREE.Vector3();
          leftHand.getWorldPosition(leftPos);
          rightHand.getWorldPosition(rightPos);
          
          const distLeft = leftPos.distanceTo(targetPos.current);
          const distRight = rightPos.distanceTo(targetPos.current);
          hand = distLeft < distRight ? leftHand : rightHand;
        } else {
          hand = leftHand || rightHand;
        }

        if (hand) {
          hand.updateMatrixWorld(true);
          const worldPos = new THREE.Vector3();
          hand.getWorldPosition(worldPos);
          ref.current.position.copy(worldPos);
        }
        
        // Progress continues in the background to finish the kick resolution
        progress.current += delta * 2 * power;
        if (progress.current >= 1) {
          progress.current = 1;
          onKickComplete();
        }
      } else {
        // Normal ball translation along the arc trajectory
        progress.current += delta * 2 * power;
        if (progress.current > 1) progress.current = 1;
        
        const currentPos = new THREE.Vector3().lerpVectors(startPos, targetPos.current, progress.current);
        currentPos.y += Math.sin(progress.current * Math.PI) * 1.5; // Arc height
        
        ref.current.position.copy(currentPos);

        // Spin the ball
        ref.current.rotation.x -= delta * 15;
        ref.current.rotation.y += delta * 10;

        if (progress.current >= 1) {
          onKickComplete();
        }
      }
    } else if (gameState === 'result' && isSaved) {
      // Keep the ball locked to the goalkeeper's hands on the result/save screens so it doesn't freeze in midair
      let hand = null;
      const leftHand = keeperRef.current?.nodes['mixamorig:LeftHand'];
      const rightHand = keeperRef.current?.nodes['mixamorig:RightHand'];
      
      if (leftHand && rightHand) {
        leftHand.updateMatrixWorld(true);
        rightHand.updateMatrixWorld(true);
        const leftPos = new THREE.Vector3();
        const rightPos = new THREE.Vector3();
        leftHand.getWorldPosition(leftPos);
        rightHand.getWorldPosition(rightPos);
        
        const distLeft = leftPos.distanceTo(targetPos.current);
        const distRight = rightPos.distanceTo(targetPos.current);
        hand = distLeft < distRight ? leftHand : rightHand;
      } else {
        hand = leftHand || rightHand;
      }

      if (hand) {
        hand.updateMatrixWorld(true);
        const worldPos = new THREE.Vector3();
        hand.getWorldPosition(worldPos);
        ref.current.position.copy(worldPos);
      }
    }
  });

  return (
    <mesh ref={ref} position={[0, 0.5, 3]} castShadow>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial 
        map={ballTexture}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
};

export default Football;

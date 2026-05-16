import React from 'react';
import { Capsule } from '@react-three/drei';

const PlayerNFT = ({ nftUrl }) => {
  // nftUrl is unused for now, serving as a placeholder for future dynamic texture loading
  
  return (
    <mesh position={[0, 1, 4]} castShadow>
      <Capsule args={[0.4, 1, 4, 16]}>
        <meshStandardMaterial 
          color="#00FFFF" 
          emissive="#00FFFF" 
          emissiveIntensity={1.5} 
          wireframe={true}
        />
      </Capsule>
    </mesh>
  );
};

export default PlayerNFT;

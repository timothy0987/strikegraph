import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * A stylised kit shell (torso + short sleeves + collar) attached to a Mixamo
 * rig's spine/arm bones, so it follows every animation.
 *
 *  - `nodes`   : the `nodes` map from the parent's useGLTF
 *  - `color`   : team / variant colour (varies per bought player for the kicker,
 *                a fixed contrast colour for the keeper)
 *  - `scale`   : single knob to nudge fit if a model imports at an odd scale
 *  - `bulk`    : thickness multiplier for the shell (>1 = chunkier / bolder)
 *  - `glow`    : emissive intensity of the kit
 */
const Jersey = ({ nodes, color = '#00FFFF', scale = 1, bulk = 1, glow = 0.4 }) => {
  const torso = useRef();
  const collar = useRef();
  const lSleeve = useRef();
  const rSleeve = useRef();

  useEffect(() => {
    if (!nodes) return;
    const find = (suffix) => {
      const k = Object.keys(nodes).find((n) => n.toLowerCase().endsWith(suffix));
      return k ? nodes[k] : null;
    };
    const spine1 = find('spine1') || find('spine');
    const spine2 = find('spine2') || spine1;
    const lArm = find('leftarm');
    const rArm = find('rightarm');

    const pairs = [
      [spine1, torso.current],
      [spine2, collar.current],
      [lArm, lSleeve.current],
      [rArm, rSleeve.current],
    ];
    pairs.forEach(([bone, mesh]) => { if (bone && mesh) bone.add(mesh); });
    return () => {
      pairs.forEach(([bone, mesh]) => {
        if (bone && mesh && mesh.parent === bone) bone.remove(mesh);
      });
    };
  }, [nodes]);

  const matProps = {
    color,
    emissive: color,
    emissiveIntensity: glow,
    roughness: 0.38,
    metalness: 0.12,
    side: THREE.DoubleSide,
  };

  // Rendered detached; the effect reparents each mesh onto a bone. Local
  // transforms are in bone space (Mixamo bone local +Y runs up the spine /
  // down the arm). `scale` matches the host model's armature scale.
  return (
    <>
      {/* torso — spans waist→shoulders, slightly wider at the top */}
      <mesh ref={torso} position={[0, 0.24 * scale, 0.01 * scale]} scale={scale} castShadow>
        <cylinderGeometry args={[0.205 * bulk, 0.165 * bulk, 0.54, 24]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* collar ring at the neck */}
      <mesh ref={collar} position={[0, 0.06 * scale, 0]} rotation={[Math.PI / 2, 0, 0]} scale={scale}>
        <torusGeometry args={[0.115 * bulk, 0.028 * bulk, 10, 24]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* short sleeves on the upper arms */}
      <mesh ref={lSleeve} position={[0, 0.1 * scale, 0]} scale={scale} castShadow>
        <cylinderGeometry args={[0.085 * bulk, 0.1 * bulk, 0.19, 16, 1, true]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      <mesh ref={rSleeve} position={[0, 0.1 * scale, 0]} scale={scale} castShadow>
        <cylinderGeometry args={[0.085 * bulk, 0.1 * bulk, 0.19, 16, 1, true]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
    </>
  );
};

export default Jersey;

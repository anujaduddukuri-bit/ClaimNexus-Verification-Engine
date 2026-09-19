import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function EvidenceNetwork() {
  const count = 75;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const [particles, dummy] = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 18;
      const y = (Math.random() - 0.5) * 18;
      const z = (Math.random() - 0.5) * 12;
      const vx = (Math.random() - 0.5) * 0.005;
      const vy = (Math.random() - 0.5) * 0.005;
      const vz = (Math.random() - 0.5) * 0.005;
      temp.push({ x, y, z, vx, vy, vz });
    }
    return [temp, new THREE.Object3D()];
  }, [count]);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * count * 6);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const { pointer } = state;
    const linePositions = lineGeometry.attributes.position.array as Float32Array;
    let lineIdx = 0;

    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;

      if (Math.abs(p.x) > 9) p.vx *= -1;
      if (Math.abs(p.y) > 9) p.vy *= -1;
      if (Math.abs(p.z) > 6) p.vz *= -1;

      const px = p.x + pointer.x * 0.3;
      const py = p.y + pointer.y * 0.3;

      dummy.position.set(px, py, p.z);
      dummy.scale.setScalar(0.07);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);

      for (let j = i + 1; j < count; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y, p.z - p2.z);
        if (dist < 3.0) {
          linePositions[lineIdx++] = px;
          linePositions[lineIdx++] = py;
          linePositions[lineIdx++] = p.z;

          linePositions[lineIdx++] = p2.x + pointer.x * 0.3;
          linePositions[lineIdx++] = p2.y + pointer.y * 0.3;
          linePositions[lineIdx++] = p2.z;
        }
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    lineGeometry.setDrawRange(0, lineIdx / 3);
    lineGeometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#B46A45" transparent opacity={0.4} />
      </instancedMesh>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#C29B5B" transparent opacity={0.12} />
      </lineSegments>
    </group>
  );
}

export const NeuralBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <EvidenceNetwork />
      </Canvas>
    </div>
  );
};

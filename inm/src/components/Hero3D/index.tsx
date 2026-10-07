import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sphere, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

function LegalArchitecture() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Pillar - Law Scale Base */}
      <Cylinder args={[0.2, 0.5, 4, 32]} position={[0, -2, 0]}>
        <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
      </Cylinder>
      
      {/* Scale Beam */}
      <Box args={[4, 0.2, 0.2]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#8b5cf6" metalness={0.8} roughness={0.2} />
      </Box>

      {/* Left Scale */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <group position={[-2, -1, 0]}>
          <Cylinder args={[0.05, 0.05, 2, 16]} position={[0, 1, 0]}>
            <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.2} />
          </Cylinder>
          <Cylinder args={[1, 1, 0.1, 32]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#3b82f6" transparent opacity={0.6} />
          </Cylinder>
          {/* Floating Data Nodes */}
          <Sphere args={[0.2, 16, 16]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={0.5} />
          </Sphere>
        </group>
      </Float>

      {/* Right Scale */}
      <Float speed={2.5} rotationIntensity={0.5} floatIntensity={1.2}>
        <group position={[2, -1, 0]}>
          <Cylinder args={[0.05, 0.05, 2, 16]} position={[0, 1, 0]}>
            <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.2} />
          </Cylinder>
          <Cylinder args={[1, 1, 0.1, 32]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#8b5cf6" transparent opacity={0.6} />
          </Cylinder>
          {/* Floating Data Nodes */}
          <Sphere args={[0.2, 16, 16]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#a78bfa" emissive="#8b5cf6" emissiveIntensity={0.5} />
          </Sphere>
        </group>
      </Float>

      {/* Connection lines (Neural network feel) */}
      {[...Array(15)].map((_, i) => (
        <Float key={i} speed={1.5} rotationIntensity={1} floatIntensity={2}>
          <Sphere
            args={[0.05, 8, 8]}
            position={[
              (Math.random() - 0.5) * 6,
              (Math.random() - 0.5) * 6,
              (Math.random() - 0.5) * 4
            ]}
          >
            <meshStandardMaterial
              color={i % 2 === 0 ? "#3b82f6" : "#8b5cf6"}
              emissive={i % 2 === 0 ? "#3b82f6" : "#8b5cf6"}
              emissiveIntensity={1}
            />
          </Sphere>
        </Float>
      ))}
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className="w-full h-[500px] lg:h-[600px] relative">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#3b82f6" />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#8b5cf6" />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        <LegalArchitecture />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}

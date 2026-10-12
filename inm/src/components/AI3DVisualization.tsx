import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line, Float } from '@react-three/drei';
import * as THREE from 'three';

const nodesData = [
  { id: 'ai', label: "AI Core", color: "#8b5cf6", pos: [0, 1, 0], scale: 0.8 },
  { id: 'research', label: "Research", color: "#3b82f6", pos: [-3, 0, -2], scale: 0.5 },
  { id: 'cases', label: "Cases API", color: "#10b981", pos: [3, 0, -2], scale: 0.5 },
  { id: 'docs', label: "Documents", color: "#f59e0b", pos: [0, -2, 3], scale: 0.5 },
  { id: 'precedents', label: "Precedents", color: "#ec4899", pos: [-2, -2, 2], scale: 0.4 },
];

const edgesData = [
  ['ai', 'research'], ['ai', 'cases'], ['ai', 'docs'], ['ai', 'precedents'],
  ['research', 'cases'], ['docs', 'precedents']
];

function GraphNodes({ processing }: { processing: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * (processing ? 0.8 : 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      {edgesData.map((edge, i) => {
        const start = nodesData.find(n => n.id === edge[0])?.pos as [number, number, number];
        const end = nodesData.find(n => n.id === edge[1])?.pos as [number, number, number];
        if (!start || !end) return null;
        return (
          <Line
            key={`edge-${i}`}
            points={[start, end]}
            color={processing ? "rgba(139, 92, 246, 0.8)" : "rgba(255, 255, 255, 0.2)"}
            lineWidth={processing ? 3 : 1}
          />
        );
      })}

      {nodesData.map((node, i) => (
        <Float key={`node-${i}`} speed={processing ? 5 : 2} rotationIntensity={processing ? 2 : 0.5} floatIntensity={0.5}>
          <group position={node.pos as [number, number, number]}>
            <Sphere args={[node.scale, 32, 32]}>
              <meshStandardMaterial 
                color={node.color} 
                emissive={node.color}
                emissiveIntensity={processing ? 2 : 0.5}
                roughness={0.2}
                metalness={0.8}
              />
            </Sphere>
            <Text 
              position={[0, node.scale + 0.3, 0]} 
              fontSize={0.3} 
              color="white" 
              anchorX="center" 
              anchorY="middle"
            >
              {node.label}
            </Text>
          </group>
        </Float>
      ))}
    </group>
  );
}

class VisualizationErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn("AI3DVisualization error caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-navy-950/60 rounded-xl border border-white/5 text-center">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/20 border border-accent-purple/40 flex items-center justify-center mb-2 animate-pulse">
            <span className="text-accent-purple text-lg font-bold">AI</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">LexIntel Neural Engine</span>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AI3DVisualization({ processing }: { processing: boolean }) {
  return (
    <VisualizationErrorBoundary>
      <div className="w-full h-full relative rounded-xl overflow-hidden bg-gradient-to-br from-black to-navy-900 border border-white/10">
        <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#8b5cf6" />
          <GraphNodes processing={processing} />
          <OrbitControls enableZoom={false} autoRotate={false} />
        </Canvas>
      </div>
    </VisualizationErrorBoundary>
  );
}

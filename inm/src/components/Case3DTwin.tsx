import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line, Float } from '@react-three/drei';
import * as THREE from 'three';

const generateNodes = (caseStage: string) => {
  return [
    { id: 'case', label: "CASE", color: "#3b82f6", pos: [0, 0, 0], scale: 0.8 },
    { id: 'client', label: "Client", color: "#8b5cf6", pos: [0, 3, 0], scale: 0.4 },
    { id: 'lawyer', label: "Lawyer", color: "#8b5cf6", pos: [2, 2, 2], scale: 0.4 },
    { id: 'court', label: "Court", color: "#10b981", pos: [-3, 0, -2], scale: 0.5 },
    { id: 'judge', label: "Judge", color: "#10b981", pos: [-4, 2, -3], scale: 0.4 },
    { id: 'documents', label: "Documents", color: "#f59e0b", pos: [3, 0, -2], scale: 0.5 },
    { id: 'evidence', label: "Evidence", color: "#f59e0b", pos: [4, -2, -1], scale: 0.4 },
    { id: 'hearings', label: "Hearings", color: caseStage === 'Hearing' ? "#ef4444" : "#ec4899", pos: [-2, -2, 2], scale: 0.5, glow: caseStage === 'Hearing' },
    { id: 'deadlines', label: "Deadlines", color: "#ec4899", pos: [0, -3, 0], scale: 0.4 },
    { id: 'precedents', label: "Precedents", color: "#6366f1", pos: [2, -2, 3], scale: 0.5 },
  ];
};

const edgesData = [
  ['case', 'client'], ['case', 'lawyer'], ['case', 'court'], ['court', 'judge'],
  ['case', 'documents'], ['documents', 'evidence'], ['case', 'hearings'],
  ['hearings', 'deadlines'], ['case', 'precedents']
];

function GraphNodes({ caseData, onNodeClick }: { caseData: any, onNodeClick: (node: any) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const nodes = generateNodes(caseData?.stage || 'Filed');
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {edgesData.map((edge, i) => {
        const start = nodes.find(n => n.id === edge[0])?.pos as [number, number, number];
        const end = nodes.find(n => n.id === edge[1])?.pos as [number, number, number];
        if (!start || !end) return null;
        return (
          <Line
            key={`edge-${i}`}
            points={[start, end]}
            color="rgba(255, 255, 255, 0.2)"
            lineWidth={2}
          />
        );
      })}

      {nodes.map((node, i) => (
        <Float key={`node-${i}`} speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <group 
            position={node.pos as [number, number, number]} 
            onClick={(e) => { e.stopPropagation(); onNodeClick(node.id); }}
            onPointerOver={(e) => (document.body.style.cursor = 'pointer')}
            onPointerOut={(e) => (document.body.style.cursor = 'auto')}
          >
            <Sphere args={[node.scale, 32, 32]}>
              <meshStandardMaterial 
                color={node.color} 
                emissive={node.color}
                emissiveIntensity={node.glow ? 2 : 0.5}
                roughness={0.2}
                metalness={0.8}
              />
            </Sphere>
            <Text 
              position={[0, node.scale + 0.4, 0]} 
              fontSize={0.4} 
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

export default function Case3DTwin({ caseData, onNodeClick }: { caseData: any, onNodeClick: (nodeId: string) => void }) {
  return (
    <div className="w-full h-[500px] relative rounded-xl overflow-hidden glass-card bg-gradient-to-br from-navy-900 to-black">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />
        <GraphNodes caseData={caseData} onNodeClick={onNodeClick} />
        <OrbitControls enableZoom={true} autoRotate autoRotateSpeed={0.3} />
      </Canvas>
      <div className="absolute top-4 left-4 pointer-events-none">
        <h3 className="text-white font-semibold text-lg drop-shadow-md">3D Digital Twin</h3>
        <p className="text-slate-300 text-xs drop-shadow-md">Interactive Lifecycle of {caseData?.name || 'Case'}</p>
      </div>
      <div className="absolute bottom-4 left-4 pointer-events-none flex gap-3">
         <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs text-white">Core</span></div>
         <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs text-white">Court</span></div>
         <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-xs text-white">Docs</span></div>
         <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-pink-500"></div><span className="text-xs text-white">Events</span></div>
      </div>
    </div>
  );
}

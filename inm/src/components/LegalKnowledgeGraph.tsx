import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line, Float } from '@react-three/drei';
import * as THREE from 'three';

export interface GraphNode {
  id: number;
  label: string;
  category: string;
  color: string;
  pos: [number, number, number];
  detail?: string;
}

export interface GraphEdge {
  source: number;
  target: number;
}

function GraphNodes({ 
  nodes, 
  edges, 
  onNodeClick 
}: { 
  nodes: GraphNode[]; 
  edges: GraphEdge[]; 
  onNodeClick: (node: GraphNode) => void 
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Draw edges */}
      {edges.map((edge, i) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return null;

        return (
          <Line
            key={`edge-${i}`}
            points={[sourceNode.pos, targetNode.pos]}
            color="rgba(255, 255, 255, 0.25)"
            lineWidth={1.2}
          />
        );
      })}

      {/* Draw nodes */}
      {nodes.map((node) => (
        <Float key={`node-${node.id}`} speed={2} rotationIntensity={0.4} floatIntensity={0.4}>
          <group position={node.pos} onClick={(e) => { e.stopPropagation(); onNodeClick(node); }}>
            <Sphere args={[node.category === 'Case' ? 0.6 : 0.4, 32, 32]}>
              <meshStandardMaterial 
                color={node.color} 
                emissive={node.color}
                emissiveIntensity={0.5}
                roughness={0.2}
                metalness={0.8}
              />
            </Sphere>
            <Text 
              position={[0, node.category === 'Case' ? 0.9 : 0.7, 0]} 
              fontSize={node.category === 'Case' ? 0.35 : 0.25} 
              color="white" 
              anchorX="center" 
              anchorY="middle"
              maxWidth={3}
            >
              {node.label}
            </Text>
          </group>
        </Float>
      ))}
    </group>
  );
}

export default function LegalKnowledgeGraph({ 
  caseData, 
  onNodeClick 
}: { 
  caseData?: any; 
  onNodeClick?: (node: GraphNode) => void 
}) {
  const { nodes, edges } = useMemo(() => {
    if (!caseData) {
      // Default initial graph data
      const defaultNodes: GraphNode[] = [
        { id: 0, label: "Case Node", category: "Case", color: "#3b82f6", pos: [0, 0, 0] },
        { id: 1, label: "Supreme Court", category: "Court", color: "#8b5cf6", pos: [3, 2, -2] },
        { id: 2, label: "Judicial Bench", category: "Judge", color: "#10b981", pos: [-3, 2, -1] },
        { id: 3, label: "Article 21 / Constitution", category: "Act", color: "#f59e0b", pos: [2, -2, 1] },
        { id: 4, label: "Data Protection / Rights", category: "Section", color: "#ef4444", pos: [4, -3, 2] },
        { id: 5, label: "Cited Precedents", category: "Precedent", color: "#6366f1", pos: [-2, -2, 3] },
      ];
      const defaultEdges: GraphEdge[] = [
        { source: 0, target: 1 },
        { source: 0, target: 2 },
        { source: 0, target: 3 },
        { source: 3, target: 4 },
        { source: 0, target: 5 },
        { source: 1, target: 2 }
      ];
      return { nodes: defaultNodes, edges: defaultEdges };
    }

    // Generate dynamic nodes based on selected real case data
    const dynamicNodes: GraphNode[] = [];
    const dynamicEdges: GraphEdge[] = [];

    // Center Node: Case Title
    const caseTitle = caseData.title || caseData.name || `Case #${caseData.tid || 'Doc'}`;
    dynamicNodes.push({
      id: 0,
      label: caseTitle.length > 25 ? caseTitle.substring(0, 22) + '...' : caseTitle,
      category: 'Case',
      color: '#3b82f6',
      pos: [0, 0, 0],
      detail: caseTitle
    });

    let currentId = 1;

    // Court Node
    const courtName = caseData.courtname || caseData.court || 'Indian Judiciary';
    const courtId = currentId++;
    dynamicNodes.push({
      id: courtId,
      label: courtName,
      category: 'Court',
      color: '#8b5cf6',
      pos: [3, 2, -1.5],
      detail: courtName
    });
    dynamicEdges.push({ source: 0, target: courtId });

    // Judges / Bench Node
    if (caseData.author || caseData.bench) {
      const benchName = (caseData.author || caseData.bench).toString();
      const benchId = currentId++;
      dynamicNodes.push({
        id: benchId,
        label: benchName.length > 20 ? benchName.substring(0, 18) + '...' : benchName,
        category: 'Judge',
        color: '#10b981',
        pos: [-3, 2, -1],
        detail: benchName
      });
      dynamicEdges.push({ source: 0, target: benchId });
      dynamicEdges.push({ source: courtId, target: benchId });
    }

    // Date Node
    if (caseData.publishdate || caseData.date) {
      const dateStr = (caseData.publishdate || caseData.date).toString();
      const dateId = currentId++;
      dynamicNodes.push({
        id: dateId,
        label: `Date: ${dateStr}`,
        category: 'Date',
        color: '#ec4899',
        pos: [-2.5, -2, -1.5],
        detail: dateStr
      });
      dynamicEdges.push({ source: 0, target: dateId });
    }

    // Citation / Acts Node
    if (caseData.cite || caseData.citation) {
      const citeStr = (caseData.cite || caseData.citation).toString();
      const citeId = currentId++;
      dynamicNodes.push({
        id: citeId,
        label: citeStr.length > 20 ? citeStr.substring(0, 18) + '...' : citeStr,
        category: 'Act',
        color: '#f59e0b',
        pos: [2.5, -2, 1],
        detail: citeStr
      });
      dynamicEdges.push({ source: 0, target: citeId });
    }

    // Cited Count / Precedents Node
    if (caseData.numcites !== undefined || caseData.numcitedby !== undefined) {
      const precedentId = currentId++;
      const precedentLabel = `Cites: ${caseData.numcites || 0} | Cited by: ${caseData.numcitedby || 0}`;
      dynamicNodes.push({
        id: precedentId,
        label: precedentLabel,
        category: 'Precedent',
        color: '#6366f1',
        pos: [-2, -2.5, 2.5],
        detail: precedentLabel
      });
      dynamicEdges.push({ source: 0, target: precedentId });
    }

    return { nodes: dynamicNodes, edges: dynamicEdges };
  }, [caseData]);

  const handleNodeClick = (node: GraphNode) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  return (
    <div className="w-full h-full min-h-[450px] relative rounded-xl overflow-hidden glass-card">
      <Canvas camera={{ position: [0, 0, 8.5], fov: 55 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
        <GraphNodes nodes={nodes} edges={edges} onNodeClick={handleNodeClick} />
        <OrbitControls enableZoom={true} autoRotate autoRotateSpeed={0.4} />
      </Canvas>
      <div className="absolute top-4 left-4 pointer-events-none">
        <h3 className="text-white font-semibold text-lg drop-shadow-md">3D Knowledge Graph</h3>
        <p className="text-slate-300 text-xs drop-shadow-md">
          {caseData ? `Dynamic relationships for: ${caseData.title || caseData.name || 'Selected Case'}` : 'Interactive relationship map'}
        </p>
      </div>
    </div>
  );
}

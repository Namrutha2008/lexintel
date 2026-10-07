import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Text, Float, Line } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Scale, BrainCircuit, Search, FolderOpen, FileText, Share2, 
  ChevronRight, Database, Code, Server, ArrowRight
} from 'lucide-react';

// 3D Nodes for Vision Graph
const graphNodes = [
  { id: 'cases', label: 'Cases', pos: [0, 2, 0], color: '#3b82f6' },
  { id: 'acts', label: 'Acts', pos: [-2, 0, -2], color: '#8b5cf6' },
  { id: 'sections', label: 'Sections', pos: [2, 0, -2], color: '#10b981' },
  { id: 'judgments', label: 'Judgments', pos: [-3, -2, 2], color: '#f59e0b' },
  { id: 'precedents', label: 'Precedents', pos: [3, -2, 2], color: '#ec4899' },
  { id: 'lawyers', label: 'Lawyers', pos: [0, -3, 0], color: '#6366f1' },
  { id: 'courts', label: 'Courts', pos: [0, 0, -4], color: '#14b8a6' },
];

const graphEdges = [
  ['cases', 'acts'], ['cases', 'sections'], ['cases', 'judgments'],
  ['judgments', 'precedents'], ['cases', 'lawyers'], ['cases', 'courts'],
  ['acts', 'sections'], ['judgments', 'courts']
];

function VisionGraph() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
  });

  return (
    <group ref={groupRef}>
      {graphEdges.map((edge, i) => {
        const start = graphNodes.find(n => n.id === edge[0])?.pos as [number, number, number];
        const end = graphNodes.find(n => n.id === edge[1])?.pos as [number, number, number];
        if (!start || !end) return null;
        return <Line key={i} points={[start, end]} color="rgba(255,255,255,0.2)" lineWidth={1} />;
      })}
      {graphNodes.map((node, i) => (
        <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <group position={node.pos as [number, number, number]}>
            <Sphere args={[0.4, 32, 32]}>
              <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={0.5} roughness={0.2} />
            </Sphere>
            <Text position={[0, 0.7, 0]} fontSize={0.3} color="white">{node.label}</Text>
          </group>
        </Float>
      ))}
    </group>
  );
}

// 3D Workflow Nodes
function WorkflowNodes() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <Sphere args={[1, 32, 32]} position={[-2, 0, 0]}>
          <meshStandardMaterial color="#3b82f6" wireframe />
        </Sphere>
      </Float>
      <Float speed={2.5} rotationIntensity={1} floatIntensity={1}>
        <Sphere args={[1, 32, 32]} position={[2, 0, 0]}>
          <meshStandardMaterial color="#8b5cf6" wireframe />
        </Sphere>
      </Float>
      <Line points={[[-2,0,0], [2,0,0]]} color="#ffffff" transparent opacity={0.3} lineWidth={2} />
      <Text position={[0, 1.5, 0]} fontSize={0.4} color="white">Data Flow</Text>
    </group>
  );
}

export default function About({ onNavigate }: { onNavigate: (view: any) => void }) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);

  return (
    <div className="min-h-screen bg-navy-900 overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 min-h-[80vh] flex items-center">
        <div className="absolute inset-0 z-0 opacity-30">
          <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#8b5cf6" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />
            <VisionGraph />
          </Canvas>
        </div>
        <div className="container mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm font-semibold mb-6">
              <BrainCircuit className="w-4 h-4" /> About LexIntel
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Reimagining Legal Research with <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-purple">Intelligence</span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed mb-8">
              An intelligent platform that brings legal research, case management, and AI-powered assistance into one unified workspace.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => onNavigate('research')} className="px-6 py-3 bg-accent-blue hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                Explore Legal Research <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => onNavigate('ai')} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-medium transition-colors">
                Try AI Assistant
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. OUR MISSION */}
      <section className="py-20 px-6 bg-black/30 border-y border-white/5 relative z-10">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              We aim to make legal research faster, highly organized, and universally accessible by converging cutting-edge Artificial Intelligence with deep legal databases and robust case management capabilities. Legal professionals should spend time arguing law, not searching for it.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3. WHAT WE PROVIDE */}
      <section className="py-24 px-6 relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">What We Provide</h2>
            <p className="text-slate-400">A comprehensive suite designed for the modern legal professional.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "AI Legal Research", icon: Search, color: "text-blue-400", desc: "Instantly query precedents and statutes using natural language." },
              { title: "Case Management", icon: FolderOpen, color: "text-purple-400", desc: "Track timelines, hearings, and documents seamlessly." },
              { title: "Case-Specific AI", icon: BrainCircuit, color: "text-emerald-400", desc: "Interact directly with your case files through intelligent chat." },
              { title: "Document Analysis", icon: FileText, color: "text-amber-400", desc: "Summarize and extract key arguments from large judgments." },
              { title: "Precedent Discovery", icon: Scale, color: "text-pink-400", desc: "Uncover hidden legal connections and related case laws." },
              { title: "Knowledge Graph", icon: Share2, color: "text-indigo-400", desc: "Visualize the lifecycle of litigation in a 3D digital twin." }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-6 border border-white/10 hover:border-accent-blue/50 transition-colors group"
              >
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS & 7. WHY THIS PLATFORM */}
      <section className="py-24 px-6 bg-black/30 border-y border-white/5 relative z-10 overflow-hidden">
        <div className="container mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Why LexIntel?</h2>
            <div className="space-y-6">
              <div className="glass-card p-5 border-l-4 border-l-red-500 bg-red-500/5">
                <h4 className="text-white font-bold mb-2">Traditional Workflows</h4>
                <p className="text-slate-400 text-sm">Information is scattered across multiple sources, case research is highly time-consuming, and managing documents separately leads to critical oversights.</p>
              </div>
              <div className="glass-card p-5 border-l-4 border-l-emerald-500 bg-emerald-500/5">
                <h4 className="text-white font-bold mb-2">The LexIntel Solution</h4>
                <p className="text-slate-400 text-sm">Everything is centralized. Query your case files directly using AI, automatically cross-reference precedents, and manage your entire litigation lifecycle in one secure platform.</p>
              </div>
            </div>
          </motion.div>
          <div className="h-[400px] rounded-2xl glass-card overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-navy-900 to-black z-0" />
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} color="#8b5cf6" />
              <WorkflowNodes />
              <OrbitControls enableZoom={false} autoRotate />
            </Canvas>
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center opacity-70">
               <div className="text-[10px] text-white uppercase tracking-widest mb-12">Legal Data</div>
               <div className="text-[10px] text-white uppercase tracking-widest mt-12">AI Insights</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PLATFORM FEATURES */}
      <section className="py-24 px-6 relative z-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
             {[
               { title: "Faster Legal Research", metric: "Unified", icon: Search },
               { title: "Case Management", metric: "Centralized", icon: FolderOpen },
               { title: "AI Analysis", metric: "Powered", icon: BrainCircuit },
               { title: "Document Intelligence", metric: "Connected", icon: FileText }
             ].map((feat, i) => (
               <div key={i} className="glass-card p-6 text-center">
                 <feat.icon className="w-8 h-8 mx-auto text-accent-blue mb-4" />
                 <div className="text-xl font-bold text-white mb-2">{feat.metric}</div>
                 <div className="text-sm text-slate-400">{feat.title}</div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 6. TECHNOLOGY */}
      <section className="py-24 px-6 bg-black/30 border-y border-white/5 relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Core Technology</h2>
            <p className="text-slate-400">Built securely on a modern, robust technology stack.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {['React', 'TypeScript', 'Node.js', 'OpenAI Legal AI', 'IndiaCode / eCourts API', 'Three.js', 'Framer Motion', 'Tailwind CSS'].map((tech, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="px-6 py-3 glass-card rounded-full flex items-center gap-2 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <Code className="w-4 h-4 text-accent-blue" />
                <span className="text-slate-200 font-medium text-sm">{tech}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. OUR VISION */}
      <section className="py-32 px-6 relative z-10">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-8 leading-tight">
            "To build an intelligent legal ecosystem where legal information, cases, documents and AI work together seamlessly."
          </h2>
          <div className="h-[300px] w-full mt-12 rounded-2xl glass-card overflow-hidden">
            <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
              <VisionGraph />
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
            </Canvas>
          </div>
        </div>
      </section>

      {/* 9. CTA */}
      <section className="py-24 px-6 relative z-10">
        <div className="container mx-auto">
          <div className="glass-card p-12 text-center rounded-3xl bg-gradient-to-b from-accent-blue/10 to-transparent border border-accent-blue/20">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Transform the Way You Work with Legal Information</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => onNavigate('research')} className="px-8 py-4 bg-accent-blue hover:bg-blue-600 text-white rounded-xl font-medium transition-colors">
                Explore Legal Research
              </button>
              <button onClick={() => onNavigate('ai')} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-medium transition-colors">
                Try AI Assistant
              </button>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}

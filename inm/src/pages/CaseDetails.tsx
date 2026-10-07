import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Clock, FileText, Calendar, BrainCircuit, Search, Download, CheckCircle2, ChevronRight
} from 'lucide-react';
import Case3DTwin from '../components/Case3DTwin';

export default function CaseDetails({ caseId, onBack, onNavigateToResearch }: { caseId: string, onBack: () => void, onNavigateToResearch: () => void }) {
  const [caseData, setCaseData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [hearings, setHearings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'documents' | 'hearings' | '3d'>('3d');
  
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    // Fetch all related data
    const fetchData = async () => {
      try {
        const cRes = await fetch(`http://localhost:3001/api/cases/${caseId}`);
        if(cRes.ok) setCaseData(await cRes.json());
        
        const tRes = await fetch(`http://localhost:3001/api/cases/${caseId}/timeline`);
        if(tRes.ok) setTimeline(await tRes.json());
        
        const dRes = await fetch(`http://localhost:3001/api/cases/${caseId}/documents`);
        if(dRes.ok) setDocuments(await dRes.json());
        
        const hRes = await fetch(`http://localhost:3001/api/cases/${caseId}/hearings`);
        if(hRes.ok) setHearings(await hRes.json());
      } catch (e) {
        console.error("Backend fetch error:", e);
        // Fallback for visual demo if backend isn't responding
        setCaseData({ id: caseId, name: 'Smith vs. Global Tech', court: 'Supreme Court', status: 'Active', stage: 'Hearing', filingDate: '2025-05-12' });
        setTimeline([{ id: 1, date: '2025-05-12', event: 'Case Filed', status: 'completed' }, { id: 2, date: '2026-11-15', event: 'Hearing', status: 'pending' }]);
        setDocuments([{ id: 'd1', title: 'Petition.pdf', type: 'Petition' }]);
        setHearings([{ id: 1, date: '2026-11-15', court: 'Supreme Court', judge: 'Hon. Davis', type: 'Arguments', status: 'Scheduled' }]);
      }
    };
    fetchData();
  }, [caseId]);

  const handleAskAI = () => {
    if(!aiQuery) return;
    setAiResponse('Thinking...');
    setTimeout(() => {
      setAiResponse(`Based on the case files for ${caseData?.name}, the next hearing is on 2026-11-15 for Final Arguments before Hon. Davis.`);
    }, 1000);
  };

  const handle3DNodeClick = (nodeId: string) => {
    if(nodeId === 'documents') setActiveTab('documents');
    if(nodeId === 'hearings') setActiveTab('hearings');
    if(nodeId === 'case' || nodeId === 'deadlines' || nodeId === 'court') setActiveTab('timeline');
    if(nodeId === 'precedents') onNavigateToResearch();
  };

  if (!caseData) return <div className="min-h-screen bg-navy-900 pt-24 text-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-navy-900 pt-24 pb-12 px-6">
      <div className="container mx-auto">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded text-xs font-bold uppercase">{caseData.status}</span>
              <span className="text-slate-400 text-sm">{caseData.id}</span>
            </div>
            <h1 className="text-3xl font-bold text-white">{caseData.name}</h1>
            <p className="text-slate-400 mt-1">{caseData.court} • Filed: {caseData.filingDate}</p>
          </div>
          <button onClick={onNavigateToResearch} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg border border-white/20 transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" /> Find Related Cases
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto hide-scrollbar">
              {['3d', 'timeline', 'documents', 'hearings'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)} 
                  className={`pb-2 px-4 text-sm font-medium transition-colors whitespace-nowrap capitalize ${activeTab === tab ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-slate-400 hover:text-white'}`}
                >
                  {tab === '3d' ? '3D Digital Twin' : tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="glass-card min-h-[500px]">
              {activeTab === '3d' && (
                <Case3DTwin caseData={caseData} onNodeClick={handle3DNodeClick} />
              )}
              
              {activeTab === 'timeline' && (
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Case Timeline</h3>
                  <div className="relative border-l border-white/10 ml-3 space-y-8">
                    {timeline.map((item, i) => (
                      <div key={i} className="relative pl-6">
                        <div className={`absolute -left-1.5 w-3 h-3 rounded-full ${item.status === 'completed' ? 'bg-green-500' : 'bg-orange-500 ring-4 ring-orange-500/20'}`}></div>
                        <div className="text-xs text-slate-400 mb-1">{item.date}</div>
                        <div className={`font-medium ${item.status === 'completed' ? 'text-white' : 'text-orange-400'}`}>{item.event}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">Documents</h3>
                    <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded">Upload Document</button>
                  </div>
                  <div className="grid gap-3">
                    {documents.map((doc, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-blue-400 p-1.5 bg-blue-400/10 rounded" />
                          <div>
                            <div className="text-white font-medium text-sm">{doc.title}</div>
                            <div className="text-xs text-slate-400">{doc.type} • {doc.date}</div>
                          </div>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg"><Download className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'hearings' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">Hearings</h3>
                    <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded">Schedule Hearing</button>
                  </div>
                  <div className="space-y-4">
                    {hearings.map((h, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-xl border-l-4 border-l-purple-500">
                        <div className="flex justify-between items-start mb-3">
                          <div className="text-lg font-bold text-white">{h.date}</div>
                          <span className="bg-purple-500/20 text-purple-400 px-2.5 py-1 rounded text-xs font-semibold">{h.status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><span className="text-slate-500">Court:</span> <span className="text-slate-300">{h.court}</span></div>
                          <div><span className="text-slate-500">Judge:</span> <span className="text-slate-300">{h.judge}</span></div>
                          <div><span className="text-slate-500">Type:</span> <span className="text-slate-300">{h.type}</span></div>
                        </div>
                        {h.notes && <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-400">Notes: {h.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Case Info Summary */}
            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4 border-b border-white/10 pb-2">Case Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="text-slate-300">Commercial</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Lawyer</span><span className="text-slate-300">Jane Doe</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Client</span><span className="text-slate-300">John Smith</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Priority</span><span className="text-red-400 font-medium">High</span></div>
              </div>
            </div>

            {/* AI Case Assistant */}
            <div className="glass-card p-0 overflow-hidden flex-1 flex flex-col border border-accent-purple/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <div className="bg-accent-purple/20 p-4 border-b border-accent-purple/30 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-accent-purple" />
                <h3 className="text-white font-semibold">AI Case Assistant</h3>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-end bg-gradient-to-b from-transparent to-black/20">
                {aiResponse ? (
                  <div className="bg-white/10 p-3 rounded-lg text-sm text-slate-200 mb-4 border border-white/10">
                    {aiResponse}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 mb-4 text-center">Ask a question about this case based on timelines, documents, and hearing data.</div>
                )}
                
                <div className="relative">
                  <input 
                    type="text" 
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                    placeholder="e.g. What is the next hearing?" 
                    className="w-full bg-white/5 border border-white/20 rounded-lg py-2.5 pl-3 pr-10 text-sm text-white focus:border-accent-purple outline-none"
                  />
                  <button onClick={handleAskAI} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-accent-purple">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button onClick={() => { setAiQuery('Summarize the documents.'); handleAskAI(); }} className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-400 hover:text-white">Summarize docs</button>
                  <button onClick={() => { setAiQuery('Important deadlines?'); handleAskAI(); }} className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-400 hover:text-white">Deadlines?</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

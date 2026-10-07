import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, AlertCircle, CheckCircle2, Clock, 
  Search, Filter, Plus, Edit2, FileText, ChevronRight,
  MoreVertical, Calendar
} from 'lucide-react';

export default function CaseManagement({ onOpenCase }: { onOpenCase: (id: string) => void }) {
  const [cases, setCases] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Use fetch to hit the backend if available, otherwise mock data to ensure it runs
  useEffect(() => {
    fetch('http://localhost:3001/api/cases')
      .then(res => res.json())
      .then(data => {
        setCases(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Backend not reachable, falling back to mock");
        // Fallback mock if backend is down
        setCases([
          { id: 'case-1001', name: 'Smith vs. Global Tech', court: 'Supreme Court', caseType: 'Commercial', status: 'Active', filingDate: '2025-05-12', nextHearing: '2026-11-15', priority: 'High', lastUpdated: '2026-10-01' }
        ]);
        setLoading(false);
      });
  }, []);

  const stats = [
    { label: "Total Cases", value: cases.length, icon: FolderOpen, color: "text-blue-400" },
    { label: "Active Cases", value: cases.filter(c => c.status === 'Active').length, icon: AlertCircle, color: "text-orange-400" },
    { label: "Pending Cases", value: cases.filter(c => c.status === 'Pending').length, icon: Clock, color: "text-amber-400" },
    { label: "Closed Cases", value: cases.filter(c => c.status === 'Closed').length, icon: CheckCircle2, color: "text-green-400" },
    { label: "Upcoming Hearings", value: 3, icon: Calendar, color: "text-purple-400" },
    { label: "Important Deadlines", value: 5, icon: AlertCircle, color: "text-red-400" },
  ];

  return (
    <div className="min-h-screen bg-navy-900 pt-24 pb-12 px-6">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FolderOpen className="text-accent-blue w-8 h-8" />
              Case Management
            </h1>
            <p className="text-slate-400 mt-2">Manage your active litigation, upcoming hearings, and case documents.</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-accent-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Case
          </button>
        </div>

        {/* 1. Dashboard Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card p-4 flex flex-col justify-center items-center text-center">
              <stat.icon className={`w-8 h-8 ${stat.color} mb-2`} />
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-slate-400 font-medium uppercase">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 2. Search & Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Search cases by name, ID, court..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-accent-blue"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {['All Cases', 'Active', 'Pending', 'Civil', 'Criminal', 'High Court'].map((filter, i) => (
                <button key={i} className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 hover:bg-white/10 transition-colors">
                  {filter}
                </button>
              ))}
              <button className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 flex items-center gap-2 hover:bg-white/10 transition-colors">
                <Filter className="w-4 h-4" /> Sort
              </button>
            </div>
          </div>
        </div>

        {/* 3. Case List */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Case ID & Name</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Court & Type</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Next Hearing</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Priority</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="text-sm font-medium text-white">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.id}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-300">{c.court}</div>
                      <div className="text-xs text-slate-500">{c.caseType}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-300">{c.nextHearing}</div>
                      <div className="text-xs text-slate-500">Updated: {c.lastUpdated}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${c.priority === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-white rounded bg-white/5 hover:bg-white/10"><FileText className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:text-white rounded bg-white/5 hover:bg-white/10"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onOpenCase(c.id)} className="px-3 py-1.5 bg-accent-blue/20 hover:bg-accent-blue text-accent-blue hover:text-white rounded text-xs font-medium transition-colors flex items-center gap-1">
                          Open <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Create Case Modal (Mock) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-card w-full max-w-2xl p-6 bg-navy-900 border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Case</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label className="text-xs text-slate-400">Case Name</label><input type="text" className="w-full mt-1 bg-white/5 border border-white/10 rounded p-2 text-white" /></div>
              <div><label className="text-xs text-slate-400">Court</label><input type="text" className="w-full mt-1 bg-white/5 border border-white/10 rounded p-2 text-white" /></div>
              <div><label className="text-xs text-slate-400">Petitioner</label><input type="text" className="w-full mt-1 bg-white/5 border border-white/10 rounded p-2 text-white" /></div>
              <div><label className="text-xs text-slate-400">Respondent</label><input type="text" className="w-full mt-1 bg-white/5 border border-white/10 rounded p-2 text-white" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
              <button onClick={() => setShowCreateModal(false)} className="px-6 py-2 bg-accent-blue text-white rounded-lg font-medium">Save Case</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

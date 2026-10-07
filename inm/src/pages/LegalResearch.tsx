import React, { useState, useEffect } from 'react';
import { 
  Search, Mic, Filter, BrainCircuit, FileText, Bookmark, Download, 
  History, Clock, Scale, Share2, MessageSquare, ChevronRight, CheckCircle2,
  ListFilter, ExternalLink, AlertCircle, RefreshCw, Send, X, ShieldAlert,
  Target, Edit3, Columns, Plus, Trash2, FileCode, Shield, Award
} from 'lucide-react';
import LegalKnowledgeGraph from '../components/LegalKnowledgeGraph';
import { legalApi } from '../services/legalApi';

export default function LegalResearch() {
  const [query, setQuery] = useState('Navtej Singh Johar');
  const [results, setResults] = useState<any[]>([]);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isApiUsed, setIsApiUsed] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filters state
  const [selectedCourt, setSelectedCourt] = useState<string>('All Courts');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('All Time');

  // Document state
  const [activeTab, setActiveTab] = useState<'results' | 'document' | 'graph'>('results');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // AI Tool Modal / Output State
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolOutput, setToolOutput] = useState<string | null>(null);
  const [isToolLoading, setIsToolLoading] = useState(false);

  // Explain Section Modal State
  const [sectionToExplain, setSectionToExplain] = useState('Article 21');
  const [showSectionModal, setShowSectionModal] = useState(false);

  // Compare Cases State
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareCase1, setCompareCase1] = useState<string>('');
  const [compareCase2, setCompareCase2] = useState<string>('');
  const [compareOutput, setCompareOutput] = useState<string | null>(null);

  // Research Notes State
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [notes, setNotes] = useState<{ id: string; title: string; content: string; date: string }[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // AI Chatbot State
  const [aiQuestion, setAiQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Navtej Singh Johar",
    "Kesavananda Bharati",
    "Maneka Gandhi",
    "right to privacy",
    "Article 21"
  ]);

  const courts = [
    'All Courts',
    'Supreme Court',
    'High Court',
    'District Court'
  ];

  const dateRanges = [
    'All Time',
    'Last 1 Year',
    'Last 5 Years',
    'Last 10 Years'
  ];

  useEffect(() => {
    // Load saved notes from localStorage
    const savedNotes = localStorage.getItem('lexintel_research_notes');
    if (savedNotes) {
      try { setNotes(JSON.parse(savedNotes)); } catch (e) {}
    }
    // Initial auto-search for default query
    handleSearch('Navtej Singh Johar');
  }, []);

  const saveNotesToStorage = (updatedNotes: any[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('lexintel_research_notes', JSON.stringify(updatedNotes));
  };

  const handleSearch = async (forcedQuery?: string, targetPage: number = 1) => {
    const q = forcedQuery !== undefined ? forcedQuery : query;
    if (!q || !q.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setCurrentPage(targetPage);

    if (!recentSearches.includes(q.trim())) {
      setRecentSearches(prev => [q.trim(), ...prev.slice(0, 4)]);
    }

    try {
      const response = await legalApi.searchCases(q, {
        court: selectedCourt,
        dateRange: selectedDateRange,
        page: targetPage
      });

      const docsList = response.results || response.data?.results || [];
      const foundCount = response.found || docsList.length;

      setResults(docsList);
      setTotalFound(foundCount);
      setIsApiUsed(!!response.isApiUsed);
      setActiveTab('results');

      if (docsList.length === 0) {
        setSearchError("No related legal documents found.");
      }
    } catch (err: any) {
      console.error("Legal Search Error:", err);
      setSearchError(err.message || "Legal database is temporarily unavailable. Please try again.");
      setIsApiUsed(!!err.isApiUsed);
      setResults([]);
      setTotalFound(0);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewCase = async (docId: string) => {
    setSelectedDocId(docId);
    setActiveTab('document');
    setIsLoadingDoc(true);
    setDocError(null);
    setSelectedDoc(null);
    setToolOutput(null);
    setActiveTool(null);
    setChatHistory([]);

    try {
      const docData = await legalApi.getCaseDocument(docId);
      setSelectedDoc(docData);
    } catch (err: any) {
      console.error("Fetch document error:", err);
      setDocError(err.message || "Legal database is temporarily unavailable. Please try again.");
    } finally {
      setIsLoadingDoc(false);
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  };

  // Execute AI tool action on the active case
  const handleExecuteTool = async (toolName: string, customPrompt?: string) => {
    if (!selectedDoc) {
      alert("Please select and view a document first to use AI Legal Tools.");
      return;
    }

    setActiveTool(toolName);
    setIsToolLoading(true);
    setToolOutput(null);

    const cleanText = stripHtml(selectedDoc.doc || selectedDoc.title || '').substring(0, 10000);
    let prompt = "";

    if (toolName === "Summarize Case") {
      prompt = `Please summarize this legal document using this structure:\n\n### Case Summary\n- **Background**: ...\n- **Main Issue**: ...\n- **Arguments**: ...\n- **Court's Reasoning**: ...\n- **Decision**: ...\n- **Important Legal Principles**: ...\n\nIf any detail is not present in the document, state "Not available in the retrieved document."`;
    } else if (toolName === "Find Precedents") {
      prompt = `Identify all cited cases and precedents in this document. Return list of precedent names, citations if available, and their relevance to this case. If none found, state "No cited precedents found in the retrieved document."`;
    } else if (toolName === "Extract Issues") {
      prompt = `Extract all key legal issues from this document in numbered format:\n\n### Legal Issues Identified\n1. ...\n2. ...`;
    } else if (toolName === "Explain Section") {
      prompt = `Explain ${customPrompt || sectionToExplain}:\n1. What this section/article means.\n2. How it relates to this case document.\n3. How the court interpreted it in this judgment.`;
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          context: {
            mode: "Uploaded Document",
            documentText: `Case Title: ${selectedDoc.title}\nCourt: ${selectedDoc.courtname || 'Supreme Court of India'}\nCitation: ${selectedDoc.cite || ''}\n\n${cleanText}`
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tool analysis failed");

      setToolOutput(data.reply || data.answer || "Analysis complete.");
    } catch (err: any) {
      setToolOutput(`Error running ${toolName}: ${err.message}`);
    } finally {
      setIsToolLoading(false);
    }
  };

  // Compare 2 Cases Handler
  const handleCompareCases = async () => {
    if (!compareCase1 || !compareCase2) {
      alert("Please select or enter two case titles to compare.");
      return;
    }

    setIsToolLoading(true);
    setCompareOutput(null);

    try {
      const prompt = `Compare these two legal cases in a Markdown table:\n\nCase 1: ${compareCase1}\nCase 2: ${compareCase2}\n\nFormat table as:\n| Category | Case 1 | Case 2 |\n| Court | | |\n| Main issue | | |\n| Relevant law | | |\n| Arguments | | |\n| Court reasoning | | |\n| Decision | | |\n| Important precedent | | |`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });
      const data = await res.json();
      setCompareOutput(data.reply || data.answer || "Comparison generated.");
    } catch (err: any) {
      setCompareOutput(`Comparison error: ${err.message}`);
    } finally {
      setIsToolLoading(false);
    }
  };

  // Chatbot send handler with conversation history
  const handleSendChat = async (forcedMsg?: string) => {
    const msg = forcedMsg || aiQuestion;
    if (!msg || !msg.trim() || isAiThinking) return;

    setAiQuestion('');
    setAiError(null);
    setIsAiThinking(true);

    const newUserMsg = { role: 'user', content: msg };
    const updatedHistory = [...chatHistory, newUserMsg];
    setChatHistory(updatedHistory);

    const cleanText = selectedDoc ? stripHtml(selectedDoc.doc || '').substring(0, 10000) : '';

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          conversation: chatHistory,
          context: {
            mode: "Uploaded Document",
            documentText: selectedDoc ? `Case Title: ${selectedDoc.title}\nCourt: ${selectedDoc.courtname || 'Supreme Court of India'}\nCNR: ${selectedDoc.cnr || ''}\nCitation: ${selectedDoc.cite || ''}\n\n${cleanText}` : undefined
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI chat error");

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: data.reply || data.answer || "No response received."
      }]);
    } catch (err: any) {
      setAiError(err.message || "Failed to communicate with AI Assistant.");
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleAddNote = () => {
    if (!newNoteTitle.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      date: new Date().toLocaleDateString()
    };
    saveNotesToStorage([newNote, ...notes]);
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  const handleDeleteNote = (id: string) => {
    saveNotesToStorage(notes.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-navy-900 pt-24 pb-12 px-6">
      <div className="container mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Scale className="text-accent-blue w-8 h-8" />
              Legal Research Workspace
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Search real Indian legal cases, reported judgments, acts, and constitutional provisions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotesDrawer(true)}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-4 h-4 text-teal-400" /> Research Notes ({notes.length})
            </button>
            {isApiUsed && (
              <div className="flex items-center gap-1.5 bg-accent-blue/10 border border-accent-blue/30 px-3 py-1.5 rounded-xl text-xs text-accent-blue font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>Data Source: eCourtsIndia API</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Content Area (Left 8 columns) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Search Bar & Filters */}
            <div className="glass-card p-5">
              <div className="flex flex-col gap-4">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 text-slate-400 w-5 h-5" />
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search cases (e.g., Navtej Singh Johar, Kesavananda Bharati, Maneka Gandhi, Article 21, right to privacy)..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-28 text-white placeholder-slate-400 focus:outline-none focus:border-accent-blue/50 transition-colors text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(undefined, 1)}
                  />
                  <button 
                    onClick={() => handleSearch(undefined, 1)}
                    disabled={isSearching}
                    className="absolute right-2 bg-accent-blue hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                
                {/* Filter Controls */}
                <div className="flex flex-wrap gap-4 items-center text-xs">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-accent-blue" />
                    <span className="text-slate-400 font-semibold uppercase">Court:</span>
                    <select
                      value={selectedCourt}
                      onChange={(e) => { setSelectedCourt(e.target.value); handleSearch(query, 1); }}
                      className="bg-navy-950 border border-white/10 text-white rounded-lg py-1.5 px-3 focus:outline-none focus:border-accent-blue"
                    >
                      {courts.map((court, i) => (
                        <option key={i} value={court} className="bg-navy-900">{court}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-semibold uppercase">Date Range:</span>
                    <select
                      value={selectedDateRange}
                      onChange={(e) => { setSelectedDateRange(e.target.value); handleSearch(query, 1); }}
                      className="bg-navy-950 border border-white/10 text-white rounded-lg py-1.5 px-3 focus:outline-none focus:border-accent-blue"
                    >
                      {dateRanges.map((range, i) => (
                        <option key={i} value={range} className="bg-navy-900">{range}</option>
                      ))}
                    </select>
                  </div>

                  {totalFound > 0 && (
                    <div className="ml-auto text-slate-400">
                      Found <strong className="text-white">{totalFound}</strong> legal records
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {searchError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between gap-3 text-red-300 text-sm">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>{searchError}</span>
                </div>
              </div>
            )}

            {/* AI Tool Active Output Banner */}
            {(isToolLoading || toolOutput) && (
              <div className="glass-card p-6 border-l-4 border-l-accent-purple bg-gradient-to-r from-accent-purple/10 to-transparent">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <BrainCircuit className="w-5 h-5 text-accent-purple" />
                    <span>AI Tool Analysis: {activeTool}</span>
                  </div>
                  <button onClick={() => { setToolOutput(null); setActiveTool(null); }} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {isToolLoading ? (
                  <div className="flex items-center gap-3 text-slate-400 text-sm py-4">
                    <RefreshCw className="w-5 h-5 text-accent-purple animate-spin" />
                    <span>Analyzing reported case content with LexIntel AI...</span>
                  </div>
                ) : (
                  <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-navy-950 p-4 rounded-xl border border-white/10">
                    <div className="text-[11px] text-slate-500 mb-2 border-b border-white/10 pb-1 flex justify-between">
                      <span>DATA SOURCE: {isApiUsed ? "eCourtsIndia API" : "Internal Catalog"}</span>
                      <span>AI ANALYSIS: LexIntel AI</span>
                    </div>
                    {toolOutput}
                  </div>
                )}
              </div>
            )}

            {/* Content Tabs */}
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab('results')} 
                  className={`pb-2 px-2 text-sm font-medium transition-colors ${activeTab === 'results' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-slate-400 hover:text-white'}`}
                >
                  Search Results ({results.length})
                </button>
                <button 
                  onClick={() => setActiveTab('document')} 
                  className={`pb-2 px-2 text-sm font-medium transition-colors ${activeTab === 'document' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-slate-400 hover:text-white'}`}
                >
                  Document Viewer {selectedDoc && `(${selectedDoc.tid || selectedDocId})`}
                </button>
                <button 
                  onClick={() => setActiveTab('graph')} 
                  className={`pb-2 px-2 text-sm font-medium transition-colors ${activeTab === 'graph' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-slate-400 hover:text-white'}`}
                >
                  3D Knowledge Graph
                </button>
              </div>

              {isApiUsed && (
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Shield className="w-3.5 h-3.5 text-accent-blue" />
                  <span>Data Source: eCourtsIndia API</span>
                </div>
              )}
            </div>

            {/* Results Area */}
            <div className="flex-1">
              {activeTab === 'results' && (
                <div className="space-y-4">
                  {isSearching && (
                    <div className="glass-card p-12 text-center">
                      <RefreshCw className="w-8 h-8 text-accent-blue animate-spin mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-white mb-1">Searching eCourts API...</h3>
                      <p className="text-slate-400 text-sm">Retrieving real legal records</p>
                    </div>
                  )}

                  {!isSearching && results.length === 0 && !searchError && (
                    <div className="glass-card p-12 text-center">
                      <Scale className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Real Legal Research</h3>
                      <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                        Search reported judgments, acts, and constitutional provisions.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {["Navtej Singh Johar", "Kesavananda Bharati", "Maneka Gandhi", "right to privacy", "Article 21"].map((term, idx) => (
                          <button
                            key={idx}
                            onClick={() => { setQuery(term); handleSearch(term, 1); }}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-accent-blue/50 text-slate-300 rounded-lg text-xs transition-colors"
                          >
                            "{term}"
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isSearching && results.map((docItem, idx) => (
                    <div key={docItem.tid || idx} className="glass-card p-5 hover:bg-white/5 transition-all group border border-white/10 hover:border-accent-blue/40">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 
                            onClick={() => handleViewCase(docItem.tid)}
                            className="text-lg font-bold text-white group-hover:text-accent-blue transition-colors cursor-pointer flex items-center gap-2"
                          >
                            {docItem.title || `Case #${docItem.tid}`}
                          </h3>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-400 mt-3 bg-white/5 p-3 rounded-xl border border-white/5">
                            <div><strong className="text-slate-500 block uppercase text-[10px]">Court</strong><span className="text-accent-blue font-semibold">{docItem.courtname || 'Supreme Court of India'}</span></div>
                            <div><strong className="text-slate-500 block uppercase text-[10px]">Case Number / CNR</strong><span className="text-slate-200">{docItem.cnr || 'N/A'}</span></div>
                            <div><strong className="text-slate-500 block uppercase text-[10px]">Decision Date</strong><span className="text-slate-200">{docItem.publishdate || 'N/A'}</span></div>
                            <div><strong className="text-slate-500 block uppercase text-[10px]">Status</strong><span className="text-emerald-400 font-semibold">{docItem.status || 'Disposed'}</span></div>
                          </div>

                          {(docItem.petitioner || docItem.respondent) && (
                            <div className="flex flex-wrap gap-4 text-xs text-slate-300 mt-2">
                              {docItem.petitioner && <div><span className="text-slate-500">Petitioner: </span><span className="font-medium text-white">{docItem.petitioner}</span></div>}
                              {docItem.respondent && <div><span className="text-slate-500">Respondent: </span><span className="font-medium text-white">{docItem.respondent}</span></div>}
                            </div>
                          )}
                        </div>

                        {isApiUsed && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-accent-blue bg-accent-blue/10 border border-accent-blue/20 px-2.5 py-1 rounded-full font-medium">
                              Data Source: eCourtsIndia API
                            </span>
                          </div>
                        )}
                      </div>

                      {docItem.headline && (
                        <div className="mt-3 mb-4">
                          <strong className="text-slate-400 text-xs uppercase block mb-1">Relevant Information</strong>
                          <p className="text-sm text-slate-300 line-clamp-3 bg-white/5 p-3 rounded-xl border border-white/5 font-serif leading-relaxed">
                            {docItem.headline}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 border-t border-white/5">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          {docItem.source && <span>Source: <strong className="text-slate-200">{docItem.source}</strong></span>}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {docItem.sourceUrl && (
                            <a
                              href={docItem.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg border border-white/10 transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> Source Link
                            </a>
                          )}
                          <button 
                            onClick={() => handleViewCase(docItem.tid)}
                            className="text-xs bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Case
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  {results.length > 0 && (
                    <div className="flex items-center justify-between glass-card p-4 rounded-xl border border-white/10 mt-4 text-xs">
                      <button
                        onClick={() => handleSearch(query, Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1 || isSearching}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-lg text-white font-medium transition-colors"
                      >
                        Previous Page
                      </button>
                      <span className="text-slate-400">
                        Page <strong className="text-white">{currentPage}</strong>
                      </span>
                      <button
                        onClick={() => handleSearch(query, currentPage + 1)}
                        disabled={results.length < 10 || isSearching}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-lg text-white font-medium transition-colors"
                      >
                        Next Page
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Document Viewer Tab */}
              {activeTab === 'document' && (
                <div className="glass-card flex flex-col overflow-hidden border border-white/10 min-h-[600px]">
                  {isLoadingDoc ? (
                    <div className="h-[600px] flex flex-col items-center justify-center text-center p-6">
                      <RefreshCw className="w-8 h-8 text-accent-blue animate-spin mb-4" />
                      <h3 className="text-lg font-bold text-white mb-1">Retrieving Legal Document</h3>
                      <p className="text-slate-400 text-sm">Loading judgment details from IndiaCode / eCourtsIndia...</p>
                    </div>
                  ) : docError ? (
                    <div className="h-[600px] flex flex-col items-center justify-center text-center p-6">
                      <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">Unable to Load Document</h3>
                      <p className="text-slate-400 text-sm max-w-md mb-6">{docError}</p>
                    </div>
                  ) : selectedDoc ? (
                    <div className="flex flex-col h-full">
                      {/* Document Header */}
                      <div className="bg-navy-950 border-b border-white/10 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-accent-blue" />
                            {selectedDoc.title}
                          </h2>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="text-accent-blue font-semibold">{selectedDoc.courtname || 'Supreme Court of India'}</span>
                            {selectedDoc.publishdate && <span>Date: {selectedDoc.publishdate}</span>}
                            {selectedDoc.cnr && <span>CNR: {selectedDoc.cnr}</span>}
                            {selectedDoc.cite && <span className="text-amber-300">Citation: {selectedDoc.cite}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-accent-blue bg-accent-blue/10 border border-accent-blue/20 px-3 py-1 rounded-full font-medium">
                            Data Source: IndiaCode / eCourtsIndia
                          </span>
                          {selectedDoc.sourceUrl && (
                            <a 
                              href={selectedDoc.sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <span>Open Official Document</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Interactive Chatbot on Document */}
                      <div className="bg-navy-950 border-b border-white/10 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-accent-purple uppercase flex items-center gap-1.5">
                            <BrainCircuit className="w-4 h-4" /> LexIntel AI Assistant (Grounded on Selected Case)
                          </span>
                          <span className="text-[10px] text-slate-400">DATA SOURCE: IndiaCode / eCourtsIndia | AI ANALYSIS: LexIntel AI</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={aiQuestion}
                            onChange={(e) => setAiQuestion(e.target.value)}
                            placeholder="Ask e.g. 'What is this case about?', 'What was the court\'s decision?'..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-accent-purple"
                            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                          />
                          <button 
                            onClick={() => handleSendChat()}
                            disabled={isAiThinking || !aiQuestion.trim()}
                            className="px-4 py-2 bg-accent-purple hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isAiThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span>Ask</span>
                          </button>
                        </div>

                        {/* Chat Messages */}
                        {chatHistory.length > 0 && (
                          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar bg-navy-900/60 p-3 rounded-xl border border-white/5">
                            {chatHistory.map((m, idx) => (
                              <div key={idx} className={`text-xs p-2 rounded-lg ${m.role === 'user' ? 'bg-accent-blue/20 text-white text-right ml-12' : 'bg-white/5 text-slate-200 mr-12'}`}>
                                <div className="font-semibold text-[10px] text-slate-400 mb-0.5">{m.role === 'user' ? 'You' : 'LexIntel AI'}</div>
                                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Document Details & Text */}
                      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50/5">
                        <div className="max-w-4xl mx-auto space-y-6">
                          {selectedDoc.parties && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-xs">
                              <span className="text-slate-400 font-semibold uppercase block mb-1">Parties:</span>
                              <span className="text-white font-medium">{selectedDoc.parties}</span>
                            </div>
                          )}

                          {selectedDoc.author && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-xs">
                              <span className="text-slate-400 font-semibold uppercase block mb-1">Judges / Bench:</span>
                              <span className="text-emerald-300 font-medium">{selectedDoc.author}</span>
                            </div>
                          )}

                          {selectedDoc.acts && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-xs">
                              <span className="text-slate-400 font-semibold uppercase block mb-2">Relevant Acts & Sections:</span>
                              <div className="flex flex-wrap gap-2">
                                {selectedDoc.acts.map((actItem: string, aIdx: number) => (
                                  <span key={aIdx} className="bg-accent-purple/20 text-accent-purple border border-accent-purple/30 px-2.5 py-1 rounded-md">
                                    {actItem}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Text Body */}
                          <div 
                            className="text-slate-200 text-sm leading-relaxed font-serif space-y-4 whitespace-pre-wrap bg-navy-950 p-6 rounded-2xl border border-white/10"
                          >
                            {selectedDoc.doc}
                          </div>

                          <div className="pt-6 border-t border-white/10 text-center text-xs text-slate-400">
                            <p>Data Source: Official IndiaCode / eCourtsIndia Database</p>
                            {selectedDoc.sourceUrl && (
                              <a href={selectedDoc.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline mt-1 inline-block">
                                Verify Document on Official Portal
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[600px] flex items-center justify-center text-slate-400 text-sm">
                      Select a case from search results to view the full document.
                    </div>
                  )}
                </div>
              )}

              {/* 3D Knowledge Graph */}
              {activeTab === 'graph' && (
                <div className="h-[600px] w-full glass-card overflow-hidden">
                  <LegalKnowledgeGraph caseData={selectedDoc} />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area (Right 4 columns) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* AI Legal Tools */}
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                <BrainCircuit className="w-5 h-5 text-accent-blue" /> AI Legal Tools
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Summarize Case", icon: FileText, color: "text-blue-400", action: "Summarize Case" },
                  { label: "Find Precedents", icon: Share2, color: "text-purple-400", action: "Find Precedents" },
                  { label: "Extract Issues", icon: Target, color: "text-red-400", action: "Extract Issues" },
                  { label: "Compare Cases", icon: Columns, color: "text-orange-400", action: "Compare Cases" },
                  { label: "Explain Section", icon: MessageSquare, color: "text-green-400", action: "Explain Section" },
                  { label: "Research Notes", icon: Edit3, color: "text-teal-400", action: "Research Notes" },
                ].map((tool, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      if (tool.action === "Explain Section") {
                        setShowSectionModal(true);
                      } else if (tool.action === "Compare Cases") {
                        setShowCompareModal(true);
                      } else if (tool.action === "Research Notes") {
                        setShowNotesDrawer(true);
                      } else {
                        handleExecuteTool(tool.action);
                      }
                    }}
                    className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center justify-center gap-2 text-center group"
                  >
                    <tool.icon className={`w-6 h-6 ${tool.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-xs font-medium text-slate-300">{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Research History & Landarmks */}
            <div className="glass-card p-5 flex-1">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-accent-purple" /> Recent Queries
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Recent Searches</h4>
                  <ul className="space-y-2">
                    {recentSearches.map((term, i) => (
                      <li 
                        key={i} 
                        onClick={() => { setQuery(term); handleSearch(term); }}
                        className="text-sm text-slate-300 flex items-center gap-2 hover:text-accent-blue cursor-pointer transition-colors truncate"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">"{term}"</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Modal: Explain Section */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-400" /> Explain Section / Article
              </h3>
              <button onClick={() => setShowSectionModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-slate-400 text-xs">Enter an article or legal section to analyze against the currently opened case.</p>
            <input 
              type="text" 
              value={sectionToExplain}
              onChange={(e) => setSectionToExplain(e.target.value)}
              placeholder="e.g. Article 21, Section 66A, Section 302 IPC..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-400"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowSectionModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button 
                onClick={() => {
                  setShowSectionModal(false);
                  handleExecuteTool("Explain Section", sectionToExplain);
                }} 
                className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Explain Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Compare Cases */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl p-6 rounded-2xl border border-white/10 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Columns className="w-5 h-5 text-orange-400" /> Compare Two Real Legal Cases
              </h3>
              <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Case 1 Title or ID</label>
                <input 
                  type="text" 
                  value={compareCase1} 
                  onChange={(e) => setCompareCase1(e.target.value)} 
                  placeholder="e.g. Navtej Singh Johar..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Case 2 Title or ID</label>
                <input 
                  type="text" 
                  value={compareCase2} 
                  onChange={(e) => setCompareCase2(e.target.value)} 
                  placeholder="e.g. Kesavananda Bharati..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>
            </div>

            <button 
              onClick={handleCompareCases} 
              disabled={isToolLoading}
              className="py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {isToolLoading ? 'Comparing Cases...' : 'Generate Case Comparison Table'}
            </button>

            {compareOutput && (
              <div className="flex-1 overflow-y-auto p-4 bg-navy-950 rounded-xl border border-white/10 text-slate-200 text-xs whitespace-pre-wrap leading-relaxed">
                {compareOutput}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawer: Research Notes */}
      {showNotesDrawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="glass-card w-full max-w-md h-full p-6 border-l border-white/10 flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-400" /> Case Research Notes
              </h3>
              <button onClick={() => setShowNotesDrawer(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {/* Note Creation Form */}
            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
              <input 
                type="text" 
                value={newNoteTitle} 
                onChange={(e) => setNewNoteTitle(e.target.value)} 
                placeholder="Note Title / Section Reference..."
                className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
              />
              <textarea 
                value={newNoteContent} 
                onChange={(e) => setNewNoteContent(e.target.value)} 
                placeholder="Write your research insights, legal arguments, or citations..."
                className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white text-xs h-20 resize-none"
              />
              <button 
                onClick={handleAddNote} 
                className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Save Research Note
              </button>
            </div>

            {/* List of Saved Notes */}
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {notes.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-8">No research notes saved yet.</div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex justify-between items-start gap-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{note.title}</div>
                      <div className="text-xs text-slate-300 mt-1 whitespace-pre-wrap">{note.content}</div>
                      <div className="text-[10px] text-slate-500 mt-2">{note.date}</div>
                    </div>
                    <button onClick={() => handleDeleteNote(note.id)} className="text-slate-500 hover:text-red-400 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

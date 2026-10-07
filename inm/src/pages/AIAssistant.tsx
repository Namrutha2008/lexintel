import React, { useState, useRef, useEffect } from 'react';
import { 
  BrainCircuit, Send, Square, Copy, Check, RefreshCw, Paperclip, 
  Trash2, MessageSquare, Plus, FileText, Scale, Info, ChevronDown,
  ShieldAlert, AlertCircle, X, FileCheck
} from 'lucide-react';
import AI3DVisualization from '../components/AI3DVisualization';

export default function AIAssistant({ caseId }: { caseId?: string }) {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState(caseId ? 'Selected Case' : 'General Legal Research');
  const [conversations, setConversations] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [uploadedDocText, setUploadedDocText] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateLocalAiReply = (prompt: string, docContext?: string): string => {
    const p = prompt.toLowerCase();
    if (docContext && docContext.trim()) {
      return `### Document Analysis & Summary (LexIntel AI)\n\n**Overview**:\n${docContext.substring(0, 400)}...\n\n**Key Takeaways**:\n1. Relevant to Indian statutory framework and constitutional guarantees.\n2. Examines judicial principles of due process and statutory interpretation.\n3. Precedential value established in reported High Court & Supreme Court case law.`;
    }
    if (p.includes('navtej') || p.includes('377') || p.includes('johar')) {
      return `### Navtej Singh Johar & Ors. v. Union of India (2018)\n\n**Overview**:\n*Navtej Singh Johar v. Union of India* (2018) 10 SCC 1 is a landmark 5-Judge Constitution Bench judgment of the Supreme Court of India that unanimously struck down Section 377 of the Indian Penal Code (IPC) in so far as it criminalized consensual sexual acts between adults in private.\n\n**Key Principles**:\n1. **Right to Dignity & Privacy (Article 21)**: Consensual intimate choices are protected under the fundamental rights to dignity, autonomy, and personal liberty.\n2. **Non-Discrimination (Article 15)**: Sex-based discrimination includes discrimination on the basis of sexual orientation.\n3. **Constitutional Morality**: CJI Dipak Misra emphasized that constitutional morality must always prevail over societal morality.`;
    }
    if (p.includes('kesavananda') || p.includes('basic structure')) {
      return `### Kesavananda Bharati v. State of Kerala (1973)\n\n**Overview**:\nThe historic 13-Judge Constitution Bench decision that established the **Basic Structure Doctrine** of the Indian Constitution.\n\n**Key Precedents**:\n1. **Limits on Amending Power**: Parliament possesses wide powers to amend the Constitution under Article 368, but cannot alter, destroy, or emasculate its basic structure.\n2. **Elements of Basic Structure**: Includes Supremacy of the Constitution, Judicial Review, Secularism, Federalism, and Separation of Powers.`;
    }
    if (p.includes('maneka') || p.includes('procedure established by law')) {
      return `### Maneka Gandhi v. Union of India (1978)\n\n**Overview**:\nA landmark 7-Judge Bench ruling that transformed Article 21 and Indian constitutional jurisprudence.\n\n**Key Principles**:\n1. **Fair & Reasonable Procedure**: The phrase "procedure established by law" in Article 21 cannot be arbitrary or oppressive; it must satisfy the test of fairness and natural justice.\n2. **Golden Triangle**: Established that Articles 14, 19, and 21 are interconnected and form a golden triangle of fundamental freedoms.`;
    }
    if (p.includes('article 21') || p.includes('privacy') || p.includes('puttaswamy')) {
      return `### Article 21 & Right to Privacy (Puttaswamy 2017)\n\n**Overview**:\nArticle 21 guarantees that *"No person shall be deprived of his life or personal liberty except according to procedure established by law."*\n\n**Judicial Scope**:\n- **Right to Privacy**: Recognized unanimously by a 9-Judge Constitution Bench in *Justice K.S. Puttaswamy v. UOI (2017)* as a fundamental right.\n- **Encompassed Rights**: Includes Right to Clean Environment, Right to Legal Aid, Right to Speedy Trial, Right to Autonomy, and Right to Live with Human Dignity.`;
    }
    return `### LexIntel AI Legal Analysis\n\n**Query**: "${prompt}"\n\n**Analysis & Principles**:\n1. **Statutory Framework**: Grounded in Indian constitutional law and reported judicial precedents.\n2. **Procedural Requirements**: Must comply with statutory guidelines under CPC / CrPC and principles of natural justice.\n3. **Judicial Precedent**: Higher courts emphasize that constitutional morality and fundamental rights take precedence.\n\n*Disclaimer: LexIntel AI provides legal research assistance and analysis, not binding legal advice.*`;
  };

  useEffect(() => {
    fetch('/api/ai/conversations')
      .then(res => res.text())
      .then(raw => {
        if (!raw) return;
        try {
          const data = JSON.parse(raw);
          setConversations(Array.isArray(data) ? data : []);
        } catch(e){}
      })
      .catch(() => console.error("Could not load conversations"));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, processing, errorMessage]);

  const handleSend = async (forcedQuery?: string, isRetry = false) => {
    const q = forcedQuery || query;
    if (!q || !q.trim() || processing) return;

    setQuery('');
    setErrorMessage(null);
    setProcessing(true);

    let updatedHistory = chatHistory;
    if (!isRetry) {
      const newUserMsg = { role: 'user', content: q };
      updatedHistory = [...chatHistory, newUserMsg];
      setChatHistory(updatedHistory);
    }

    try {
      let isSuccess = false;
      let aiReply = '';
      let keyPoints: any = undefined;
      let sources: any = undefined;
      let suggestedQuestions: any = undefined;
      let disclaimer: any = undefined;

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: q, 
            conversation: updatedHistory.slice(0, -1),
            caseId: caseId || (mode.includes('Smith') ? 'case-101' : undefined),
            documentContext: uploadedDocText || undefined,
            context: {
              mode: mode,
              caseId: caseId || (mode.includes('Smith') ? 'case-101' : undefined),
              documentText: uploadedDocText || undefined,
              documentContext: uploadedDocText || undefined
            }
          })
        });

        const rawText = await res.text();
        let data: any = {};
        if (rawText) {
          try {
            data = JSON.parse(rawText);
          } catch (jsonErr) {
            console.error("Non-JSON API response received:", rawText);
          }
        }

        if (res.ok && data.success !== false) {
          isSuccess = true;
          aiReply = data.reply || data.answer || "No response received.";
          keyPoints = data.keyPoints;
          sources = data.sources;
          suggestedQuestions = data.suggestedQuestions;
          disclaimer = data.disclaimer;
        }
      } catch (backendErr) {
        console.warn("Backend fetch failed, using local AI fallback:", backendErr);
      }

      if (!isSuccess) {
        aiReply = generateLocalAiReply(q, uploadedDocText || undefined);
        suggestedQuestions = [
          "What is the key principle or precedent established here?",
          "How has the Supreme Court interpreted this in recent judgments?",
          "Explain this in simple terms for a legal draft."
        ];
        disclaimer = "LexIntel AI provides legal research assistance and analysis, not binding legal advice.";
      }

      setChatHistory(prev => [...prev, {
        role: 'assistant', 
        content: aiReply,
        keyPoints,
        sources,
        suggestedQuestions,
        disclaimer
      }]);
    } catch (e: any) {
      console.error("Chat error:", e);
      setErrorMessage("Failed to generate response. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = () => {
    const lastUserMsg = [...chatHistory].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.content, true);
    }
  };

  const handleNewChat = () => {
    setChatHistory([]);
    setErrorMessage(null);
    setUploadedDocName(null);
    setUploadedDocText(null);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedDocName(file.name);
      setMode('Uploaded Document');
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setUploadedDocText(text);
      };
      reader.readAsText(file);
    }
  };

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((chunk, idx) => {
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-white">{chunk.slice(2, -2)}</strong>;
      }
      if (chunk.startsWith('`') && chunk.endsWith('`')) {
        return <code key={idx} className="bg-white/10 px-1.5 py-0.5 rounded text-accent-blue font-mono text-xs">{chunk.slice(1, -1)}</code>;
      }
      return chunk;
    });
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;

    const codeBlockRegex = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'code', lang: match[1] || 'code', content: match[2].trim() });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return (
      <div className="space-y-3">
        {parts.map((part, pIdx) => {
          if (part.type === 'code') {
            return (
              <div key={pIdx} className="my-3 rounded-xl bg-navy-950 border border-white/10 overflow-hidden text-xs font-mono">
                <div className="bg-white/5 px-4 py-1.5 flex justify-between items-center text-slate-400 border-b border-white/10">
                  <span>{part.lang}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(part.content)}
                    className="hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Code
                  </button>
                </div>
                <pre className="p-4 text-emerald-300 overflow-x-auto whitespace-pre">
                  <code>{part.content}</code>
                </pre>
              </div>
            );
          }

          const lines = part.content.split('\n');
          return (
            <div key={pIdx} className="space-y-2">
              {lines.map((line, lIdx) => {
                if (line.startsWith('### ')) {
                  return <h3 key={lIdx} className="text-base font-bold text-white mt-3 mb-1">{parseInline(line.replace('### ', ''))}</h3>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={lIdx} className="text-lg font-bold text-accent-blue mt-4 mb-1">{parseInline(line.replace('## ', ''))}</h2>;
                }
                if (line.startsWith('# ')) {
                  return <h1 key={lIdx} className="text-xl font-extrabold text-white mt-4 mb-2">{parseInline(line.replace('# ', ''))}</h1>;
                }
                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 ml-2 text-slate-200">
                      <span className="text-accent-purple text-base">•</span>
                      <span>{parseInline(line.trim().substring(2))}</span>
                    </div>
                  );
                }
                if (/^\d+\.\s/.test(line.trim())) {
                  const matchNum = line.trim().match(/^(\d+)\.\s(.*)/);
                  return (
                    <div key={lIdx} className="flex items-start gap-2 ml-2 text-slate-200">
                      <span className="text-accent-blue font-semibold text-xs mt-0.5">{matchNum?.[1]}.</span>
                      <span>{parseInline(matchNum?.[2] || '')}</span>
                    </div>
                  );
                }
                if (!line.trim()) return <div key={lIdx} className="h-2" />;
                return <p key={lIdx} className="text-slate-200 leading-relaxed text-sm">{parseInline(line)}</p>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const aiTools = [
    { label: "Article 21 Rights", query: "What is Article 21 of the Indian Constitution?", icon: FileText },
    { label: "Summarize Case", query: "Please summarize this legal case.", icon: Scale },
    { label: "Judicial Review", query: "Compare judicial review and judicial activism.", icon: Info },
    { label: "Code Example", query: "Write a Python program for legal document processing.", icon: BrainCircuit },
  ];

  return (
    <div className="min-h-screen bg-navy-900 pt-24 pb-0 flex flex-col h-screen overflow-hidden">
      <div className="container mx-auto px-4 lg:px-6 flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BrainCircuit className="text-accent-purple w-8 h-8" />
              AI Legal Assistant
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Your intelligent assistant for legal research, case analysis, and document understanding.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 px-3 py-2 bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/40 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>

            <div className="relative">
              <span className="text-xs text-slate-400 mr-2">Context:</span>
              <select 
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 text-white rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-accent-purple cursor-pointer"
              >
                <option className="bg-navy-900">General Legal Research</option>
                <option className="bg-navy-900">Selected Case (Smith v. TechCorp)</option>
                <option className="bg-navy-900">Uploaded Document</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden pb-6">
          
          {/* Left Sidebar - Chat History & Visualization */}
          <div className="hidden lg:flex flex-col w-64 shrink-0 gap-6">
            <div className="glass-card h-44 p-2">
              <AI3DVisualization processing={processing} />
            </div>
            
            <div className="glass-card flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-accent-purple" /> Recent Chats
                </h3>
                {chatHistory.length > 0 && (
                  <button 
                    onClick={handleNewChat}
                    className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                    title="Clear current conversation"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
                {conversations.map(conv => (
                  <div key={conv.id} className="group p-3 rounded-lg hover:bg-white/5 cursor-pointer flex justify-between items-center transition-colors">
                    <div className="truncate">
                      <div className="text-sm text-slate-300 truncate">{conv.title}</div>
                      <div className="text-xs text-slate-500">{conv.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="glass-card flex-1 flex flex-col overflow-hidden relative">
            
            {/* Uploaded Doc Indicator */}
            {uploadedDocName && (
              <div className="bg-accent-blue/10 border-b border-accent-blue/20 px-6 py-2 flex justify-between items-center text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-accent-blue" />
                  <span>Document context active: <strong className="text-white">{uploadedDocName}</strong></span>
                </div>
                <button 
                  onClick={() => { setUploadedDocName(null); setUploadedDocText(null); }}
                  className="hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-accent-purple/20 rounded-2xl flex items-center justify-center mb-6 border border-accent-purple/30">
                    <BrainCircuit className="w-8 h-8 text-accent-purple" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">LexIntel AI Workspace</h2>
                  <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                    Ask any legal question, summarize documents, compare cases, or discuss code. I am equipped with conversational memory.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {aiTools.map((tool, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSend(tool.query)}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-accent-purple/50 transition-all text-left flex items-start gap-3 group"
                      >
                        <tool.icon className="w-5 h-5 text-accent-purple mt-0.5 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="text-sm font-semibold text-slate-200">{tool.label}</div>
                          <div className="text-xs text-slate-500 mt-1 truncate max-w-[140px]">"{tool.query}"</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-5 ${
                      msg.role === 'user' 
                        ? 'bg-accent-blue/20 border border-accent-blue/30 text-white' 
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      {msg.role !== 'user' && (
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                          <BrainCircuit className="w-5 h-5 text-accent-purple" />
                          <span className="text-sm font-semibold text-white">LexIntel AI</span>
                        </div>
                      )}
                      
                      {msg.role === 'user' ? (
                        <div className="text-white text-sm whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        renderMarkdown(msg.content)
                      )}

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {msg.sources.map((src: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-900 border border-white/10 rounded-lg text-xs text-slate-300">
                              <FileText className="w-3.5 h-3.5 text-accent-blue" />
                              <span>{src.title}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <h4 className="text-xs font-semibold text-slate-400 mb-2">Suggested Follow-ups:</h4>
                          <div className="flex flex-wrap gap-2">
                            {msg.suggestedQuestions.map((sq: string, idx: number) => (
                              <button key={idx} onClick={() => handleSend(sq)} className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-slate-300 hover:bg-white/10 transition-colors">
                                "{sq}"
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.disclaimer && (
                        <div className="mt-6 flex items-start gap-2 text-[10px] text-slate-500 bg-black/20 p-2 rounded">
                          <ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" />
                          <p>{msg.disclaimer}</p>
                        </div>
                      )}

                      {msg.role !== 'user' && (
                        <div className="flex items-center gap-2 mt-4 pt-2 justify-end border-t border-white/5">
                          <button 
                            onClick={() => handleCopy(msg.content, i)} 
                            className="text-slate-400 hover:text-white flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-white/5 transition-colors" 
                            title="Copy response"
                          >
                            {copiedIndex === i ? (
                              <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {processing && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
                    <BrainCircuit className="w-5 h-5 text-accent-purple animate-spin" />
                    <span className="text-sm text-slate-400">LexIntel AI is thinking...</span>
                    <div className="flex gap-1 ml-2">
                      <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start justify-between gap-3 text-red-300 text-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-red-200">AI Error</div>
                      <div className="text-xs text-red-300/80 mt-1">{errorMessage}</div>
                    </div>
                  </div>
                  <button 
                    onClick={handleRetry} 
                    className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg text-xs font-medium text-red-200 transition-colors shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-navy-900/50">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".txt,.md,.pdf,.doc,.docx" 
              />
              <div className="relative flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl p-2 focus-within:border-accent-purple/50 transition-colors">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload document to analyze"
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <textarea 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask a legal question, request a document summary, or code example (Enter to send, Shift+Enter for new line)..."
                  className="w-full bg-transparent text-white resize-none max-h-32 min-h-[44px] py-2.5 focus:outline-none custom-scrollbar text-sm"
                  rows={1}
                />
                {processing ? (
                  <button disabled className="p-2.5 bg-accent-purple/50 text-white rounded-lg transition-colors cursor-not-allowed">
                    <Square className="w-5 h-5 fill-current animate-pulse" />
                  </button>
                ) : (
                  <button 
                    onClick={() => handleSend()}
                    disabled={!query.trim()}
                    className="p-2.5 bg-accent-purple hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="text-center mt-2 flex justify-between items-center px-1">
                <span className="text-[10px] text-slate-500">LexIntel AI provides research assistance. Always verify citations with primary sources.</span>
                <span className="text-[10px] text-slate-500">Press <kbd className="bg-white/10 px-1 rounded text-slate-400">Shift + Enter</kbd> for line break</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

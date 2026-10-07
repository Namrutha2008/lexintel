import React, { useEffect, useState } from 'react';
import { 
  Scale, 
  Search, 
  FileText, 
  BrainCircuit, 
  FolderOpen, 
  Calendar, 
  Clock, 
  Users, 
  Database, 
  Lock, 
  Network, 
  Cpu,
  GraduationCap,
  Briefcase,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import Hero3D from './components/Hero3D';
import LegalResearch from './pages/LegalResearch';
import CaseManagement from './pages/CaseManagement';
import CaseDetails from './pages/CaseDetails';
import AIAssistant from './pages/AIAssistant';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'research' | 'management' | 'caseDetails' | 'ai' | 'about' | 'login' | 'register'>('home');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  
  const [user, setUser] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const cachedUser = localStorage.getItem('lexintel_current_user');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }});
          if (res.ok) {
            setUser(await res.json());
            return;
          }
        } catch (e) {
          // ignore network failure
        }

        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch (e) {
            localStorage.removeItem('token');
            localStorage.removeItem('lexintel_current_user');
          }
        }
      }
    };
    checkAuth();
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigate = (view: any) => {
    const protectedViews = ['research', 'management', 'caseDetails', 'ai'];
    if (protectedViews.includes(view) && !user) {
      setPendingRoute(view);
      setCurrentView('login');
      return;
    }
    setCurrentView(view);
  };

  const handleLoginSuccess = (_token: string, userData: any) => {
    setUser(userData);
    if (pendingRoute) {
      setCurrentView(pendingRoute as any);
      setPendingRoute(null);
    } else {
      if (userData.role === 'Student' || userData.role === 'Legal Researcher') {
        setCurrentView('research');
      } else if (userData.role === 'Lawyer' || userData.role === 'Law Firm') {
        setCurrentView('management');
      } else {
        setCurrentView('home');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('lexintel_current_user');
    setUser(null);
    setShowProfileMenu(false);
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200 selection:bg-accent-blue/30 selection:text-white overflow-hidden">
      
      {/* 1. Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'glass-nav py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-accent-blue to-accent-purple p-2 rounded-lg">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Lex<span className="text-accent-blue">Intel</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => handleNavigate('home')} className="hover:text-white transition-colors text-sm font-medium">Home</button>
            <button onClick={() => handleNavigate('research')} className={`transition-colors text-sm font-medium ${currentView === 'research' ? 'text-accent-blue' : 'hover:text-white'}`}>Legal Research</button>
            <button onClick={() => handleNavigate('management')} className={`transition-colors text-sm font-medium ${currentView === 'management' || currentView === 'caseDetails' ? 'text-accent-blue' : 'hover:text-white'}`}>Case Management</button>
            <button onClick={() => handleNavigate('ai')} className={`transition-colors text-sm font-medium ${currentView === 'ai' ? 'text-accent-purple' : 'hover:text-white'}`}>AI Assistant</button>
            <button onClick={() => handleNavigate('about')} className={`transition-colors text-sm font-medium ${currentView === 'about' ? 'text-accent-blue' : 'hover:text-white'}`}>About</button>
          </div>

          <div className="hidden md:flex items-center gap-4 relative">
            {!user ? (
              <>
                <button onClick={() => handleNavigate('login')} className="px-5 py-2 text-sm font-medium hover:text-white transition-colors">Login</button>
                <button onClick={() => handleNavigate('register')} className="bg-accent-blue hover:bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-accent-blue/20">
                  Register
                </button>
              </>
            ) : (
              <div className="relative">
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue text-xs font-bold uppercase">{user.name.charAt(0)}</div>
                  <span className="text-sm font-medium text-white max-w-[100px] truncate">{user.name}</span>
                </button>
                
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 glass-card rounded-xl border border-white/10 overflow-hidden shadow-xl"
                    >
                      <div className="p-4 border-b border-white/10 bg-white/5">
                        <div className="font-semibold text-white truncate">{user.name}</div>
                        <div className="text-xs text-slate-400 truncate">{user.email}</div>
                        <div className="text-[10px] text-accent-blue uppercase mt-1 font-bold">{user.role}</div>
                      </div>
                      <div className="p-2">
                        <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors">Profile</button>
                        <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors">Logout</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-navy-900 pt-24 px-6 md:hidden glass-nav"
          >
            <div className="flex flex-col gap-6 text-lg">
              <button onClick={() => { handleNavigate('home'); setMobileMenuOpen(false); }} className="text-left">Home</button>
              <button onClick={() => { handleNavigate('research'); setMobileMenuOpen(false); }} className={`text-left ${currentView === 'research' ? 'text-accent-blue' : ''}`}>Legal Research</button>
              <button onClick={() => { handleNavigate('management'); setMobileMenuOpen(false); }} className={`text-left ${currentView === 'management' || currentView === 'caseDetails' ? 'text-accent-blue' : ''}`}>Case Management</button>
              <button onClick={() => { handleNavigate('ai'); setMobileMenuOpen(false); }} className={`text-left ${currentView === 'ai' ? 'text-accent-purple' : ''}`}>AI Assistant</button>
              <button onClick={() => { handleNavigate('about'); setMobileMenuOpen(false); }} className={`text-left ${currentView === 'about' ? 'text-accent-blue' : ''}`}>About</button>
              <hr className="border-white/10" />
              {!user ? (
                <>
                  <button onClick={() => { handleNavigate('login'); setMobileMenuOpen(false); }} className="text-left py-2">Login</button>
                  <button onClick={() => { handleNavigate('register'); setMobileMenuOpen(false); }} className="bg-accent-blue text-white py-3 rounded-xl text-center font-medium">Register</button>
                </>
              ) : (
                <>
                  <div className="py-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue text-sm font-bold uppercase">{user.name.charAt(0)}</div>
                    <div>
                      <div className="text-white font-medium">{user.name}</div>
                      <div className="text-xs text-slate-400">{user.role}</div>
                    </div>
                  </div>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-left text-red-400 py-2">Logout</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentView === 'research' ? (
        <LegalResearch />
      ) : currentView === 'management' ? (
        <CaseManagement onOpenCase={(id) => { setSelectedCaseId(id); handleNavigate('caseDetails'); }} />
      ) : currentView === 'caseDetails' ? (
        <CaseDetails 
          caseId={selectedCaseId} 
          onBack={() => handleNavigate('management')} 
          onNavigateToResearch={() => handleNavigate('research')} 
        />
      ) : currentView === 'ai' ? (
        <AIAssistant caseId={selectedCaseId} />
      ) : currentView === 'about' ? (
        <About onNavigate={handleNavigate} />
      ) : currentView === 'login' ? (
        <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
      ) : currentView === 'register' ? (
        <Register onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
      ) : (
      <main>
        {/* 2. Hero Section */}
        <section id="home" className="pt-32 pb-20 lg:pt-48 lg:pb-32 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-blue/10 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-blue/30 bg-accent-blue/10 text-accent-blue text-sm mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-blue"></span>
                </span>
                LexIntel AI 2.0 Now Available
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 text-white">
                Intelligent Legal <br/>
                <span className="gradient-text">Research & Case Management</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-400 mb-8 max-w-xl leading-relaxed">
                Research smarter, manage cases efficiently, and make better legal decisions with AI-powered insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => handleNavigate('research')} className="bg-white text-navy-900 hover:bg-slate-100 px-8 py-4 rounded-full font-semibold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  Start Research <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => handleNavigate('about')} className="glass-card px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all flex items-center justify-center">
                  Explore Platform
                </button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              {/* 3D Hero Element */}
              <div className="rounded-3xl overflow-hidden glass-card p-1 bg-gradient-to-br from-white/10 to-transparent">
                <div className="bg-navy-900 rounded-[22px] overflow-hidden">
                  <Hero3D />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. AI Legal Research */}
        <section id="research" className="py-24 bg-navy-800 relative">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">AI-Powered <span className="text-accent-blue">Legal Research</span></h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">Harness the power of artificial intelligence to uncover precedents, analyze judgments, and summarize documents in seconds.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Search, title: "Smart Semantic Search", desc: "Search legal cases and judgments using natural language instead of complex boolean queries." },
                { icon: BrainCircuit, title: "Precedent Finder", desc: "Automatically identify relevant precedents and connected cases across jurisdictions." },
                { icon: FileText, title: "Document Summarization", desc: "Condense lengthy legal documents and judgments into concise, actionable summaries." },
                { icon: Network, title: "Section Extraction", desc: "Instantly extract and highlight important legal sections, clauses, and arguments." },
                { icon: Cpu, title: "AI Research Insights", desc: "Generate comprehensive AI-powered research memos and legal insights on demand." }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-8 hover:-translate-y-2 transition-transform duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent-blue/20 flex items-center justify-center mb-6 border border-accent-blue/30">
                    <feature.icon className="text-accent-blue w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Case Management */}
        <section id="management" className="py-24 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/3 h-full bg-accent-purple/5 blur-[100px] pointer-events-none"></div>
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Unified <span className="text-accent-purple">Case Management</span></h2>
                <p className="text-slate-400 text-lg mb-8">Organize your entire practice in one secure platform. Track deadlines, manage client information, and collaborate on documents effortlessly.</p>
                
                <div className="space-y-4">
                  {[
                    { icon: FolderOpen, text: "Centralized Active Cases Dashboard" },
                    { icon: Calendar, text: "Automated Hearing & Deadline Tracking" },
                    { icon: Clock, text: "Smart Time Tracking & Billing" },
                    { icon: Users, text: "Secure Client Portal & Information" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 glass-card">
                      <div className="bg-accent-purple/20 p-2 rounded-lg">
                        <item.icon className="text-accent-purple w-5 h-5" />
                      </div>
                      <span className="text-white font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Dashboard Mockup */}
              <div className="glass-card p-2 bg-gradient-to-tr from-white/10 to-transparent">
                <div className="bg-navy-900 rounded-xl overflow-hidden border border-white/5">
                  <div className="border-b border-white/5 p-4 flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-semibold text-white">Active Cases Overview</h4>
                      <button className="text-xs bg-accent-purple/20 text-accent-purple px-3 py-1 rounded-full">View All</button>
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white/5 p-4 rounded-lg flex justify-between items-center">
                          <div>
                            <div className="text-sm text-slate-400 mb-1">Case #{1040 + i}</div>
                            <div className="text-white font-medium">Smith vs. Global Tech</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-accent-blue bg-accent-blue/10 px-2 py-1 rounded mb-1">Hearing: Tomorrow</div>
                            <div className="text-xs text-slate-500">Updated 2h ago</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. How It Works */}
        <section className="py-24 bg-navy-800">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-16">How It Works</h2>
            
            <div className="grid md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-accent-blue/0 via-accent-blue/50 to-accent-purple/0"></div>
              
              {[
                { step: "01", title: "Research", desc: "Query millions of legal records using natural language.", color: "text-accent-blue", bg: "bg-accent-blue" },
                { step: "02", title: "Analyze", desc: "AI extracts key arguments and summarizes precedents.", color: "text-blue-400", bg: "bg-blue-400" },
                { step: "03", title: "Manage", desc: "Organize findings into cases and track all deadlines.", color: "text-indigo-400", bg: "bg-indigo-400" },
                { step: "04", title: "Decide", desc: "Make informed legal strategies with comprehensive data.", color: "text-accent-purple", bg: "bg-accent-purple" }
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center">
                  <div className={`w-24 h-24 rounded-full glass-card flex items-center justify-center text-2xl font-bold mb-6 ${item.color} border-t border-${item.color}/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Technology / API */}
        <section className="py-24 relative">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Enterprise-Grade Architecture</h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">Built on robust, scalable, and secure technologies to ensure your legal practice runs without interruption.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Database, name: "Legal Database API", provider: "Caselaw Access" },
                { icon: BrainCircuit, name: "AI/NLP API", provider: "OpenAI / Claude" },
                { icon: Lock, name: "Auth & Security", provider: "Enterprise SSO" },
                { icon: FileText, name: "Document Processing", provider: "OCR Engine" }
              ].map((api, i) => (
                <div key={i} className="glass-card p-6 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                  <api.icon className="w-10 h-10 text-slate-300 mb-4" />
                  <h4 className="text-white font-semibold mb-1">{api.name}</h4>
                  <p className="text-xs text-slate-400">{api.provider}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. User Roles */}
        <section className="py-24 bg-navy-800">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-16">Built For Legal Professionals</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-card p-8 border-t-4 border-accent-blue">
                <Briefcase className="w-12 h-12 text-accent-blue mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">Lawyers</h3>
                <p className="text-slate-400">Streamline case preparation, access precedents instantly, and manage your firm's entire workload from a single dashboard.</p>
              </div>
              
              <div className="glass-card p-8 border-t-4 border-indigo-500">
                <GraduationCap className="w-12 h-12 text-indigo-500 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">Law Students</h3>
                <p className="text-slate-400">Accelerate your learning curve with AI-summarized judgments, complex case breakdowns, and intelligent study tools.</p>
              </div>
              
              <div className="glass-card p-8 border-t-4 border-accent-purple">
                <Search className="w-12 h-12 text-accent-purple mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">Legal Researchers</h3>
                <p className="text-slate-400">Perform exhaustive cross-jurisdictional research in minutes, extract insights automatically, and generate comprehensive memos.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Statistics */}
        <section className="py-20 relative">
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
              {[
                { value: "10M+", label: "Legal Documents" },
                { value: "50K+", label: "Cases Analyzed" },
                { value: "95%", label: "Faster Research" },
                { value: "24/7", label: "AI Assistance" }
              ].map((stat, i) => (
                <div key={i} className="text-center px-4">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">{stat.value}</div>
                  <div className="text-accent-blue text-sm uppercase tracking-wider font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Final CTA */}
        <section className="py-24 bg-gradient-to-b from-navy-900 to-navy-800">
          <div className="container mx-auto px-6">
            <div className="glass-card p-12 md:p-20 text-center relative overflow-hidden bg-gradient-to-br from-accent-blue/10 to-accent-purple/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/20 rounded-full blur-[80px]"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-purple/20 rounded-full blur-[80px]"></div>
              
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 relative z-10">
                Transform the Way You Work With <span className="gradient-text">Legal Information</span>
              </h2>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto relative z-10">
                Join thousands of legal professionals who have already upgraded their practice with LexIntel's AI-powered platform.
              </p>
              <button onClick={() => handleNavigate('research')} className="bg-white text-navy-900 hover:bg-slate-100 px-10 py-5 rounded-full font-bold text-lg transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] relative z-10">
                Get Started Today
              </button>
            </div>
          </div>
        </section>
      </main>
      )}

      {/* 10. Footer */}
      <footer className="bg-black/40 border-t border-white/5 pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <Scale className="w-6 h-6 text-accent-blue" />
                <span className="text-2xl font-bold text-white">LexIntel</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Empowering legal professionals with intelligent tools for research, analysis, and case management.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6">Platform</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-accent-blue transition-colors">Legal Research</a></li>
                <li><a href="#" className="hover:text-accent-blue transition-colors">Case Management</a></li>
                <li><a href="#" className="hover:text-accent-blue transition-colors">AI Assistant</a></li>
                <li><a href="#" className="hover:text-accent-blue transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-accent-blue transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-accent-blue transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-accent-blue transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-accent-blue transition-colors">Webinars</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6">Company</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-accent-blue transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-accent-blue transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-accent-blue transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-accent-blue transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} LexIntel Technologies. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

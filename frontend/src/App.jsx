import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import LoginPage from './pages/LoginPage';
import { 
  IconSearch, IconRobot, IconUser, IconDatabase, IconSparkles, 
  IconUpload, IconLogout, IconFiles, IconX, IconArrowRight,
  IconBrain, IconShieldLock, IconBolt, IconMenu2, IconSun, IconMoon
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './components/FileUpload';
import DocumentList from './components/DocumentList';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
        <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return <LoginPage />;

  return (
    <div className={theme}>
       <MainLayout session={session} theme={theme} setTheme={setTheme} />
    </div>
  );
}

function MainLayout({ session, theme, setTheme }) {
  const [view, setView] = useState('home'); // 'home' or 'chat'

  return (
    <div className="min-h-screen bg-mesh font-sans antialiased text-neutral-100 dark:text-neutral-100 light:text-slate-900 transition-colors duration-300">
      <AnimatePresence mode="wait">
        {view === 'home' ? (
          <Home 
            key="home" 
            onStart={() => setView('chat')} 
            onSignOut={() => supabase.auth.signOut()} 
            user={session.user} 
            theme={theme}
            setTheme={setTheme}
          />
        ) : (
          <Dashboard 
            key="dashboard" 
            session={session} 
            onBack={() => setView('home')} 
            theme={theme}
            setTheme={setTheme}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ThemeToggle({ theme, setTheme }) {
  return (
    <button 
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2.5 rounded-xl border border-current opacity-40 hover:opacity-100 transition-all cursor-pointer"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
    >
      {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
    </button>
  );
}

function Home({ onStart, onSignOut, user, theme, setTheme }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex flex-col relative"
    >
      {/* Home Nav */}
      <nav className="fixed top-0 w-full z-50 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="p-2 bg-blue-600/10 rounded-xl border border-blue-600/20 group-hover:bg-blue-600/20 transition-all">
            <IconDatabase size={20} className="text-blue-500" />
          </div>
          <span className={`font-bold text-xl tracking-tight uppercase italic ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Studio</span>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <span className="text-sm font-medium opacity-50 hidden md:block">{user.email}</span>
          <button onClick={onSignOut} className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 opacity-40 hover:opacity-100 transition-all cursor-pointer">
            <IconLogout size={18} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20">
        <div className="max-w-4xl w-full text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/10 text-blue-500 text-[11px] font-bold uppercase tracking-[0.2em]"
          >
            <IconSparkles size={14} /> Enterprise Intelligence
          </motion.div>
          
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: { staggerChildren: 0.1, delayChildren: 0.3 }
              }
            }}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <motion.h1 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className={`text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
            >
              Talk to your <br />
              <span className="text-gradient-primary italic underline decoration-blue-500/30">Documents.</span>
            </motion.h1>

            <motion.p 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className={`text-lg md:text-xl max-w-xl mx-auto leading-relaxed font-medium ${theme === 'dark' ? 'text-neutral-500' : 'text-slate-500'}`}
            >
              The ultimate Knowledge Retrieval System. High-speed vector search, multi-model AI, and secure cloud storage.
            </motion.p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
          >
            <button 
              onClick={onStart}
              className={`px-10 py-5 rounded-2xl font-extrabold transition-all shadow-2xl flex items-center gap-3 group cursor-pointer ${
                theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              Open Studio <IconArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
            </button>
          </motion.div>

          {/* Features */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-24"
          >
            {[
              { icon: <IconBrain size={22} />, title: "3072D Vectors", desc: "Ultra-precise semantic matching with Gemini Pro." },
              { icon: <IconShieldLock size={22} />, title: "Row Level Security", desc: "Your files never leave your private workspace." },
              { icon: <IconBolt size={22} />, title: "Async Engine", desc: "Parallel processing for large document libraries." }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-[2.5rem] glass text-left space-y-4 transition-all group shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-current/5 border border-current/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-inner">
                  {f.icon}
                </div>
                <div>
                  <h3 className={`font-bold text-lg mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{f.title}</h3>
                  <p className={`text-sm leading-relaxed font-medium ${theme === 'dark' ? 'text-neutral-500' : 'text-slate-500'}`}>{f.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      <footer className="py-12 text-center">
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="w-8 h-[1px] bg-current opacity-10"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20">Enterprise RAG Studio &copy; 2026</span>
          <div className="w-8 h-[1px] bg-current opacity-10"></div>
        </div>
      </footer>
    </motion.div>
  );
}

function Dashboard({ session, onBack, theme, setTheme }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [refreshDocs, setRefreshDocs] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setQuery('');
    setIsLoading(true);

    fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ query: query, top_k: 5 })
    })
      .then(res => {
        if (!res.ok) throw new Error('Search failed');
        return res.json();
      })
      .then(data => {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: data.answer,
            citations: data.citations
          }
        ]);
      })
      .catch(err => {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: `Error: ${err.message}. Make sure you have uploaded documents first.` }
        ]);
      })
      .finally(() => setIsLoading(false));
  };

  const user = session.user;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen flex flex-col relative"
    >
      
      {/* Drawer Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={() => setShowSidebar(false)}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className={`fixed left-0 top-0 bottom-0 w-[340px] z-50 border-r border-current/5 flex flex-col shadow-2xl transition-colors duration-300 ${
                theme === 'dark' ? 'bg-neutral-900' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between p-7 border-b border-current/5">
                <div className="flex items-center gap-3">
                  <IconFiles size={20} className="text-blue-500" />
                  <h2 className="text-sm font-black uppercase tracking-widest">Library</h2>
                </div>
                <button onClick={() => setShowSidebar(false)} className="p-2 rounded-full hover:bg-current/5 transition-colors cursor-pointer opacity-50">
                  <IconX size={20} />
                </button>
              </div>

              <div className="p-7">
                <FileUpload session={session} onUploadComplete={() => setRefreshDocs(r => r + 1)} />
              </div>

              <div className="flex-1 overflow-y-auto p-7 px-4 pt-0">
                <DocumentList session={session} refreshTrigger={refreshDocs} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* FIXED Top Header */}
      <header className={`sticky top-0 w-full z-10 px-8 py-4 glass border-b border-current/5 flex items-center justify-between`}>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowSidebar(true)}
              className="group flex items-center gap-3 px-4 py-2 rounded-2xl bg-current/5 border border-current/5 hover:bg-current/10 transition-all cursor-pointer shadow-inner"
            >
              <IconMenu2 size={18} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-wider">Upload Library</span>
            </button>
            <div className="h-6 w-[1px] bg-current opacity-5"></div>
            <button 
              onClick={onBack}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="p-1.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-all">
                <IconDatabase size={18} className="text-blue-500" />
              </div>
              <span className="font-bold text-sm tracking-tight opacity-70 group-hover:opacity-100 transition-colors">Enterprise Studio</span>
            </button>
          </div>

          <div className="flex items-center gap-5">
             <ThemeToggle theme={theme} setTheme={setTheme} />
             <div className="w-9 h-9 rounded-2xl bg-current/5 border border-current/5 overflow-hidden shadow-inner flex items-center justify-center">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <IconUser size={20} className="opacity-20" />
                )}
             </div>
          </div>
      </header>

      {/* SCROLLABLE Conversation Area */}
      <main className="flex-1 overflow-y-auto px-8 py-12">
          <div className="max-w-4xl mx-auto pb-48">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full"></div>
                  <div className="relative animate-float w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 border border-white/20">
                    <IconSparkles size={40} className="text-white" />
                  </div>
                </div>
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ staggerChildren: 0.2 }}
                  className="space-y-2"
                >
                  <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-black tracking-tighter"
                  >
                    How can I assist you today?
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="opacity-40 max-w-sm mx-auto text-sm font-medium leading-relaxed"
                  >
                    Query your indexed documents. I'll search your library and provide expert insights instantly.
                  </motion.p>
                </motion.div>
                <button
                  onClick={() => setShowSidebar(true)}
                  className="px-6 py-3 rounded-2xl bg-current/5 border border-current/5 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-current/10 transition-all cursor-pointer"
                >
                  Manage Context Library
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                {messages.map((msg, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx}
                    className={`flex gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-12 h-12 rounded-[1.25rem] bg-blue-600/10 border border-blue-600/10 flex items-center justify-center shrink-0 mt-1">
                        <IconRobot size={24} className="text-blue-500" />
                      </div>
                    )}

                    <div className={`flex flex-col gap-4 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-7 py-5 rounded-[2.5rem] text-[15.5px] leading-[1.6] whitespace-pre-wrap shadow-xl ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-[5px] font-medium'
                          : 'glass rounded-tl-[5px] font-medium'
                      }`}>
                        {msg.content}
                      </div>

                      {msg.citations && msg.citations.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-2 px-2 opacity-30 text-[9px] font-black uppercase tracking-[0.2em]">
                            <IconShieldCheck size={12} /> Source Intelligence
                          </div>
                          <div className="flex flex-wrap gap-3 px-2">
                            {msg.citations.map((cite, i) => (
                              <motion.div 
                                key={i} 
                                whileHover={{ y: -2 }}
                                className="group relative"
                              >
                                <div className="flex flex-col gap-1.5 px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer min-w-[180px]">
                                  <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:bg-emerald-500"></span>
                                    <span className="text-[10px] font-black text-white uppercase tracking-wider truncate max-w-[140px]">{cite.title}</span>
                                  </div>
                                  
                                  <div className="flex flex-col gap-0.5">
                                    <div className="text-[9px] font-bold text-neutral-500 flex items-center gap-1.5">
                                      <IconBolt size={10} className="text-emerald-500/50" />
                                      {cite.created_at ? new Date(cite.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "History Unknown"}
                                    </div>
                                    <div className="text-[8px] font-black text-blue-500/40 uppercase tracking-[0.1em] group-hover:text-emerald-500/60 transition-colors">
                                      {cite.source_type || "Document"} Insight &rsaquo;
                                    </div>
                                  </div>

                                  {/* Hover Detail Tooltip */}
                                  <div className="absolute bottom-full left-0 mb-3 w-64 p-4 glass-card rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20 translate-y-2 group-hover:translate-y-0 shadow-2xl">
                                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                      <IconSparkles size={12} /> Context History
                                    </p>
                                    <p className="text-[11px] text-neutral-400 leading-relaxed italic">
                                      This story was indexed on {cite.created_at ? new Date(cite.created_at).toLocaleTimeString() : "an unknown date"}. 
                                      {cite.metadata?.original_filename && ` Original file: ${cite.metadata.original_filename}.`}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-6 animate-pulse mt-10"
              >
                <div className="w-12 h-12 rounded-[1.25rem] bg-blue-600/10 border border-blue-600/10 flex items-center justify-center shrink-0 mt-1">
                  <IconDatabase size={22} className="text-blue-500" />
                </div>
                <div className="flex items-center gap-3 px-6 py-5 opacity-20 text-sm font-black uppercase tracking-[0.2em] italic">
                  Search active...
                </div>
              </motion.div>
            )}
          </div>
      </main>

      {/* STICKY Bottom Input Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-10 bg-gradient-to-t from-current/5 via-current/0 to-transparent pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <form
              onSubmit={handleSubmit}
              className={`flex items-center gap-3 p-1.5 rounded-[2.5rem] border border-current/5 shadow-2xl transition-all duration-300 ${
                theme === 'dark' ? 'bg-neutral-900 border-white/5 shadow-black/50' : 'bg-white border-black/5 shadow-slate-200'
              }`}
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me anything..."
                className={`flex-1 bg-transparent border-none outline-none py-3 px-6 placeholder:opacity-30 font-medium text-base ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className={`p-3 rounded-full transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center shrink-0 ${
                  theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <IconSearch size={22} stroke={3} />
              </button>
            </form>
          </div>
        </div>
    </motion.div>
  );
}

export default App;

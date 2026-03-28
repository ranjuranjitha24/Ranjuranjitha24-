import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  IconMail, IconLock, IconDatabase, IconSparkles, 
  IconLoader2, IconBrandGoogle, IconArrowRight, IconShieldCheck
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [method, setMethod] = useState('google'); // 'google' or 'email'

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Registration successful! Please verify your email.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center px-4 font-sans antialiased text-slate-100 transition-colors duration-700">
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Logo/Branding */}
        <div className="text-center mb-10 space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-blue-600 shadow-2xl shadow-emerald-500/20 mb-2 border border-white/10"
          >
            <IconSparkles size={40} className="text-white animate-pulse" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white">Studio</h1>
            <p className="text-emerald-500/80 text-[10px] font-black uppercase tracking-[0.4em] mt-1 ml-1">Enterprise Intelligence</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] p-10 relative overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
          {/* Subtle Glow Overlay */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="space-y-1 mb-8">
              <h2 className="text-2xl font-black tracking-tight text-white">Secure Access</h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Unlock your private knowledge studio with enterprise-grade security.
              </p>
            </div>

            {/* Method Toggles */}
            <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl mb-8">
              <button 
                onClick={() => setMethod('google')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  method === 'google' ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <IconBrandGoogle size={14} /> Google
              </button>
              <button 
                onClick={() => setMethod('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  method === 'email' ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <IconMail size={14} /> Mail
              </button>
            </div>

            <AnimatePresence mode="wait">
              {method === 'google' ? (
                <motion.div
                  key="google"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="space-y-6 py-2"
                >
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-4 px-6 py-5 rounded-[1.5rem] bg-slate-50 text-slate-950 font-black text-sm hover:bg-white transition-all shadow-xl active:scale-[0.98] group cursor-pointer"
                  >
                    {loading ? <IconLoader2 size={24} className="animate-spin" /> : <IconBrandGoogle size={24} />}
                    Continue with Google
                    <IconArrowRight size={18} className="opacity-20 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                  </button>
                  <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                    By confirming, you authorize access <br /> to your secure workspace.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="email"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  onSubmit={handleSignIn}
                  className="space-y-5"
                >
                  <div className="space-y-3">
                    <div className="group relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                        <IconMail size={20} />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all font-medium text-sm"
                        placeholder="Work Email"
                      />
                    </div>

                    <div className="group relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                        <IconLock size={20} />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all font-medium text-sm"
                        placeholder="Security Pin"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider"
                    >
                      {error}
                    </motion.div>
                  )}

                  {message && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider"
                    >
                      {message}
                    </motion.div>
                  )}

                  <div className="flex gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-slate-50 text-slate-950 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 cursor-pointer shadow-lg active:scale-95"
                    >
                      {loading ? <IconLoader2 size={16} className="animate-spin" /> : null}
                      Access Studio
                    </button>
                    
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleSignUp}
                      className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-slate-100 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Initialize
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-10 pt-8 border-t border-white/5">
              <div className="flex items-center justify-center gap-3 text-slate-600 text-[9px] font-black uppercase tracking-[0.3em]">
                <IconShieldCheck size={14} className="text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                <span>Encrypted • Session Only</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Decorative Aurora Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[160px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[140px]"></div>
      </div>
    </div>
  );
}

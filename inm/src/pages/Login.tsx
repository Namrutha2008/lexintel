import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login({ 
  onNavigate, 
  onLoginSuccess 
}: { 
  onNavigate: (view: string) => void,
  onLoginSuccess: (token: string, user: any) => void
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.trim() || !password) {
      setError('Invalid email or password.');
      return;
    }

    setLoading(true);
    const normEmail = email.trim().toLowerCase();

    try {
      let isSuccess = false;
      let token = '';
      let user: any = null;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ email: normEmail, password })
        });
        
        const rawText = await res.text();
        let data: any = {};
        if (rawText) {
          try {
            data = JSON.parse(rawText);
          } catch (jsonErr) {
            console.error("Non-JSON login response");
          }
        }
        
        if (res.ok && data.success !== false && data.token && data.user) {
          isSuccess = true;
          token = data.token;
          user = data.user;
        } else if (data.message === 'Invalid email or password.' || data.error === 'Invalid email or password.') {
          throw new Error('Invalid email or password.');
        }
      } catch (backendErr: any) {
        if (backendErr.message === 'Invalid email or password.') {
          throw backendErr;
        }
        console.warn("Backend unavailable. Falling back to DEMO AUTH in-memory/localStorage:", backendErr);
      }

      if (!isSuccess) {
        // Check demo users from localStorage
        const demoUsersRaw = localStorage.getItem('lexintel_demo_users');
        const demoUsers = demoUsersRaw ? JSON.parse(demoUsersRaw) : [];

        // Also add auto demo account if matching prompt requirement
        if (normEmail === 'namruthasivaji2802@gmail.com') {
          user = {
            id: 'usr_namrutha',
            name: 'Namrutha A S',
            email: 'namruthasivaji2802@gmail.com',
            role: 'Student'
          };
          token = `demo_token_${Date.now()}`;
          isSuccess = true;
        } else {
          const found = demoUsers.find((u: any) => u.email.toLowerCase() === normEmail && u.password === password);
          if (found) {
            user = { id: found.id, name: found.name, email: found.email, role: found.role };
            token = `demo_token_${Date.now()}`;
            isSuccess = true;
          }
        }
      }

      if (isSuccess && user && token) {
        localStorage.setItem('token', token);
        localStorage.setItem('lexintel_current_user', JSON.stringify(user));
        onLoginSuccess(token, user);
      } else {
        throw new Error('Invalid email or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-6 pt-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 to-transparent z-0"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 rounded-2xl border border-white/10 relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-accent-blue" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white text-center mb-2">Welcome Back</h2>
        <p className="text-slate-400 text-center text-sm mb-8">Sign in to your LexIntel account to continue.</p>

        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="email" 
                value={email}
                onChange={e => { setEmail(e.target.value); if(error) setError(''); }}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-accent-blue transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={e => { setPassword(e.target.value); if(error) setError(''); }}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:border-accent-blue transition-colors"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded bg-white/5 border-white/10 text-accent-blue focus:ring-0" />
              <span className="text-sm text-slate-400">Remember me</span>
            </label>
            <a href="#" className="text-sm text-accent-blue hover:text-blue-400">Forgot password?</a>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-accent-blue hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <button onClick={() => onNavigate('register')} className="text-accent-blue hover:text-white font-medium transition-colors">
            Register here
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, User, Shield, Briefcase, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register({ 
  onNavigate,
  onLoginSuccess
}: { 
  onNavigate: (view: string) => void,
  onLoginSuccess: (token: string, user: any) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Lawyer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    if (!formData.name || !formData.name.trim()) {
      setError("Please enter your name.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email.");
      return false;
    }

    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    const newUserObj = {
      id: `usr_${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role
    };

    try {
      let isSuccess = false;
      let token = '';
      let user = newUserObj;

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role: formData.role
          })
        });

        const rawText = await res.text();
        let data: any = {};
        if (rawText) {
          try {
            data = JSON.parse(rawText);
          } catch (parseErr) {
            console.error("Non-JSON API response received:", rawText);
          }
        }

        if (res.ok && data.success !== false) {
          isSuccess = true;
          token = data.token;
          user = data.user || user;
        } else if (data.message === "Email already exists" || data.error === "Email already exists") {
          throw new Error("Email already exists");
        }
      } catch (backendErr: any) {
        if (backendErr.message === "Email already exists") {
          throw backendErr;
        }
        console.warn("Backend unavailable or returned error. Falling back to Demo Auth mode:", backendErr);
      }

      // If backend was not reached or returned non-fatal error, use local DEMO AUTH
      if (!isSuccess) {
        // Save to demo users in localStorage
        const existingDemoUsersRaw = localStorage.getItem('lexintel_demo_users');
        const demoUsers = existingDemoUsersRaw ? JSON.parse(existingDemoUsersRaw) : [];
        
        const existing = demoUsers.find((u: any) => u.email.toLowerCase() === newUserObj.email);
        if (existing) {
          throw new Error("Email already exists");
        }

        demoUsers.push(newUserObj);
        localStorage.setItem('lexintel_demo_users', JSON.stringify(demoUsers));

        token = `demo_token_${Date.now()}`;
        user = { id: newUserObj.id, name: newUserObj.name, email: newUserObj.email, role: newUserObj.role };
      }

      setSuccess("Account created successfully!");
      localStorage.setItem('token', token);
      localStorage.setItem('lexintel_current_user', JSON.stringify(user));

      setTimeout(() => {
        onLoginSuccess(token, user);
      }, 1000);

    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-6 pt-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 to-transparent z-0"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass-card p-8 rounded-2xl border border-white/10 relative z-10"
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <User className="w-8 h-8 text-accent-purple" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white text-center mb-2">Create an Account</h2>
        <p className="text-slate-400 text-center text-sm mb-6">Join LexIntel to supercharge your legal research.</p>

        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm rounded-xl text-center font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-accent-purple transition-colors"
                placeholder="Namrutha A S"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-accent-purple transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-9 text-white text-sm focus:outline-none focus:border-accent-purple transition-colors"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Confirm</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-9 text-white text-sm focus:outline-none focus:border-accent-purple transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Your Role</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <select 
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-navy-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-accent-purple transition-colors appearance-none"
              >
                <option value="Student">Student</option>
                <option value="Lawyer">Lawyer</option>
                <option value="Legal Researcher">Legal Researcher</option>
                <option value="Law Firm">Law Firm</option>
              </select>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input type="checkbox" required className="mt-1 rounded bg-white/5 border-white/10 text-accent-purple focus:ring-0" />
            <span className="text-xs text-slate-400">I agree to the <a href="#" className="text-accent-purple hover:text-purple-400">Terms of Service</a> and <a href="#" className="text-accent-purple hover:text-purple-400">Privacy Policy</a>.</span>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 mt-4 bg-accent-purple hover:bg-purple-600 text-white rounded-xl font-medium transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Creating Account...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-accent-purple hover:text-white font-medium transition-colors">
            Login here
          </button>
        </div>
      </motion.div>
    </div>
  );
}

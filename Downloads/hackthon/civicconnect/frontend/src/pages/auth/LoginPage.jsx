import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Brain, Map, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const PERKS = [
  { icon: Brain, text: 'AI-powered complaint analysis' },
  { icon: Map,   text: 'Geographic hotspot detection' },
  { icon: CheckCircle, text: 'Real-time resolution tracking' },
];

export default function LoginPage() {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.full_name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-gradient-hero relative overflow-hidden p-10">
        <div className="absolute inset-0 hero-dots" />
        <motion.div animate={{ scale:[1,1.1,1], opacity:[0.2,0.35,0.2] }} transition={{ duration:8, repeat:Infinity }}
          className="absolute top-0 right-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Shield className="w-4.5 h-4.5 text-secondary" style={{width:'18px',height:'18px'}} />
            </div>
            <span className="font-black text-white text-lg tracking-tight">CivicConnect</span>
          </Link>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-black text-white mb-2 leading-tight">Transform civic<br />complaints into action.</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8">AI-powered platform for modern civic complaint management.</p>
          <div className="space-y-3">
            {PERKS.map((p, i) => (
              <motion.div key={i} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.3 + i*0.1 }}
                className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-xl px-4 py-3">
                <div className="w-7 h-7 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-3.5 h-3.5 text-secondary" />
                </div>
                <span className="text-white/70 text-sm font-medium">{p.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative text-white/25 text-xs">© 2024 CivicConnect · Hackathon Project</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-civic-bg p-6">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45 }}
          className="w-full max-w-sm">

          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-primary">CivicConnect</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-primary tracking-tight mb-1">Welcome back</h1>
            <p className="text-slate-500 text-sm">Sign in to your account to continue</p>
          </div>

          <div className="card shadow-float">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" placeholder="you@example.com" value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    className="input-field pl-10" required />
                </div>
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={show ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    className="input-field pl-10 pr-10" required />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full py-3 text-sm mt-2">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-secondary font-semibold hover:text-secondary-dark transition-colors">
                Create one free
              </Link>
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-700 font-semibold mb-0.5">Demo Note</p>
            <p className="text-xs text-blue-600 leading-relaxed">Register as a citizen, or ask your system admin for admin credentials.</p>
          </div>

          <p className="text-center mt-6">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">← Back to home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const BENEFITS = [
  'Free citizen account — no credit card required',
  'Submit and track unlimited complaints',
  'AI-powered analysis on every submission',
  'Real-time department assignment updates',
];

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) return toast.error('Please fill all required fields');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register({ email: form.email, password: form.password, full_name: form.full_name, phone: form.phone });
      setDone(true);
      toast.success('Account created! You can now log in.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-civic-bg flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card shadow-float max-w-md w-full text-center py-12">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-black text-primary mb-2">You're all set!</h2>
          <p className="text-slate-500 text-sm mb-6">Your account has been created. Sign in to start reporting.</p>
          <Link to="/login" className="btn-primary inline-flex">Go to Sign In <ArrowRight className="w-4 h-4" /></Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-gradient-hero relative overflow-hidden p-10">
        <div className="absolute inset-0 hero-dots" />
        <motion.div animate={{ scale:[1,1.1,1], opacity:[0.2,0.35,0.2] }} transition={{ duration:8, repeat:Infinity }}
          className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Shield className="text-secondary" style={{width:'18px',height:'18px'}} />
            </div>
            <span className="font-black text-white text-lg tracking-tight">CivicConnect</span>
          </Link>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-secondary/20 border border-secondary/30 rounded-full px-3 py-1 text-xs font-bold text-secondary mb-5">
            <Zap className="w-3 h-3" /> Free · No credit card needed
          </div>
          <h2 className="text-3xl font-black text-white mb-2 leading-tight">Join thousands<br />making cities better.</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8">Your voice matters. Report, track, and hold local government accountable.</p>
          <div className="space-y-2.5">
            {BENEFITS.map((b, i) => (
              <motion.div key={i} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.3 + i*0.1 }}
                className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-secondary" />
                </div>
                <span className="text-white/65 text-sm">{b}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative text-white/25 text-xs">© 2024 CivicConnect · Hackathon Project</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-civic-bg p-6 overflow-y-auto">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45 }}
          className="w-full max-w-sm py-4">

          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-primary">CivicConnect</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-primary tracking-tight mb-1">Create your account</h1>
            <p className="text-slate-500 text-sm">Register as a citizen — takes 30 seconds</p>
          </div>

          <div className="card shadow-float">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Your full name" value={form.full_name}
                    onChange={e => setForm({...form, full_name: e.target.value})}
                    className="input-field pl-10" required />
                </div>
              </div>

              <div>
                <label className="form-label">Email address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" placeholder="you@example.com" value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    className="input-field pl-10" required />
                </div>
              </div>

              <div>
                <label className="form-label">Phone <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="tel" placeholder="+91 9XXXXXXXXX" value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    className="input-field pl-10" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={show ? 'text' : 'password'} placeholder="Min 6 chars" value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})}
                      className="input-field pl-10 pr-9" required />
                    <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label">Confirm *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" placeholder="Repeat" value={form.confirm}
                      onChange={e => setForm({...form, confirm: e.target.value})}
                      className="input-field pl-10" required />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm mt-1">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-secondary font-semibold hover:text-secondary-dark transition-colors">Sign in</Link>
            </div>
          </div>

          <p className="text-center mt-6">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">← Back to home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

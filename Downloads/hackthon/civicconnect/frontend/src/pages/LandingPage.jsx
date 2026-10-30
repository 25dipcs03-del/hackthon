import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Shield, ArrowRight, CheckCircle, Map, Brain, Zap, Users,
  ChevronRight, Menu, X, AlertTriangle, Droplets, Lightbulb,
  Trash2, Waves, Construction, Star, TrendingUp, Activity,
  Clock, BarChart2, Lock, Globe
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'How It Works', href: '#how' },
  { label: 'Features', href: '#features' },
  { label: 'Categories', href: '#categories' },
];

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Analysis', desc: 'Gemini AI categorizes, prioritizes and summarizes every complaint with explainable reasoning in seconds.', color: 'bg-violet-50 text-violet-600' },
  { icon: Map, title: 'Geographic Hotspots', desc: 'Interactive map clusters complaints to reveal recurring problem areas and infrastructure hotspots.', color: 'bg-teal-50 text-teal-600' },
  { icon: Zap, title: 'Real-time Tracking', desc: 'Citizens track their complaints through every step — from submission to resolution with live status.', color: 'bg-amber-50 text-amber-600' },
  { icon: Shield, title: 'Duplicate Detection', desc: 'AI detects similar complaints using text similarity and geographic proximity, preventing redundant work.', color: 'bg-blue-50 text-blue-600' },
  { icon: Users, title: 'Department Routing', desc: 'AI suggests the right department and administrators assign and track accountability end-to-end.', color: 'bg-indigo-50 text-indigo-600' },
  { icon: CheckCircle, title: 'Resolution Workflow', desc: 'Structured 5-stage workflow from Submitted → Under Review → Assigned → In Progress → Resolved.', color: 'bg-emerald-50 text-emerald-600' },
];

const CATEGORIES = [
  { icon: Construction, label: 'Road Damage',       color: 'from-red-500 to-rose-600',    bg: 'bg-red-50' },
  { icon: Waves,        label: 'Waterlogging',       color: 'from-blue-500 to-cyan-600',   bg: 'bg-blue-50' },
  { icon: Trash2,       label: 'Garbage Overflow',   color: 'from-green-500 to-emerald-600', bg: 'bg-green-50' },
  { icon: Lightbulb,    label: 'Streetlight Failure',color: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-50' },
  { icon: Droplets,     label: 'Drainage Problem',   color: 'from-cyan-500 to-teal-600',   bg: 'bg-cyan-50' },
  { icon: AlertTriangle,label: 'Water Supply',       color: 'from-orange-500 to-red-500',  bg: 'bg-orange-50' },
];

const STEPS = [
  { n: '01', icon: Activity,  title: 'Report an Issue',   desc: 'Fill a simple form with complaint details, location pin, and photo. Takes under 1 minute.' },
  { n: '02', icon: Brain,     title: 'AI Understanding',  desc: 'Gemini AI analyzes your complaint, assigns priority and suggests the responsible department.' },
  { n: '03', icon: Users,     title: 'Admin Action',      desc: 'City administrators review, assign to departments and update status in real time.' },
  { n: '04', icon: CheckCircle, title: 'Resolution',      desc: 'Complaint resolved, citizens notified and resolution documented for accountability.' },
];

const STATS = [
  { value: '40+', label: 'Demo Complaints',   icon: BarChart2 },
  { value: '6',   label: 'Departments',       icon: Users },
  { value: 'AI',  label: 'Powered Analysis',  icon: Brain },
  { value: '5',   label: 'Status Stages',     icon: TrendingUp },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
};

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ── Navigation ─────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'}`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className={`font-black text-lg tracking-tight transition-colors ${scrolled ? 'text-primary' : 'text-white'}`}>
              CivicConnect
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-primary hover:bg-slate-50' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${scrolled ? 'text-primary hover:bg-primary/5' : 'text-white/90 hover:text-white'}`}>
              Sign In
            </Link>
            <Link to="/register" className="btn-secondary text-sm py-2 px-5 shadow-md hover:shadow-lg">
              Get Started
            </Link>
          </div>

          <button className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className={`w-5 h-5 ${scrolled ? 'text-slate-700' : 'text-white'}`} /> : <Menu className={`w-5 h-5 ${scrolled ? 'text-slate-700' : 'text-white'}`} />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-1">
              {NAV_LINKS.map(l => (
                <a key={l.label} href={l.href} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary" onClick={() => setMenuOpen(false)}>
                  {l.label}
                </a>
              ))}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <Link to="/login" className="btn-ghost w-full justify-center">Sign In</Link>
                <Link to="/register" className="btn-primary w-full">Get Started Free</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-hero">
        {/* Animated dots pattern */}
        <div className="absolute inset-0 hero-dots opacity-100" />

        {/* Floating blobs */}
        <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
        <motion.div animate={{ scale: [1.08, 1, 1.08], opacity: [0.2, 0.35, 0.2] }} transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse-slow" />
              AI-Powered Civic Platform · Hackathon 2024
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.0] mb-5">
              From
              <br />
              <span className="gradient-text">Complaints</span>
              <br />
              to Action
            </motion.h1>

            <motion.p variants={itemVariants} className="text-white/65 text-lg leading-relaxed mb-8 max-w-md">
              Report. Prioritize. Resolve. Together.<br />
              AI transforms scattered civic issues into trackable, prioritized actions.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mb-12">
              <Link to="/register" className="flex items-center gap-2 bg-secondary hover:bg-secondary-dark text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95">
                Report an Issue <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/track" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all backdrop-blur-sm">
                Track Complaint
              </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-4 gap-4">
              {STATS.map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div className="text-white/45 text-xs mt-0.5 leading-tight">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — live feed card */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:block">
            <div className="glass-card p-6 border-white/15">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Live Complaint Feed</span>
                </div>
                <span className="text-white/30 text-xs">Real-time</span>
              </div>

              <div className="space-y-2.5 mb-5">
                {[
                  { cat: 'Road Damage',   loc: 'MG Road, Bengaluru',      pri: 'Critical', dot: 'bg-red-400',    delay: 0.5 },
                  { cat: 'Waterlogging',  loc: 'Silk Board Junction',      pri: 'High',     dot: 'bg-orange-400', delay: 0.65 },
                  { cat: 'Streetlight',   loc: 'Outer Ring Road',          pri: 'High',     dot: 'bg-orange-400', delay: 0.8 },
                  { cat: 'Garbage',       loc: 'Gandhi Nagar Market',      pri: 'Medium',   dot: 'bg-amber-400',  delay: 0.95 },
                  { cat: 'Sewage',        loc: 'Residential Block 7, Delhi', pri: 'Critical', dot: 'bg-red-400', delay: 1.1 },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: item.delay }}
                    className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl p-3 hover:bg-white/10 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-semibold truncate">{item.cat}</div>
                      <div className="text-white/35 text-xs truncate mt-0.5">{item.loc}</div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0
                      ${item.pri === 'Critical' ? 'bg-red-500/20 text-red-300' : item.pri === 'High' ? 'bg-orange-500/20 text-orange-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {item.pri}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* AI status bar */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white/80 text-xs font-semibold">AI analyzing 3 new reports...</div>
                  <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-teal rounded-full"
                      initial={{ width: '20%' }} animate={{ width: '75%' }} transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-1.5 text-white/40 text-xs font-medium">
            <span>Scroll</span>
            <ChevronRight className="w-3 h-3 rotate-90" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats bar ──────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
          {[
            { label: 'Complaint Categories', value: '7 types', icon: BarChart2 },
            { label: 'AI Priority Levels',   value: '4 levels', icon: Zap },
            { label: 'Resolution Stages',    value: '5 stages', icon: TrendingUp },
            { label: 'Security',             value: 'Role-based', icon: Lock },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="flex items-center gap-3 px-6 first:pl-0 last:pr-0 py-1">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-base font-black text-primary">{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────── */}
      <section id="how" className="py-24 bg-civic-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4">
              Process
            </div>
            <h2 className="text-4xl font-black text-primary mb-3">How It Works</h2>
            <p className="text-slate-500 max-w-lg mx-auto">Four simple steps from problem to resolution</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all group">
                <div className="absolute top-4 right-4 text-5xl font-black text-slate-50 select-none leading-none">{s.n}</div>
                <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-primary mb-2 text-base">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────── */}
      <section id="categories" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/8 text-primary rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4">
              Report Types
            </div>
            <h2 className="text-4xl font-black text-primary mb-3">What Can You Report?</h2>
            <p className="text-slate-500">Any public infrastructure issue affecting your daily life</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06, type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-slate-100 hover:border-secondary/30 hover:shadow-card-hover hover:-translate-y-1 transition-all cursor-pointer group">
                <div className={`w-13 h-13 rounded-xl flex items-center justify-center ${cat.bg} group-hover:scale-110 transition-transform`} style={{width:'52px',height:'52px'}}>
                  <cat.icon className={`w-6 h-6 bg-gradient-to-br ${cat.color} bg-clip-text`} style={{color:'currentColor'}} />
                </div>
                <span className="text-xs font-bold text-slate-700 text-center leading-tight">{cat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section id="features" className="py-24 bg-civic-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4">
              <Brain className="w-3.5 h-3.5" /> AI-Powered Features
            </div>
            <h2 className="text-4xl font-black text-primary mb-3">Built for Modern Civic Management</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Enterprise-grade tools that make complaint management transparent and accountable</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all group">
                <div className={`w-11 h-11 ${f.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-primary mb-2 text-base">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 hero-dots opacity-50" />
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-96 h-96 bg-secondary/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 backdrop-blur-sm">
              <Globe className="w-3.5 h-3.5" /> Join the Movement
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
              Ready to Build<br />a Better City?
            </h2>
            <p className="text-white/60 text-base mb-10 max-w-xl mx-auto leading-relaxed">
              Join CivicConnect and help transform how your community reports and resolves public infrastructure problems.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-dark text-white px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-xl font-bold text-sm transition-all backdrop-blur-sm">
                Sign In to Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="bg-primary-900 text-white/40 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-secondary rounded-lg flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white/70 font-black text-sm tracking-tight">CivicConnect</span>
          </div>
          <p className="text-xs text-center leading-relaxed">© 2024 CivicConnect · Hackathon demonstration project · Uses synthetic data only.</p>
          <div className="flex gap-5 text-xs">
            <Link to="/login"    className="hover:text-white/80 transition-colors">Admin Login</Link>
            <Link to="/register" className="hover:text-white/80 transition-colors">Register</Link>
            <Link to="/track"    className="hover:text-white/80 transition-colors">Track</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

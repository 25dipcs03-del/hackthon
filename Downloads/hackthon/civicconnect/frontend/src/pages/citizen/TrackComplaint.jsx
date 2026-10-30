import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowRight, Shield, MapPin, Calendar, Building2,
  Brain, CheckCircle, Clock, AlertTriangle, ChevronRight, FileText
} from 'lucide-react';
import { complaintAPI } from '../../services/api';
import { PriorityBadge, StatusBadge, LoadingSpinner } from '../../components/ui';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CC_RE   = /^CC-\d{4}-\d{5}$/i;

export default function TrackComplaint() {
  const [query, setQuery]       = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return toast.error('Enter a complaint ID or number');

    setLoading(true);
    setNotFound(false);
    setComplaint(null);

    try {
      let res;
      if (UUID_RE.test(q)) {
        // UUID — use authenticated route if logged in, else 404
        res = await complaintAPI.getById(q);
      } else if (CC_RE.test(q)) {
        // Complaint number like CC-2024-01001 — public lookup
        res = await complaintAPI.trackByNumber(q);
      } else {
        // Try as complaint number anyway (user may have omitted prefix)
        res = await complaintAPI.trackByNumber(q);
      }
      setComplaint(res.data.data);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        setNotFound(true);
      } else {
        toast.error('Search failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStep = complaint ? STATUS_STEPS.indexOf(complaint.status) : -1;
  const ai = complaint?.ai_analysis;
  const dept = complaint?.departments?.name || complaint?.assignments?.[0]?.departments?.name;
  const officer = complaint?.assignments?.[0]?.assigned_officer;

  return (
    <div className="min-h-screen bg-civic-bg">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-primary text-sm tracking-tight">CivicConnect</span>
          </Link>
          <Link to="/login" className="text-xs font-semibold text-secondary hover:text-secondary/80 transition-colors">
            Sign in →
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="text-center mb-10">
          <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-card">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-primary mb-2">Track Your Complaint</h1>
          <p className="text-slate-500 text-sm">Enter your complaint number (e.g. <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">CC-2024-01001</code>) to see its status</p>
        </motion.div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2.5 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="CC-2024-01001 or complaint UUID"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input-field pl-10 py-3 text-sm"
              autoFocus
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary px-5 flex items-center gap-2">
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><span>Track</span><ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </form>

        {/* Not found */}
        <AnimatePresence>
          {notFound && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="card text-center py-10 mb-6">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="font-bold text-slate-700 mb-1">Complaint not found</p>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                The ID you entered doesn't match any complaint in our system. Check the number and try again.
              </p>
              <Link to="/login" className="text-xs text-secondary font-semibold mt-3 inline-block hover:underline">
                Sign in to view your complaints →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Complaint result */}
        <AnimatePresence>
          {complaint && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="space-y-4">

              {/* Header card */}
              <div className="card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono text-slate-400">{complaint.complaint_number}</span>
                    <h2 className="font-black text-primary text-base mt-0.5 leading-snug">{complaint.title}</h2>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <PriorityBadge priority={complaint.priority} />
                    <StatusBadge status={complaint.status} />
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-4">{complaint.description}</p>

                <div className="grid sm:grid-cols-2 gap-2.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />{complaint.location_address}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" />{format(new Date(complaint.created_at), 'dd MMM yyyy')}</span>
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" />{complaint.category}</span>
                  {dept && <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400" />Assigned: <span className="font-semibold text-slate-700">{dept}</span></span>}
                  {officer && <span className="flex items-center gap-1.5 col-span-2"><CheckCircle className="w-3.5 h-3.5 text-green-400" />Officer: {officer}</span>}
                </div>

                {complaint.admin_remarks && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs font-bold text-blue-600 mb-1">Admin Remarks</p>
                    <p className="text-xs text-blue-800 leading-relaxed">{complaint.admin_remarks}</p>
                  </div>
                )}

                {complaint.resolution_details && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                    <p className="text-xs font-bold text-green-600 mb-1">Resolution Details</p>
                    <p className="text-xs text-green-800 leading-relaxed">{complaint.resolution_details}</p>
                  </div>
                )}
              </div>

              {/* Progress timeline */}
              <div className="card">
                <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Complaint Progress
                </h3>
                <div className="flex items-center">
                  {STATUS_STEPS.map((s, i) => (
                    <React.Fragment key={s}>
                      <div className="flex flex-col items-center" style={{ flex: 1 }}>
                        <motion.div
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.07 }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all
                            ${i < currentStep ? 'bg-secondary text-white shadow-sm'
                              : i === currentStep ? 'bg-primary text-white ring-4 ring-primary/20'
                              : 'bg-slate-100 text-slate-400'}`}>
                          {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
                        </motion.div>
                        <span className="text-center mt-1.5 hidden sm:block" style={{ fontSize: '9px', color: i <= currentStep ? '#142D4E' : '#94a3b8', fontWeight: i === currentStep ? 700 : 400 }}>
                          {s}
                        </span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                          style={{ transformOrigin: 'left' }}
                          className={`flex-1 h-0.5 ${i < currentStep ? 'bg-secondary' : 'bg-slate-200'}`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* AI summary (if available) */}
              {ai && ai.analysis_status === 'completed' && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-secondary" />
                    <h3 className="font-bold text-slate-700 text-sm">AI Analysis</h3>
                    <span className="text-2xs bg-secondary/10 text-secondary font-bold px-2 py-0.5 rounded-full">Complete</span>
                  </div>
                  <div className="space-y-2.5">
                    {ai.ai_summary && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-2.5">{ai.ai_summary}</p>
                    )}
                    <div className="flex items-start gap-2.5 p-2.5 bg-orange-50 rounded-lg border border-orange-100">
                      <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-orange-700">Priority: {ai.priority}</p>
                        <p className="text-xs text-orange-600 mt-0.5 leading-relaxed">{ai.priority_reason}</p>
                      </div>
                    </div>
                    {ai.recommended_action && (
                      <div className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-lg">
                        <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700 leading-relaxed">{ai.recommended_action}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status history */}
              {complaint.status_history?.length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> Activity Timeline
                  </h3>
                  <div className="space-y-2.5">
                    {[...complaint.status_history]
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .map((h, i) => (
                        <motion.div key={i} initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-slate-700">
                              {h.old_status ? `${h.old_status} → ` : ''}<span className="text-primary">{h.new_status}</span>
                            </p>
                            {h.remarks && <p className="text-xs text-slate-500 mt-0.5 italic">{h.remarks}</p>}
                            <p className="text-xs text-slate-400 mt-0.5">{format(new Date(h.created_at), 'dd MMM yyyy, HH:mm')}</p>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer links */}
        <div className="mt-10 text-center space-x-4">
          <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">← Back to home</Link>
          <span className="text-slate-200">|</span>
          <Link to="/login" className="text-xs text-secondary hover:text-secondary/80 font-semibold transition-colors">Sign in to manage complaints →</Link>
        </div>
      </div>
    </div>
  );
}

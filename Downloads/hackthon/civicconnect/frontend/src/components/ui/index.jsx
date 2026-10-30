import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, CheckCircle, Clock, Minus } from 'lucide-react';

/* ── Priority ───────────────────────────────────────── */
const PRIORITY_CONFIG = {
  Critical: { cls: 'badge-critical', dot: 'bg-red-500' },
  High:     { cls: 'badge-high',     dot: 'bg-orange-500' },
  Medium:   { cls: 'badge-medium',   dot: 'bg-amber-400' },
  Low:      { cls: 'badge-low',      dot: 'bg-emerald-500' },
};

export function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium;
  return (
    <span className={cfg.cls}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {priority || 'Medium'}
    </span>
  );
}

/* ── Status ─────────────────────────────────────────── */
const STATUS_CONFIG = {
  'Submitted':    'status-submitted',
  'Under Review': 'status-under-review',
  'Assigned':     'status-assigned',
  'In Progress':  'status-in-progress',
  'Resolved':     'status-resolved',
};

export function StatusBadge({ status }) {
  const cls = STATUS_CONFIG[status] || 'status-submitted';
  return <span className={cls}>{status || 'Unknown'}</span>;
}

export function CategoryBadge({ category }) {
  return (
    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
      {category}
    </span>
  );
}

/* ── Loading ────────────────────────────────────────── */
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-[3px]' };
  return (
    <div className={`animate-spin rounded-full border-secondary border-t-transparent ${sizes[size]} ${className}`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-slate-400 animate-pulse">Loading...</p>
    </div>
  );
}

/* ── Empty state ────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        {Icon && <Icon className="w-7 h-7 text-slate-400" />}
      </div>
      <h3 className="text-base font-bold text-slate-700 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-slate-400 mb-5 max-w-xs leading-relaxed">{description}</p>}
      {action}
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────── */
export function StatCard({ label, value, icon: Icon, color = 'text-primary', bg = 'bg-primary/10', trend, delta }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="stat-card group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
          {Icon && <Icon className={`w-5 h-5 ${color}`} />}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className={`text-3xl font-black tracking-tight ${color}`}>{value ?? '—'}</p>
        <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">{label}</p>
        {delta && <p className="text-xs text-slate-400 mt-0.5">{delta}</p>}
      </div>
    </motion.div>
  );
}

/* ── Page header ────────────────────────────────────── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="flex items-start justify-between mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </motion.div>
  );
}

/* ── Skeleton ────────────────────────────────────────── */
export function SkeletonCard() {
  return (
    <div className="card animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-2/3" />
          <div className="skeleton h-3 w-1/3" />
        </div>
      </div>
      <div className="skeleton h-8 w-1/2" />
      <div className="skeleton h-3 w-full" />
    </div>
  );
}

/* ── Section divider ─────────────────────────────────── */
export function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-100" />
      {label && <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest px-1">{label}</span>}
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

/* ── Priority score bar ──────────────────────────────── */
export function PriorityScoreBar({ score, priority }) {
  const colors = { Critical: 'bg-red-500', High: 'bg-orange-500', Medium: 'bg-amber-400', Low: 'bg-emerald-500' };
  const barColor = colors[priority] || 'bg-slate-400';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${barColor} rounded-full`} />
      </div>
      <span className="text-sm font-black text-slate-700 w-8 text-right">{score}</span>
    </div>
  );
}

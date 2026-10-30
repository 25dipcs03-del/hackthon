import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, AlertTriangle, Copy, TrendingUp, TrendingDown, Minus,
  Zap, BarChart2, RefreshCw, Target, ShieldAlert, Clock, Users,
  Wrench, CheckCircle, ChevronRight
} from 'lucide-react';
import { aiAPI } from '../../services/api';
import { LoadingSpinner, PageHeader, StatCard } from '../../components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#142D4E','#19B6A4','#EF4444','#F97316','#EAB308','#22C55E','#8B5CF6'];
const URGENCY_COLOR = { low: '#22C55E', medium: '#EAB308', high: '#F97316', critical: '#EF4444' };

function ScoreBar({ label, score, maxScore = 25, color = '#19B6A4', reason }) {
  const pct = Math.round((score / maxScore) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold text-slate-700">{score}/{maxScore}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      {reason && <p className="text-2xs text-slate-400 leading-snug">{reason}</p>}
    </div>
  );
}

function TrendBadge({ recent, previous }) {
  if (recent === undefined || previous === undefined) return null;
  if (recent > previous) return (
    <span className="flex items-center gap-1 text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">
      <TrendingUp className="w-3 h-3" /> +{recent - previous} vs last week
    </span>
  );
  if (recent < previous) return (
    <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
      <TrendingDown className="w-3 h-3" /> {recent - previous} vs last week
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" /> Stable
    </span>
  );
}

export default function AiInsights() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await aiAPI.getInsights();
      setData(res.data);
    } catch {
      toast.error('Failed to load AI insights');
    }
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    toast.success('Insights refreshed');
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  if (!data)   return <div className="text-center py-24 text-slate-400">Failed to load insights</div>;

  const { stats = {}, actionBrief, categoryRecommendations = [] } = data;

  const catData = Object.entries(stats.categoryBreakdown || {})
    .map(([name, value], i) => ({ name, value, fill: COLORS[i % COLORS.length] }));

  // Scoring factor radar data (averages across all analyzed complaints)
  const sf = stats.scoringFactors || {};
  const radarData = sf.sample_count > 0 ? [
    { factor: 'Safety Risk',   score: sf.avg_safety,   fullMark: 25 },
    { factor: 'Urgency',       score: sf.avg_urgency,  fullMark: 25 },
    { factor: 'Public Impact', score: sf.avg_impact,   fullMark: 25 },
    { factor: 'Severity',      score: sf.avg_severity, fullMark: 25 },
  ] : [];

  // Category table data
  const catStats = (stats.categoryStats || []).slice(0, 8);

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.25 }}>
      <PageHeader
        title="AI Insights"
        subtitle="Automated pattern analysis, explainable priority scoring, and department recommendations"
        action={
          <div className="flex items-center gap-2">
            <TrendBadge recent={stats.recentWeekCount} previous={stats.previousWeekCount} />
            <button onClick={refresh} disabled={refreshing} className="btn-ghost text-xs gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        }
      />

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="AI Analyzed"       value={stats.analyzed ?? 0}    icon={Brain}         color="text-secondary"  bg="bg-secondary/10" />
        <StatCard label="Duplicates Found"  value={stats.duplicates ?? 0}  icon={Copy}          color="text-amber-600"  bg="bg-amber-50" />
        <StatCard label="Critical Issues"   value={stats.critical ?? 0}    icon={AlertTriangle} color="text-red-600"    bg="bg-red-50" />
        <StatCard label="Resolution Rate"   value={`${stats.resolutionRate ?? 0}%`} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
      </div>

      {/* AI Action Brief */}
      {actionBrief && (
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="card mb-5 border-secondary/20 bg-gradient-to-br from-secondary/5 to-primary/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-secondary/15 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h2 className="font-black text-primary text-sm">AI Action Brief</h2>
                <span className="text-2xs bg-secondary/15 text-secondary font-bold px-2 py-0.5 rounded-full">Gemini-powered · live data</span>
                {stats.recentWeekCount !== undefined && (
                  <span className="text-2xs text-slate-400">{stats.recentWeekCount} complaints this week</span>
                )}
              </div>
              <div className="text-sm text-slate-700 leading-relaxed border-l-4 border-secondary/40 pl-4 whitespace-pre-line">
                {actionBrief}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Category bar chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="font-black text-slate-800 text-sm">Complaint Volume by Category</h3>
            <p className="text-xs text-slate-400 mt-0.5">Total reports per issue type</p>
          </div>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catData} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:'#64748b' }} width={120} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [v, 'Complaints']} />
                <Bar dataKey="value" name="Complaints" radius={[0,6,6,0]}>
                  {catData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">No complaints yet</div>
          )}
        </div>

        {/* Scoring Factor Radar */}
        <div className="card">
          <div className="mb-4">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              Average Scoring Factors
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {sf.sample_count > 0
                ? `Computed across ${sf.sample_count} AI-analyzed complaints (each factor max 25)`
                : 'No AI-analyzed complaints yet'}
            </p>
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 25]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Radar name="Avg Score" dataKey="score" stroke="#19B6A4" fill="#19B6A4" fillOpacity={0.3} />
                <Tooltip formatter={(v) => [`${v}/25`, 'Avg Score']} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <Brain className="w-10 h-10 text-slate-200" />
              <p className="text-xs text-slate-400">Submit complaints to see AI scoring patterns</p>
            </div>
          )}
        </div>
      </div>

      {/* Scoring methodology explanation */}
      <div className="card mb-4">
        <h3 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-400" /> Explainable Priority Scoring Methodology
        </h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Every complaint is scored by Google Gemini AI on four independent factors (each 0–25).
          The total score (0–100) determines the priority band. All scoring reasons are saved and shown on the complaint detail page.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: ShieldAlert, label: 'Safety Risk',    color: '#EF4444', desc: 'Immediate risk of injury, accident, or health hazard.', avg: sf.avg_safety },
            { icon: Clock,       label: 'Urgency',        color: '#F97316', desc: 'How time-sensitive — will it worsen if unaddressed?',  avg: sf.avg_urgency },
            { icon: Users,       label: 'Public Impact',  color: '#EAB308', desc: 'Number of people or area of infrastructure affected.',  avg: sf.avg_impact },
            { icon: Wrench,      label: 'Severity',       color: '#142D4E', desc: 'Extent of physical damage or service failure.',         avg: sf.avg_severity },
          ].map(({ icon: Icon, label, color, desc, avg }) => (
            <div key={label} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                <span className="text-xs font-bold text-slate-700">{label}</span>
                {sf.sample_count > 0 && avg !== undefined && (
                  <span className="ml-auto text-xs font-black" style={{ color }}>{avg}/25</span>
                )}
              </div>
              <p className="text-2xs text-slate-400 leading-relaxed">{desc}</p>
              {sf.sample_count > 0 && avg !== undefined && (
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(avg/25)*100}%`, background: color }} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {[
            { band: 'Critical', range: '80–100', color: 'bg-red-500' },
            { band: 'High',     range: '60–79',  color: 'bg-orange-500' },
            { band: 'Medium',   range: '30–59',  color: 'bg-yellow-500' },
            { band: 'Low',      range: '0–29',   color: 'bg-green-500' },
          ].map(b => (
            <div key={b.band} className={`${b.color} text-white rounded-lg py-1.5 px-2`}>
              <p className="text-xs font-black">{b.band}</p>
              <p className="text-2xs opacity-80">{b.range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category recommendations from Gemini */}
      {categoryRecommendations.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-black text-slate-800 text-sm mb-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-secondary" /> AI-Generated Department Recommendations
          </h3>
          <p className="text-xs text-slate-400 mb-4">Based on unresolved complaint patterns — generated by Google Gemini</p>
          <div className="space-y-3">
            {categoryRecommendations.map((rec, i) => {
              const urgColor = URGENCY_COLOR[rec.urgency] || '#94a3b8';
              return (
                <motion.div key={i} initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: urgColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-slate-700">{rec.category}</span>
                      <span className="text-2xs font-bold px-1.5 py-0.5 rounded-full text-white capitalize" style={{ background: urgColor }}>
                        {rec.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{rec.pattern}</p>
                    <div className="flex items-start gap-1.5 p-2 bg-white rounded-lg border border-slate-100">
                      <ChevronRight className="w-3 h-3 text-secondary mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-secondary font-medium leading-relaxed">{rec.recommended_action}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category stats table */}
      {catStats.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-slate-400" /> Category Status Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-slate-400 font-semibold pb-2 pr-4">Category</th>
                  <th className="text-center text-slate-400 font-semibold pb-2 px-3">Total</th>
                  <th className="text-center text-red-400 font-semibold pb-2 px-3">Critical</th>
                  <th className="text-center text-orange-400 font-semibold pb-2 px-3">High</th>
                  <th className="text-center text-amber-500 font-semibold pb-2 px-3">Unresolved</th>
                  <th className="text-center text-green-500 font-semibold pb-2 px-3">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {catStats.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 pr-4 font-medium text-slate-700">{row.category}</td>
                    <td className="py-2 px-3 text-center font-bold text-slate-700">{row.total}</td>
                    <td className="py-2 px-3 text-center font-bold text-red-600">{row.critical || 0}</td>
                    <td className="py-2 px-3 text-center font-bold text-orange-500">{row.high || 0}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`font-bold ${row.unresolved > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {row.unresolved}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-green-600">{row.resolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-2 flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
        <Brain className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <p className="text-xs text-slate-400">
          All AI analysis is powered by Google Gemini 1.5 Flash and is based entirely on real complaint data. Priority scores are computed
          from four independent factors (Safety Risk, Urgency, Public Impact, Severity) — each explained per complaint. These are
          recommendations only and must be reviewed by administrators before action.
        </p>
      </div>
    </motion.div>
  );
}

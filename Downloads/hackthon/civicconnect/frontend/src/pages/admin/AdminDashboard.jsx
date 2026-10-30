import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Clock, TrendingUp, CheckCircle, Percent, ArrowRight, Brain, Activity } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { PriorityBadge, StatusBadge, StatCard, LoadingSpinner, PageHeader } from '../../components/ui';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PIE_COLORS   = ['#142D4E','#19B6A4','#EF4444','#F97316','#EAB308','#22C55E','#8B5CF6'];
const PRI_COLORS   = { Critical:'#EF4444', High:'#F97316', Medium:'#EAB308', Low:'#22C55E' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-float px-3 py-2 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center py-24"><LoadingSpinner size="lg" /></div>;
  if (!data)   return <div className="text-center py-20 text-slate-500">Failed to load dashboard</div>;

  const categoryData = Object.entries(data.charts?.categoryBreakdown || {}).map(([name, value]) => ({ name, value }));
  const priorityData = Object.entries(data.charts?.priorityBreakdown || {}).map(([name, value]) => ({ name, value, fill: PRI_COLORS[name] || '#6B7280' }));
  const monthlyData  = data.charts?.monthlyTrends || [];
  const statusData   = Object.entries(data.charts?.statusBreakdown || {}).map(([name, value]) => ({ name, value }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <PageHeader title="Overview" subtitle="Real-time complaint intelligence dashboard" />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        {[
          { label: 'Total',          value: data.stats.total,          icon: FileText,    color: 'text-primary',    bg: 'bg-primary/8' },
          { label: 'Critical',       value: data.stats.critical,       icon: AlertTriangle, color: 'text-red-600',  bg: 'bg-red-50' },
          { label: 'Pending',        value: data.stats.submitted,      icon: Clock,       color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'In Progress',    value: data.stats.inProgress,     icon: TrendingUp,  color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'Resolved',       value: data.stats.resolved,       icon: CheckCircle, color: 'text-emerald-600',bg: 'bg-emerald-50' },
          { label: 'Resolution %',   value: `${data.stats.resolutionRate}%`, icon: Percent, color: 'text-secondary', bg: 'bg-secondary/10' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Monthly trend */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-slate-800 text-sm">Monthly Trends</h3>
              <p className="text-xs text-slate-400">Complaint volume over last 6 months</p>
            </div>
            <Activity className="w-4 h-4 text-slate-300" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#19B6A4" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#19B6A4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#19B6A4" strokeWidth={2.5} fill="url(#tealGrad)" dot={{ fill:'#19B6A4', r:4, strokeWidth:0 }} activeDot={{ r:6 }} name="Complaints" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="card">
          <div className="mb-4">
            <h3 className="font-black text-slate-800 text-sm">By Category</h3>
            <p className="text-xs text-slate-400">Distribution of complaint types</p>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" nameKey="name" paddingAngle={2}>
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{fontSize:'10px',color:'#64748b'}}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-slate-400 text-xs">No data yet</div>}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Priority bar */}
        <div className="card">
          <div className="mb-4">
            <h3 className="font-black text-slate-800 text-sm">Priority Distribution</h3>
            <p className="text-xs text-slate-400">Count by priority level</p>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={priorityData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6,6,0,0]} name="Count">
                {priorityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status bar */}
        <div className="card">
          <div className="mb-4">
            <h3 className="font-black text-slate-800 text-sm">Status Breakdown</h3>
            <p className="text-xs text-slate-400">Complaints at each workflow stage</p>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={statusData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:'#64748b' }} width={90} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#142D4E" radius={[0,6,6,0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent complaints table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-800 text-sm">Recent Complaints</h3>
            <p className="text-xs text-slate-400">Latest submissions requiring attention</p>
          </div>
          <Link to="/admin/complaints" className="btn-ghost text-secondary text-xs gap-1.5 hover:text-secondary-dark">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                {['ID', 'Title', 'Category', 'Priority', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="table-header first:pl-6 last:pr-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.recent || []).map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.03 }}
                  className="hover:bg-slate-50/70 transition-colors">
                  <td className="table-cell pl-6 font-mono text-2xs text-slate-400">{c.complaint_number}</td>
                  <td className="table-cell max-w-[180px]">
                    <p className="font-semibold text-slate-800 truncate text-xs">{c.title}</p>
                    <p className="text-2xs text-slate-400 truncate mt-0.5">{c.location_address}</p>
                  </td>
                  <td className="table-cell hidden md:table-cell text-xs text-slate-500">{c.category}</td>
                  <td className="table-cell"><PriorityBadge priority={c.priority} /></td>
                  <td className="table-cell"><StatusBadge status={c.status} /></td>
                  <td className="table-cell hidden lg:table-cell text-xs text-slate-400">{format(new Date(c.created_at), 'dd MMM yy')}</td>
                  <td className="table-cell pr-6 text-right">
                    <Link to={`/admin/complaints/${c.id}`} className="text-xs font-bold text-secondary hover:text-secondary-dark transition-colors">View →</Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

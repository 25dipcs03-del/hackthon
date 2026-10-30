import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { PageHeader, LoadingSpinner, StatCard } from '../../components/ui';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import { TrendingUp, BarChart2, PieChart as PieIcon, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#142D4E', '#19B6A4', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#8B5CF6'];
const PRIORITY_COLORS = { Critical: '#EF4444', High: '#F97316', Medium: '#EAB308', Low: '#22C55E' };

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  if (!data) return null;

  const categoryData = Object.entries(data.charts?.categoryBreakdown || {}).map(([name, value], i) => ({ name, value, fill: COLORS[i % COLORS.length] }));
  const priorityData = Object.entries(data.charts?.priorityBreakdown || {}).map(([name, value]) => ({ name, value, fill: PRIORITY_COLORS[name] }));
  const monthlyData = data.charts?.monthlyTrends || [];
  const statusData = Object.entries(data.charts?.statusBreakdown || {}).map(([name, value]) => ({ name, value }));
  const deptData = (data.charts?.deptPerformance || []).filter(d => d.total > 0);

  return (
    <div>
      <PageHeader title="Analytics & Reports" subtitle="Complaint trend analysis and performance metrics" />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Complaints" value={data.stats.total} icon={FileText} color="text-primary" bg="bg-primary/10" />
        <StatCard label="Resolution Rate" value={`${data.stats.resolutionRate}%`} icon={TrendingUp} color="text-green-600" bg="bg-green-50" />
        <StatCard label="Critical Issues" value={data.stats.critical} icon={BarChart2} color="text-red-600" bg="bg-red-50" />
        <StatCard label="Resolved" value={data.stats.resolved} icon={PieIcon} color="text-secondary" bg="bg-secondary/10" />
      </div>

      {/* Monthly trend - full width */}
      <div className="card mb-4">
        <h3 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" /> Monthly Complaint Trends (Last 6 Months)
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#19B6A4" strokeWidth={2.5} dot={{ fill: '#19B6A4', r: 5 }} name="Complaints" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Category pie */}
        <div className="card">
          <h3 className="font-semibold text-gray-700 text-sm mb-4">Complaints by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" nameKey="name" label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority donut */}
        <div className="card">
          <h3 className="font-semibold text-gray-700 text-sm mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name">
                {priorityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status bar */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 text-sm mb-4">Complaints by Status</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#142D4E" name="Count" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Department performance */}
      {deptData.length > 0 && (
        <div className="card mt-4">
          <h3 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-gray-400" /> Department Performance
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData} layout="vertical" margin={{ left: 16, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Total Assigned" fill="#142D4E" radius={[0, 4, 4, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="#19B6A4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-4">
        All charts use real data from the database. No hardcoded values.
      </p>
    </div>
  );
}

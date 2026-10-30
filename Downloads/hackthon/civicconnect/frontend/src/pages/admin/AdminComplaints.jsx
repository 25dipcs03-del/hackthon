import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { PriorityBadge, StatusBadge, LoadingSpinner, PageHeader, EmptyState } from '../../components/ui';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CATEGORIES = ['Road Damage','Waterlogging','Garbage Overflow','Streetlight Failure','Drainage Problem','Water Supply','Other'];
const PRIORITIES  = ['Critical','High','Medium','Low'];
const STATUSES    = ['Submitted','Under Review','Assigned','In Progress','Resolved'];

export default function AdminComplaints() {
  const [data, setData]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search:'', category:'', priority:'', status:'', page:1, limit:20 });
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getComplaints(filters);
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load complaints'); }
    finally  { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / filters.limit);
  const setF = (patch) => setFilters(f => ({ ...f, ...patch, page: 1 }));

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.25 }}>
      <PageHeader
        title="All Complaints"
        subtitle={`${total} complaint${total !== 1 ? 's' : ''} found`}
        action={
          <button onClick={fetchData}
            className="btn-ghost text-xs gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {/* Search & filter bar */}
      <div className="card mb-4 p-4">
        <div className="flex gap-2.5 items-center flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by ID, title, description…"
              value={filters.search}
              onChange={e => setF({ search: e.target.value })}
              className="input-field pl-10 py-2.5 text-sm" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all ${showFilters ? 'border-secondary bg-secondary/5 text-secondary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {(filters.category || filters.priority || filters.status) && (
              <span className="w-2 h-2 rounded-full bg-secondary" />
            )}
          </button>
        </div>

        <motion.div initial={false} animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }} className="overflow-hidden">
          <div className="pt-3 mt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <select className="input-field py-2 text-xs" value={filters.category} onChange={e => setF({ category: e.target.value })}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input-field py-2 text-xs" value={filters.priority} onChange={e => setF({ priority: e.target.value })}>
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="input-field py-2 text-xs" value={filters.status} onChange={e => setF({ status: e.target.value })}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" className="input-field py-2 text-xs" onChange={e => setF({ date_from: e.target.value })} />
            <input type="date" className="input-field py-2 text-xs" onChange={e => setF({ date_to: e.target.value })} />
          </div>
        </motion.div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : !data.length ? (
          <div className="py-12"><EmptyState icon={Search} title="No complaints found" description="Try adjusting your search or filter criteria" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Complaint ID','Title & Location','Category','Priority','Status','Citizen','Date',''].map(h => (
                      <th key={h} className="table-header first:pl-6 last:pr-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((c, i) => (
                    <motion.tr key={c.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.02 }}
                      className="hover:bg-slate-50/70 transition-colors group">
                      <td className="table-cell pl-6 font-mono text-2xs text-slate-400 whitespace-nowrap">{c.complaint_number}</td>
                      <td className="table-cell max-w-[200px]">
                        <p className="font-bold text-slate-800 truncate text-xs">{c.title}</p>
                        <p className="text-2xs text-slate-400 truncate mt-0.5">{c.location_address}</p>
                      </td>
                      <td className="table-cell hidden lg:table-cell text-xs text-slate-500 whitespace-nowrap">{c.category}</td>
                      <td className="table-cell whitespace-nowrap"><PriorityBadge priority={c.priority} /></td>
                      <td className="table-cell whitespace-nowrap"><StatusBadge status={c.status} /></td>
                      <td className="table-cell hidden xl:table-cell text-xs text-slate-500">{c.profiles?.full_name || '—'}</td>
                      <td className="table-cell hidden md:table-cell text-xs text-slate-400 whitespace-nowrap">{format(new Date(c.created_at), 'dd MMM yy')}</td>
                      <td className="table-cell pr-6 text-right">
                        <Link to={`/admin/complaints/${c.id}`}
                          className="text-xs font-bold text-secondary hover:text-secondary-dark whitespace-nowrap transition-colors opacity-0 group-hover:opacity-100">
                          View →
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-medium">
                Showing {((filters.page - 1) * filters.limit) + 1}–{Math.min(filters.page * filters.limit, total)} of <span className="text-slate-600 font-bold">{total}</span>
              </p>
              <div className="flex items-center gap-2">
                <button disabled={filters.page <= 1}
                  onClick={() => setFilters(f => ({...f, page: f.page - 1}))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <span className="text-xs font-bold text-slate-600 min-w-[60px] text-center">
                  {filters.page} / {totalPages || 1}
                </span>
                <button disabled={filters.page >= totalPages}
                  onClick={() => setFilters(f => ({...f, page: f.page + 1}))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

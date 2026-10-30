import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Clock, CheckCircle, TrendingUp, LogOut, Shield, MapPin, Calendar, ArrowRight, AlertCircle, Bell, Info, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { citizenAPI } from '../../services/api';
import { PriorityBadge, StatusBadge, StatCard, EmptyState, LoadingSpinner } from '../../components/ui';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const NOTIF_ICON  = { critical: AlertTriangle, success: CheckCircle, info: Info, warning: AlertTriangle };
const NOTIF_COLOR = { critical: 'text-red-500', success: 'text-green-500', info: 'text-blue-500', warning: 'text-amber-500' };

export default function CitizenDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);

  // Notifications
  const [notifOpen, setNotifOpen]       = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]             = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    citizenAPI.getDashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));

    // Fetch notification count
    citizenAPI.getNotifications()
      .then(r => {
        const notifs = r.data.data || [];
        setNotifications(notifs);
        setUnread(notifs.filter(n => !n.read).length);
      })
      .catch(() => {});
  }, []);

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openNotifications = () => {
    setNotifOpen(prev => !prev);
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const first = user?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-civic-bg">
      {/* Nav */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-primary text-sm tracking-tight">CivicConnect</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <div ref={notifRef} className="relative">
              <button onClick={openNotifications}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <Bell style={{width:'18px',height:'18px'}} className="text-slate-500" />
                {unread > 0 && (
                  <motion.span initial={{scale:0}} animate={{scale:1}}
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-2xs font-black rounded-full flex items-center justify-center px-1 leading-none">
                    {unread > 9 ? '9+' : unread}
                  </motion.span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{opacity:0,y:-8,scale:0.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:0.96}}
                    transition={{duration:0.15}}
                    className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-float border border-slate-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Notifications</span>
                      {unread > 0 && <span className="text-2xs text-slate-400">{unread} unread</span>}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center">
                          <Bell className="w-7 h-7 text-slate-200 mx-auto mb-1.5" />
                          <p className="text-xs text-slate-400">No notifications yet</p>
                        </div>
                      ) : notifications.map(n => {
                        const Icon = NOTIF_ICON[n.type] || Info;
                        const color = NOTIF_COLOR[n.type] || 'text-blue-500';
                        return (
                          <div key={n.id} className={`flex items-start gap-3 px-4 py-3 ${!n.read ? 'bg-blue-50/40' : ''}`}>
                            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-700 leading-tight">{n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-2xs text-slate-400 mt-1">{format(new Date(n.created_at), 'dd MMM, HH:mm')}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
              <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xs font-black">
                {user?.full_name?.[0]?.toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-700">{user?.full_name}</span>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors px-3 py-2 rounded-xl hover:bg-red-50">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary tracking-tight">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {first} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">Here's a snapshot of your complaints</p>
          </div>
          <Link to="/report" className="btn-secondary flex-shrink-0">
            <Plus className="w-4 h-4" /> Report Issue
          </Link>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show">
            {/* Stats */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total"      value={data?.stats?.total ?? 0}      icon={FileText}    color="text-primary"    bg="bg-primary/10" />
              <StatCard label="Pending"    value={data?.stats?.submitted ?? 0}  icon={Clock}       color="text-blue-600"   bg="bg-blue-50" />
              <StatCard label="In Progress" value={data?.stats?.inProgress ?? 0} icon={TrendingUp} color="text-amber-600"  bg="bg-amber-50" />
              <StatCard label="Resolved"   value={data?.stats?.resolved ?? 0}   icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
            </motion.div>

            {/* Complaints list */}
            <motion.div variants={fadeUp} className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-primary text-base">Your Complaints</h2>
                <Link to="/report" className="text-xs font-bold text-secondary hover:text-secondary-dark flex items-center gap-1.5 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> New
                </Link>
              </div>

              {!data?.recent?.length ? (
                <EmptyState
                  icon={FileText}
                  title="No complaints yet"
                  description="Start by reporting a public infrastructure issue near you"
                  action={<Link to="/report" className="btn-primary text-sm">Report Your First Issue</Link>}
                />
              ) : (
                <div className="space-y-2.5">
                  {data.recent.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <Link to={`/complaints/${c.id}`}
                        className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-secondary/30 hover:bg-slate-50/50 hover:shadow-xs transition-all group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-2xs font-mono text-slate-400">{c.complaint_number}</span>
                            <PriorityBadge priority={c.priority} />
                            <StatusBadge status={c.status} />
                          </div>
                          <p className="font-bold text-slate-800 text-sm truncate">{c.title}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 flex-shrink-0" />{c.location_address}</span>
                            <span className="flex items-center gap-1 flex-shrink-0"><Calendar className="w-3 h-3" />{format(new Date(c.created_at), 'dd MMM yy')}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-secondary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick actions */}
            <motion.div variants={fadeUp} className="grid sm:grid-cols-2 gap-4 mt-4">
              {[
                { to: '/report', icon: Plus, title: 'Report a Problem', desc: 'Submit a new civic complaint with AI analysis', color: 'bg-secondary/10', iconColor: 'text-secondary' },
                { to: '/track',  icon: TrendingUp, title: 'Track by ID', desc: 'Look up any complaint using its complaint number', color: 'bg-primary/8', iconColor: 'text-primary' },
              ].map(a => (
                <Link key={a.to} to={a.to}
                  className="flex items-center gap-4 card hover:shadow-card-hover hover:-translate-y-0.5 transition-all group">
                  <div className={`w-11 h-11 ${a.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    <a.icon className={`w-5 h-5 ${a.iconColor}`} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-200 ml-auto group-hover:text-secondary transition-colors" />
                </Link>
              ))}
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

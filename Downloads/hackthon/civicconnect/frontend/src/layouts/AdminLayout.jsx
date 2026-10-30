import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Brain, Map, Building2, BarChart3,
  LogOut, Bell, Menu, X, ChevronLeft, Shield, CheckCheck, AlertTriangle,
  Info, CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { format } from 'date-fns';

const NAV = [
  { to: '/admin',             icon: LayoutDashboard, label: 'Overview',    end: true },
  { to: '/admin/complaints',  icon: FileText,        label: 'Complaints'  },
  { to: '/admin/insights',    icon: Brain,           label: 'AI Insights' },
  { to: '/admin/map',         icon: Map,             label: 'Hotspot Map' },
  { to: '/admin/departments', icon: Building2,       label: 'Departments' },
  { to: '/admin/analytics',   icon: BarChart3,       label: 'Analytics'   },
];

const NOTIF_ICON = { critical: AlertTriangle, success: CheckCircle, info: Info };
const NOTIF_COLOR = { critical: 'text-red-500', success: 'text-green-500', info: 'text-blue-500' };

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Notifications
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);
  const pollRef = useRef(null);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await adminAPI.getUnreadCount();
      setUnread(res.data.count || 0);
    } catch { /* silent */ }
  }, []);

  const openNotifications = async () => {
    if (notifOpen) { setNotifOpen(false); return; }
    setNotifOpen(true);
    setNotifLoading(true);
    try {
      const res = await adminAPI.getNotifications();
      setNotifications(res.data.data || []);
    } catch { /* silent */ } finally { setNotifLoading(false); }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminAPI.markAllRead();
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnread();
    pollRef.current = setInterval(fetchUnread, 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchUnread]);

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const isActive = (to, end) => end ? location.pathname === to : location.pathname.startsWith(to);
  const avatar = user?.full_name?.[0]?.toUpperCase() || 'A';

  /* ── Sidebar content ─────────────────────────────── */
  const Sidebar = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-white/10 flex-shrink-0 ${collapsed && !mobile ? 'justify-center px-3' : 'gap-3 px-5'}`}>
        <div className="w-8 h-8 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-secondary" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <span className="text-white font-black text-base tracking-tight block leading-tight">CivicConnect</span>
            <span className="text-white/35 text-xs">Admin Portal</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {(!collapsed || mobile) && <p className="section-label text-white/25 px-3.5 mb-2 mt-1">Navigation</p>}
        {NAV.map(({ to, icon: Icon, label, end }) => {
          const active = isActive(to, end);
          return (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              title={collapsed && !mobile ? label : undefined}
              className={`${active ? 'nav-item-active' : 'nav-item'} ${collapsed && !mobile ? 'justify-center px-0 py-3' : ''}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {(!collapsed || mobile) && <span>{label}</span>}
              {active && (!collapsed || mobile) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/10 p-3 flex-shrink-0 ${collapsed && !mobile ? 'flex flex-col items-center gap-2' : ''}`}>
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1 bg-white/5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-teal flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-bold truncate leading-tight">{user?.full_name}</p>
              <p className="text-white/35 text-xs truncate">Administrator</p>
            </div>
          </div>
        )}
        {(collapsed && !mobile) && (
          <div className="w-8 h-8 rounded-full bg-gradient-teal flex items-center justify-center text-white text-xs font-black mb-1">
            {avatar}
          </div>
        )}
        <button onClick={handleLogout}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-red-300 hover:bg-red-500/15 hover:text-red-200 transition-all text-xs font-semibold w-full ${collapsed && !mobile ? 'justify-center' : ''}`}>
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          {(!collapsed || mobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-civic-bg overflow-hidden">

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-gradient-primary shadow-sidebar flex-shrink-0 overflow-hidden relative">
        <Sidebar />
        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-card flex items-center justify-center hover:bg-slate-50 transition-colors z-10">
          <ChevronLeft className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }} transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed left-0 top-0 h-full w-64 bg-gradient-primary z-50 lg:hidden flex flex-col shadow-float">
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center gap-3 px-4 flex-shrink-0 z-10">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden btn-ghost p-2">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <span className="hidden sm:block text-xs text-slate-400 font-medium">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Notification bell with badge */}
            <div ref={notifRef} className="relative">
              <button onClick={openNotifications}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <Bell style={{width:'18px',height:'18px'}} className="text-slate-500" />
                {unread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-2xs font-black rounded-full flex items-center justify-center px-1 leading-none">
                    {unread > 99 ? '99+' : unread}
                  </motion.span>
                )}
              </button>

              {/* Notification dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-float border border-slate-100 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                      <span className="text-sm font-bold text-slate-700">Notifications</span>
                      {unread > 0 && (
                        <button onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-xs text-secondary hover:text-secondary/80 font-semibold transition-colors">
                          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      {notifLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-8 text-center">
                          <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-xs text-slate-400">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map(n => {
                          const Icon = NOTIF_ICON[n.type] || Info;
                          const color = NOTIF_COLOR[n.type] || 'text-blue-500';
                          return (
                            <div key={n.id}
                              className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}>
                              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-700 leading-tight">{n.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                                <p className="text-2xs text-slate-400 mt-1">{format(new Date(n.created_at), 'dd MMM, HH:mm')}</p>
                              </div>
                              {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-black">
                {avatar}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-700 leading-tight">{user?.full_name}</p>
                <p className="text-2xs text-slate-400">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-4 lg:p-6 max-w-[1600px]"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Filter, Map, AlertTriangle, ChevronDown } from 'lucide-react';
import { aiAPI } from '../../services/api';
import { PriorityBadge, StatusBadge, PageHeader, LoadingSpinner } from '../../components/ui';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

const PRIORITY_COLORS = { Critical: '#EF4444', High: '#F97316', Medium: '#EAB308', Low: '#22C55E' };
const CATEGORIES = ['Road Damage', 'Waterlogging', 'Garbage Overflow', 'Streetlight Failure', 'Drainage Problem', 'Water Supply', 'Other'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];

function getMarkerColor(priority) {
  return PRIORITY_COLORS[priority] || '#6B7280';
}

export default function HotspotMap() {
  const [complaints, setComplaints] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', priority: '', status: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState('complaints'); // complaints | clusters

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await aiAPI.getHotspots(filters);
      setComplaints(res.data.complaints || []);
      setClusters(res.data.clusters || []);
    } catch {
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const withCoords = complaints.filter(c => c.latitude && c.longitude);

  return (
    <div>
      <PageHeader title="Hotspot Map" subtitle="Geographic visualization of complaint clusters and problem areas" />

      {/* Controls */}
      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('complaints')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'complaints' ? 'bg-primary text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              Individual Complaints
            </button>
            <button onClick={() => setViewMode('clusters')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'clusters' ? 'bg-primary text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              Hotspot Clusters
            </button>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 ml-auto">
            <Filter className="w-4 h-4" /> Filters
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3 flex-wrap">
            <select className="input-field py-1.5 text-xs w-40" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input-field py-1.5 text-xs w-36" value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}>
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="input-field py-1.5 text-xs w-36" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Priority:</span>
        {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
          <span key={p} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: c }} />
            {p}
          </span>
        ))}
        <span className="ml-auto text-xs text-gray-400">{withCoords.length} complaints with coordinates</span>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '520px' }}>
        {loading ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <MapContainer center={[12.9716, 77.5946]} zoom={10} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap contributors' />

            {viewMode === 'complaints' && withCoords.map(c => (
              <CircleMarker key={c.id} center={[parseFloat(c.latitude), parseFloat(c.longitude)]}
                radius={8} fillColor={getMarkerColor(c.priority)} color="white" weight={1.5}
                fillOpacity={0.85} eventHandlers={{ click: () => setSelected(c) }}>
                <Popup>
                  <div className="min-w-40">
                    <p className="text-xs font-mono text-gray-400">{c.complaint_number}</p>
                    <p className="font-semibold text-gray-800 text-sm mt-0.5">{c.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.location_address}</p>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold`} style={{background: getMarkerColor(c.priority)+'20', color: getMarkerColor(c.priority)}}>{c.priority}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{c.status}</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {viewMode === 'clusters' && clusters.map((cluster, i) => (
              <CircleMarker key={i} center={[cluster.center.lat, cluster.center.lng]}
                radius={Math.min(8 + cluster.count * 2, 28)}
                fillColor={getMarkerColor(cluster.top_priority)} color="white" weight={2}
                fillOpacity={0.7}>
                <Popup maxWidth={280}>
                  <div className="min-w-56" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', marginBottom: '6px' }}>
                      <p style={{ fontWeight: 800, color: '#142D4E', fontSize: '13px', marginBottom: '2px' }}>
                        🔥 Hotspot Cluster
                      </p>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>
                        {cluster.count} complaints · {cluster.unresolved ?? cluster.count} unresolved
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' }}>
                      <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '4px 6px' }}>
                        <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Issue</p>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>{cluster.top_category}</p>
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '4px 6px' }}>
                        <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</p>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: getMarkerColor(cluster.top_priority) }}>{cluster.top_priority}</p>
                      </div>
                    </div>

                    {cluster.suggested_action && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 8px', marginBottom: '8px' }}>
                        <p style={{ fontSize: '9px', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                          ⚡ Suggested Action
                        </p>
                        <p style={{ fontSize: '10px', color: '#166534', lineHeight: '1.4' }}>
                          {cluster.suggested_action}
                        </p>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', marginBottom: '3px' }}>Complaints in cluster:</p>
                      {cluster.complaints.slice(0, 4).map(cp => (
                        <p key={cp.id} style={{ fontSize: '10px', color: '#64748b', marginBottom: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          • {cp.title}
                        </p>
                      ))}
                      {cluster.complaints.length > 4 && (
                        <p style={{ fontSize: '10px', color: '#94a3b8' }}>+{cluster.complaints.length - 4} more</p>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Summary stats */}
      {!loading && clusters.length > 0 && (
        <div className="mt-4 grid sm:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold text-primary">{clusters.length}</p>
            <p className="text-xs text-gray-500">Hotspot Clusters Detected</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-red-600">{withCoords.filter(c => c.priority === 'Critical').length}</p>
            <p className="text-xs text-gray-500">Critical on Map</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-secondary">{withCoords.length}</p>
            <p className="text-xs text-gray-500">Total Mapped Complaints</p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-3">
        Hotspot clusters use DBSCAN proximity algorithm (0.8km radius). Map data from OpenStreetMap.
      </p>
    </div>
  );
}

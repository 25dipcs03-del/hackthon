import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Brain, MapPin, Calendar, Building2, User, AlertTriangle, CheckCircle, Copy, ShieldAlert, Clock, Users, Wrench } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { adminAPI } from '../../services/api';
import { PriorityBadge, StatusBadge, LoadingSpinner } from '../../components/ui';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export default function AdminComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [statusForm, setStatusForm] = useState({ status: '', remarks: '', resolution_details: '' });
  const [assignForm, setAssignForm] = useState({ department_id: '', assigned_officer: '', remarks: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      adminAPI.getComplaint(id),
      adminAPI.getDepartments()
    ]).then(([c, d]) => {
      setComplaint(c.data.data);
      setDepartments(d.data.data || []);
      setStatusForm(f => ({ ...f, status: c.data.data.status }));
    }).catch(() => toast.error('Failed to load complaint'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!statusForm.status) return toast.error('Select a status');
    setSaving(true);
    try {
      await adminAPI.updateStatus(id, statusForm);
      toast.success('Status updated');
      const res = await adminAPI.getComplaint(id);
      setComplaint(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally { setSaving(false); }
  };

  const handleAssign = async () => {
    if (!assignForm.department_id) return toast.error('Select a department');
    setSaving(true);
    try {
      await adminAPI.assignComplaint(id, assignForm);
      toast.success('Complaint assigned');
      const res = await adminAPI.getComplaint(id);
      setComplaint(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign');
    } finally { setSaving(false); }
  };

  const handlePriorityUpdate = async (priority) => {
    try {
      await adminAPI.updatePriority(id, { priority });
      toast.success(`Priority set to ${priority}`);
      setComplaint(c => ({ ...c, priority }));
    } catch { toast.error('Failed to update priority'); }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!complaint) return <div className="text-center py-20 text-gray-500">Complaint not found</div>;

  const ai = complaint.ai_analysis;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/complaints" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-gray-400">{complaint.complaint_number}</span>
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
            {complaint.is_duplicate && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Duplicate Flagged</span>}
          </div>
          <h1 className="text-lg font-bold text-primary mt-0.5">{complaint.title}</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left column - Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Complaint info */}
          <div className="card">
            <h2 className="font-semibold text-gray-700 text-sm mb-3">Complaint Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Description</p>
                <p className="text-gray-700 leading-relaxed">{complaint.description}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Location</p>
                  <p className="text-gray-700 flex items-start gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />{complaint.location_address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Submitted</p>
                  <p className="text-gray-700 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400" />{format(new Date(complaint.created_at), 'PPP')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Category</p>
                  <p className="text-gray-700">{complaint.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Citizen</p>
                  <p className="text-gray-700 flex items-center gap-1"><User className="w-3.5 h-3.5 text-gray-400" />{complaint.profiles?.full_name || 'Anonymous'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-secondary" />
              <h2 className="font-semibold text-gray-700 text-sm">AI Analysis</h2>
              {ai?.analysis_status === 'pending' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Processing</span>}
              {ai?.analysis_status === 'completed' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Complete</span>}
              {ai?.analysis_status === 'failed' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Failed</span>}
            </div>

            {!ai || ai.analysis_status !== 'completed' ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                {ai?.analysis_status === 'pending' ? 'AI analysis is processing...' : ai?.analysis_status === 'failed' ? 'AI analysis failed. Manual review required.' : 'No AI analysis available.'}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">AI Category</p>
                    <p className="text-sm font-medium text-gray-800">{ai.ai_category}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Suggested Department</p>
                    <p className="text-sm font-medium text-gray-800">{ai.suggested_department}</p>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">AI Summary</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{ai.ai_summary}</p>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                    <p className="text-xs font-semibold text-orange-700">Priority: {ai.priority} (Score: {ai.priority_score}/100)</p>
                  </div>
                  <p className="text-xs text-orange-700 leading-relaxed">{ai.priority_reason}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Recommended Action</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{ai.recommended_action}</p>
                </div>

                {/* Scoring Breakdown */}
                {ai.scoring_breakdown && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-secondary" /> Explainable Scoring Breakdown
                    </p>
                    <div className="space-y-2">
                      {[
                        { icon: ShieldAlert, label: 'Safety Risk',   score: ai.scoring_breakdown.safety_risk_score,   reason: ai.scoring_breakdown.safety_risk_reason,   color: '#EF4444' },
                        { icon: Clock,       label: 'Urgency',       score: ai.scoring_breakdown.urgency_score,       reason: ai.scoring_breakdown.urgency_reason,       color: '#F97316' },
                        { icon: Users,       label: 'Public Impact', score: ai.scoring_breakdown.public_impact_score, reason: ai.scoring_breakdown.public_impact_reason, color: '#EAB308' },
                        { icon: Wrench,      label: 'Severity',      score: ai.scoring_breakdown.severity_score,      reason: ai.scoring_breakdown.severity_reason,      color: '#142D4E' },
                      ].map(({ icon: Icon, label, score, reason, color }) => (
                        <div key={label} className="space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 text-gray-600 font-medium">
                              <Icon className="w-3 h-3" style={{ color }} /> {label}
                            </span>
                            <span className="font-bold text-gray-700">{score ?? '—'}/25</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${((score ?? 0) / 25) * 100}%`, background: color }} />
                          </div>
                          {reason && <p className="text-2xs text-gray-400 leading-tight">{reason}</p>}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-gray-500">Total Score</span>
                      <span className="font-black text-primary">{ai.priority_score ?? 0}/100</span>
                    </div>
                  </div>
                )}

                {/* Factors */}
                {ai.factors && (
                  <div className="grid grid-cols-2 gap-2">
                    {ai.factors.safety_risk && (
                      <div className="p-2 bg-red-50 rounded-lg text-xs">
                        <p className="text-red-500 font-semibold mb-0.5">Safety</p>
                        <p className="text-red-700 capitalize">{ai.factors.safety_risk}</p>
                      </div>
                    )}
                    {ai.factors.urgency && (
                      <div className="p-2 bg-orange-50 rounded-lg text-xs">
                        <p className="text-orange-500 font-semibold mb-0.5">Urgency</p>
                        <p className="text-orange-700 capitalize">{ai.factors.urgency}</p>
                      </div>
                    )}
                    {ai.factors.public_impact && (
                      <div className="p-2 bg-yellow-50 rounded-lg text-xs col-span-2">
                        <p className="text-yellow-600 font-semibold mb-0.5">Public Impact</p>
                        <p className="text-yellow-800">{ai.factors.public_impact}</p>
                      </div>
                    )}
                    {ai.factors.estimated_resolution_days && (
                      <div className="p-2 bg-blue-50 rounded-lg text-xs">
                        <p className="text-blue-500 font-semibold mb-0.5">Est. Resolution</p>
                        <p className="text-blue-700">{ai.factors.estimated_resolution_days} days</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Duplicate detection */}
          {ai?.duplicate_candidates?.length > 0 && (
            <div className="card border-yellow-200 bg-yellow-50/30">
              <h2 className="font-semibold text-yellow-800 text-sm mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" /> Possible Duplicate Complaints Detected
              </h2>
              <div className="space-y-2">
                {ai.duplicate_candidates.map((d, i) => (
                  <div key={i} className="bg-white rounded-lg border border-yellow-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-mono text-gray-400">{d.complaint_number}</p>
                        <p className="text-sm font-medium text-gray-700">{d.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{d.location}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={d.status} />
                        <span className="text-xs text-orange-600 font-semibold">{d.similarity_score}% match</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {complaint.latitude && complaint.longitude && (
            <div className="card">
              <h2 className="font-semibold text-gray-700 text-sm mb-3">Location on Map</h2>
              <div className="h-52 rounded-lg overflow-hidden">
                <MapContainer center={[parseFloat(complaint.latitude), parseFloat(complaint.longitude)]} zoom={14} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
                  <Marker position={[parseFloat(complaint.latitude), parseFloat(complaint.longitude)]}>
                    <Popup>{complaint.title}<br />{complaint.complaint_number}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}

          {/* Image */}
          {complaint.complaint_images?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-700 text-sm mb-3">Complaint Photo</h2>
              <img src={complaint.complaint_images[0].image_url} alt="Complaint" className="w-full h-64 object-cover rounded-lg" />
            </div>
          )}
        </div>

        {/* Right column - Actions */}
        <div className="space-y-4">
          {/* Status Update */}
          <div className="card">
            <h2 className="font-semibold text-gray-700 text-sm mb-3">Update Status</h2>
            <div className="space-y-3">
              <select value={statusForm.status} onChange={e => setStatusForm({...statusForm, status: e.target.value})} className="input-field text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea placeholder="Admin remarks (optional)" value={statusForm.remarks}
                onChange={e => setStatusForm({...statusForm, remarks: e.target.value})}
                className="input-field text-sm resize-none" rows={2} />
              {statusForm.status === 'Resolved' && (
                <textarea placeholder="Resolution details..." value={statusForm.resolution_details}
                  onChange={e => setStatusForm({...statusForm, resolution_details: e.target.value})}
                  className="input-field text-sm resize-none" rows={2} />
              )}
              <button onClick={handleStatusUpdate} disabled={saving} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Update Status'}
              </button>
            </div>
          </div>

          {/* Assign */}
          <div className="card">
            <h2 className="font-semibold text-gray-700 text-sm mb-3">Assign to Department</h2>
            <div className="space-y-3">
              <select value={assignForm.department_id} onChange={e => setAssignForm({...assignForm, department_id: e.target.value})} className="input-field text-sm">
                <option value="">Select department...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input type="text" placeholder="Assigned officer name" value={assignForm.assigned_officer}
                onChange={e => setAssignForm({...assignForm, assigned_officer: e.target.value})}
                className="input-field text-sm" />
              <textarea placeholder="Remarks (optional)" value={assignForm.remarks}
                onChange={e => setAssignForm({...assignForm, remarks: e.target.value})}
                className="input-field text-sm resize-none" rows={2} />
              <button onClick={handleAssign} disabled={saving} className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Assign Department'}
              </button>
            </div>
          </div>

          {/* Priority */}
          <div className="card">
            <h2 className="font-semibold text-gray-700 text-sm mb-3">Override Priority</h2>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITIES.map(p => (
                <button key={p} onClick={() => handlePriorityUpdate(p)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${complaint.priority === p ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary/50 hover:text-primary'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Status History */}
          {complaint.status_history?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-700 text-sm mb-3">Status History</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {[...complaint.status_history].reverse().map((h, i) => (
                  <div key={i} className="text-xs border-b border-gray-50 pb-2 last:border-0">
                    <div className="flex items-center gap-1.5"><StatusBadge status={h.new_status} /></div>
                    {h.remarks && <p className="text-gray-500 mt-0.5 italic">{h.remarks}</p>}
                    <p className="text-gray-400 mt-0.5">{format(new Date(h.created_at), 'dd MMM yy HH:mm')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

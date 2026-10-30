import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Calendar, Brain, AlertTriangle, CheckCircle, Clock, Zap, Building2 } from 'lucide-react';
import { complaintAPI } from '../../services/api';
import { PriorityBadge, StatusBadge, CategoryBadge, LoadingSpinner } from '../../components/ui';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];

export default function CitizenComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = React.useRef(null);

  const fetchComplaint = React.useCallback(() => {
    return complaintAPI.getById(id)
      .then(r => {
        const data = r.data.data;
        setComplaint(data);
        // Stop polling once AI analysis is no longer pending
        const aiStatus = data?.ai_analysis?.analysis_status;
        if (aiStatus && aiStatus !== 'pending') {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        return data;
      });
  }, [id]);

  useEffect(() => {
    fetchComplaint()
      .catch(() => toast.error('Failed to load complaint'))
      .finally(() => setLoading(false));

    // If analysis is pending on load, poll every 5 seconds
    pollRef.current = setInterval(() => {
      fetchComplaint().catch(() => clearInterval(pollRef.current));
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [fetchComplaint]);

  if (loading) return <div className="min-h-screen bg-civic-bg flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!complaint) return <div className="min-h-screen bg-civic-bg flex items-center justify-center"><p className="text-gray-500">Complaint not found</p></div>;

  const ai = complaint.ai_analysis;
  const currentStep = STATUS_STEPS.indexOf(complaint.status);

  return (
    <div className="min-h-screen bg-civic-bg py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-gray-400">{complaint.complaint_number}</span>
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
              {complaint.is_duplicate && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Possible Duplicate</span>}
            </div>
            <h1 className="text-lg font-bold text-primary mt-1">{complaint.title}</h1>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="card mb-4">
          <h2 className="font-semibold text-gray-700 text-sm mb-4">Complaint Progress</h2>
          <div className="flex items-center">
            {STATUS_STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${i < currentStep ? 'bg-secondary text-white' : i === currentStep ? 'bg-primary text-white ring-2 ring-primary/30' : 'bg-gray-100 text-gray-400'}`}>
                    {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-xs text-gray-500 mt-1.5 text-center hidden sm:block" style={{fontSize:'10px'}}>{s}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 transition-all ${i < currentStep ? 'bg-secondary' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Complaint Info */}
          <div className="card">
            <h2 className="font-semibold text-gray-700 text-sm mb-3">Complaint Information</h2>
            <div className="space-y-2.5 text-sm">
              <div>
                <p className="text-xs text-gray-400">Description</p>
                <p className="text-gray-700 mt-0.5 leading-relaxed">{complaint.description}</p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">{complaint.location_address}</p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-gray-600">{format(new Date(complaint.created_at), 'PPP')}</p>
              </div>
              {complaint.departments && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-gray-600">Assigned to: <span className="font-medium">{complaint.departments.name}</span></p>
                </div>
              )}
              {complaint.admin_remarks && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium mb-0.5">Admin Remarks</p>
                  <p className="text-xs text-blue-800">{complaint.admin_remarks}</p>
                </div>
              )}
              {complaint.resolution_details && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 font-medium mb-0.5">Resolution Details</p>
                  <p className="text-xs text-green-800">{complaint.resolution_details}</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Analysis */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-secondary" />
              <h2 className="font-semibold text-gray-700 text-sm">AI Analysis</h2>
              {ai?.analysis_status === 'pending' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Processing...</span>}
              {ai?.analysis_status === 'failed' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Failed</span>}
              {ai?.analysis_status === 'completed' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Complete</span>}
            </div>

            {!ai || ai.analysis_status === 'pending' ? (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-blue-700">AI is analyzing your complaint...</p>
              </div>
            ) : ai.analysis_status === 'failed' ? (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-700">AI analysis failed. Your complaint has been saved and will be reviewed manually.</p>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {ai.ai_summary && <div>
                  <p className="text-xs text-gray-400">Summary</p>
                  <p className="text-gray-700 mt-0.5 text-xs leading-relaxed">{ai.ai_summary}</p>
                </div>}
                <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-700">Priority: <PriorityBadge priority={ai.priority} /></p>
                    <p className="text-xs text-gray-500 mt-1">{ai.priority_reason}</p>
                  </div>
                </div>
                {ai.recommended_action && <div>
                  <p className="text-xs text-gray-400">Recommended Action</p>
                  <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{ai.recommended_action}</p>
                </div>}
              </div>
            )}
          </div>
        </div>

        {/* Image */}
        {complaint.complaint_images?.length > 0 && (
          <div className="card mt-4">
            <h2 className="font-semibold text-gray-700 text-sm mb-3">Attached Photo</h2>
            <img src={complaint.complaint_images[0].image_url} alt="Complaint" className="w-full h-64 object-cover rounded-lg" />
          </div>
        )}

        {/* Map */}
        {complaint.latitude && complaint.longitude && (
          <div className="card mt-4">
            <h2 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" /> Location on Map
            </h2>
            <div className="h-48 rounded-lg overflow-hidden">
              <MapContainer center={[parseFloat(complaint.latitude), parseFloat(complaint.longitude)]} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
                <Marker position={[parseFloat(complaint.latitude), parseFloat(complaint.longitude)]}>
                  <Popup>{complaint.title}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        )}

        {/* Status History */}
        {complaint.status_history?.length > 0 && (
          <div className="card mt-4">
            <h2 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" /> Activity Timeline
            </h2>
            <div className="space-y-3">
              {[...complaint.status_history].reverse().map((h, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Status: <StatusBadge status={h.new_status} /></p>
                    {h.remarks && <p className="text-xs text-gray-500 mt-0.5">{h.remarks}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{format(new Date(h.created_at), 'PPp')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

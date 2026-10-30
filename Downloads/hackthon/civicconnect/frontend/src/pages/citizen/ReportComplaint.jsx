import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Upload, X, ChevronLeft, AlertCircle, CheckCircle, Brain, Camera } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { complaintAPI } from '../../services/api';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const CATEGORIES = ['Road Damage', 'Waterlogging', 'Garbage Overflow', 'Streetlight Failure', 'Drainage Problem', 'Water Supply', 'Other'];

function MapPicker({ position, onSelect }) {
  useMapEvents({
    click(e) { onSelect(e.latlng); }
  });
  return position ? <Marker position={position} /> : null;
}

export default function ReportComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '', location_address: '', latitude: '', longitude: '' });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [mapPos, setMapPos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [step, setStep] = useState(1);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('Image must be under 10 MB');
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file');
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleMapClick = useCallback((latlng) => {
    setMapPos(latlng);
    setForm(f => ({ ...f, latitude: latlng.lat.toFixed(6), longitude: latlng.lng.toFixed(6) }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Please enter a complaint title');
    if (!form.description.trim() || form.description.length < 20) return toast.error('Description must be at least 20 characters');
    if (!form.category) return toast.error('Please select a category');
    if (!form.location_address.trim()) return toast.error('Please enter the location address');

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (image) fd.append('image', image);

      const res = await complaintAPI.submit(fd);
      setSubmitted(res.data);
      toast.success('Complaint submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-civic-bg flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card max-w-md w-full text-center py-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-primary mb-2">Complaint Submitted!</h2>
          <p className="text-gray-500 text-sm mb-1">Your complaint has been recorded.</p>
          <div className="inline-flex items-center gap-2 bg-primary/5 text-primary rounded-lg px-4 py-2 my-3">
            <span className="font-mono text-sm font-bold">{submitted.complaint_number}</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3 mb-6 text-left">
            <Brain className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700">AI analysis is processing in the background. Priority and department will be assigned shortly.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link to={`/complaints/${submitted.complaint_id}`} className="btn-primary text-sm">View Complaint</Link>
            <Link to="/dashboard" className="btn-outline text-sm">My Dashboard</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-civic-bg py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-primary">Report a Problem</h1>
            <p className="text-gray-500 text-sm">Share the details of the public issue you've encountered</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Complaint Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Complaint Title *</label>
              <input type="text" placeholder="e.g. Large pothole on Main Road near bus stop"
                value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="input-field" maxLength={150} required />
              <p className="text-xs text-gray-400 mt-1">{form.title.length}/150 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="input-field" required>
                <option value="">Select issue category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Detailed Description *</label>
              <textarea placeholder="Describe the issue in detail. Include how long it has existed, safety risks, and who is affected. The more detail you provide, the better the AI can analyze it."
                value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="input-field resize-none" rows={4} minLength={20} maxLength={1000} required />
              <p className="text-xs text-gray-400 mt-1">{form.description.length}/1000 characters (min 20)</p>
            </div>
          </div>

          {/* Location */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Location</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address / Landmark *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="e.g. MG Road, Near Bus Stop, Bengaluru"
                  value={form.location_address} onChange={e => setForm({...form, location_address: e.target.value})}
                  className="input-field pl-10" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pin on Map (click to set location)</label>
              <div className="h-56 rounded-lg overflow-hidden border border-gray-200">
                <MapContainer center={[12.9716, 77.5946]} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
                  <MapPicker position={mapPos} onSelect={handleMapClick} />
                </MapContainer>
              </div>
              {mapPos && (
                <p className="text-xs text-secondary mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Location pinned: {mapPos.lat.toFixed(5)}, {mapPos.lng.toFixed(5)}
                </p>
              )}
              {!mapPos && <p className="text-xs text-gray-400 mt-1">Click on the map to pin your exact location (recommended)</p>}
            </div>
          </div>

          {/* Image upload */}
          <div className="card">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Photo Evidence (Recommended)</h2>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <button type="button" onClick={() => { setImage(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-secondary/50 hover:bg-secondary/5 transition-all">
                <Camera className="w-8 h-8 text-gray-300 mb-2" />
                <span className="text-sm text-gray-500">Click to upload photo</span>
                <span className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 10 MB</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Link to="/dashboard" className="flex-1 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 text-center transition-all">
              Cancel
            </Link>
            <button type="submit" disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 text-sm">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Submitting...</span></>
              ) : (
                <>Submit Complaint</>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            <AlertCircle className="w-3 h-3 inline mr-1" />
            AI analysis will run automatically after submission
          </p>
        </form>
      </div>
    </div>
  );
}

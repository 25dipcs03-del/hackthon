import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Building2, X, Save, Mail, Phone, User, FileText } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { PageHeader, LoadingSpinner, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';

const EMPTY = { name: '', description: '', head_officer: '', email: '', phone: '' };

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | dept object
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await adminAPI.getDepartments();
      setDepartments(res.data.data || []);
    } catch { toast.error('Failed to load departments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (d) => { setForm({ name: d.name, description: d.description || '', head_officer: d.head_officer || '', email: d.email || '', phone: d.phone || '' }); setModal(d); };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Department name is required');
    setSaving(true);
    try {
      if (modal === 'add') {
        await adminAPI.createDepartment(form);
        toast.success('Department created');
      } else {
        await adminAPI.updateDepartment(modal.id, form);
        toast.success('Department updated');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save department');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this department? Assigned complaints will be unlinked.')) return;
    try {
      await adminAPI.deleteDepartment(id);
      toast.success('Department deleted');
      load();
    } catch { toast.error('Failed to delete department'); }
  };

  return (
    <div>
      <PageHeader
        title="Department Management"
        subtitle="Manage departments responsible for complaint resolution"
        action={<button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Department</button>}
      />

      {loading ? <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {!departments.length ? (
            <div className="col-span-full">
              <EmptyState icon={Building2} title="No departments" description="Add your first department" action={<button onClick={openAdd} className="btn-primary text-sm">Add Department</button>} />
            </div>
          ) : departments.map(dept => (
            <motion.div key={dept.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(dept)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(dept.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-primary mb-1">{dept.name}</h3>
              {dept.description && <p className="text-xs text-gray-500 mb-3 leading-relaxed">{dept.description}</p>}
              <div className="space-y-1 text-xs text-gray-500">
                {dept.head_officer && <p className="flex items-center gap-1.5"><User className="w-3 h-3" />{dept.head_officer}</p>}
                {dept.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{dept.email}</p>}
                {dept.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{dept.phone}</p>}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  <FileText className="w-3 h-3 inline mr-1" />{dept.complaint_count ?? 0} assigned complaints
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-primary">{modal === 'add' ? 'Add Department' : 'Edit Department'}</h2>
                <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Department Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field text-sm" placeholder="e.g. Road Maintenance" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field text-sm resize-none" rows={2} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Head Officer</label>
                  <input type="text" value={form.head_officer} onChange={e => setForm({...form, head_officer: e.target.value})} className="input-field text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-2.5">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-3.5 h-3.5" /> Save</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

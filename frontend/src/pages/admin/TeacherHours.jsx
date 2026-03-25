import React, { useState, useEffect } from 'react';
import { getTeacherHours, createTeacherHours, updateTeacherHours, deleteTeacherHours, getUsers } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

function HoursForm({ initial, teachers, onSubmit, loading, error }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    teacher_user_id: initial?.teacher_user_id || '',
    work_date: initial?.work_date?.split('T')[0] || today,
    hours_worked: initial?.hours_worked || '',
    notes: initial?.notes || '',
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
      {!initial && (
        <div>
          <label className="form-label">Teacher *</label>
          <select className="form-select" required value={form.teacher_user_id} onChange={(e) => set('teacher_user_id', e.target.value)}>
            <option value="">Select teacher...</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.email})</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Date *</label>
          <input type="date" className="form-input" required value={form.work_date} onChange={(e) => set('work_date', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Hours Worked *</label>
          <input type="number" step="0.25" min="0" max="24" className="form-input" required value={form.hours_worked} onChange={(e) => set('hours_worked', e.target.value)} placeholder="e.g. 7.5" />
        </div>
      </div>
      <div>
        <label className="form-label">Notes</label>
        <input className="form-input" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional notes" />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : initial ? 'Save Changes' : 'Log Hours'}
        </button>
      </div>
    </form>
  );
}

export default function AdminTeacherHours() {
  const [hours, setHours] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ teacher_id: '', date_from: '', date_to: '' });
  const [modal, setModal] = useState({ open: false, record: null });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.teacher_id) params.teacher_id = filters.teacher_id;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      const r = await getTeacherHours(params);
      setHours(r.data.hours);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    getUsers({ role: 'teacher', status: 'active' }).then((r) => setTeachers(r.data.users)).catch(console.error);
  }, []);

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hours record?')) return;
    try { await deleteTeacherHours(id); load(); }
    catch (e) { alert(e.response?.data?.error || 'Failed to delete'); }
  };

  const handleSubmit = async (form) => {
    setFormLoading(true); setFormError('');
    try {
      if (modal.record) await updateTeacherHours(modal.record.id, form);
      else await createTeacherHours(form);
      setModal({ open: false, record: null }); load();
    } catch (e) {
      setFormError(e.response?.data?.error || 'An error occurred');
    } finally { setFormLoading(false); }
  };

  const totalHours = hours.reduce((s, h) => s + parseFloat(h.hours_worked || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Hours</h1>
        <button onClick={() => { setModal({ open: true, record: null }); setFormError(''); }} className="btn-primary">+ Log Hours</button>
      </div>

      <div className="card mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label">Teacher</label>
            <select className="form-select w-48" value={filters.teacher_id} onChange={(e) => setFilters((f) => ({ ...f, teacher_id: e.target.value }))}>
              <option value="">All Teachers</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">From Date</label>
            <input type="date" className="form-input w-36" value={filters.date_from} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input type="date" className="form-input w-36" value={filters.date_to} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))} />
          </div>
          <button onClick={load} className="btn-secondary">Filter</button>
        </div>
      </div>

      {hours.length > 0 && (
        <div className="card mb-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Total:</strong> {totalHours.toFixed(2)} hours across {hours.length} records
          </p>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          {!hours.length ? (
            <EmptyState icon="⏱" title="No hours logged" description="Log hours for teachers to track work time." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>{['Teacher', 'Date', 'Hours', 'Notes', 'Logged By', 'Actions'].map((h) => <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hours.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{h.first_name} {h.last_name}</td>
                      <td className="table-cell">{h.work_date?.split('T')[0]}</td>
                      <td className="table-cell"><span className="font-semibold text-blue-700">{parseFloat(h.hours_worked).toFixed(2)}h</span></td>
                      <td className="table-cell text-gray-500">{h.notes || '–'}</td>
                      <td className="table-cell text-gray-500 text-xs">{h.admin_first_name} {h.admin_last_name}</td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <button onClick={() => { setModal({ open: true, record: h }); setFormError(''); }} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(h.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false, record: null })} title={modal.record ? 'Edit Hours' : 'Log Teacher Hours'}>
        <HoursForm initial={modal.record} teachers={teachers} onSubmit={handleSubmit} loading={formLoading} error={formError} />
      </Modal>
    </div>
  );
}

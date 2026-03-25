import React, { useState, useEffect } from 'react';
import { getStudents, createStudent, updateStudent, assignTeachers, assignParents, getUsers } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

function StudentForm({ initial, onSubmit, loading, error }) {
  const [form, setForm] = useState({
    first_name: initial?.first_name || '',
    last_name: initial?.last_name || '',
    display_name: initial?.display_name || '',
    date_of_birth: initial?.date_of_birth?.split('T')[0] || '',
    grade_class: initial?.grade_class || '',
    status: initial?.status || 'active',
    notes: initial?.notes || '',
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">First Name *</label>
          <input className="form-input" required value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Last Name *</label>
          <input className="form-input" required value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="form-label">Display Name</label>
        <input className="form-input" value={form.display_name} onChange={(e) => set('display_name', e.target.value)} placeholder="e.g. Ethan J." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Date of Birth</label>
          <input type="date" className="form-input" value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Grade/Class</label>
          <input className="form-input" value={form.grade_class} onChange={(e) => set('grade_class', e.target.value)} placeholder="e.g. Grade 3" />
        </div>
      </div>
      {initial && (
        <div>
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      )}
      <div>
        <label className="form-label">Notes</label>
        <textarea className="form-textarea" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Student'}
        </button>
      </div>
    </form>
  );
}

function AssignModal({ student, type, onClose, onSaved }) {
  const [allUsers, setAllUsers] = useState([]);
  const [selected, setSelected] = useState(
    type === 'teachers'
      ? (student.teachers || []).map((t) => t.id)
      : (student.parents || []).map((p) => p.id)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsers({ role: type === 'teachers' ? 'teacher' : 'parent', status: 'active' })
      .then((r) => setAllUsers(r.data.users))
      .catch(console.error);
  }, [type]);

  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const handleSave = async () => {
    if (!selected.length) { setError('Select at least one user'); return; }
    setLoading(true);
    try {
      if (type === 'teachers') await assignTeachers(student.id, selected);
      else await assignParents(student.id, selected);
      onSaved();
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
      <p className="text-sm text-gray-500">Assigning {type} to <strong>{student.first_name} {student.last_name}</strong></p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {allUsers.map((u) => (
          <label key={u.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} className="rounded" />
            <span className="text-sm">{u.first_name} {u.last_name} <span className="text-gray-400">({u.email})</span></span>
          </label>
        ))}
        {!allUsers.length && <p className="text-sm text-gray-400 text-center py-4">No {type} found</p>}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [modal, setModal] = useState({ open: false, student: null, type: 'form' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const r = await getStudents(params);
      setStudents(r.data.students);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const closeModal = () => setModal({ open: false, student: null, type: 'form' });

  const handleFormSubmit = async (form) => {
    setFormLoading(true); setFormError('');
    try {
      if (modal.student) await updateStudent(modal.student.id, form);
      else await createStudent(form);
      closeModal(); load();
    } catch (e) {
      setFormError(e.response?.data?.error || 'An error occurred');
    } finally { setFormLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <button onClick={() => { setModal({ open: true, student: null, type: 'form' }); setFormError(''); }} className="btn-primary">+ Add Student</button>
      </div>

      <div className="card mb-4">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex flex-wrap gap-3">
          <input className="form-input w-48" placeholder="Search name..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="form-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="btn-secondary">Search</button>
        </form>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          {!students.length ? (
            <EmptyState icon="🎒" title="No students found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name', 'Grade', 'Teachers', 'Parents', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="font-medium">{s.display_name || `${s.first_name} ${s.last_name}`}</div>
                        <div className="text-xs text-gray-400">{s.first_name} {s.last_name}</div>
                      </td>
                      <td className="table-cell text-gray-500">{s.grade_class || '–'}</td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {s.teachers?.length ? s.teachers.map((t) => (
                            <span key={t.id} className="badge-blue text-xs">{t.first_name}</span>
                          )) : <span className="text-gray-400 text-xs">None</span>}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {s.parents?.length ? s.parents.map((p) => (
                            <span key={p.id} className="badge-yellow text-xs">{p.first_name}</span>
                          )) : <span className="text-gray-400 text-xs">None</span>}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={s.status === 'active' ? 'badge-green' : 'badge-red'}>{s.status}</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <button onClick={() => { setModal({ open: true, student: s, type: 'form' }); setFormError(''); }} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                          <button onClick={() => setModal({ open: true, student: s, type: 'teachers' })} className="text-green-600 hover:text-green-800 text-xs font-medium">Teachers</button>
                          <button onClick={() => setModal({ open: true, student: s, type: 'parents' })} className="text-purple-600 hover:text-purple-800 text-xs font-medium">Parents</button>
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

      <Modal
        open={modal.open}
        onClose={closeModal}
        title={
          modal.type === 'form' ? (modal.student ? 'Edit Student' : 'Add Student') :
          modal.type === 'teachers' ? 'Assign Teachers' : 'Assign Parents'
        }
      >
        {modal.type === 'form' && (
          <StudentForm initial={modal.student} onSubmit={handleFormSubmit} loading={formLoading} error={formError} />
        )}
        {(modal.type === 'teachers' || modal.type === 'parents') && modal.student && (
          <AssignModal student={modal.student} type={modal.type} onClose={closeModal} onSaved={load} />
        )}
      </Modal>
    </div>
  );
}

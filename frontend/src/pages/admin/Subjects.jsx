import React, { useState, useEffect } from 'react';
import { getSubjects, createSubject, updateSubject } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

function SubjectForm({ initial, onSubmit, loading, error }) {
  const [name, setName] = useState(initial?.name || '');
  const [status, setStatus] = useState(initial?.status || 'active');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, status }); }} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
      <div>
        <label className="form-label">Subject Name *</label>
        <input className="form-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Math" />
      </div>
      {initial && (
        <div>
          <label className="form-label">Status</label>
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Subject'}
        </button>
      </div>
    </form>
  );
}

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, subject: null });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    try { const r = await getSubjects(); setSubjects(r.data.subjects); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (form) => {
    setFormLoading(true); setFormError('');
    try {
      if (modal.subject) await updateSubject(modal.subject.id, form);
      else await createSubject(form);
      setModal({ open: false, subject: null }); load();
    } catch (e) {
      setFormError(e.response?.data?.error || 'An error occurred');
    } finally { setFormLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
        <button onClick={() => { setModal({ open: true, subject: null }); setFormError(''); }} className="btn-primary">+ Add Subject</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          {!subjects.length ? (
            <EmptyState icon="📚" title="No subjects yet" description="Add school subjects to get started." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Subject', 'Status', 'Created', 'Actions'].map((h) => <th key={h} className="table-header">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subjects.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{s.name}</td>
                      <td className="table-cell"><span className={s.status === 'active' ? 'badge-green' : 'badge-red'}>{s.status}</span></td>
                      <td className="table-cell text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="table-cell">
                        <button onClick={() => { setModal({ open: true, subject: s }); setFormError(''); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false, subject: null })} title={modal.subject ? 'Edit Subject' : 'Add Subject'}>
        <SubjectForm initial={modal.subject} onSubmit={handleSubmit} loading={formLoading} error={formError} />
      </Modal>
    </div>
  );
}

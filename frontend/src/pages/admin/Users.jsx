import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

const ROLES = ['admin', 'teacher', 'parent'];

function UserForm({ initial, onSubmit, loading, error }) {
  const [form, setForm] = useState({
    first_name: initial?.first_name || '',
    last_name: initial?.last_name || '',
    email: initial?.email || '',
    password: '',
    role: initial?.role || 'teacher',
    status: initial?.status || 'active',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <label className="form-label">Email *</label>
        <input type="email" className="form-input" required value={form.email} onChange={(e) => set('email', e.target.value)} />
      </div>
      <div>
        <label className="form-label">{initial ? 'New Password (leave blank to keep)' : 'Password *'}</label>
        <input type="password" className="form-input" required={!initial} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min. 6 characters" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Role *</label>
          <select className="form-select" value={form.role} onChange={(e) => set('role', e.target.value)} disabled={!!initial}>
            {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
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
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create User'}
        </button>
      </div>
    </form>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', status: '', search: '' });
  const [modal, setModal] = useState({ open: false, user: null });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    const params = {};
    if (filters.role) params.role = filters.role;
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    try {
      const r = await getUsers(params);
      setUsers(r.data.users);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters.role, filters.status]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const openCreate = () => { setModal({ open: true, user: null }); setFormError(''); };
  const openEdit = (u) => { setModal({ open: true, user: u }); setFormError(''); };
  const closeModal = () => setModal({ open: false, user: null });

  const handleSubmit = async (form) => {
    setFormLoading(true);
    setFormError('');
    try {
      if (modal.user) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await updateUser(modal.user.id, payload);
      } else {
        await createUser(form);
      }
      closeModal();
      load();
    } catch (e) {
      setFormError(e.response?.data?.error || 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const roleBadge = { admin: 'badge-blue', teacher: 'badge-green', parent: 'badge-yellow' };
  const statusBadge = { active: 'badge-green', inactive: 'badge-red' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button onClick={openCreate} className="btn-primary">+ Add User</button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <input
            className="form-input w-48"
            placeholder="Search name or email..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <select className="form-select w-36" value={filters.role} onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}>
            <option value="">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <select className="form-select w-36" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="btn-secondary">Search</button>
        </form>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          {!users.length ? (
            <EmptyState icon="👥" title="No users found" description="Create your first user to get started." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{u.first_name} {u.last_name}</td>
                      <td className="table-cell text-gray-500">{u.email}</td>
                      <td className="table-cell"><span className={roleBadge[u.role]}>{u.role}</span></td>
                      <td className="table-cell"><span className={statusBadge[u.status]}>{u.status}</span></td>
                      <td className="table-cell text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="table-cell">
                        <button onClick={() => openEdit(u)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={modal.open} onClose={closeModal} title={modal.user ? 'Edit User' : 'Add User'}>
        <UserForm initial={modal.user} onSubmit={handleSubmit} loading={formLoading} error={formError} />
      </Modal>
    </div>
  );
}

import React, { useState } from 'react';
import Modal from '../../components/Modal';

const mockAnnouncements = [
  { id: 1, title: 'Spring Break Schedule', body: 'School will be closed from April 14–18. Classes resume April 21. Enjoy your break!', audience: 'Everyone', author: 'Sarah Mitchell', date: '2026-03-20', pinned: true },
  { id: 2, title: 'Parent-Teacher Conference Day', body: 'Scheduled for March 28. Please check your email for individual time slots.', audience: 'Parents', author: 'Sarah Mitchell', date: '2026-03-18', pinned: true },
  { id: 3, title: 'New Evaluation Templates Available', body: 'Updated evaluation templates for Math and Science are now live. Please use them starting this week.', audience: 'Teachers', author: 'Sarah Mitchell', date: '2026-03-15', pinned: false },
  { id: 4, title: 'Fire Drill on Friday', body: 'A fire drill is scheduled for Friday at 10:00 AM. Please prepare your students accordingly.', audience: 'Everyone', author: 'Sarah Mitchell', date: '2026-03-12', pinned: false },
];

const AUDIENCES = ['Everyone', 'Parents', 'Teachers'];

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({ title: '', body: '', audience: 'Everyone', pinned: false });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = filter === 'All' ? announcements : announcements.filter(a => a.audience === filter);
  const pinned = filtered.filter(a => a.pinned);
  const rest = filtered.filter(a => !a.pinned);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAnnouncements(prev => [{
      ...form, id: Date.now(), author: 'Sarah Mitchell', date: new Date().toISOString().split('T')[0],
    }, ...prev]);
    setModal(false);
    setForm({ title: '', body: '', audience: 'Everyone', pinned: false });
  };

  const togglePin = (id) => setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a));
  const remove = (id) => setAnnouncements(prev => prev.filter(a => a.id !== id));

  const Card = ({ a }) => (
    <div className={`card ${a.pinned ? 'border-l-4 border-l-blue-500' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {a.pinned && <span className="text-xs text-blue-600 font-medium">📌 Pinned</span>}
            <h3 className="font-semibold text-gray-900">{a.title}</h3>
            <span className={`badge ${a.audience === 'Everyone' ? 'badge-blue' : a.audience === 'Parents' ? 'badge-yellow' : 'badge-green'}`}>
              {a.audience}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">{a.body}</p>
          <p className="text-xs text-gray-400 mt-2">By {a.author} · {a.date}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => togglePin(a.id)} title={a.pinned ? 'Unpin' : 'Pin'}
            className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors">📌</button>
          <button onClick={() => remove(a.id)}
            className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors">🗑</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">School Announcements</h1>
        <button onClick={() => setModal(true)} className="btn-primary">+ New Announcement</button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['All', ...AUDIENCES].map(opt => (
          <button key={opt} onClick={() => setFilter(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === opt ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
            {opt}
          </button>
        ))}
      </div>

      {pinned.length > 0 && (
        <div className="space-y-3 mb-4">
          {pinned.map(a => <Card key={a.id} a={a} />)}
        </div>
      )}
      <div className="space-y-3">
        {rest.map(a => <Card key={a.id} a={a} />)}
        {filtered.length === 0 && (
          <div className="card text-center text-gray-400 py-10">No announcements found.</div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Announcement">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Title *</label>
            <input className="form-input" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Announcement title" />
          </div>
          <div>
            <label className="form-label">Message *</label>
            <textarea className="form-textarea" rows={4} required value={form.body} onChange={e => set('body', e.target.value)} placeholder="Write your announcement..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Audience</label>
              <select className="form-select" value={form.audience} onChange={e => set('audience', e.target.value)}>
                {AUDIENCES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.pinned} onChange={e => set('pinned', e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-700">Pin this announcement</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Post</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import React, { useState } from 'react';
import Modal from '../../components/Modal';

const mockAnnouncements = [
  { id: 1, title: 'Spring Break Schedule', body: 'School will be closed from April 14–18. Classes resume April 21.', type: 'school', author: 'Sarah Mitchell', date: '2026-03-20', pinned: true },
  { id: 2, title: 'Math Quiz on Friday', body: 'Reminder: there will be a short quiz on addition and subtraction this Friday. Please review pages 10–15.', type: 'course', course: 'Math - Grade 3', author: 'James Turner', date: '2026-03-22', pinned: false },
  { id: 3, title: 'Reading Assignment Updated', body: 'The reading assignment due date has been moved to April 2nd. Please check the assignments section.', type: 'course', course: 'Reading - Grade 3', author: 'James Turner', date: '2026-03-21', pinned: false },
  { id: 4, title: 'Parent-Teacher Conference Day', body: 'Scheduled for March 28. Please check your email for individual time slots.', type: 'school', author: 'Sarah Mitchell', date: '2026-03-18', pinned: true },
];

const COURSES = ['Math - Grade 3', 'Reading - Grade 3', 'Science - Grade 3'];

export default function TeacherAnnouncements() {
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({ title: '', body: '', course: COURSES[0] });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = filter === 'All' ? announcements
    : filter === 'School' ? announcements.filter(a => a.type === 'school')
    : announcements.filter(a => a.type === 'course');

  const handleSubmit = (e) => {
    e.preventDefault();
    setAnnouncements(prev => [{
      ...form, id: Date.now(), type: 'course', author: 'James Turner',
      date: new Date().toISOString().split('T')[0], pinned: false,
    }, ...prev]);
    setModal(false);
    setForm({ title: '', body: '', course: COURSES[0] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <button onClick={() => setModal(true)} className="btn-primary">+ Post Announcement</button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['All', 'School', 'Course'].map(opt => (
          <button key={opt} onClick={() => setFilter(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === opt ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
            {opt}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(a => (
          <div key={a.id} className={`card ${a.pinned ? 'border-l-4 border-l-blue-500' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.pinned && <span className="text-xs text-blue-600 font-medium">📌</span>}
                  <span className={a.type === 'school' ? 'badge-blue' : 'badge-green'}>
                    {a.type === 'school' ? 'School-wide' : a.course}
                  </span>
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-2">{a.body}</p>
                <p className="text-xs text-gray-400 mt-2">By {a.author} · {a.date}</p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="card text-center text-gray-400 py-10">No announcements.</div>}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Post Course Announcement">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Course</label>
            <select className="form-select" value={form.course} onChange={e => set('course', e.target.value)}>
              {COURSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Title *</label>
            <input className="form-input" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Announcement title" />
          </div>
          <div>
            <label className="form-label">Message *</label>
            <textarea className="form-textarea" rows={4} required value={form.body} onChange={e => set('body', e.target.value)} placeholder="Write your message..." />
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

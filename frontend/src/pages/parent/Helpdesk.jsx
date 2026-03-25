import React, { useState } from 'react';
import Modal from '../../components/Modal';

const mockTickets = [
  { id: 1, subject: 'Unable to view evaluation results', category: 'Technical', status: 'resolved', date: '2026-03-15', messages: [
    { from: 'parent', text: 'I cannot see the latest evaluation for Ethan. The page shows blank.', date: '2026-03-15' },
    { from: 'school', text: 'Thank you for reporting this. The issue has been fixed. Please try refreshing your browser.', date: '2026-03-15' },
  ]},
  { id: 2, subject: 'Question about assignment due date', category: 'Academic', status: 'open', date: '2026-03-22', messages: [
    { from: 'parent', text: 'Hi, can you please clarify the due date for the reading assignment? The portal shows March 30 but the teacher mentioned April 2nd.', date: '2026-03-22' },
  ]},
  { id: 3, subject: 'Request for additional learning resources', category: 'Academic', status: 'in-progress', date: '2026-03-20', messages: [
    { from: 'parent', text: 'Could you please share some extra math practice materials for Grade 3 students?', date: '2026-03-20' },
    { from: 'school', text: 'We are compiling a resource list and will share it by end of week.', date: '2026-03-21' },
  ]},
];

const CATEGORIES = ['Technical', 'Academic', 'Billing', 'General', 'Other'];
const statusBadge = { open: 'badge-yellow', 'in-progress': 'badge-blue', resolved: 'badge-green' };
const statusIcon = { open: '🟡', 'in-progress': '🔵', resolved: '🟢' };

export default function ParentHelpdesk() {
  const [tickets, setTickets] = useState(mockTickets);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'General', message: '' });
  const [reply, setReply] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = (e) => {
    e.preventDefault();
    const newTicket = {
      ...form, id: Date.now(), status: 'open',
      date: new Date().toISOString().split('T')[0],
      messages: [{ from: 'parent', text: form.message, date: new Date().toISOString().split('T')[0] }],
    };
    setTickets(prev => [newTicket, ...prev]);
    setModal(false);
    setForm({ subject: '', category: 'General', message: '' });
  };

  const handleReply = (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    const msg = { from: 'parent', text: reply, date: new Date().toISOString().split('T')[0] };
    setTickets(prev => prev.map(t => t.id !== selected.id ? t : { ...t, messages: [...t.messages, msg] }));
    setSelected(prev => ({ ...prev, messages: [...prev.messages, msg] }));
    setReply('');
  };

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} className="text-blue-600 hover:text-blue-800 text-sm mb-4 flex items-center gap-1">← Back to Helpdesk</button>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{selected.subject}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="badge-gray">{selected.category}</span>
              <span className={statusBadge[selected.status]}>{selected.status}</span>
              <span className="text-xs text-gray-400">Opened {selected.date}</span>
            </div>
          </div>
        </div>

        <div className="card mb-4 space-y-4">
          {selected.messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.from === 'parent' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${m.from === 'parent' ? 'bg-blue-500' : 'bg-green-500'}`}>
                {m.from === 'parent' ? 'P' : 'S'}
              </div>
              <div className={`max-w-sm rounded-lg p-3 text-sm ${m.from === 'parent' ? 'bg-blue-50 text-blue-900' : 'bg-gray-100 text-gray-800'}`}>
                <p>{m.text}</p>
                <p className="text-xs text-gray-400 mt-1">{m.date}</p>
              </div>
            </div>
          ))}
        </div>

        {selected.status !== 'resolved' && (
          <form onSubmit={handleReply} className="card flex gap-3">
            <textarea
              className="form-textarea flex-1"
              rows={2}
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Type your reply..."
            />
            <button type="submit" className="btn-primary btn-sm self-end">Send</button>
          </form>
        )}
        {selected.status === 'resolved' && (
          <div className="card text-center text-green-600 font-medium py-4">✅ This ticket has been resolved.</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Helpdesk</h1>
        <button onClick={() => setModal(true)} className="btn-primary">+ New Ticket</button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Submit a support request and track your tickets.</p>

      <div className="space-y-3">
        {tickets.map(t => (
          <div key={t.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(t)}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>{statusIcon[t.status]}</span>
                  <h3 className="font-semibold text-gray-900">{t.subject}</h3>
                  <span className={statusBadge[t.status]}>{t.status}</span>
                  <span className="badge-gray">{t.category}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Opened {t.date} · {t.messages.length} message{t.messages.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        ))}
        {tickets.length === 0 && <div className="card text-center text-gray-400 py-10">No tickets yet.</div>}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Support Ticket">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="form-label">Subject *</label>
            <input className="form-input" required value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Brief description of your issue" />
          </div>
          <div>
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Message *</label>
            <textarea className="form-textarea" rows={4} required value={form.message} onChange={e => set('message', e.target.value)} placeholder="Describe your issue in detail..." />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Submit Ticket</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

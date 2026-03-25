import React, { useState } from 'react';
import Modal from '../../components/Modal';

const SUBJECTS = ['Math', 'Reading', 'Writing', 'Science', 'Behavior & Social Skills'];

const mockAssignments = [
  { id: 1, title: 'Addition Worksheet', subject: 'Math', dueDate: '2026-03-28', instructions: 'Complete all problems on pages 12-13.', students: 3, submissions: [
    { name: 'Ethan J.', status: 'submitted', grade: null, file: 'ethan_math.pdf' },
    { name: 'Lucas W.', status: 'submitted', grade: 'B+', file: 'lucas_math.pdf' },
    { name: 'Noah B.', status: 'pending', grade: null, file: null },
  ]},
  { id: 2, title: 'Reading Comprehension - Chapter 2', subject: 'Reading', dueDate: '2026-03-30', instructions: 'Read Chapter 2 and answer the questions.', students: 3, submissions: [
    { name: 'Ethan J.', status: 'submitted', grade: 'A', file: 'ethan_reading.pdf' },
    { name: 'Lucas W.', status: 'pending', grade: null, file: null },
    { name: 'Noah B.', status: 'pending', grade: null, file: null },
  ]},
  { id: 3, title: 'Creative Writing Essay', subject: 'Writing', dueDate: '2026-04-05', instructions: 'Write a 1-page creative story of your choice.', students: 3, submissions: [
    { name: 'Ethan J.', status: 'pending', grade: null, file: null },
    { name: 'Lucas W.', status: 'pending', grade: null, file: null },
    { name: 'Noah B.', status: 'pending', grade: null, file: null },
  ]},
];

const GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState(mockAssignments);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', subject: 'Math', dueDate: '', instructions: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = (e) => {
    e.preventDefault();
    const newA = {
      ...form, id: Date.now(), students: 3,
      submissions: [
        { name: 'Ethan J.', status: 'pending', grade: null, file: null },
        { name: 'Lucas W.', status: 'pending', grade: null, file: null },
        { name: 'Noah B.', status: 'pending', grade: null, file: null },
      ],
    };
    setAssignments(prev => [newA, ...prev]);
    setModal(false);
    setForm({ title: '', subject: 'Math', dueDate: '', instructions: '' });
  };

  const setGrade = (assignmentId, studentName, grade) => {
    setAssignments(prev => prev.map(a => a.id !== assignmentId ? a : {
      ...a, submissions: a.submissions.map(s => s.name !== studentName ? s : { ...s, grade }),
    }));
    if (selected?.id === assignmentId) {
      setSelected(prev => ({
        ...prev, submissions: prev.submissions.map(s => s.name !== studentName ? s : { ...s, grade }),
      }));
    }
  };

  const statusColor = { submitted: 'badge-blue', pending: 'badge-yellow', graded: 'badge-green' };

  if (selected) {
    const submitted = selected.submissions.filter(s => s.status === 'submitted' || s.grade).length;
    return (
      <div>
        <button onClick={() => setSelected(null)} className="text-blue-600 hover:text-blue-800 text-sm mb-4 flex items-center gap-1">← Back to Assignments</button>
        <div className="flex items-start justify-between mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selected.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{selected.subject} · Due {selected.dueDate}</p>
            {selected.instructions && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded">{selected.instructions}</p>}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{submitted}/{selected.students}</div>
            <div className="text-xs text-gray-500">submitted</div>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Student</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">File</th>
                  <th className="table-header">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selected.submissions.map(s => (
                  <tr key={s.name} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{s.name}</td>
                    <td className="table-cell">
                      <span className={statusColor[s.grade ? 'graded' : s.status] || 'badge-gray'}>
                        {s.grade ? 'graded' : s.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      {s.file ? (
                        <span className="text-blue-600 text-sm cursor-pointer hover:underline">📄 {s.file}</span>
                      ) : <span className="text-gray-400 text-sm">—</span>}
                    </td>
                    <td className="table-cell">
                      <select
                        className="form-select w-24 text-sm"
                        value={s.grade || ''}
                        onChange={e => setGrade(selected.id, s.name, e.target.value)}
                        disabled={s.status === 'pending' && !s.file}
                      >
                        <option value="">—</option>
                        {GRADES.map(g => <option key={g}>{g}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <button onClick={() => setModal(true)} className="btn-primary">+ New Assignment</button>
      </div>

      <div className="space-y-3">
        {assignments.map(a => {
          const submitted = a.submissions.filter(s => s.status === 'submitted' || s.grade).length;
          const pct = Math.round((submitted / a.students) * 100);
          return (
            <div key={a.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(a)}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{a.title}</span>
                    <span className="badge-blue">{a.subject}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Due {a.dueDate}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center hidden sm:block">
                    <div className="text-lg font-bold text-gray-900">{submitted}/{a.students}</div>
                    <div className="text-xs text-gray-500">submitted</div>
                  </div>
                  <div className="w-24 hidden sm:block">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-gray-400 mt-1 text-center">{pct}%</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Assignment">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="form-label">Title *</label>
            <input className="form-input" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Math Worksheet #3" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Subject</label>
              <select className="form-select" value={form.subject} onChange={e => set('subject', e.target.value)}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Due Date *</label>
              <input type="date" className="form-input" required value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="form-label">Instructions</label>
            <textarea className="form-textarea" rows={3} value={form.instructions} onChange={e => set('instructions', e.target.value)} placeholder="Describe what students need to do..." />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Assignment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import React, { useState } from 'react';
import Modal from '../../components/Modal';

const mockAssignments = [
  { id: 1, title: 'Addition Worksheet', subject: 'Math', dueDate: '2026-03-28', status: 'submitted', grade: 'B+', instructions: 'Complete all problems on pages 12-13.', submittedFile: 'ethan_math.pdf' },
  { id: 2, title: 'Reading Comprehension - Chapter 2', subject: 'Reading', dueDate: '2026-03-30', status: 'pending', grade: null, instructions: 'Read Chapter 2 and answer the questions.', submittedFile: null },
  { id: 3, title: 'Creative Writing Essay', subject: 'Writing', dueDate: '2026-04-05', status: 'pending', grade: null, instructions: 'Write a 1-page creative story of your choice.', submittedFile: null },
  { id: 4, title: 'Subtraction Quiz', subject: 'Math', dueDate: '2026-03-20', status: 'graded', grade: 'A', instructions: 'Complete the quiz.', submittedFile: 'ethan_quiz.pdf' },
];

const statusBadge = { submitted: 'badge-blue', pending: 'badge-yellow', graded: 'badge-green' };

export default function ParentAssignments() {
  const [assignments, setAssignments] = useState(mockAssignments);
  const [submitModal, setSubmitModal] = useState(null);
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? assignments : assignments.filter(a => a.status === filter.toLowerCase());

  const handleSubmit = (id) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'submitted', submittedFile: 'submission.pdf' } : a));
    setSubmitModal(null);
  };

  const pending = assignments.filter(a => a.status === 'pending').length;
  const graded = assignments.filter(a => a.grade).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <p className="text-sm text-gray-500 mt-1">Track and submit your child's assignments.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{pending}</div>
          <div className="text-xs text-gray-500 mt-1">Pending</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{assignments.filter(a => a.status === 'submitted').length}</div>
          <div className="text-xs text-gray-500 mt-1">Submitted</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{graded}</div>
          <div className="text-xs text-gray-500 mt-1">Graded</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['All', 'Pending', 'Submitted', 'Graded'].map(opt => (
          <button key={opt} onClick={() => setFilter(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === opt ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
            {opt}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(a => (
          <div key={a.id} className="card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  <span className={statusBadge[a.status] || 'badge-gray'}>{a.status}</span>
                  <span className="badge-gray">{a.subject}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Due {a.dueDate}</p>
                <p className="text-sm text-gray-600 mt-1">{a.instructions}</p>
                {a.submittedFile && (
                  <p className="text-sm text-blue-600 mt-1 cursor-pointer hover:underline">📄 {a.submittedFile}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {a.grade && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{a.grade}</div>
                    <div className="text-xs text-gray-500">grade</div>
                  </div>
                )}
                {a.status === 'pending' && (
                  <button onClick={() => setSubmitModal(a)} className="btn-primary btn-sm whitespace-nowrap">
                    Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="card text-center text-gray-400 py-10">No assignments found.</div>}
      </div>

      <Modal open={!!submitModal} onClose={() => setSubmitModal(null)} title={`Submit: ${submitModal?.title}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{submitModal?.instructions}</p>
          <div>
            <label className="form-label">Upload File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer transition-colors">
              <div className="text-4xl mb-2">📎</div>
              <p className="text-sm text-gray-600 font-medium">Click to browse or drag & drop</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, Images supported</p>
            </div>
          </div>
          <div>
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-textarea" rows={2} placeholder="Any notes for the teacher..." />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setSubmitModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleSubmit(submitModal.id)} className="btn-primary">Submit Assignment</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

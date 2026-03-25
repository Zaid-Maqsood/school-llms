import React, { useState } from 'react';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';

const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
const SUBJECTS = ['Math', 'Reading', 'Writing', 'Science', 'Behavior & Social Skills'];

const mockCourses = [
  { id: 1, name: 'Math - Grade 3', grade: 'Grade 3', subject: 'Math', teacher: 'James Turner', students: 8, materials: 12, status: 'active' },
  { id: 2, name: 'Reading - Grade 3', grade: 'Grade 3', subject: 'Reading', teacher: 'James Turner', students: 8, materials: 7, status: 'active' },
  { id: 3, name: 'Math - Grade 4', grade: 'Grade 4', subject: 'Math', teacher: 'Maria Lopez', students: 6, materials: 15, status: 'active' },
  { id: 4, name: 'Science - Grade 4', grade: 'Grade 4', subject: 'Science', teacher: 'Maria Lopez', students: 6, materials: 9, status: 'active' },
  { id: 5, name: 'Writing - Grade 2', grade: 'Grade 2', subject: 'Writing', teacher: 'James Turner', students: 5, materials: 3, status: 'inactive' },
  { id: 6, name: 'Science - Grade 3', grade: 'Grade 3', subject: 'Science', teacher: 'James Turner', students: 8, materials: 5, status: 'active' },
];

export default function AdminCourses() {
  const [courses, setCourses] = useState(mockCourses);
  const [gradeFilter, setGradeFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', grade: 'Grade 3', subject: 'Math', teacher: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = courses.filter(c =>
    (!gradeFilter || c.grade === gradeFilter) &&
    (!subjectFilter || c.subject === subjectFilter)
  );

  const handleCreate = (e) => {
    e.preventDefault();
    setCourses(prev => [...prev, { ...form, id: Date.now(), students: 0, materials: 0, status: 'active' }]);
    setModal(false);
    setForm({ name: '', grade: 'Grade 3', subject: 'Math', teacher: '' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <button onClick={() => setModal(true)} className="btn-primary">+ Create Course</button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <select className="form-select w-40" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
          <option value="">All Grades</option>
          {GRADES.map(g => <option key={g}>{g}</option>)}
        </select>
        <select className="form-select w-44" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-500 self-center">{filtered.length} course{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card overflow-hidden p-0">
        {!filtered.length ? (
          <EmptyState icon="📚" title="No courses found" description="Try a different filter or create a new course." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>{['Course', 'Grade', 'Subject', 'Teacher', 'Students', 'Materials', 'Status'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{c.name}</td>
                    <td className="table-cell text-gray-500">{c.grade}</td>
                    <td className="table-cell text-gray-500">{c.subject}</td>
                    <td className="table-cell text-gray-500">{c.teacher || '—'}</td>
                    <td className="table-cell text-gray-500">{c.students}</td>
                    <td className="table-cell text-gray-500">{c.materials} files</td>
                    <td className="table-cell">
                      <span className={c.status === 'active' ? 'badge-green' : 'badge-red'}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Create Course">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="form-label">Course Name *</label>
            <input className="form-input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Math - Grade 3" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Grade</label>
              <select className="form-select" value={form.grade} onChange={e => set('grade', e.target.value)}>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Subject</label>
              <select className="form-select" value={form.subject} onChange={e => set('subject', e.target.value)}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Teacher</label>
            <input className="form-input" value={form.teacher} onChange={e => set('teacher', e.target.value)} placeholder="Assign a teacher" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">Create Course</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

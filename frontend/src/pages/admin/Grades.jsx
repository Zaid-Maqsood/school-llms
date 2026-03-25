import React, { useState } from 'react';

const SUBJECTS = ['Math', 'Reading', 'Writing', 'Science', 'Behavior'];

const mockGrades = [
  { id: 1, student: 'Ethan J.', grade: 'Grade 3', Math: 85, Reading: 78, Writing: 82, Science: 79, Behavior: 90 },
  { id: 2, student: 'Mia C.', grade: 'Grade 4', Math: 92, Reading: 95, Writing: 94, Science: 88, Behavior: 96 },
  { id: 3, student: 'Lucas W.', grade: 'Grade 3', Math: 73, Reading: 68, Writing: 71, Science: 75, Behavior: 80 },
  { id: 4, student: 'Ava M.', grade: 'Grade 4', Math: 88, Reading: 91, Writing: 87, Science: 90, Behavior: 92 },
  { id: 5, student: 'Noah B.', grade: 'Grade 2', Math: 76, Reading: 80, Writing: 74, Science: null, Behavior: 85 },
];

const scoreColor = (s) => {
  if (s === null || s === undefined) return 'text-gray-300';
  if (s >= 90) return 'text-green-600 font-semibold';
  if (s >= 80) return 'text-blue-600 font-semibold';
  if (s >= 70) return 'text-yellow-600 font-semibold';
  return 'text-red-600 font-semibold';
};

const letter = (s) => {
  if (s === null || s === undefined) return '—';
  if (s >= 90) return 'A';
  if (s >= 80) return 'B';
  if (s >= 70) return 'C';
  if (s >= 60) return 'D';
  return 'F';
};

export default function AdminGrades() {
  const [gradeFilter, setGradeFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const filtered = mockGrades.filter(s =>
    (!gradeFilter || s.grade === gradeFilter)
  );

  const visibleSubjects = subjectFilter ? [subjectFilter] : SUBJECTS;

  const subjectAvg = (sub) => {
    const scores = mockGrades.map(s => s[sub]).filter(Boolean);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const studentAvg = (s) => {
    const scores = SUBJECTS.map(sub => s[sub]).filter(v => v !== null && v !== undefined);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grading Dashboard</h1>
        <button className="btn-secondary">Export CSV</button>
      </div>

      {/* Subject averages */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {SUBJECTS.map(sub => {
          const avg = subjectAvg(sub);
          return (
            <div key={sub} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${scoreColor(avg)}`}>{avg}%</div>
              <div className="text-xs text-gray-500 mt-1">{sub}</div>
              <div className="text-xs font-medium text-gray-400">{letter(avg)} avg</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select className="form-select w-40" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
          <option value="">All Grades</option>
          <option>Grade 2</option>
          <option>Grade 3</option>
          <option>Grade 4</option>
        </select>
        <select className="form-select w-44" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Student</th>
                <th className="table-header">Grade</th>
                {visibleSubjects.map(s => <th key={s} className="table-header">{s}</th>)}
                {!subjectFilter && <th className="table-header">Average</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => {
                const avg = studentAvg(s);
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{s.student}</td>
                    <td className="table-cell text-gray-500">{s.grade}</td>
                    {visibleSubjects.map(sub => (
                      <td key={sub} className={`table-cell ${scoreColor(s[sub])}`}>
                        {s[sub] != null ? `${s[sub]}% (${letter(s[sub])})` : '—'}
                      </td>
                    ))}
                    {!subjectFilter && (
                      <td className={`table-cell ${scoreColor(avg)}`}>
                        {avg}% ({letter(avg)})
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

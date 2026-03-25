import React, { useState, useEffect } from 'react';
import { getAdminEvaluations, getStudents, getUsers } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function AdminEvaluations() {
  const [evals, setEvals] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ student_id: '', teacher_id: '', date_from: '', date_to: '' });

  useEffect(() => {
    Promise.all([
      getStudents(),
      getUsers({ role: 'teacher' }),
    ]).then(([sRes, tRes]) => {
      setStudents(sRes.data.students);
      setTeachers(tRes.data.users);
    }).catch(console.error);
    load();
  }, []);

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const params = {};
      if (f.student_id) params.student_id = f.student_id;
      if (f.teacher_id) params.teacher_id = f.teacher_id;
      if (f.date_from) params.date_from = f.date_from;
      if (f.date_to) params.date_to = f.date_to;
      const r = await getAdminEvaluations(params);
      setEvals(r.data.evaluations);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Evaluations</h1>

      <div className="card mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label">Student</label>
            <select className="form-select w-44" value={filters.student_id} onChange={(e) => setFilters((f) => ({ ...f, student_id: e.target.value }))}>
              <option value="">All Students</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Teacher</label>
            <select className="form-select w-44" value={filters.teacher_id} onChange={(e) => setFilters((f) => ({ ...f, teacher_id: e.target.value }))}>
              <option value="">All Teachers</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">From</label>
            <input type="date" className="form-input w-36" value={filters.date_from} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">To</label>
            <input type="date" className="form-input w-36" value={filters.date_to} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))} />
          </div>
          <button onClick={() => load(filters)} className="btn-secondary">Filter</button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          {!evals.length ? (
            <EmptyState icon="📋" title="No evaluations found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>{['Date', 'Student', 'Teacher', 'Subject', 'Strengths', 'Struggles'].map((h) => <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {evals.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="table-cell text-gray-500">{e.evaluation_date?.split('T')[0]}</td>
                      <td className="table-cell font-medium">{e.student_name}</td>
                      <td className="table-cell text-gray-500">{e.teacher_name}</td>
                      <td className="table-cell"><span className="badge-blue">{e.subject_name}</span></td>
                      <td className="table-cell text-gray-500 max-w-xs truncate">{e.strengths_text || '–'}</td>
                      <td className="table-cell text-gray-500 max-w-xs truncate">{e.struggles_text || '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

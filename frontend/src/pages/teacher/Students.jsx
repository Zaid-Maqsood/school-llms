import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyStudents } from '../../api/teacher';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function TeacherStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyStudents()
      .then((r) => setStudents(r.data.students))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Students</h1>

      {!students.length ? (
        <EmptyState icon="🎒" title="No students assigned" description="Contact your administrator to get students assigned to you." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => (
            <div key={s.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xl font-bold">
                  {s.first_name[0]}
                </div>
                <span className={s.status === 'active' ? 'badge-green' : 'badge-red'}>{s.status}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{s.display_name || `${s.first_name} ${s.last_name}`}</h3>
              <p className="text-sm text-gray-500 mb-1">{s.first_name} {s.last_name}</p>
              {s.grade_class && <p className="text-xs text-gray-400 mb-4">📚 {s.grade_class}</p>}
              {s.notes && <p className="text-xs text-gray-500 mb-4 line-clamp-2">{s.notes}</p>}
              <div className="flex gap-2">
                <Link to={`/teacher/evaluations/new?student_id=${s.id}`} className="btn-primary btn-sm flex-1 text-center">
                  + Evaluate
                </Link>
                <Link to={`/teacher/students/${s.id}`} className="btn-secondary btn-sm flex-1 text-center">
                  History
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyStudent } from '../../api/teacher';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function TeacherStudentDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyStudent(id)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="text-red-600">Student not found</div>;

  const { student, recent_evaluations } = data;

  return (
    <div>
      <Link to="/teacher/students" className="text-blue-600 hover:text-blue-800 text-sm mb-4 flex items-center gap-1">← Back to Students</Link>

      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl font-bold">
            {student.first_name[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{student.display_name || `${student.first_name} ${student.last_name}`}</h1>
            <p className="text-sm text-gray-500">{student.first_name} {student.last_name}</p>
            <div className="flex gap-2 mt-1">
              <span className={student.status === 'active' ? 'badge-green' : 'badge-red'}>{student.status}</span>
              {student.grade_class && <span className="badge-gray">{student.grade_class}</span>}
            </div>
          </div>
        </div>
        {student.notes && <p className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">{student.notes}</p>}
        <div className="mt-4">
          <Link to={`/teacher/evaluations/new?student_id=${student.id}`} className="btn-primary btn-sm">
            + New Evaluation
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Evaluations</h2>
        {!recent_evaluations?.length ? (
          <EmptyState icon="📋" title="No evaluations yet" description="Submit the first evaluation for this student." />
        ) : (
          <div className="space-y-3">
            {recent_evaluations.map((e) => (
              <div key={e.id} className="p-3 border border-gray-100 rounded-md hover:bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{e.evaluation_date?.split('T')[0]}</span>
                  <span className="badge-blue text-xs">{e.subject_name}</span>
                </div>
                {e.strengths_text && <p className="text-xs text-green-700 mt-1">✓ {e.strengths_text}</p>}
                {e.struggles_text && <p className="text-xs text-orange-600 mt-1">⚠ {e.struggles_text}</p>}
              </div>
            ))}
            <Link to={`/teacher/evaluations?student_id=${student.id}`} className="text-sm text-blue-600 hover:text-blue-800 block text-center mt-2">
              View full history →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

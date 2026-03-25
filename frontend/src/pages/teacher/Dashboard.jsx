import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTeacherDashboardStats, getMyStudents, getMyEvaluations } from '../../api/teacher';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [recentEvals, setRecentEvals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTeacherDashboardStats(),
      getMyStudents(),
      getMyEvaluations({ date_from: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] }),
    ]).then(([statsRes, studentsRes, evalsRes]) => {
      setStats(statsRes.data);
      setStudents(studentsRes.data.students.filter((s) => s.status === 'active'));
      setRecentEvals(evalsRes.data.evaluations);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Welcome, {user?.first_name}!
      </h1>
      <p className="text-gray-500 mb-6 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="card border-l-4 border-l-green-400">
          <div className="text-2xl font-bold text-green-700">{stats?.assigned_students ?? 0}</div>
          <div className="text-sm font-medium text-gray-700">Assigned Students</div>
        </div>
        <div className="card border-l-4 border-l-blue-400">
          <div className="text-2xl font-bold text-blue-700">{stats?.evaluations_this_week ?? 0}</div>
          <div className="text-sm font-medium text-gray-700">Evaluations This Week</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Students */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">My Students</h2>
            <Link to="/teacher/students" className="text-sm text-blue-600 hover:text-blue-800">View all →</Link>
          </div>
          {students.length ? (
            <div className="space-y-2">
              {students.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-md">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{s.display_name || `${s.first_name} ${s.last_name}`}</div>
                    <div className="text-xs text-gray-400">{s.grade_class || 'No grade'}</div>
                  </div>
                  <Link
                    to={`/teacher/evaluations/new?student_id=${s.id}`}
                    className="btn-primary btn-sm text-xs"
                  >
                    + Evaluate
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No students assigned yet</p>
          )}
        </div>

        {/* Recent Evaluations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Evaluations (7 days)</h2>
            <Link to="/teacher/evaluations" className="text-sm text-blue-600 hover:text-blue-800">View all →</Link>
          </div>
          {recentEvals.length ? (
            <div className="space-y-2">
              {recentEvals.slice(0, 6).map((e) => (
                <div key={e.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-md">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{e.student_name}</div>
                    <div className="text-xs text-gray-400">{e.subject_name} · {e.evaluation_date?.split('T')[0]}</div>
                  </div>
                  <span className="badge-blue text-xs">{parseInt(e.attachment_count) > 0 ? `📎 ${e.attachment_count}` : ''}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No evaluations this week</p>
          )}
        </div>
      </div>
    </div>
  );
}

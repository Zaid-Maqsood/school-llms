import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';

function StatCard({ icon, label, value, sub, color = 'blue', to }) {
  const colors = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
  };
  const card = (
    <div className={`card border-l-4 ${colors[color].split(' ')[0]} flex items-center gap-4 hover:shadow-md transition-shadow`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <div className={`text-2xl font-bold ${colors[color].split(' ')[2]}`}>{value ?? '–'}</div>
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {sub && <div className="text-xs text-gray-500">{sub}</div>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="👩‍🏫" label="Teachers" value={stats?.users?.teacher ?? 0} color="blue" to="/admin/users" />
        <StatCard icon="👨‍👩‍👦" label="Parents" value={stats?.users?.parent ?? 0} color="purple" to="/admin/users" />
        <StatCard icon="🎒" label="Active Students" value={stats?.students?.active ?? 0} color="green" to="/admin/students" />
        <StatCard icon="📋" label="Evaluations (30d)" value={stats?.evaluations_last_30_days ?? 0} color="orange" to="/admin/evaluations" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard
          icon="⏱"
          label="Teacher Hours Logged (30d)"
          value={`${stats?.teacher_hours_last_30_days?.toFixed(1) ?? 0}h`}
          color="blue"
          to="/admin/teacher-hours"
        />
        <StatCard
          icon="🎓"
          label="Inactive Students"
          value={stats?.students?.inactive ?? 0}
          color="orange"
          to="/admin/students"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { to: '/admin/users', icon: '👥', label: 'Manage Users', desc: 'Add or update teacher and parent accounts' },
          { to: '/admin/students', icon: '🎒', label: 'Manage Students', desc: 'Student profiles and assignments' },
          { to: '/admin/templates', icon: '📋', label: 'Eval Templates', desc: 'Configure evaluation question templates' },
          { to: '/admin/teacher-hours', icon: '⏱', label: 'Teacher Hours', desc: 'Log and review work hours' },
          { to: '/admin/exports', icon: '📤', label: 'Exports', desc: 'Download CSV payroll reports' },
          { to: '/admin/subjects', icon: '📚', label: 'Subjects', desc: 'Manage school subjects' },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="font-semibold text-gray-900">{item.label}</div>
            <div className="text-sm text-gray-500 mt-1">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

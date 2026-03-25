import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyChildren } from '../../api/parent';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyChildren()
      .then((r) => setChildren(r.data.children))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user?.first_name}!</h1>
      <p className="text-gray-500 mb-6 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

      {!children.length ? (
        <EmptyState
          icon="👶"
          title="No children linked to your account"
          description="Please contact your school administrator to link your children to this account."
        />
      ) : (
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-4">Your Children</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <div key={child.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-14 w-14 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-2xl font-bold">
                    {child.first_name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{child.display_name || `${child.first_name} ${child.last_name}`}</h3>
                    {child.grade_class && <p className="text-sm text-gray-500">📚 {child.grade_class}</p>}
                    <span className={child.status === 'active' ? 'badge-green text-xs' : 'badge-red text-xs'}>{child.status}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/parent/children/${child.id}/summary`} className="btn-primary btn-sm flex-1 text-center">
                    📊 Summary
                  </Link>
                  <Link to={`/parent/children/${child.id}/evaluations`} className="btn-secondary btn-sm flex-1 text-center">
                    📋 Reports
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

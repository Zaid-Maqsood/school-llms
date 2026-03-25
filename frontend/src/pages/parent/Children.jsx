import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyChildren } from '../../api/parent';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function ParentChildren() {
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Children</h1>

      {!children.length ? (
        <EmptyState
          icon="👶"
          title="No children linked"
          description="Contact your school administrator to link your children."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {children.map((child) => (
            <div key={child.id} className="card">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-3xl font-bold">
                  {child.first_name[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{child.display_name || `${child.first_name} ${child.last_name}`}</h2>
                  <p className="text-sm text-gray-500">{child.first_name} {child.last_name}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={child.status === 'active' ? 'badge-green' : 'badge-red'}>{child.status}</span>
                    {child.grade_class && <span className="badge-gray">{child.grade_class}</span>}
                  </div>
                </div>
              </div>

              {child.date_of_birth && (
                <p className="text-sm text-gray-500 mb-4">🎂 Born: {new Date(child.date_of_birth).toLocaleDateString()}</p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Link to={`/parent/children/${child.id}/summary?period=weekly`} className="btn-primary text-center">
                  📊 This Week
                </Link>
                <Link to={`/parent/children/${child.id}/summary?period=monthly`} className="btn-secondary text-center">
                  📅 This Month
                </Link>
                <Link to={`/parent/children/${child.id}/evaluations`} className="btn-secondary text-center col-span-2">
                  📋 Full Report History
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

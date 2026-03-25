import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const adminNav = [
  { path: '/admin', label: 'Dashboard', icon: '▤' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/students', label: 'Students', icon: '🎒' },
  { path: '/admin/subjects', label: 'Subjects', icon: '📚' },
  { path: '/admin/templates', label: 'Eval Templates', icon: '📋' },
  { path: '/admin/teacher-hours', label: 'Teacher Hours', icon: '⏱' },
  { path: '/admin/exports', label: 'Exports', icon: '📤' },
];

const teacherNav = [
  { path: '/teacher', label: 'Dashboard', icon: '▤' },
  { path: '/teacher/students', label: 'My Students', icon: '🎒' },
  { path: '/teacher/evaluations/new', label: 'New Evaluation', icon: '✏️' },
  { path: '/teacher/evaluations', label: 'History', icon: '📋' },
];

const parentNav = [
  { path: '/parent', label: 'Dashboard', icon: '▤' },
  { path: '/parent/children', label: 'My Children', icon: '👶' },
];

const navByRole = { admin: adminNav, teacher: teacherNav, parent: parentNav };

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = navByRole[user?.role] || [];
  const roleColor = { admin: 'bg-blue-700', teacher: 'bg-green-700', parent: 'bg-purple-700' };
  const headerBg = roleColor[user?.role] || 'bg-blue-700';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav bar */}
      <header className={`${headerBg} text-white flex items-center justify-between px-4 py-3 shadow-md`}>
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1 rounded hover:bg-white/20"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="text-xl">☰</span>
          </button>
          <span className="font-bold text-lg">🏫 School Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm hidden sm:block">
            {user?.first_name} {user?.last_name}
            <span className="ml-2 opacity-70 capitalize">({user?.role})</span>
          </span>
          <button onClick={handleLogout} className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors">
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 w-56 bg-white border-r border-gray-200 flex flex-col pt-16 lg:pt-0
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {nav.map((item) => {
              const active = location.pathname === item.path ||
                (item.path !== '/admin' && item.path !== '/teacher' && item.path !== '/parent' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

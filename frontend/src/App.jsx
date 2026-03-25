import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminStudents from './pages/admin/Students';
import AdminSubjects from './pages/admin/Subjects';
import AdminTemplates from './pages/admin/Templates';
import AdminTeacherHours from './pages/admin/TeacherHours';
import AdminExports from './pages/admin/Exports';
import AdminEvaluations from './pages/admin/Evaluations';

// Teacher
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherStudents from './pages/teacher/Students';
import TeacherStudentDetail from './pages/teacher/StudentDetail';
import NewEvaluation from './pages/teacher/NewEvaluation';
import EvaluationHistory from './pages/teacher/EvaluationHistory';

// Parent
import ParentDashboard from './pages/parent/Dashboard';
import ParentChildren from './pages/parent/Children';
import ChildEvaluations from './pages/parent/ChildEvaluations';
import ChildSummary from './pages/parent/ChildSummary';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />

      {/* Admin routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute roles={['admin']}>
          <Layout>
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="subjects" element={<AdminSubjects />} />
              <Route path="templates" element={<AdminTemplates />} />
              <Route path="teacher-hours" element={<AdminTeacherHours />} />
              <Route path="exports" element={<AdminExports />} />
              <Route path="evaluations" element={<AdminEvaluations />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      {/* Teacher routes */}
      <Route path="/teacher/*" element={
        <ProtectedRoute roles={['teacher']}>
          <Layout>
            <Routes>
              <Route index element={<TeacherDashboard />} />
              <Route path="students" element={<TeacherStudents />} />
              <Route path="students/:id" element={<TeacherStudentDetail />} />
              <Route path="evaluations" element={<EvaluationHistory />} />
              <Route path="evaluations/new" element={<NewEvaluation />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      {/* Parent routes */}
      <Route path="/parent/*" element={
        <ProtectedRoute roles={['parent']}>
          <Layout>
            <Routes>
              <Route index element={<ParentDashboard />} />
              <Route path="children" element={<ParentChildren />} />
              <Route path="children/:id/evaluations" element={<ChildEvaluations />} />
              <Route path="children/:id/summary" element={<ChildSummary />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      {/* Unauthorized */}
      <Route path="/unauthorized" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-500 mt-2">You don't have permission to view this page.</p>
            <a href="/login" className="mt-4 btn-primary inline-block">Go to Login</a>
          </div>
        </div>
      } />

      {/* Root redirect */}
      <Route path="/" element={
        user ? <Navigate to={`/${user.role}`} replace /> : <Navigate to="/login" replace />
      } />

      {/* 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">404</div>
            <h1 className="text-xl font-bold text-gray-900">Page Not Found</h1>
            <a href="/" className="mt-4 btn-primary inline-block">Go Home</a>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

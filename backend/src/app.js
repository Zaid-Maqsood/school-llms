require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { authenticate } = require('./middleware/auth');
const { requireRole } = require('./middleware/roles');

const authRoutes = require('./routes/auth');
const adminUsersRoutes = require('./routes/admin/users');
const adminStudentsRoutes = require('./routes/admin/students');
const adminSubjectsRoutes = require('./routes/admin/subjects');
const adminTemplatesRoutes = require('./routes/admin/templates');
const adminTeacherHoursRoutes = require('./routes/admin/teacherHours');
const adminEvaluationsRoutes = require('./routes/admin/evaluations');
const teacherStudentsRoutes = require('./routes/teacher/students');
const teacherEvaluationsRoutes = require('./routes/teacher/evaluations');
const parentChildrenRoutes = require('./routes/parent/children');
const sharedRoutes = require('./routes/shared');

const app = express();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, server-side) or matching origins
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV === 'development' && /^http:\/\/localhost:\d+$/.test(origin))) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging (minimal)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Public routes
app.use('/api/auth', authRoutes);

// All routes below require authentication
app.use('/api', authenticate);

// Shared routes (available to multiple roles)
app.use('/api', sharedRoutes);

// Admin routes
app.use('/api/admin/users', requireRole('admin'), adminUsersRoutes);
app.use('/api/admin/students', requireRole('admin'), adminStudentsRoutes);
app.use('/api/admin/subjects', requireRole('admin'), adminSubjectsRoutes);
app.use('/api/admin/templates', requireRole('admin'), adminTemplatesRoutes);
app.use('/api/admin/teacher-hours', requireRole('admin'), adminTeacherHoursRoutes);
app.use('/api/admin/evaluations', requireRole('admin'), adminEvaluationsRoutes);

// Teacher routes
app.use('/api/teacher/students', requireRole('teacher'), teacherStudentsRoutes);
app.use('/api/teacher/evaluations', requireRole('teacher'), teacherEvaluationsRoutes);

// Parent routes
app.use('/api/parent/children', requireRole('parent'), parentChildrenRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: `File too large. Max size is ${process.env.MAX_FILE_SIZE_MB || 50}MB.` });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;

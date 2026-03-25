import api from './index';

// Users
export const getUsers = (params) => api.get('/admin/users', { params });
export const createUser = (data) => api.post('/admin/users', data);
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);

// Students
export const getStudents = (params) => api.get('/admin/students', { params });
export const getStudent = (id) => api.get(`/admin/students/${id}`);
export const createStudent = (data) => api.post('/admin/students', data);
export const updateStudent = (id, data) => api.put(`/admin/students/${id}`, data);
export const assignTeachers = (studentId, teacher_ids) => api.post(`/admin/students/${studentId}/teachers`, { teacher_ids });
export const assignParents = (studentId, parent_ids) => api.post(`/admin/students/${studentId}/parents`, { parent_ids });

// Subjects
export const getSubjects = (params) => api.get('/admin/subjects', { params });
export const createSubject = (data) => api.post('/admin/subjects', data);
export const updateSubject = (id, data) => api.put(`/admin/subjects/${id}`, data);

// Templates
export const getTemplates = (params) => api.get('/admin/templates', { params });
export const getTemplate = (id) => api.get(`/admin/templates/${id}`);
export const createTemplate = (data) => api.post('/admin/templates', data);
export const updateTemplate = (id, data) => api.put(`/admin/templates/${id}`, data);
export const createQuestion = (templateId, data) => api.post(`/admin/templates/${templateId}/questions`, data);
export const updateQuestion = (qId, data) => api.put(`/admin/templates/questions/${qId}`, data);

// Teacher Hours
export const getTeacherHours = (params) => api.get('/admin/teacher-hours', { params });
export const createTeacherHours = (data) => api.post('/admin/teacher-hours', data);
export const updateTeacherHours = (id, data) => api.put(`/admin/teacher-hours/${id}`, data);
export const deleteTeacherHours = (id) => api.delete(`/admin/teacher-hours/${id}`);
export const exportTeacherHoursCSV = (params) => api.get('/admin/teacher-hours/export/csv', { params, responseType: 'blob' });

// Evaluations (admin view)
export const getAdminEvaluations = (params) => api.get('/admin/evaluations', { params });

// Dashboard stats
export const getDashboardStats = () => api.get('/admin/dashboard-stats');

// Export logs
export const getExportLogs = () => api.get('/admin/export-logs');

// Grades (from evaluations)
export const getGrades = () => api.get('/admin/grades');

// Course Materials
export const getCourseMaterials = () => api.get('/admin/course-materials');
export const createFolder = (data) => api.post('/admin/course-materials/folders', data);
export const uploadCourseFile = (folderId, formData) =>
  api.post(`/admin/course-materials/folders/${folderId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteCourseFile = (fileId) => api.delete(`/admin/course-materials/files/${fileId}`);
export const deleteCourseFolder = (folderId) => api.delete(`/admin/course-materials/folders/${folderId}`);
export const getCourseFileDownloadUrl = (fileId) => `/api/admin/course-materials/files/${fileId}/download`;

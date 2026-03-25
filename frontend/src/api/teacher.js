import api from './index';

// Students
export const getMyStudents = () => api.get('/teacher/students');
export const getMyStudent = (id) => api.get(`/teacher/students/${id}`);

// Evaluations
export const getMyEvaluations = (params) => api.get('/teacher/evaluations', { params });
export const getEvaluation = (id) => api.get(`/teacher/evaluations/${id}`);
export const createEvaluation = (data) => api.post('/teacher/evaluations', data);
export const updateEvaluation = (id, data) => api.put(`/teacher/evaluations/${id}`, data);
export const uploadAttachments = (evalId, formData) =>
  api.post(`/teacher/evaluations/${evalId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Subjects with active templates
export const getSubjectsWithTemplates = () => api.get('/teacher/subjects-with-templates');
export const getTemplateQuestions = (subjectId) => api.get(`/teacher/templates/${subjectId}/questions`);

// Dashboard stats
export const getTeacherDashboardStats = () => api.get('/teacher/dashboard-stats');

// Assignments
export const getAssignments = () => api.get('/teacher/assignments');
export const getAssignment = (id) => api.get(`/teacher/assignments/${id}`);
export const createAssignment = (data) => api.post('/teacher/assignments', data);
export const deleteAssignment = (id) => api.delete(`/teacher/assignments/${id}`);
export const gradeSubmission = (assignmentId, subId, grade) =>
  api.put(`/teacher/assignments/${assignmentId}/submissions/${subId}/grade`, { grade });

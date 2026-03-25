import api from './index';

export const getMyChildren = () => api.get('/parent/children');
export const getMyChild = (id) => api.get(`/parent/children/${id}`);
export const getChildEvaluations = (childId, params) => api.get(`/parent/children/${childId}/evaluations`, { params });
export const getChildEvaluationDetail = (childId, evalId) => api.get(`/parent/children/${childId}/evaluations/${evalId}`);
export const getChildSummary = (childId, params) => api.get(`/parent/children/${childId}/summary`, { params });

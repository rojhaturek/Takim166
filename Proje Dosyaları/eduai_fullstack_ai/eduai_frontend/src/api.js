import axios from 'axios';

// Create a configured axios instance. The base URL can be overridden by
// defining VITE_API_BASE_URL in a .env file when building with Vite.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
});

// Add an interceptor to attach JWT from localStorage to each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (data) => api.post('/register', data);
export const loginUser = (data) => api.post('/token', data);

// Exams
export const fetchExams = () => api.get('/exams');
export const selectExam = (exam_id) => api.post('/select_exam', { exam_id });

// Questionnaire
export const submitQuestionnaire = (payload) => api.post('/questionnaire', payload);

// AI‑driven questionnaire endpoints
export const fetchQuestionnaireAI = () => api.get('/questionnaire_ai');
export const submitQuestionnaireAI = (answers) => api.post('/questionnaire_ai', answers);

// Mini Test
export const getMiniTest = () => api.get('/mini_test');
export const submitMiniTest = (answers) => api.post('/mini_test', { answers });

// Weekly Plan
export const getWeeklyPlan = (week_start) => api.get('/weekly_plan', { params: { week_start } });
export const listPlans = () => api.get('/plans');
export const deletePlan = (id) => api.delete(`/plans/${id}`);

// Profile and progress
export const getProfile = () => api.get('/profile');
export const getProgress = () => api.get('/progress');
export const getAIHistory = (limit = 10) => api.get('/ai_history', { params: { limit } });

// Chat
export const sendChat = (message) => api.post('/chat', { message });

export default api;
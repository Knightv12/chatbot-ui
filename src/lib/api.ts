import axios from 'axios';

// 修改為使用絕對 URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('Using API URL:', API_URL);

// 創建 axios 實例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 啟用跨域 Cookie
});

// 請求攔截器，添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 認證相關 API
export const authAPI = {
  register: async (data: { username: string; email: string; password: string; role: 'teacher' | 'student' }) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },
  forgotPassword: async (data: { email: string }) => {
    const response = await api.post('/api/auth/forgot-password', data);
    return response.data;
  },
  resetPassword: async (data: { token: string; password: string }) => {
    const response = await api.post('/api/auth/reset-password', data);
    return response.data;
  },
  verifyResetToken: async (token: string) => {
    const response = await api.get(`/api/auth/verify-reset-token/${token}`);
    return response.data;
  }
};

// 聊天相關 API
export const chatAPI = {
  sendMessage: async (data: { message: string; topic: string }) => {
    const response = await api.post('/api/chat/message', data);
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/api/chat/history');
    return response.data;
  },
};

// Reviews API
export const reviewsAPI = {
  getStudentReviews: async (studentId: string) => {
    const response = await api.get(`/api/reviews/student/${studentId}`);
    return response.data;
  },
  
  getTeacherReviews: async (teacherId: string) => {
    const response = await api.get(`/api/reviews/teacher/${teacherId}`);
    return response.data;
  },
  
  createReview: async (data: { teacherId: string; studentId: string; content: string; rating?: number }) => {
    const response = await api.post('/api/reviews', data);
    return response.data;
  },
  
  updateReview: async (reviewId: string, data: { content?: string; rating?: number }) => {
    const response = await api.put(`/api/reviews/${reviewId}`, data);
    return response.data;
  },
  
  deleteReview: async (reviewId: string) => {
    const response = await api.delete(`/api/reviews/${reviewId}`);
    return response.data;
  }
};

// Teacher-Student API
export const teacherStudentAPI = {
  getStudentTeacher: async (studentId: string) => {
    const response = await api.get(`/api/auth/student/teacher?userId=${studentId}`);
    return response.data;
  },
  
  getTeacherStudents: async (teacherId: string) => {
    const response = await api.get(`/api/auth/teacher/students?userId=${teacherId}`);
    return response.data;
  },
  
  connectStudentToTeacher: async (data: { teacherId: string; studentId: string }) => {
    const response = await api.post('/api/auth/connect', data);
    return response.data;
  }
};

export default api; 
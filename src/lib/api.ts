import axios from 'axios';

// 使用相對路徑，這樣就不需要硬編碼服務器地址
const API_URL = '/api';

// 創建 axios 實例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  forgotPassword: async (data: { email: string }) => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },
  resetPassword: async (data: { token: string; password: string }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
  verifyResetToken: async (token: string) => {
    const response = await api.get(`/auth/verify-reset-token/${token}`);
    return response.data;
  }
};

// 聊天相關 API
export const chatAPI = {
  sendMessage: async (data: { message: string; topic: string }) => {
    const response = await api.post('/chat/message', data);
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/chat/history');
    return response.data;
  },
};

// Reviews API
export const reviewsAPI = {
  getStudentReviews: async (studentId: string) => {
    const response = await api.get(`/reviews/student/${studentId}`);
    return response.data;
  },
  
  getTeacherReviews: async (teacherId: string) => {
    const response = await api.get(`/reviews/teacher/${teacherId}`);
    return response.data;
  },
  
  createReview: async (data: { teacherId: string; studentId: string; content: string; rating?: number }) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },
  
  updateReview: async (reviewId: string, data: { content?: string; rating?: number }) => {
    const response = await api.put(`/reviews/${reviewId}`, data);
    return response.data;
  },
  
  deleteReview: async (reviewId: string) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  }
};

// Teacher-Student API
export const teacherStudentAPI = {
  getStudentTeacher: async (studentId: string) => {
    const response = await api.get(`/auth/student/teacher?userId=${studentId}`);
    return response.data;
  },
  
  getTeacherStudents: async (teacherId: string) => {
    const response = await api.get(`/auth/teacher/students?userId=${teacherId}`);
    return response.data;
  },
  
  connectStudentToTeacher: async (data: { teacherId: string; studentId: string }) => {
    const response = await api.post('/auth/connect', data);
    return response.data;
  }
};

export default api; 
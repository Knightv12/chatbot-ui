import { User } from '../interfaces/interfaces';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

const login = async (data: { email: string; password: string }) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('登入失敗');
  }

  return response.json();
};

const register = async (data: { username: string; email: string; password: string; role: 'teacher' | 'student' }) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('註冊失敗');
  }

  return response.json();
};

const forgotPassword = async (data: { email: string }) => {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('發送重置密碼郵件失敗');
  }

  return response.json();
};

const resetPassword = async (data: { token: string; password: string }) => {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('重置密碼失敗');
  }

  return response.json();
};

const verifyResetToken = async (token: string) => {
  const response = await fetch(`${API_URL}/auth/verify-reset-token/${token}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('驗證重置令牌失敗');
  }

  return response.json();
};

const updateUser = async (userData: Partial<User>) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/auth/update-user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    return data;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

export const authAPI = {
  login,
  register,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  updateUser
};
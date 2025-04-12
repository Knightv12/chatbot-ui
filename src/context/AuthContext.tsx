import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';

interface User {
  _id: string;
  id: string;
  username: string;
  email: string;
  role: 'teacher' | 'student';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role: 'teacher' | 'student') => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyResetToken: (token: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredAuth = () => {
  const token = localStorage.getItem('token');
  const userJSON = localStorage.getItem('user');
  
  if (token && userJSON) {
    try {
      const user = JSON.parse(userJSON);
      if (!user.id && user._id) {
        user.id = user._id;
      }
      return { token, user };
    } catch (error) {
      return null;
    }
  }
  
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check stored authentication info on initialization
  useEffect(() => {
    const storedAuth = getStoredAuth();
    if (storedAuth) {
      setToken(storedAuth.token);
      setUser(storedAuth.user);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      setToken(response.token);
      const userWithId = {
        ...response.user,
        id: response.user._id
      };
      setUser(userWithId);
      
      // Store in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userWithId));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, role: 'teacher' | 'student') => {
    try {
      const response = await authAPI.register({ username, email, password, role });
      setToken(response.token);
      const userWithId = {
        ...response.user,
        id: response.user._id
      };
      setUser(userWithId);
      
      // Store in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userWithId));
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const forgotPassword = async (email: string) => {
    try {
      await authAPI.forgotPassword({ email });
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      await authAPI.resetPassword({ token, password });
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const verifyResetToken = async (token: string) => {
    try {
      await authAPI.verifyResetToken(token);
      return true;
    } catch (error) {
      console.error('Verify reset token error:', error);
      return false;
    }
  };

  // Check if token is valid
  useEffect(() => {
    const checkToken = async () => {
      if (token) {
        try {
          // Here you can add an API call to verify the token
          // If the token is invalid, log the user out
        } catch (error) {
          logout();
        }
      }
    };

    checkToken();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        verifyResetToken,
        isAuthenticated: !!token,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
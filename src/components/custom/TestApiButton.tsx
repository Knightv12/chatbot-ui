import { useState } from 'react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

export function TestApiButton() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 使用環境變數中的 API URL 中的基礎部分，不包括 /api
      const apiUrl = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace('/api', '') 
        : 'http://localhost:3001';
      
      // 使用根路由來檢查連接
      const response = await axios({
        method: 'get',
        url: apiUrl, // 使用根路由
        withCredentials: true,
        timeout: 15000, // 15 秒超時
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      setResult(JSON.stringify({
        status: 'success',
        message: 'API connection successful!',
        data: response.data
      }, null, 2));
    } catch (err: any) {
      console.error('API test detailed error:', err);
      
      // Display complete error details
      const errorDetails = {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      };
      
      setError(err.message || 'Request failed');
      setResult(JSON.stringify(errorDetails, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const testBackendDirectly = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 直接使用環境變數中的 API URL 而不添加額外的 /api
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      // 使用測試用戶憑證進行登入測試
      const response = await axios({
        method: 'post',
        url: `${apiUrl}/auth/login`,
        data: {
          email: 'stephenshum2001@yahoo.com.hk',
          password: 'FYP43214321'
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true // 添加這個選項以支持跨域認證
      });
      
      setResult(JSON.stringify({
        status: 'success',
        message: 'Login function test successful!',
        data: response.data
      }, null, 2));
    } catch (err: any) {
      console.error('Login test error:', err);
      setError(`Login test failed: ${err.message}`);
      
      const errorDetails = {
        error: err.message,
        status: err.response?.status,
        data: err.response?.data,
        time: new Date().toISOString()
      };
      
      setResult(JSON.stringify(errorDetails, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const createTestUser = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 直接使用環境變數中的 API URL 而不添加額外的 /api
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      // 使用 AJAX 呼叫註冊端點
      const response = await axios({
        method: 'post',
        url: `${apiUrl}/auth/register`,
        data: {
          username: 'testuser',
          email: 'testuser@example.com',
          password: 'password123',
          role: 'student'
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });
      
      setResult(JSON.stringify(response.data, null, 2));
    } catch (err: any) {
      console.error('Create user error:', err);
      setError(`Failed to create test user: ${err.message}`);
      
      // Display detailed error
      const errorDetails = {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      };
      
      setResult(JSON.stringify(errorDetails, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  // 測試後端是否運行
  const testServerRunning = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 使用環境變數中的基礎 URL 的基礎部分，不包括 /api
      const baseUrl = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace('/api', '') 
        : 'http://localhost:3001';
      
      console.log('Attempting to connect to backend server:', baseUrl);
      
      // Use fetch directly instead of axios
      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(JSON.stringify({
          message: 'Backend server is running!',
          status: response.status,
          statusText: response.statusText,
          data: data
        }, null, 2));
      } else {
        setResult(JSON.stringify({
          message: 'Server returned an error',
          status: response.status,
          statusText: response.statusText
        }, null, 2));
      }
    } catch (err: any) {
      console.error('Server connection error:', err);
      setError('Unable to connect to backend server: ' + err.message);
      
      setResult(JSON.stringify({
        message: err.message,
        error: 'Unable to connect to backend server, please check your network connection or contact administrator'
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-medium mb-2">API Connection Test</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        <Button 
          onClick={testServerRunning} 
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          Check Server Status
        </Button>
        
        <Button 
          onClick={testApi} 
          disabled={isLoading}
        >
          Test API Connection
        </Button>
        
        <Button 
          onClick={testBackendDirectly} 
          disabled={isLoading}
          variant="outline"
        >
          Test Login Function
        </Button>
        
        <Button 
          onClick={createTestUser} 
          disabled={isLoading}
          variant="secondary"
        >
          Create Test User
        </Button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <p className="font-medium mb-2">Response:</p>
          <pre className="p-3 bg-muted text-foreground text-xs overflow-auto rounded-md max-h-60">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
} 
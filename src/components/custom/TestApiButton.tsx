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
      // 使用環境變數中的 API URL
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      // 使用簡單的 GET 請求來檢查連接
      const response = await axios({
        method: 'get',
        url: `${apiUrl}/auth/check-user`, // 使用環境變數
        params: { email: 'test@example.com' },
        withCredentials: true,
        timeout: 10000, // 10 秒超時
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      setResult(JSON.stringify(response.data, null, 2));
    } catch (err: any) {
      console.error('API 測試詳細錯誤:', err);
      setError(err.message || '請求失敗');
      
      // 顯示完整的錯誤詳情
      const errorDetails = {
        message: err.message,
        stack: err.stack?.split('\n')[0],
        status: err.response?.status,
        statusText: err.response?.statusText,
        headers: err.response?.headers,
        data: err.response?.data,
        request: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers,
          baseURL: err.config?.baseURL,
          timeout: err.config?.timeout
        }
      };
      
      setResult(JSON.stringify(errorDetails, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  // 直接測試後端
  const testBackendDirectly = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 直接連接到後端 URL，繞過 _redirects
      const response = await axios({
        method: 'get',
        url: 'http://localhost:5000/api/auth/check-user',
        params: { email: 'test@example.com' },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      setResult(JSON.stringify({
        message: '直接連接成功！',
        data: response.data,
        status: response.status
      }, null, 2));
    } catch (err: any) {
      console.error('直接連接後端錯誤:', err);
      setError('直接連接失敗: ' + err.message);
      
      const errorDetails = {
        message: err.message,
        stack: err.stack?.split('\n')[0],
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      };
      
      setResult(JSON.stringify(errorDetails, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  // 創建測試用戶
  const createTestUser = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 創建測試用戶
      const response = await axios({
        method: 'post',
        url: 'http://localhost:5000/api/auth/register',
        data: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          role: 'student'
        },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      setResult(JSON.stringify({
        message: '測試用戶創建成功！',
        data: response.data,
        status: response.status,
        note: '現在您可以使用 test@example.com / password123 登錄'
      }, null, 2));
    } catch (err: any) {
      console.error('創建測試用戶錯誤:', err);
      // 如果用戶已存在，視為成功
      if (err.response?.data?.message === 'User already exists') {
        setError('用戶已存在，可以直接登錄: test@example.com / password123');
      } else {
        setError('創建測試用戶失敗: ' + err.message);
      }
      
      const errorDetails = {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
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
      // 使用環境變數中的基礎 URL
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const healthUrl = baseUrl.replace('/api', '/health');
      
      // 直接使用 fetch 而不是 axios
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        setResult(JSON.stringify({
          message: '伺服器正在運行！',
          status: response.status,
          statusText: response.statusText
        }, null, 2));
      } else {
        setResult(JSON.stringify({
          message: '伺服器返回錯誤',
          status: response.status,
          statusText: response.statusText
        }, null, 2));
      }
    } catch (err: any) {
      console.error('伺服器連接錯誤:', err);
      setError('伺服器未運行或無法連接: ' + err.message);
      
      setResult(JSON.stringify({
        message: err.message,
        error: '無法連接到後端伺服器，請檢查網絡連接或聯繫管理員'
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-medium mb-2">API 連接測試</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        <Button 
          onClick={testServerRunning} 
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          檢查伺服器是否運行
        </Button>
        
        <Button 
          onClick={testApi} 
          disabled={isLoading}
        >
          測試 API 連接
        </Button>
        
        <Button 
          onClick={testBackendDirectly} 
          disabled={isLoading}
          variant="outline"
        >
          直接測試後端
        </Button>

        <Button 
          onClick={createTestUser} 
          disabled={isLoading}
          variant="secondary"
        >
          創建測試用戶
        </Button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          <p className="font-medium">錯誤:</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <p className="font-medium mb-2">API 回應:</p>
          <pre className="p-3 bg-gray-100 text-xs overflow-auto rounded-md max-h-60">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
} 
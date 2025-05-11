import "./App.css";
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { Chat } from './pages/chat/chat';
import Reviews from './pages/Reviews';
import StudentProgress from './pages/StudentProgress';
import { useAuth } from './context/AuthContext';
import Settings from './pages/Settings';
import ReactMarkdown from "react-markdown";

// 保護路由組件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// 老師專用路由
const TeacherRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return user?.role === 'teacher' ? <>{children}</> : <Navigate to="/chat" />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
            <Route path="/student-progress" element={<TeacherRoute><StudentProgress /></TeacherRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/chat" />} />
          </Routes>
          <div>
            <h1>測試 Wolfram Alpha 圖片</h1>
            <ReactMarkdown>
              {`
這是測試圖片：

![測試圖片](https://api.wolframalpha.com/v1/simple?appid=5PYGQG-WRJHRP392T&i=plot(sin(x)%2C%20%7Bx%2C%20-10%CF%80%2C%2010%CF%80%7D)&width=800)
              `}
            </ReactMarkdown>
          </div>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

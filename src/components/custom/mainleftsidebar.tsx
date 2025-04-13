import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "../ui/button";
import { cn } from '@/lib/utils';
import { X, Menu, LogIn, LogOut, Users, Settings, Home, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Added useNavigate
import { useAuth } from '@/context/AuthContext';

export default function MainLeftSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate
  const { user, isAuthenticated, logout } = useAuth();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const handleLogin = () => {
    // Navigate to login page
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewReviews = () => {
    navigate('/reviews');
  };

  const handleStudentProgress = () => {
    navigate('/student-progress');
  };

  return (
    <div className="relative">
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Background overlay - only visible when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/50 z-30" 
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out z-40",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-4">
          <h2 className="text-lg font-semibold mb-4">Teaching Platform</h2>

          {/* General features */}
          <div className="mb-4">
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate('/chat')}>
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>

          {/* Role-specific features */}
          {isAuthenticated && user && (
            <div className="mb-4">
              {user.role === 'teacher' && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-2"
                  onClick={handleStudentProgress}
                >
                  <Users className="h-4 w-4" />
                  Student Progress
                </Button>
              )}
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2"
                onClick={handleViewReviews}
              >
                <Star className="h-4 w-4" />
                {user.role === 'student' ? '我的學習評語' : '學生評語管理'}
              </Button>
            </div>
          )}

          {/* Login/Logout */}
          <div className="mt-auto">
            {!isAuthenticated ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleLogin} // Navigate to login page
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleLogout} // Execute logout logic
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
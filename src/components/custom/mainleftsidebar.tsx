import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, Menu, LogIn, LogOut, Book, Users, Settings, Home } from 'lucide-react';

export default function MainLeftSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'teacher' | 'student' | null>(null); // Login role

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogin = () => {
    // Simulate login logic
    setIsLoggedIn(true);
    setRole('teacher'); // Default to teacher, or switch based on actual requirements
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole(null);
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
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>

          {/* Teacher features */}
          {role === 'teacher' && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Teacher Features</h3>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Book className="h-4 w-4" />
                Course Management
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                Student List
              </Button>
            </div>
          )}

          {/* Student features */}
          {role === 'student' && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Student Features</h3>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Book className="h-4 w-4" />
                Browse Courses
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                Check Grades
              </Button>
            </div>
          )}

          {/* Login/Logout button */}
          <div className="mt-auto">
            {!isLoggedIn ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleLogin}
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleLogout}
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
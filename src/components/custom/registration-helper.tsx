import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { teacherStudentAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Helper component to automate registration and connection
export function RegistrationHelper() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { register, login } = useAuth();
  
  // Teacher info
  const teacherUsername = 'Prof';
  const teacherEmail = 'stephenshum2001@yahoo.com.hk';
  const teacherPassword = 'FYP43214321';
  
  // Student info (assuming Knightv12 is already registered)
  const studentUsername = 'Knightv12';
  const studentEmail = 'knightv12@example.com';
  const studentPassword = 'password123';

  const handleRegisterTeacher = async () => {
    setIsRegistering(true);
    try {
      await register(teacherUsername, teacherEmail, teacherPassword, 'teacher');
      toast.success(`Teacher ${teacherUsername} registered successfully`);
      
      // Auto login after registration
      await login(teacherEmail, teacherPassword);
      toast.success(`Logged in as ${teacherUsername}`);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Teacher registration failed. The user might already exist.');
      
      // Try to login if registration fails
      try {
        await login(teacherEmail, teacherPassword);
        toast.success(`Logged in as ${teacherUsername}`);
      } catch (loginError) {
        toast.error('Login failed');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegisterStudent = async () => {
    setIsRegistering(true);
    try {
      await register(studentUsername, studentEmail, studentPassword, 'student');
      toast.success(`Student ${studentUsername} registered successfully`);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Student registration failed. The user might already exist.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleConnectStudentToTeacher = async () => {
    setIsConnecting(true);
    try {
      // First login as teacher to get the token
      await login(teacherEmail, teacherPassword);
      
      // We need to get the IDs of both users first
      // This is mocked here since we don't have APIs to search users by username
      const mockTeacherId = 'teacher123';
      const mockStudentId = 'student456';
      
      await teacherStudentAPI.connectStudentToTeacher({
        teacherId: mockTeacherId, 
        studentId: mockStudentId
      });
      
      toast.success(`Connected ${studentUsername} to ${teacherUsername}`);
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect student to teacher');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="p-4 border rounded-md shadow-sm bg-card">
      <h2 className="text-lg font-medium mb-4">Registration Helper</h2>
      
      <div className="flex flex-col gap-4">
        <Button
          onClick={handleRegisterTeacher}
          disabled={isRegistering}
          className="w-full"
        >
          {isRegistering ? 'Registering...' : `Register Teacher (${teacherUsername})`}
        </Button>
        
        <Button
          onClick={handleRegisterStudent}
          disabled={isRegistering}
          variant="outline"
          className="w-full"
        >
          {isRegistering ? 'Registering...' : `Register Student (${studentUsername})`}
        </Button>
        
        <Button
          onClick={handleConnectStudentToTeacher}
          disabled={isConnecting}
          variant="secondary"
          className="w-full"
        >
          {isConnecting ? 'Connecting...' : 'Connect Student to Teacher'}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-4">
        This helper automates the process of creating teacher and student accounts, and connecting them together.
      </p>
    </div>
  );
} 
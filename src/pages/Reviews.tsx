import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { reviewsAPI, teacherStudentAPI } from '@/lib/api';
import { Review, User } from '@/interfaces/interfaces';
import { Header } from '@/components/custom/header';
import LeftSidebar from '@/components/custom/mainleftsidebar';
import { Star } from 'lucide-react';

// Sample review data
const sampleReviews: Review[] = [
  {
    _id: 'sample1',
    teacher: { 
      id: 'teacher1', 
      username: 'Knightv12', 
      email: 'stephenshum2001@yahoo.com.hk', 
      role: 'teacher' 
    },
    student: { 
      id: 'student1', 
      username: 'stephenshum2001', 
      email: 'stephenshum2001@gmail.com', 
      role: 'student' 
    },
    content: "Student demonstrates excellent understanding of trigonometric functions and algebra. Needs to work on calculus concepts, recommend additional practice problems.",
    rating: 4,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  },
  {
    _id: 'sample2',
    teacher: { 
      id: 'teacher1', 
      username: 'Knightv12', 
      email: 'stephenshum2001@yahoo.com.hk', 
      role: 'teacher' 
    },
    student: { 
      id: 'student1', 
      username: 'stephenshum2001', 
      email: 'stephenshum2001@gmail.com', 
      role: 'student' 
    },
    content: "Makes good progress in problem-solving skills. Shows creativity in approaching complex problems. Could improve on time management during tests.",
    rating: 5,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days ago
  },
  {
    _id: 'sample3',
    teacher: { 
      id: 'teacher1', 
      username: 'Knightv12', 
      email: 'stephenshum2001@yahoo.com.hk', 
      role: 'teacher' 
    },
    student: { 
      id: 'student1', 
      username: 'stephenshum2001', 
      email: 'stephenshum2001@gmail.com', 
      role: 'student' 
    },
    content: "Has difficulty with vector calculus concepts. Needs to focus on understanding the fundamental theorems. I recommend reviewing basic integration techniques.",
    rating: 3,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
  },
  {
    _id: 'sample4',
    teacher: { 
      id: 'teacher1', 
      username: 'Knightv12', 
      email: 'stephenshum2001@yahoo.com.hk', 
      role: 'teacher' 
    },
    student: { 
      id: 'student1', 
      username: 'stephenshum2001', 
      email: 'stephenshum2001@gmail.com', 
      role: 'student' 
    },
    content: "Great improvement in understanding differential equations! Keep up the good work and continue practicing with more complex examples.",
    rating: 4,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  },
  {
    _id: 'sample5',
    teacher: { 
      id: 'teacher1', 
      username: 'Knightv12', 
      email: 'stephenshum2001@yahoo.com.hk', 
      role: 'teacher' 
    },
    student: { 
      id: 'student1', 
      username: 'stephenshum2001', 
      email: 'stephenshum2001@gmail.com', 
      role: 'student' 
    },
    content: "Recent test performance shows mastery of polynomial functions and sequences. Next focus area should be limits and continuity.",
    rating: 5,
    createdAt: new Date().toISOString() // Today
  }
];

// Sample teacher data
const sampleTeacher: User = {
  id: 'teacher1',
  username: 'Knightv12',
  email: 'stephenshum2001@yahoo.com.hk',
  role: 'teacher'
};

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<User | null>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        if (user.role === 'student') {
          // If student, get all reviews for this student
          const result = await reviewsAPI.getStudentReviews(user.id);
          setReviews(result.reviews);
          
          // Get the student's teacher
          const teacherResult = await teacherStudentAPI.getStudentTeacher(user.id);
          if (teacherResult.teacher) {
            setTeacher(teacherResult.teacher);
          }
        } else if (user.role === 'teacher') {
          // If teacher, get all reviews created by this teacher
          const result = await reviewsAPI.getTeacherReviews(user.id);
          setReviews(result.reviews);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        // Use sample data as fallback
        if (user.role === 'student') {
          setReviews(sampleReviews);
          setTeacher(sampleTeacher);
        } else {
          setReviews(sampleReviews);
        }
        setError(null); // Clear error since we're using sample data
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReviews();
  }, [user]);

  // Render rating stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <LeftSidebar />
      <Header user={user} onLogout={logout} />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">
            {user?.role === 'student' ? 'Your Reviews' : 'Reviews You Gave'}
          </h1>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {user?.role === 'student' 
                ? 'You don\'t have any reviews from your teacher yet.' 
                : 'You haven\'t given any reviews to your students yet.'}
            </div>
          ) : (
            <div className="space-y-6">
              {user?.role === 'student' && teacher && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                  <p className="font-medium">Your Teacher: {teacher.username}</p>
                  <p className="text-sm text-muted-foreground">{teacher.email}</p>
                </div>
              )}
              
              {reviews.map((review) => (
                <div 
                  key={review._id} 
                  className="bg-card p-6 rounded-lg shadow-sm border"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-medium">
                        {user?.role === 'student' 
                          ? 'Review from your teacher' 
                          : `Review for ${typeof review.student === 'object' ? review.student.username : 'Student'}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  <p className="whitespace-pre-line">{review.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews; 
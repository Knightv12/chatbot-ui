import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { reviewsAPI, teacherStudentAPI } from '@/lib/api';
import { Review, User } from '@/interfaces/interfaces';
import { Header } from '@/components/custom/header';
import LeftSidebar from '@/components/custom/mainleftsidebar';
import { Star } from 'lucide-react';

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
          // 如果是學生，獲取所有給該學生的評論
          const result = await reviewsAPI.getStudentReviews(user.id);
          setReviews(result.reviews);
          
          // 獲取學生的老師
          const teacherResult = await teacherStudentAPI.getStudentTeacher(user.id);
          if (teacherResult.teacher) {
            setTeacher(teacherResult.teacher);
          }
        } else if (user.role === 'teacher') {
          // 如果是老師，獲取該老師發出的所有評論
          const result = await reviewsAPI.getTeacherReviews(user.id);
          setReviews(result.reviews);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReviews();
  }, [user]);

  // 渲染評分星星
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
            {user?.role === 'student' ? 'Teacher Reviews' : 'Reviews You Gave'}
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
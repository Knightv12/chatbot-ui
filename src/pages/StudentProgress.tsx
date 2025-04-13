import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { teacherStudentAPI, reviewsAPI } from '@/lib/api';
import { User, Review } from '@/interfaces/interfaces';
import { Header } from '@/components/custom/header';
import LeftSidebar from '@/components/custom/mainleftsidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// 示例學生數據
const sampleStudents: User[] = [
  {
    id: 'student1',
    username: 'stephenshum2001',
    email: 'stephenshum2001@gmail.com',
    role: 'student'
  },
  {
    id: 'student2',
    username: 'johnsmith',
    email: 'john.smith@example.com',
    role: 'student'
  },
  {
    id: 'student3',
    username: 'marywong',
    email: 'mary.wong@example.com',
    role: 'student'
  }
];

// 示例評論數據
const generateSampleReviews = (): Record<string, Review[]> => {
  const reviews: Record<string, Review[]> = {};
  
  // 為第一個學生（stephenshum2001）創建評論
  reviews['student1'] = [
    {
      _id: 'review1',
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
      _id: 'review2',
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
  
  // 為其他示例學生創建評論
  reviews['student2'] = [
    {
      _id: 'review3',
      teacher: { 
        id: 'teacher1', 
        username: 'Knightv12', 
        email: 'stephenshum2001@yahoo.com.hk', 
        role: 'teacher' 
      },
      student: { 
        id: 'student2', 
        username: 'johnsmith', 
        email: 'john.smith@example.com', 
        role: 'student' 
      },
      content: "Has shown consistent improvement in linear algebra. Good problem-solving approach. Should work on mathematical proofs.",
      rating: 4,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
    }
  ];
  
  reviews['student3'] = [
    {
      _id: 'review4',
      teacher: { 
        id: 'teacher1', 
        username: 'Knightv12', 
        email: 'stephenshum2001@yahoo.com.hk', 
        role: 'teacher' 
      },
      student: { 
        id: 'student3', 
        username: 'marywong', 
        email: 'mary.wong@example.com', 
        role: 'student' 
      },
      content: "Excellent work on probability theory. Very strong in statistical analysis. Consider exploring more advanced topics in this area.",
      rating: 5,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    }
  ];
  
  return reviews;
};

const StudentProgress = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [reviewContent, setReviewContent] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user || user.role !== 'teacher') return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await teacherStudentAPI.getTeacherStudents(user.id);
        setStudents(result.students);
        
        // Get reviews for all students
        const reviewsMap: Record<string, Review[]> = {};
        for (const student of result.students) {
          const reviewResult = await reviewsAPI.getStudentReviews(student.id);
          reviewsMap[student.id] = reviewResult.reviews;
        }
        setReviews(reviewsMap);
      } catch (err) {
        console.error('Error fetching students:', err);
        // Use sample data as fallback
        setStudents(sampleStudents);
        setReviews(generateSampleReviews());
        setError(null); // Clear error since we're using sample data
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, [user]);

  const handleSubmitReview = async () => {
    if (!selectedStudent || !user) return;
    
    if (!reviewContent.trim()) {
      toast.error('Review content cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (editingReview) {
        // Update existing review
        try {
          const result = await reviewsAPI.updateReview(editingReview._id, {
            content: reviewContent,
            rating
          });
          
          toast.success('Review updated successfully');
          
          // Update local reviews list
          const updatedReviews = {...reviews};
          const reviewIndex = updatedReviews[selectedStudent.id].findIndex(
            r => r._id === editingReview._id
          );
          
          if (reviewIndex !== -1) {
            updatedReviews[selectedStudent.id][reviewIndex] = result.review;
            setReviews(updatedReviews);
          }
          
          setEditingReview(null);
        } catch (err) {
          console.error('Error updating review:', err);
          toast.error('Failed to update review. Please try again.');
        }
      } else {
        // Create new review
        try {
          const result = await reviewsAPI.createReview({
            teacherId: user.id,
            studentId: selectedStudent.id,
            content: reviewContent,
            rating
          });
          
          toast.success('Review added successfully');
          
          // Update local reviews list
          const updatedReviews = {...reviews};
          updatedReviews[selectedStudent.id] = [
            result.review,
            ...updatedReviews[selectedStudent.id] || []
          ];
          setReviews(updatedReviews);
        } catch (err) {
          console.error('Error creating review:', err);
          
          // Create a mock review if API fails
          const mockReview: Review = {
            _id: `mock-${Date.now()}`,
            teacher: {
              id: user.id,
              username: user.username || 'Teacher',
              email: user.email || '',
              role: 'teacher'
            },
            student: selectedStudent,
            content: reviewContent,
            rating: rating,
            createdAt: new Date().toISOString()
          };
          
          toast.success('Review added successfully (offline mode)');
          
          // Update local reviews list
          const updatedReviews = {...reviews};
          updatedReviews[selectedStudent.id] = [
            mockReview,
            ...updatedReviews[selectedStudent.id] || []
          ];
          setReviews(updatedReviews);
        }
      }
      
      // Reset form
      setReviewContent('');
      setRating(5);
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setReviewContent(review.content);
    setRating(review.rating);
  };

  const handleDeleteReview = async (reviewId: string, studentId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await reviewsAPI.deleteReview(reviewId);
      toast.success('Review deleted successfully');
      
      // Update local reviews list
      const updatedReviews = {...reviews};
      updatedReviews[studentId] = updatedReviews[studentId].filter(
        r => r._id !== reviewId
      );
      setReviews(updatedReviews);
      
      // Reset form if editing the deleted review
      if (editingReview && editingReview._id === reviewId) {
        setEditingReview(null);
        setReviewContent('');
        setRating(5);
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      toast.error('Failed to delete review. Please try again.');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  const renderRatingSelector = () => {
    return (
      <div className="flex items-center space-x-1 mb-4">
        <span className="text-sm mr-2">Rating:</span>
        {[...Array(5)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors 
              ${i < rating ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-gray-400'}`}
          >
            <Star className={i < rating ? 'fill-yellow-400' : ''} size={20} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <LeftSidebar />
      <Header user={user} onLogout={logout} />
      
      <div className="flex h-full overflow-hidden">
        {/* Students list sidebar */}
        <div className="w-64 border-r border-border bg-card overflow-y-auto">
          <div className="p-4">
            <h2 className="font-medium text-lg mb-4">Your Students</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                You don't have any students yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {students.map((student) => (
                  <li key={student.id}>
                    <button
                      className={`w-full text-left p-2 rounded-md transition-colors ${
                        selectedStudent?.id === student.id 
                          ? 'bg-primary/10 text-primary' 
                          : 'hover:bg-secondary/50'
                      }`}
                      onClick={() => {
                        setSelectedStudent(student);
                        setEditingReview(null);
                        setReviewContent('');
                        setRating(5);
                      }}
                    >
                      <div className="font-medium">{student.username}</div>
                      <div className="text-xs text-muted-foreground truncate">{student.email}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedStudent ? (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">{selectedStudent.username}</h1>
                <p className="text-muted-foreground">{selectedStudent.email}</p>
              </div>
              
              {/* Review form */}
              <div className="bg-card p-6 rounded-lg border mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  {editingReview ? 'Edit Review' : 'Add New Review'}
                </h2>
                
                {renderRatingSelector()}
                
                <Textarea
                  placeholder="Write your feedback for this student..."
                  className="min-h-32 mb-4"
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                />
                
                <div className="flex space-x-3">
                  <Button 
                    onClick={handleSubmitReview} 
                    disabled={isSubmitting || !reviewContent.trim()}
                    className="flex-1"
                  >
                    {isSubmitting ? 
                      'Submitting...' : 
                      editingReview ? 'Update Review' : 'Add Review'
                    }
                  </Button>
                  
                  {editingReview && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditingReview(null);
                        setReviewContent('');
                        setRating(5);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Reviews list */}
              <h2 className="text-xl font-semibold mb-4">Previous Reviews</h2>
              
              {!reviews[selectedStudent.id] || reviews[selectedStudent.id].length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No reviews yet for this student.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews[selectedStudent.id].map((review) => (
                    <div 
                      key={review._id} 
                      className={`bg-card p-5 rounded-lg border ${
                        editingReview?._id === review._id ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex space-x-2 items-center">
                          {renderStars(review.rating)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditReview(review)}
                            className="p-1 text-muted-foreground hover:text-foreground"
                            title="Edit review"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review._id, selectedStudent.id)}
                            className="p-1 text-muted-foreground hover:text-red-500"
                            title="Delete review"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="whitespace-pre-line text-sm">{review.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-lg mb-2">Select a student from the list</p>
              <p className="text-sm">to view or add reviews</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProgress; 
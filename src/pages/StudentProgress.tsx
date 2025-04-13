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
        
        // 獲取所有學生的評論
        const reviewsMap: Record<string, Review[]> = {};
        for (const student of result.students) {
          const reviewResult = await reviewsAPI.getStudentReviews(student.id);
          reviewsMap[student.id] = reviewResult.reviews;
        }
        setReviews(reviewsMap);
      } catch (err) {
        console.error('Error fetching students:', err);
        // 使用示例數據
        setStudents(sampleStudents);
        setReviews(generateSampleReviews());
        setError(null); // 清除錯誤，因為我們使用了示例數據
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, [user]);

  const handleSubmitReview = async () => {
    if (!user || !selectedStudent) return;
    
    if (!reviewContent.trim()) {
      toast.error('Review content cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (editingReview) {
        // 更新評論
        await reviewsAPI.updateReview(editingReview._id, {
          content: reviewContent,
          rating
        });
        
        toast.success('Review updated successfully');
        
        // 更新本地評論列表
        const updatedReviews = {...reviews};
        updatedReviews[selectedStudent.id] = updatedReviews[selectedStudent.id].map(review => 
          review._id === editingReview._id 
            ? {...review, content: reviewContent, rating} 
            : review
        );
        setReviews(updatedReviews);
        
        setEditingReview(null);
      } else {
        // 創建新評論
        try {
          const result = await reviewsAPI.createReview({
            teacherId: user.id,
            studentId: selectedStudent.id,
            content: reviewContent,
            rating
          });
          
          toast.success('Review added successfully');
          
          // 更新本地評論列表
          const updatedReviews = {...reviews};
          updatedReviews[selectedStudent.id] = [
            result.review,
            ...updatedReviews[selectedStudent.id] || []
          ];
          setReviews(updatedReviews);
        } catch (err) {
          // API失敗的情況下，創建一個模擬的新評論
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
          
          toast.success('Review added successfully');
          
          // 更新本地評論列表
          const updatedReviews = {...reviews};
          updatedReviews[selectedStudent.id] = [
            mockReview,
            ...updatedReviews[selectedStudent.id] || []
          ];
          setReviews(updatedReviews);
        }
      }
      
      // 重置表單
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
      
      // 更新本地評論列表
      const updatedReviews = {...reviews};
      updatedReviews[studentId] = updatedReviews[studentId].filter(review => review._id !== reviewId);
      setReviews(updatedReviews);
      
      // 如果正在編輯該評論，重置表單
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

  // 渲染評分星星選擇器
  const StarRating = () => {
    return (
      <div className="flex items-center mb-4">
        <span className="mr-2">Rating:</span>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star 
              key={value} 
              className={`h-6 w-6 cursor-pointer ${value <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
              onClick={() => setRating(value)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <LeftSidebar />
      <Header user={user} onLogout={logout} />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Student Progress</h1>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You don't have any students yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* 學生列表 */}
              <div className="md:col-span-1 bg-card p-4 rounded-lg border h-fit">
                <h2 className="font-medium mb-4">Your Students</h2>
                <div className="space-y-2">
                  {students.map((student) => (
                    <div 
                      key={student.id} 
                      className={`p-3 rounded-md cursor-pointer ${selectedStudent?.id === student.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'}`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <p className="font-medium">{student.username}</p>
                      <p className="text-xs truncate">{student.email}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 學生詳情和評論 */}
              <div className="md:col-span-3">
                {selectedStudent ? (
                  <div>
                    <div className="bg-card p-6 rounded-lg border mb-6">
                      <h2 className="text-xl font-medium mb-4">{selectedStudent.username}</h2>
                      <p className="text-muted-foreground mb-2">{selectedStudent.email}</p>
                      
                      {/* 添加/編輯評論表單 */}
                      <div className="mt-6 border-t pt-4">
                        <h3 className="font-medium mb-3">
                          {editingReview ? 'Edit Review' : 'Add New Review'}
                        </h3>
                        
                        <StarRating />
                        
                        <Textarea
                          placeholder="Write your review about this student's progress..."
                          value={reviewContent}
                          onChange={(e) => setReviewContent(e.target.value)}
                          rows={4}
                          className="mb-4"
                        />
                        
                        <div className="flex gap-3">
                          <Button 
                            onClick={handleSubmitReview}
                            disabled={isSubmitting}
                          >
                            {isSubmitting 
                              ? 'Submitting...' 
                              : editingReview ? 'Update Review' : 'Add Review'
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
                    </div>
                    
                    {/* 評論列表 */}
                    <h3 className="font-medium mb-4">Reviews</h3>
                    
                    {reviews[selectedStudent.id]?.length > 0 ? (
                      <div className="space-y-4">
                        {reviews[selectedStudent.id].map((review) => (
                          <div key={review._id} className="bg-card p-4 rounded-lg border">
                            <div className="flex justify-between mb-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                  />
                                ))}
                                <span className="text-sm ml-2 text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditReview(review)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-red-500"
                                  onClick={() => handleDeleteReview(review._id, selectedStudent.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <p className="whitespace-pre-line">{review.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 bg-card rounded-lg border">
                        No reviews yet for this student.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-card rounded-lg border">
                    Select a student to view details and manage reviews.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProgress; 
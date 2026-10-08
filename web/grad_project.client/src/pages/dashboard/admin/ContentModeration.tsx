import { useState, useEffect, useCallback } from 'react';
import { adminApi, type AdminInternshipReview, type AdminCourseReview, type PaginatedResponse } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Trash2, Star, ChevronLeft, ChevronRight } from 'lucide-react';

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

export default function ContentModeration() {
  const [activeTab, setActiveTab] = useState<'internship' | 'course'>('internship');

  // Internship reviews state
  const [internshipData, setInternshipData] = useState<PaginatedResponse<AdminInternshipReview> | null>(null);
  const [internshipPage, setInternshipPage] = useState(1);
  const [internshipLoading, setInternshipLoading] = useState(true);

  // Course reviews state
  const [courseData, setCourseData] = useState<PaginatedResponse<AdminCourseReview> | null>(null);
  const [coursePage, setCoursePage] = useState(1);
  const [courseLoading, setCourseLoading] = useState(true);

  const fetchInternshipReviews = useCallback(async () => {
    setInternshipLoading(true);
    try {
      const res = await adminApi.getInternshipReviews({ page: internshipPage, pageSize: 15 });
      setInternshipData(res.data);
    } catch (error) {
      console.error('Error fetching internship reviews:', error);
    } finally {
      setInternshipLoading(false);
    }
  }, [internshipPage]);

  const fetchCourseReviews = useCallback(async () => {
    setCourseLoading(true);
    try {
      const res = await adminApi.getCourseReviews({ page: coursePage, pageSize: 15 });
      setCourseData(res.data);
    } catch (error) {
      console.error('Error fetching course reviews:', error);
    } finally {
      setCourseLoading(false);
    }
  }, [coursePage]);

  useEffect(() => {
    fetchInternshipReviews();
  }, [fetchInternshipReviews]);

  useEffect(() => {
    fetchCourseReviews();
  }, [fetchCourseReviews]);

  const handleDeleteInternshipReview = async (id: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await adminApi.deleteInternshipReview(id);
      fetchInternshipReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleDeleteCourseReview = async (id: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await adminApi.deleteCourseReview(id);
      fetchCourseReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MessageSquare className="h-8 w-8" />
          Content Moderation
        </h1>
        <p className="text-muted-foreground mt-1">Review and moderate user-generated content</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === 'internship' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('internship')}
        >
          Internship Reviews ({internshipData?.totalCount ?? 0})
        </Button>
        <Button
          variant={activeTab === 'course' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('course')}
        >
          Course Reviews ({courseData?.totalCount ?? 0})
        </Button>
      </div>

      {/* Internship Reviews Tab */}
      {activeTab === 'internship' && (
        <div className="space-y-3">
          {internshipLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
          ) : internshipData?.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No internship reviews found</div>
          ) : (
            <>
              {internshipData?.items.map((review) => (
                <Card key={review.reviewId}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{review.studentName}</p>
                          {renderStars(review.overallRating)}
                          <Badge variant="outline" className="text-xs">{review.overallRating}/5</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {review.internshipTitle} at {review.companyName}
                        </p>
                        {review.reviewText && (
                          <p className="text-sm mt-2 text-foreground/80 line-clamp-2">{review.reviewText}</p>
                        )}
                        {review.createdAt && (
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(review.createdAt)}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteInternshipReview(review.reviewId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0 ml-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {internshipData && internshipData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-2">
                  <Button variant="outline" size="sm" disabled={internshipPage <= 1} onClick={() => setInternshipPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {internshipData.page} of {internshipData.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={internshipPage >= internshipData.totalPages} onClick={() => setInternshipPage(p => p + 1)}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Course Reviews Tab */}
      {activeTab === 'course' && (
        <div className="space-y-3">
          {courseLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
          ) : courseData?.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No course reviews found</div>
          ) : (
            <>
              {courseData?.items.map((review) => (
                <Card key={review.reviewId}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{review.studentName}</p>
                          {renderStars(review.rating)}
                          <Badge variant="outline" className="text-xs">{review.rating}/5</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.courseTitle}</p>
                        {review.courseLink && (
                          <a href={review.courseLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                            {review.courseLink}
                          </a>
                        )}
                        {review.reviewText && (
                          <p className="text-sm mt-2 text-foreground/80 line-clamp-2">{review.reviewText}</p>
                        )}
                        {review.createdAt && (
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(review.createdAt)}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCourseReview(review.reviewId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0 ml-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {courseData && courseData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-2">
                  <Button variant="outline" size="sm" disabled={coursePage <= 1} onClick={() => setCoursePage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {courseData.page} of {courseData.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={coursePage >= courseData.totalPages} onClick={() => setCoursePage(p => p + 1)}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  savedCareerPlanApi,
  courseReviewApi,
  type SavedCareerPlanDto,
  type CourseReviewSummaryDto,
  type CareerPlanCourseDto,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  MessageSquare,
  User,
  Loader2,
  CheckCircle,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

export default function CourseReviewsPage() {
  const [searchParams] = useSearchParams();
  const courseParam = searchParams.get('course');

  const [activePlan, setActivePlan] = useState<SavedCareerPlanDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Selected course for viewing/adding review
  const [selectedCourse, setSelectedCourse] = useState<CareerPlanCourseDto | null>(null);
  const [courseReviews, setCourseReviews] = useState<CourseReviewSummaryDto | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchActivePlan();
  }, []);

  // Auto-select course from URL parameter
  useEffect(() => {
    if (activePlan && courseParam) {
      const course = activePlan.courses.find(c => c.courseTitle === courseParam);
      if (course) {
        loadCourseReviews(course);
      }
    }
  }, [activePlan, courseParam]);

  const fetchActivePlan = async () => {
    try {
      setLoading(true);
      const response = await savedCareerPlanApi.getActivePlan();
      setActivePlan(response.data);
    } catch {
      // No active plan
      setActivePlan(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseReviews = async (course: CareerPlanCourseDto) => {
    setSelectedCourse(course);
    setReviewRating(0);
    setReviewText('');
    setCourseReviews(null);

    try {
      setLoadingReviews(true);
      const response = await courseReviewApi.getReviews(course.courseTitle, course.courseLink || undefined);
      setCourseReviews(response.data);

      // If user has already reviewed, pre-fill the form
      const ownReview = response.data.reviews.find(r => r.isOwnReview);
      if (ownReview) {
        setReviewRating(ownReview.rating);
        setReviewText(ownReview.reviewText || '');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedCourse || reviewRating === 0) return;

    try {
      setSubmittingReview(true);
      setError('');

      const existingReview = courseReviews?.reviews.find(r => r.isOwnReview);

      if (existingReview) {
        await courseReviewApi.updateReview(existingReview.reviewId, {
          rating: reviewRating,
          reviewText: reviewText || undefined,
        });
      } else {
        await courseReviewApi.createReview({
          courseTitle: selectedCourse.courseTitle,
          courseLink: selectedCourse.courseLink || null,
          skillName: selectedCourse.skillName,
          rating: reviewRating,
          reviewText: reviewText || undefined,
        });
      }

      // Refresh reviews
      const response = await courseReviewApi.getReviews(selectedCourse.courseTitle, selectedCourse.courseLink || undefined);
      setCourseReviews(response.data);
      setSuccessMessage('Review submitted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    const existingReview = courseReviews?.reviews.find(r => r.isOwnReview);
    if (!existingReview || !selectedCourse) return;

    if (!confirm('Are you sure you want to delete your review?')) return;

    try {
      await courseReviewApi.deleteReview(existingReview.reviewId);

      // Refresh reviews
      const response = await courseReviewApi.getReviews(selectedCourse.courseTitle, selectedCourse.courseLink || undefined);
      setCourseReviews(response.data);
      setReviewRating(0);
      setReviewText('');
      setSuccessMessage('Review deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error deleting review:', err);
      setError(err.response?.data?.message || 'Failed to delete review.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // No course parameter provided
  if (!courseParam) {
    return (
      <div className="max-w-3xl">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No Course Selected</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Please select a course from your Career Plan to add a review.
            </p>
            <Button asChild className="gradient-btn hover:shadow-lg hover:shadow-primary/20 transition-all text-white">
              <Link to="/dashboard/student/career-plan">Go to Career Plan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No active plan
  if (!activePlan) {
    return (
      <div className="max-w-3xl">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No Active Career Plan</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You need an active career plan to add course reviews.
            </p>
            <Button asChild className="gradient-btn hover:shadow-lg hover:shadow-primary/20 transition-all text-white">
              <Link to="/dashboard/student/career-plan">Go to Career Planner</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Course not found in plan
  if (!selectedCourse) {
    return (
      <div className="max-w-3xl">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Course Not Found</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              The selected course was not found in your career plan.
            </p>
            <Button asChild className="gradient-btn hover:shadow-lg hover:shadow-primary/20 transition-all text-white">
              <Link to="/dashboard/student/career-plan">Go to Career Plan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Course Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedCourse.courseTitle}</CardTitle>
                  <CardDescription className="mt-2">
                    <Badge variant="outline" className="mr-2">{selectedCourse.skillName}</Badge>
                    <span>{selectedCourse.hours} hours</span>
                  </CardDescription>
                </div>
                {selectedCourse.courseLink && (
                  <Button asChild size="sm" variant="outline">
                    <a href={selectedCourse.courseLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Course
                    </a>
                  </Button>
                )}
              </div>
              {courseReviews && courseReviews.totalReviews > 0 && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-lg">{courseReviews.averageRating.toFixed(1)}</span>
                  </div>
                  <span className="text-muted-foreground">
                    ({courseReviews.totalReviews} {courseReviews.totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Add/Edit Review */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                {courseReviews?.reviews.find(r => r.isOwnReview) ? 'Your Review' : 'Write a Review'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="text-sm font-medium mb-2 block">Your Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="p-1 transition-transform hover:scale-110"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setReviewRating(star)}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoverRating || reviewRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  {reviewRating > 0 && (
                    <span className="ml-3 text-sm text-muted-foreground">
                      {reviewRating === 1 && 'Poor'}
                      {reviewRating === 2 && 'Fair'}
                      {reviewRating === 3 && 'Good'}
                      {reviewRating === 4 && 'Very Good'}
                      {reviewRating === 5 && 'Excellent'}
                    </span>
                  )}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="text-sm font-medium mb-2 block">Your Review (Optional)</label>
                <textarea
                  placeholder="Share your experience with this course..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full min-h-[120px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {reviewText.length}/1000
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitReview}
                  disabled={reviewRating === 0 || submittingReview}
                  className="gradient-btn text-white"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : courseReviews?.reviews.find(r => r.isOwnReview) ? (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Update Review
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
                {courseReviews?.reviews.find(r => r.isOwnReview) && (
                  <Button
                    variant="outline"
                    onClick={handleDeleteReview}
                    className="text-destructive hover:text-destructive"
                  >
                    Delete Review
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                All Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReviews ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : courseReviews && courseReviews.reviews.length > 0 ? (
                <div className="space-y-4">
                  {courseReviews.reviews.map((review) => (
                    <div
                      key={review.reviewId}
                      className={`p-4 rounded-lg border ${
                        review.isOwnReview ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {review.isOwnReview ? 'You' : review.studentName}
                              </span>
                              {review.isOwnReview && (
                                <Badge variant="outline" className="text-xs">Your review</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.createdAt || '').toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.reviewText && (
                        <p className="text-sm text-muted-foreground">{review.reviewText}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Be the first to review this course!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}

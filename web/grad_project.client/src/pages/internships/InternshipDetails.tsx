import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { internshipApi, applicationApi, internshipReviewApi, type Internship, type InternshipReviewSummaryDto } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Header } from '@/components/Header';
import { StudentLayout } from '@/components/StudentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  Building2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Hourglass,
  Star,
  MessageSquare,
  User,
  Video,
} from 'lucide-react';

export default function InternshipDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [applicationHasReport, setApplicationHasReport] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState('');
  const [reviewSummary, setReviewSummary] = useState<InternshipReviewSummaryDto | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    fetchInternship();
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await internshipReviewApi.getForInternship(Number(id));
      setReviewSummary(response.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Check if student has already applied and get status
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (isAuthenticated && user?.role === 'student') {
        try {
          const response = await applicationApi.getStudentApplications();
          const applications = response.data || [];
          const application = applications.find(
            (app: {
              internshipId: number;
              applicationId: number;
              status: string;
              hasMockInterviewReport?: boolean;
            }) => app.internshipId === Number(id)
          );
          if (application) {
            setApplicationStatus(application.status);
            setApplicationId(application.applicationId);
            setApplicationHasReport(Boolean(application.hasMockInterviewReport));
          }
        } catch (err) {
          console.error('Error checking application status:', err);
        }
      }
    };
    checkApplicationStatus();
  }, [id, isAuthenticated, user?.role]);

  const fetchInternship = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await internshipApi.getById(Number(id));
      setInternship(response.data);
    } catch (err) {
      console.error('Error fetching internship:', err);
      setError('Failed to load internship details.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
      return;
    }

    if (user?.role !== 'student') {
      setApplyError('Only candidates can apply for internships');
      return;
    }

    try {
      setApplying(true);
      setApplyError('');
      setApplySuccess('');

      await applicationApi.apply({
        internshipId: Number(id),
      });

      setApplicationStatus('pending');
      setApplySuccess('Application submitted successfully! You will receive a confirmation email shortly.');
    } catch (err: unknown) {
      console.error('Error applying:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setApplyError(axiosError.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const formatDuration = (weeks?: number) => {
    if (!weeks) return 'Not specified';
    if (weeks >= 4) {
      const months = Math.round(weeks / 4);
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  };

  const isDeadlinePassed = internship?.deadline
    ? new Date(internship.deadline) < new Date()
    : false;

  const isStudent = isAuthenticated && user?.role === 'student';

  // Wrapper component for consistent layout
  const PageWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isStudent) {
      return <StudentLayout>{children}</StudentLayout>;
    }
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />
        <main className="container max-w-4xl mx-auto px-4 pt-28 pb-8">
          {children}
        </main>
      </div>
    );
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !internship) {
    return (
      <PageWrapper>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Internship not found'}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/internships')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Internships
        </Button>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/internships')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Internships
        </Button>

        <div className="grid gap-6">
          {/* Main Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{internship.title}</CardTitle>
                  <CardDescription className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {internship.companyName || 'Company'}
                  </CardDescription>
                </div>
                <Badge variant={internship.isActive ? 'default' : 'secondary'}>
                  {internship.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {internship.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[var(--muted-foreground)]" />
                    <span>{internship.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[var(--muted-foreground)]" />
                  <span>{formatDuration(internship.periodInWeeks)}</span>
                </div>
                {internship.stipend && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--primary)]">
                      {internship.stipend} EGP
                    </span>
                  </div>
                )}
                {internship.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[var(--muted-foreground)]" />
                    <span>
                      Starts: {formatDate(internship.startDate)}
                    </span>
                  </div>
                )}
                {internship.deadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[var(--muted-foreground)]" />
                    <span>
                      Deadline: {formatDate(internship.deadline)}
                      {isDeadlinePassed && (
                        <Badge variant="destructive" className="ml-2">
                          Closed
                        </Badge>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-[var(--muted-foreground)] whitespace-pre-wrap">
                  {internship.description}
                </p>
              </div>

              {internship.requiredSkill && (
                <div>
                  <h3 className="font-semibold mb-2">Required Skill</h3>
                  <Badge variant="outline">
                    {internship.requiredSkill.skillName}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Apply Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Apply for this Internship
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {applySuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{applySuccess}</AlertDescription>
                </Alert>
              )}

              {applyError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{applyError}</AlertDescription>
                </Alert>
              )}

              {!applicationStatus && !isDeadlinePassed && internship.isActive && (
                <>
                  {!isAuthenticated ? (
                    <div className="space-y-2">
                      <p className="text-[var(--muted-foreground)]">
                        Please sign in to apply for this internship.
                      </p>
                      <Button asChild className="gradient-btn hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all text-white">
                        <Link to="/auth/signin">Sign In to Apply</Link>
                      </Button>
                    </div>
                  ) : user?.role !== 'student' ? (
                    <p className="text-[var(--muted-foreground)]">
                      Only candidates can apply for internships.
                    </p>
                  ) : (
                    <Button onClick={handleApply} disabled={applying} className="w-full gradient-btn hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all text-white">
                      {applying ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  )}
                </>
              )}

              {isDeadlinePassed && (
                <p className="text-[var(--muted-foreground)]">
                  The application deadline for this internship has passed.
                </p>
              )}

              {!internship.isActive && !isDeadlinePassed && (
                <p className="text-[var(--muted-foreground)]">
                  This internship is no longer accepting applications.
                </p>
              )}

              {applicationStatus && (
                <div className="text-center py-4">
                  {(() => {
                    const status = applicationStatus.toLowerCase();
                    if (status === 'completed') {
                      return (
                        <>
                          <CheckCircle className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                          <p className="font-semibold text-lg text-purple-700">You have completed this internship!</p>
                        </>
                      );
                    } else if (status === 'accepted') {
                      return (
                        <>
                          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                          <p className="font-semibold text-lg text-green-700">Your application has been accepted!</p>
                        </>
                      );
                    } else if (status === 'rejected' || status === 'refused') {
                      return (
                        <>
                          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                          <p className="font-semibold text-lg text-red-700">Your application was not accepted</p>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <Hourglass className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                          <p className="font-semibold text-lg text-yellow-700">Your application is under review</p>
                        </>
                      );
                    }
                  })()}
                </div>
              )}

              {applicationStatus && isStudent && (
                applicationStatus.toLowerCase() === 'pending' && !applicationHasReport ? (
                  <Button variant="outline" asChild className="w-full">
                    <Link
                      to={
                        applicationId !== null
                          ? `/dashboard/student/mock-interview?applicationId=${applicationId}`
                          : '/dashboard/student/mock-interview'
                      }
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Mock Interview
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled
                    className="w-full"
                    title={
                      applicationHasReport
                        ? 'You already completed a mock interview for this application.'
                        : 'Mock Interview is available while your application is pending.'
                    }
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Mock Interview
                  </Button>
                )
              )}
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Intern Reviews
              </CardTitle>
              {reviewSummary && reviewSummary.totalReviews > 0 && (
                <CardDescription className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    {renderStars(Math.round(reviewSummary.averageOverallRating), 'md')}
                    <span className="font-semibold text-lg">{reviewSummary.averageOverallRating.toFixed(1)}</span>
                    <span className="text-[var(--muted-foreground)]">
                      ({reviewSummary.totalReviews} review{reviewSummary.totalReviews !== 1 ? 's' : ''})
                    </span>
                  </div>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
                </div>
              ) : !reviewSummary || reviewSummary.totalReviews === 0 ? (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No reviews yet</p>
                  <p className="text-sm mt-1">Be the first to share your experience after completing this internship!</p>
                </div>
              ) : (
                <div className="space-y-4">
                    {reviewSummary.reviews.map((review) => (
                      <div key={review.reviewId} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-[var(--primary)]" />
                            </div>
                            <div>
                              <p className="font-medium">{review.studentName || 'Anonymous'}</p>
                              <p className="text-sm text-[var(--muted-foreground)]">
                                {review.createdAt ? formatDate(review.createdAt) : 'Recently'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {renderStars(review.overallRating)}
                            <span className="font-medium">{review.overallRating}/5</span>
                          </div>
                        </div>

                        {review.reviewText && (
                          <p className="text-sm text-[var(--muted-foreground)]">{review.reviewText}</p>
                        )}
                      </div>
                    ))}
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}

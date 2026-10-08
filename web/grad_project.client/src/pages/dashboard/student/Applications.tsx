import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { applicationApi, internshipReviewApi, type InternshipReviewDto } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InternshipReviewForm } from '@/components/InternshipReviewForm';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Star,
  Award,
  ExternalLink,
  MessageSquarePlus,
  Edit3,
  Loader2,
  Video,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Application {
  applicationId: number;
  internshipId: number;
  internshipTitle: string;
  companyName: string;
  status: string;
  appliedAt: string;
  reviewedAt: string | null;
  reviewerNotes: string | null;
  performanceRating: number | null;
  performanceComment: string | null;
  certificateUrl: string | null;
  completedAt: string | null;
  hasMockInterviewReport: boolean;
  mockInterviewReportShared: boolean;
}

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [existingReviews, setExistingReviews] = useState<Record<number, InternshipReviewDto>>({});
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Mock interview report viewer state
  const [reportViewerApplication, setReportViewerApplication] = useState<Application | null>(null);
  const [reportContent, setReportContent] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  // Fetch existing reviews for completed applications
  useEffect(() => {
    const fetchExistingReviews = async () => {
      const completedApps = applications.filter(a => a.status === 'completed');
      if (completedApps.length === 0) return;

      setReviewsLoading(true);
      try {
        const reviewsMap: Record<number, InternshipReviewDto> = {};
        for (const app of completedApps) {
          try {
            const checkResponse = await internshipReviewApi.checkExists(app.applicationId);
            if (checkResponse.data.exists && checkResponse.data.reviewId) {
              const myReviews = await internshipReviewApi.getMyReviews();
              const review = myReviews.data.find(r => r.applicationId === app.applicationId);
              if (review) {
                reviewsMap[app.applicationId] = review;
              }
            }
          } catch (err) {
            console.error('Error checking review for application:', app.applicationId, err);
          }
        }
        setExistingReviews(reviewsMap);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchExistingReviews();
  }, [applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationApi.getStudentApplications();
      setApplications(response.data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId: number) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;

    try {
      await applicationApi.withdraw(applicationId);
      setApplications(applications.filter(a => a.applicationId !== applicationId));
    } catch (err: unknown) {
      console.error('Error withdrawing application:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      alert(axiosError.response?.data?.message || 'Failed to withdraw application');
    }
  };

  const openMockInterviewReport = async (application: Application) => {
    setReportViewerApplication(application);
    setReportContent('');
    setReportError(null);
    setReportLoading(true);
    // Capture the id we're loading for; if the user opens a different report
    // before this fetch resolves, the late response is ignored instead of
    // overwriting the newer one.
    const requestedId = application.applicationId;
    try {
      const { data } = await applicationApi.getMyMockInterviewReport(requestedId);
      setReportViewerApplication((current) => {
        if (current?.applicationId !== requestedId) return current;
        setReportContent(data.report);
        return current;
      });
    } catch (err) {
      console.error('Error fetching mock interview report:', err);
      setReportViewerApplication((current) => {
        if (current?.applicationId !== requestedId) return current;
        const axiosError = err as { response?: { data?: { message?: string }, status?: number } };
        setReportError(axiosError.response?.data?.message || 'Failed to load the report.');
        return current;
      });
    } finally {
      setReportViewerApplication((current) => {
        if (current?.applicationId === requestedId) {
          setReportLoading(false);
        }
        return current;
      });
    }
  };

  const closeMockInterviewReport = () => {
    setReportViewerApplication(null);
    setReportContent('');
    setReportError(null);
  };

  const [sharingId, setSharingId] = useState<number | null>(null);

  const handleToggleShareReport = async (application: Application) => {
    const nextShared = !application.mockInterviewReportShared;
    try {
      setSharingId(application.applicationId);
      await applicationApi.shareMockInterviewReport(application.applicationId, nextShared);
      setApplications((prev) =>
        prev.map((a) =>
          a.applicationId === application.applicationId
            ? { ...a, mockInterviewReportShared: nextShared }
            : a
        )
      );
    } catch (err: unknown) {
      console.error('Error updating report sharing:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      alert(axiosError.response?.data?.message || 'Failed to update report sharing');
    } finally {
      setSharingId(null);
    }
  };

  const handleOpenReview = (application: Application) => {
    setSelectedApplication(application);
    setReviewDialogOpen(true);
  };

  const handleReviewSuccess = async () => {
    // Refresh reviews after successful submission
    if (selectedApplication) {
      try {
        const myReviews = await internshipReviewApi.getMyReviews();
        const review = myReviews.data.find(r => r.applicationId === selectedApplication.applicationId);
        if (review) {
          setExistingReviews(prev => ({
            ...prev,
            [selectedApplication.applicationId]: review
          }));
        }
      } catch (err) {
        console.error('Error refreshing reviews:', err);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-purple-600 hover:bg-purple-600 text-white flex items-center gap-1">
            <Award className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-green-600 hover:bg-green-600 text-white flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-600 hover:bg-red-600 text-white flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Refused
          </Badge>
        );
      case 'reviewed':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Under Review
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Congratulations! You have successfully completed this internship.';
      case 'accepted':
        return 'Congratulations! Your application has been accepted.';
      case 'rejected':
        return 'Unfortunately, your application was not selected.';
      case 'reviewed':
        return 'Your application is under review by the recruiter.';
      default:
        return 'Your application is pending review.';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            My Applications
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Track the status of your internship applications
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-[var(--muted-foreground)] text-center mb-4">
                Start applying to internships to see them here
              </p>
              <Button asChild>
                <Link to="/internships">Browse Internships</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.applicationId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{application.internshipTitle}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4" />
                        {application.companyName}
                      </CardDescription>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {getStatusMessage(application.status)}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <Calendar className="h-4 w-4" />
                    Applied: {formatDate(application.appliedAt)}
                    {application.reviewedAt && (
                      <span className="ml-4">
                        Reviewed: {formatDate(application.reviewedAt)}
                      </span>
                    )}
                  </div>

                  {application.reviewerNotes && (
                    <div className="bg-[var(--muted)] p-3 rounded-md">
                      <p className="text-sm font-medium mb-1">Recruiter Notes:</p>
                      <p className="text-sm">{application.reviewerNotes}</p>
                    </div>
                  )}

                  {/* Completion Details */}
                  {application.status === 'completed' && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Internship Completed!</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-[var(--muted-foreground)]">Performance Rating</p>
                          <div className="flex items-center gap-2">
                            {renderStars(application.performanceRating || 0)}
                            <span className="text-sm font-medium">{application.performanceRating}/5</span>
                          </div>
                        </div>
                        {application.completedAt && (
                          <div>
                            <p className="text-sm text-[var(--muted-foreground)]">Completed On</p>
                            <p className="font-medium">{formatDate(application.completedAt)}</p>
                          </div>
                        )}
                      </div>
                      {application.performanceComment && (
                        <div>
                          <p className="text-sm text-[var(--muted-foreground)]">Performance Feedback</p>
                          <p className="text-sm">{application.performanceComment}</p>
                        </div>
                      )}
                      {application.certificateUrl && (
                        <div>
                          <a
                            href={application.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                          >
                            <Award className="h-4 w-4" />
                            View Certificate
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button variant="outline" asChild>
                      <Link to={`/internships/${application.internshipId}`}>View Internship</Link>
                    </Button>
                    {application.status !== 'completed' ? (
                      <Button variant="outline" asChild>
                        <Link to={`/dashboard/student/mock-interview?applicationId=${application.applicationId}`}>
                          <Video className="h-4 w-4 mr-1" />
                          {application.hasMockInterviewReport ? 'Retake Mock Interview' : 'Mock Interview'}
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        disabled
                        title="Mock Interview is not available once the application is completed."
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Mock Interview
                      </Button>
                    )}
                    {application.hasMockInterviewReport && (
                      <Button
                        variant="outline"
                        onClick={() => openMockInterviewReport(application)}
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Mock Interview Report
                      </Button>
                    )}
                    {application.hasMockInterviewReport && (
                      application.mockInterviewReportShared ? (
                        <Button
                          variant="outline"
                          onClick={() => handleToggleShareReport(application)}
                          disabled={sharingId === application.applicationId}
                          className="text-green-700 border-green-300 hover:bg-green-50"
                          title="The recruiter can currently see this report. Click to hide it again."
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Shared with Recruiter
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => handleToggleShareReport(application)}
                          disabled={sharingId === application.applicationId}
                          title="Let the recruiter see your mock interview report."
                        >
                          <EyeOff className="h-4 w-4 mr-1" />
                          Show Report to Recruiter
                        </Button>
                      )
                    )}
                    {application.status === 'pending' && (
                      <Button
                        variant="outline"
                        onClick={() => handleWithdraw(application.applicationId)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Withdraw
                      </Button>
                    )}
                    {application.status === 'completed' && (
                      existingReviews[application.applicationId] ? (
                        <Button
                          variant="outline"
                          onClick={() => handleOpenReview(application)}
                          disabled={reviewsLoading}
                          className="text-[var(--primary)]"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit Review
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleOpenReview(application)}
                          disabled={reviewsLoading}
                          className="gradient-btn text-white"
                        >
                          <MessageSquarePlus className="h-4 w-4 mr-1" />
                          Write Review
                        </Button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      {/* Review Form Dialog */}
      {selectedApplication && (
        <InternshipReviewForm
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          applicationId={selectedApplication.applicationId}
          internshipTitle={selectedApplication.internshipTitle}
          companyName={selectedApplication.companyName}
          existingReview={existingReviews[selectedApplication.applicationId] || null}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Mock Interview Report Dialog */}
      <Dialog
        open={reportViewerApplication !== null}
        onOpenChange={(open) => {
          if (!open) closeMockInterviewReport();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogClose
            aria-label="Close report"
            onClick={closeMockInterviewReport}
          />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Mock Interview Report
            </DialogTitle>
            <DialogDescription>
              {reportViewerApplication
                ? `${reportViewerApplication.internshipTitle} — ${reportViewerApplication.companyName}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {reportLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading report…
            </div>
          )}
          {reportError && !reportLoading && (
            <Alert variant="destructive">
              <AlertDescription>{reportError}</AlertDescription>
            </Alert>
          )}
          {!reportLoading && !reportError && reportContent && (
            // react-markdown by default ignores raw HTML in the source, which
            // is what we want here — the report comes from the AI agent and
            // is therefore untrusted. If you ever add `rehype-raw` for richer
            // rendering, pair it with `rehype-sanitize` to keep this safe.
            <article className="prose prose-sm max-w-none">
              <ReactMarkdown>{reportContent}</ReactMarkdown>
            </article>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { applicationApi, internshipApi, openCvBlob } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { RecruiterLayout } from '@/components/RecruiterLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Users,
  Star,
  Award,
  Undo2,
  Loader2,
  Video,
} from 'lucide-react';

interface Skill {
  skillId: number;
  skillName: string;
}

interface Application {
  applicationId: number;
  internshipId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  status: string;
  appliedAt: string;
  reviewedAt: string | null;
  reviewerNotes: string | null;
  performanceRating: number | null;
  performanceComment: string | null;
  certificateUrl: string | null;
  completedAt: string | null;
  universityName: string | null;
  majorName: string | null;
  gpa: number | null;
  graduationYear: number | null;
  hasCv: boolean;
  linkedinUrl: string | null;
  githubUrl: string | null;
  studentSkills: Skill[] | null;
  hasMockInterviewReport: boolean;
}

interface Internship {
  internshipId: number;
  title: string;
  companyName: string;
}

export default function ApplicationsPage() {
  const { internshipId } = useParams<{ internshipId: string }>();

  const [internship, setInternship] = useState<Internship | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Completion form state
  const [completingApplication, setCompletingApplication] = useState<Application | null>(null);
  const [performanceRating, setPerformanceRating] = useState(5);
  const [performanceComment, setPerformanceComment] = useState('');

  // Mock interview report viewer state
  const [reportViewerApplication, setReportViewerApplication] = useState<Application | null>(null);
  const [reportContent, setReportContent] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [internshipId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [internshipRes, applicationsRes] = await Promise.all([
        internshipApi.getById(Number(internshipId)),
        applicationApi.getInternshipApplications(Number(internshipId)),
      ]);
      setInternship(internshipRes.data);
      setApplications(applicationsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId: number, status: string) => {
    try {
      setUpdating(true);
      await applicationApi.updateStatus(applicationId, { status, reviewerNotes: reviewNotes });

      // Update local state
      setApplications(applications.map(app =>
        app.applicationId === applicationId
          ? { ...app, status, reviewerNotes: reviewNotes, reviewedAt: new Date().toISOString() }
          : app
      ));
      setSelectedApplication(null);
      setReviewNotes('');
    } catch (err: unknown) {
      console.error('Error updating status:', err);
      const axiosError = err as { response?: { data?: { message?: string }, status?: number }, message?: string };
      const errorMsg = axiosError.response?.data?.message || axiosError.message || 'Failed to update application status';
      const statusCode = axiosError.response?.status;
      alert(`Error ${statusCode || ''}: ${errorMsg}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = async (applicationId: number) => {
    try {
      setUpdating(true);
      await applicationApi.complete(applicationId, {
        performanceRating,
        performanceComment: performanceComment || undefined,
      });

      // Update local state
      setApplications(applications.map(app =>
        app.applicationId === applicationId
          ? {
              ...app,
              status: 'completed',
              performanceRating,
              performanceComment,
              completedAt: new Date().toISOString(),
            }
          : app
      ));
      setCompletingApplication(null);
      setPerformanceRating(5);
      setPerformanceComment('');
    } catch (err: unknown) {
      console.error('Error completing application:', err);
      const axiosError = err as { response?: { data?: { message?: string }, status?: number }, message?: string };
      const errorMsg = axiosError.response?.data?.message || axiosError.message || 'Failed to complete application';
      alert(`Error: ${errorMsg}`);
    } finally {
      setUpdating(false);
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
      const { data } = await applicationApi.getMockInterviewReport(requestedId);
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

  const openCompletionForm = (application: Application) => {
    setCompletingApplication(application);
    setPerformanceRating(application.performanceRating || 5);
    setPerformanceComment(application.performanceComment || '');
  };

  const handleUndoComplete = async (applicationId: number) => {
    if (!confirm('Are you sure you want to undo the completion? This will revert the status to "Accepted" and remove all completion details.')) {
      return;
    }

    try {
      setUpdating(true);
      await applicationApi.undoComplete(applicationId);

      // Update local state
      setApplications(applications.map(app =>
        app.applicationId === applicationId
          ? {
              ...app,
              status: 'accepted',
              performanceRating: null,
              performanceComment: null,
              certificateUrl: null,
              completedAt: null,
            }
          : app
      ));
    } catch (err: unknown) {
      console.error('Error undoing completion:', err);
      const axiosError = err as { response?: { data?: { message?: string }, status?: number }, message?: string };
      const errorMsg = axiosError.response?.data?.message || axiosError.message || 'Failed to undo completion';
      alert(`Error: ${errorMsg}`);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-purple-600 hover:bg-purple-600 text-white">Completed</Badge>;
      case 'accepted':
        return <Badge className="bg-green-600 hover:bg-green-600 text-white">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-600 hover:bg-red-600 text-white">Refused</Badge>;
      case 'reviewed':
        return <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white">Under Review</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
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

  if (loading) {
    return (
      <RecruiterLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Applications
          </h1>
          <p className="text-muted-foreground mt-1">
            {internship?.title} - {applications.length} application{applications.length !== 1 ? 's' : ''}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground">
                Applications will appear here once candidates apply
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {applications.map((application) => (
              <Card key={application.applicationId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {application.studentName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4" />
                        {application.studentEmail}
                      </CardDescription>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {application.universityName && (
                      <div>
                        <p className="text-sm text-muted-foreground">University</p>
                        <p className="font-medium">{application.universityName}</p>
                      </div>
                    )}
                    {application.majorName && (
                      <div>
                        <p className="text-sm text-muted-foreground">Major</p>
                        <p className="font-medium">{application.majorName}</p>
                      </div>
                    )}
                    {application.gpa && (
                      <div>
                        <p className="text-sm text-muted-foreground">GPA</p>
                        <p className="font-medium">{application.gpa}</p>
                      </div>
                    )}
                    {application.graduationYear && (
                      <div className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{application.graduationYear}</span>
                      </div>
                    )}
                  </div>

                  {application.studentSkills && application.studentSkills.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {application.studentSkills.map((skill) => (
                          <Badge key={skill.skillId} variant="outline" className="text-xs">
                            {skill.skillName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4">
                    {application.hasCv && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await applicationApi.downloadCv(application.applicationId);
                          await openCvBlob(res.data as Blob);
                        }}
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                      >
                        <FileText className="h-4 w-4" />
                        View CV
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                    {application.linkedinUrl && (
                      <a
                        href={application.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                      >
                        LinkedIn
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {application.githubUrl && (
                      <a
                        href={application.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                      >
                        GitHub
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {application.hasMockInterviewReport && (
                      <button
                        type="button"
                        onClick={() => openMockInterviewReport(application)}
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                      >
                        <Video className="h-4 w-4" />
                        Mock Interview Report
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Applied: {formatDate(application.appliedAt)}
                    {application.reviewedAt && (
                      <span className="ml-4">
                        Reviewed: {formatDate(application.reviewedAt)}
                      </span>
                    )}
                  </div>

                  {application.reviewerNotes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Review Notes</p>
                      <p className="text-sm">{application.reviewerNotes}</p>
                    </div>
                  )}

                  {/* Completion Details */}
                  {application.status === 'completed' && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Internship Completed</span>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Rating</p>
                        <div className="flex items-center gap-2">
                          {renderStars(application.performanceRating || 0)}
                          <span className="text-sm font-medium">{application.performanceRating}/5</span>
                        </div>
                      </div>
                      {application.performanceComment && (
                        <div>
                          <p className="text-sm text-muted-foreground">Comment</p>
                          <p className="text-sm">{application.performanceComment}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    {/* Completion Form */}
                    {completingApplication?.applicationId === application.applicationId ? (
                      <div className="space-y-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Award className="h-5 w-5 text-purple-600" />
                          {application.status === 'completed' ? 'Edit Completion Details' : 'Mark Internship Complete'}
                        </h4>
                        <div className="space-y-2">
                          <Label>Performance Rating (Required)</Label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setPerformanceRating(star)}
                                className="p-1 hover:scale-110 transition-transform"
                              >
                                <Star
                                  className={`h-6 w-6 ${
                                    star <= performanceRating
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="ml-2 text-sm text-muted-foreground self-center">
                              {performanceRating}/5
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="performanceComment">Comment (Optional)</Label>
                          <Textarea
                            id="performanceComment"
                            value={performanceComment}
                            onChange={(e) => setPerformanceComment(e.target.value)}
                            placeholder="Describe the candidate's performance during the internship..."
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleComplete(application.applicationId)}
                            disabled={updating}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Award className="h-4 w-4 mr-1" />
                            {application.status === 'completed' ? 'Update Rating' : 'Mark Complete'}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setCompletingApplication(null);
                              setPerformanceRating(5);
                              setPerformanceComment('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : selectedApplication?.applicationId === application.applicationId ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="notes">Review Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              placeholder="Add notes about this application..."
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleUpdateStatus(application.applicationId, 'accepted')}
                              disabled={updating}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              onClick={() => handleUpdateStatus(application.applicationId, 'rejected')}
                              disabled={updating}
                              variant="destructive"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              onClick={() => handleUpdateStatus(application.applicationId, 'reviewed')}
                              disabled={updating}
                              variant="outline"
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Mark Reviewed
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setSelectedApplication(null);
                                setReviewNotes('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                    ) : (
                      <div className="flex gap-2">
                        {application.status !== 'completed' && (
                          <Button variant="outline" onClick={() => setSelectedApplication(application)}>
                            Update Status
                          </Button>
                        )}
                        {(application.status === 'accepted' || application.status === 'completed') && (
                          <Button
                            variant="outline"
                            onClick={() => openCompletionForm(application)}
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            <Award className="h-4 w-4 mr-1" />
                            {application.status === 'completed' ? 'Edit Completion' : 'Mark Complete'}
                          </Button>
                        )}
                        {application.status === 'completed' && (
                          <Button
                            variant="outline"
                            onClick={() => handleUndoComplete(application.applicationId)}
                            disabled={updating}
                            className="border-orange-300 text-orange-700 hover:bg-orange-50"
                          >
                            <Undo2 className="h-4 w-4 mr-1" />
                            Undo Completion
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
              {reportViewerApplication?.studentName ?? ''} — generated by the AI interviewer.
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
    </RecruiterLayout>
  );
}

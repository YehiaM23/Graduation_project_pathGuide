import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationApi, openCvBlob } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { RecruiterLayout } from '@/components/RecruiterLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Briefcase,
  Star,
  Award,
  Undo2,
} from 'lucide-react';

interface Skill {
  skillId: number;
  skillName: string;
}

interface Application {
  applicationId: number;
  internshipId: number;
  internshipTitle: string;
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
}

export default function AllApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  // Completion form state
  const [completingApplication, setCompletingApplication] = useState<Application | null>(null);
  const [performanceRating, setPerformanceRating] = useState(5);
  const [performanceComment, setPerformanceComment] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationApi.getRecruiterApplications();
      setApplications(response.data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId: number, status: string) => {
    try {
      setUpdating(true);
      await applicationApi.updateStatus(applicationId, { status, reviewerNotes: reviewNotes });

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
      alert(`Error: ${errorMsg}`);
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

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewed: applications.filter(a => a.status === 'reviewed').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    completed: applications.filter(a => a.status === 'completed').length,
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
            All Applications
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and manage applications across all your internships
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'reviewed', label: 'Under Review' },
            { key: 'accepted', label: 'Accepted' },
            { key: 'rejected', label: 'Refused' },
            { key: 'completed', label: 'Completed' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(key)}
              className={filter === key ? 'gradient-btn text-white' : ''}
            >
              {label} ({statusCounts[key as keyof typeof statusCounts]})
            </Button>
          ))}
        </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Applications will appear here once candidates apply to your internships
              </p>
              <Button asChild className="gradient-btn hover:shadow-lg hover:shadow-primary/20 transition-all text-white">
                <Link to="/dashboard/recruiter/internships/new">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Post an Internship
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No {filter} applications</h3>
              <p className="text-muted-foreground">
                Try selecting a different filter
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredApplications.map((application) => (
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
                      <div className="mt-2">
                        <Link
                          to={`/dashboard/recruiter/internships/${application.internshipId}/applications`}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <Briefcase className="h-3 w-3" />
                          {application.internshipTitle}
                        </Link>
                      </div>
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
    </RecruiterLayout>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { savedCareerPlanApi, type SavedCareerPlanDto, type CareerPlanCourseDto } from '@/lib/api';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  Upload,
  AlertCircle,
} from 'lucide-react';

export default function CompleteCourse() {
  const navigate = useNavigate();
  const { planId, courseId } = useParams<{ planId: string; courseId: string }>();

  const [plan, setPlan] = useState<SavedCareerPlanDto | null>(null);
  const [course, setCourse] = useState<CareerPlanCourseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');

  useEffect(() => {
    fetchPlanAndCourse();
  }, [planId, courseId]);

  const fetchPlanAndCourse = async () => {
    if (!planId || !courseId) {
      setError('Invalid plan or course ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await savedCareerPlanApi.getPlan(parseInt(planId));
      setPlan(response.data);

      const foundCourse = response.data.courses.find(
        (c) => c.courseId === parseInt(courseId)
      );

      if (foundCourse) {
        setCourse(foundCourse);
        setCertificateUrl(foundCourse.certificateUrl || '');
      } else {
        setError('Course not found');
      }
    } catch (err) {
      console.error('Error fetching plan:', err);
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!planId || !courseId) return;

    try {
      setSaving(true);
      setError('');

      await savedCareerPlanApi.markCourseComplete(
        parseInt(planId),
        parseInt(courseId),
        { certificateUrl: certificateUrl || undefined }
      );

      navigate('/dashboard/student/career-plan', {
        state: { success: 'Course marked as complete!' }
      });
    } catch (err: any) {
      console.error('Error marking course complete:', err);
      const errorMsg = err.response?.data?.message || 'Failed to mark course as complete.';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)] pt-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-3xl mx-auto px-4 pt-28 pb-8">
          <Button variant="ghost" className="mb-6" onClick={() => navigate('/dashboard/student/career-plan')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Career Plan
          </Button>

          <Card className="border-destructive">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Error</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button asChild>
                <Link to="/dashboard/student/career-plan">Go Back</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-3xl mx-auto px-4 pt-28 pb-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/dashboard/student/career-plan')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Career Plan
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            Mark Course Complete
          </h1>
          <p className="text-muted-foreground mt-2">
            Record your completion and add your certificate
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {course && (
          <div className="space-y-6">
            {/* Course Details Card */}
            <Card className="border-primary/50">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Course Details
                </CardTitle>
                <CardDescription>
                  Step {course.stepNumber} in your learning path
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{course.courseTitle}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-muted-foreground">Skill:</span>
                    <Badge variant="outline">{course.skillName}</Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{course.hours} hours</span>
                  </div>
                  {course.courseLink && (
                    <a
                      href={course.courseLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View Course</span>
                    </a>
                  )}
                </div>

                {course.prerequisites.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Prerequisites:</p>
                    <div className="flex flex-wrap gap-2">
                      {course.prerequisites.map((prereq) => (
                        <Badge key={prereq} variant="secondary" className="text-xs">
                          {prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certificate Upload Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Certificate of Completion
                </CardTitle>
                <CardDescription>
                  Add a link to your certificate as proof of completion (optional but recommended)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="certificateUrl">Certificate URL</Label>
                  <Input
                    id="certificateUrl"
                    placeholder="https://example.com/certificate/your-certificate"
                    value={certificateUrl}
                    onChange={(e) => setCertificateUrl(e.target.value)}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste a link to your certificate from Coursera, Udemy, LinkedIn Learning, or any other platform
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-2">Tips for certificates:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Use the shareable link provided by the course platform</li>
                    <li>• Make sure the link is public or accessible</li>
                    <li>• You can also link to a PDF stored in Google Drive or Dropbox</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleMarkComplete}
                disabled={saving}
                className="flex-1 h-14 text-lg gradient-btn hover:shadow-lg hover:shadow-primary/20 transition-all text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Mark as Complete
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/student/career-plan')}
                className="sm:w-auto h-14"
              >
                Cancel
              </Button>
            </div>

            {/* Info Card */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">What happens next?</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Once you mark this course as complete, your progress will be updated and you'll be one step closer to achieving your career goal as a {plan?.targetRole}!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  studentApi,
  careerPlanApi,
  savedCareerPlanApi,
  type PlanResponse,
  type RoleInfo,
  type SavedCareerPlanDto,
  type SavedCareerPlanSummary,
  type CareerPlanCourseDto,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Target,
  BookOpen,
  Clock,
  CheckCircle,
  ExternalLink,
  Loader2,
  GraduationCap,
  TrendingUp,
  Calendar,
  AlertCircle,
  ArrowRight,
  Save,
  History,
  Upload,
  Award,
  Circle,
  Trash2,
  Eye,
  MessageSquare,
} from 'lucide-react';

interface Skill {
  skillId: number;
  skillName: string;
}

interface StudentProfile {
  careerPathName?: string;
  skills?: Skill[];
}

export default function CareerPlanPage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [roleInfo, setRoleInfo] = useState<RoleInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Saved plan states
  const [savedPlans, setSavedPlans] = useState<SavedCareerPlanSummary[]>([]);
  const [activeSavedPlan, setActiveSavedPlan] = useState<SavedCareerPlanDto | null>(null);
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [loadingSavedPlan, setLoadingSavedPlan] = useState(false);

  // Certificate upload modal
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CareerPlanCourseDto | null>(null);
  const [certificateUrl, setCertificateUrl] = useState('');
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    fetchStudentProfile();
    fetchSavedPlans();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      setLoadingProfile(true);
      const response = await studentApi.getProfile();
      setProfile(response.data);
      const skills = response.data.skills || [];
      setCurrentSkills(skills.map((s: Skill) => s.skillName));
    } catch (err) {
      console.error('Error fetching student profile:', err);
      setError('Failed to load your profile.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchSavedPlans = async () => {
    try {
      const response = await savedCareerPlanApi.getMyPlans();
      setSavedPlans(response.data);

      // Also fetch active plan if exists
      try {
        const activeResponse = await savedCareerPlanApi.getActivePlan();
        setActiveSavedPlan(activeResponse.data);
      } catch {
        // No active plan exists
        setActiveSavedPlan(null);
      }
    } catch (err) {
      console.error('Error fetching saved plans:', err);
    }
  };

  const handleGeneratePlan = async () => {
    if (!profile?.careerPathName) {
      setError('Please set your career path in your profile first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setPlan(null);
      setRoleInfo(null);

      const [planResponse, rolesResponse] = await Promise.all([
        careerPlanApi.createPlan({
          target_role: profile.careerPathName,
          current_skills: currentSkills,
        }),
        careerPlanApi.getRoles(),
      ]);

      setPlan(planResponse.data);

      const targetRole = rolesResponse.data.find(
        (r) => r.role.toLowerCase() === profile.careerPathName?.toLowerCase()
      );
      if (targetRole) {
        setRoleInfo(targetRole);
      }
    } catch (err) {
      console.error('Error generating plan:', err);
      setError('Career Planner service is not available. Please make sure the service is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!plan) return;

    try {
      setSavingPlan(true);
      setError('');

      const requestData = {
        targetRole: plan.target_role,
        skillsNeeded: plan.skills_needed,
        steps: plan.steps.map((step) => ({
          step: step.step,
          skill: step.skill,
          courseTitle: step.course_title,
          courseLink: step.course_link,
          hours: step.hours,
          cumulativeHours: step.cumulative_hours,
          prerequisites: step.prerequisites,
        })),
        totalHours: plan.total_hours,
        weeksAt10H: plan.weeks_at_10h,
      };

      console.log('Sending request data:', JSON.stringify(requestData, null, 2));

      const response = await savedCareerPlanApi.savePlan({
        targetRole: plan.target_role,
        skillsNeeded: plan.skills_needed,
        steps: plan.steps.map((step) => ({
          step: step.step,
          skill: step.skill,
          courseTitle: step.course_title,
          courseLink: step.course_link,
          hours: step.hours,
          cumulativeHours: step.cumulative_hours,
          prerequisites: step.prerequisites,
        })),
        totalHours: plan.total_hours,
        weeksAt10H: plan.weeks_at_10h,
      });

      setActiveSavedPlan(response.data);
      setSuccessMessage('Career plan saved successfully! You can now track your progress.');
      await fetchSavedPlans();

      // Clear the generated plan view and show saved plan
      setPlan(null);

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error('Error saving plan:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      let errorMsg = err.response?.data?.message || err.message || 'Failed to save career plan.';
      if (err.response?.data?.errors) {
        errorMsg += ' Errors: ' + JSON.stringify(err.response.data.errors);
      }
      setError(errorMsg);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleViewSavedPlan = async (planId: number) => {
    try {
      setLoadingSavedPlan(true);
      const response = await savedCareerPlanApi.getPlan(planId);
      setActiveSavedPlan(response.data);
      setShowSavedPlans(false);
    } catch (err) {
      console.error('Error fetching saved plan:', err);
      setError('Failed to load saved plan.');
    } finally {
      setLoadingSavedPlan(false);
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this career plan?')) return;

    try {
      await savedCareerPlanApi.deletePlan(planId);
      setSuccessMessage('Career plan deleted successfully.');
      await fetchSavedPlans();

      if (activeSavedPlan?.savedPlanId === planId) {
        setActiveSavedPlan(null);
      }

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('Failed to delete career plan.');
    }
  };

  const openCertModal = (course: CareerPlanCourseDto) => {
    setSelectedCourse(course);
    setCertificateUrl(course.certificateUrl || '');
    setShowCertModal(true);
  };

  const handleMarkComplete = async () => {
    if (!activeSavedPlan || !selectedCourse) return;

    try {
      setMarkingComplete(true);
      await savedCareerPlanApi.markCourseComplete(
        activeSavedPlan.savedPlanId,
        selectedCourse.courseId,
        { certificateUrl: certificateUrl || undefined }
      );

      // Refresh the active plan
      const response = await savedCareerPlanApi.getPlan(activeSavedPlan.savedPlanId);
      setActiveSavedPlan(response.data);
      await fetchSavedPlans();

      setShowCertModal(false);
      setSelectedCourse(null);
      setCertificateUrl('');
      setSuccessMessage('Course marked as complete!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error marking course complete:', err);
      setError('Failed to mark course as complete.');
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleMarkUncomplete = async (course: CareerPlanCourseDto) => {
    if (!activeSavedPlan) return;

    try {
      await savedCareerPlanApi.markCourseUncomplete(
        activeSavedPlan.savedPlanId,
        course.courseId
      );

      const response = await savedCareerPlanApi.getPlan(activeSavedPlan.savedPlanId);
      setActiveSavedPlan(response.data);
      await fetchSavedPlans();
    } catch (err) {
      console.error('Error marking course uncomplete:', err);
      setError('Failed to update course status.');
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.careerPathName) {
    return (
      <div className="max-w-3xl">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Career Path Not Set</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              To use the Career Path Planner, you need to set your career goal in your profile first.
              This helps us create a personalized learning path just for you.
            </p>
            <Button asChild size="lg" className="gradient-btn hover:shadow-lg hover:shadow-primary/20 transition-all text-white">
              <Link to="/dashboard/student/profile">
                Go to Profile Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              Career Path Planner
            </h1>
            <p className="text-muted-foreground mt-2">
              Generate and track your personalized learning path
            </p>
          </div>
          {savedPlans.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowSavedPlans(!showSavedPlans)}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              Saved Plans ({savedPlans.length})
            </Button>
          )}
        </div>

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

        {/* Saved Plans List */}
        {showSavedPlans && savedPlans.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Your Saved Career Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedPlans.map((p) => (
                  <div
                    key={p.savedPlanId}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      p.isActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{p.targetRole}</span>
                        {p.isActive && (
                          <Badge className="bg-primary text-white text-xs">Active</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{p.completedCoursesCount}/{p.totalCoursesCount} courses</span>
                        <span>{p.progressPercentage}% complete</span>
                        <span>Created {new Date(p.createdAt || '').toLocaleDateString()}</span>
                      </div>
                      <Progress value={p.progressPercentage} className="mt-2 h-2" />
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewSavedPlan(p.savedPlanId)}
                        disabled={loadingSavedPlan}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeletePlan(p.savedPlanId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Career Goal Card */}
          <Card className="border-primary border-2">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Your Career Goal
              </CardTitle>
              <CardDescription>
                Based on your profile settings
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">{profile.careerPathName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Want to change? <Link to="/dashboard/student/profile" className="text-primary hover:underline">Update your profile</Link>
                  </p>
                </div>
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Skills */}
          {currentSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Your Current Skills
                </CardTitle>
                <CardDescription>
                  These skills will be considered when generating your learning path
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {currentSkills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Saved Plan Progress */}
          {activeSavedPlan && !plan && (
            <div className="space-y-6">
              {/* Progress Overview */}
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <TrendingUp className="h-6 w-6" />
                    Your Progress - {activeSavedPlan.targetRole}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        {activeSavedPlan.completedCoursesCount} of {activeSavedPlan.totalCoursesCount} courses completed
                      </span>
                      <span className="font-semibold text-primary">{activeSavedPlan.progressPercentage}%</span>
                    </div>
                    <Progress value={activeSavedPlan.progressPercentage} className="h-3" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{activeSavedPlan.totalCoursesCount}</p>
                      <p className="text-sm text-muted-foreground">Total Courses</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold">{activeSavedPlan.completedCoursesCount}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{Math.round(activeSavedPlan.totalHours ?? 0)}</p>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{Math.round(activeSavedPlan.weeksAt10H ?? 0)}</p>
                      <p className="text-sm text-muted-foreground">Weeks (10h/week)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Needed */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills You'll Learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {activeSavedPlan.skills.map((skill) => (
                      <Badge key={skill.planSkillId} className="text-sm py-1 px-3">
                        {skill.skillName}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Course Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Learning Path Progress</CardTitle>
                  <CardDescription>
                    Track your progress and mark courses as complete
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeSavedPlan.courses.map((course) => {
                      const unlocksSkills = activeSavedPlan.courses
                        .filter((c) => c.prerequisites.some(
                          (prereq) => prereq.toLowerCase() === course.skillName.toLowerCase()
                        ))
                        .map((c) => c.skillName);

                      return (
                        <div
                          key={course.courseId}
                          className={`relative pl-8 pb-8 border-l-2 last:pb-0 last:border-l-0 ${
                            course.isCompleted ? 'border-green-500' : 'border-primary/30'
                          }`}
                        >
                          {/* Step Number Circle */}
                          <div className={`absolute left-[-17px] top-0 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            course.isCompleted
                              ? 'bg-green-500 text-white'
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            {course.isCompleted ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              course.stepNumber
                            )}
                          </div>

                          <div className={`bg-card border rounded-lg p-4 ml-4 ${
                            course.isCompleted ? 'border-green-200 bg-green-50/50' : ''
                          }`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-lg">{course.courseTitle}</h4>
                                  {course.isCompleted && (
                                    <Badge className="bg-green-500 text-white text-xs">Completed</Badge>
                                  )}
                                </div>
                                <p className="text-muted-foreground mb-3">
                                  Learn: <Badge variant="outline">{course.skillName}</Badge>
                                </p>

                                <div className="flex flex-wrap gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{Math.round(course.hours ?? 0)} hours</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <span>Total: {Math.round(course.cumulativeHours ?? 0)} hours</span>
                                  </div>
                                </div>

                                {course.prerequisites.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-xs text-muted-foreground mb-1">Prerequisites:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {course.prerequisites.map((prereq) => (
                                        <Badge key={prereq} variant="secondary" className="text-xs">
                                          {prereq}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {unlocksSkills.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                      <ArrowRight className="h-3 w-3" />
                                      Unlocks:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {unlocksSkills.map((skill) => (
                                        <Badge key={skill} variant="outline" className="text-xs border-amber-500 text-amber-700 bg-amber-50">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {course.isCompleted && course.certificateUrl && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <Award className="h-4 w-4 text-green-600" />
                                    <a
                                      href={course.certificateUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline"
                                    >
                                      View Certificate
                                    </a>
                                  </div>
                                )}

                                {course.isCompleted && course.completedAt && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Completed on {new Date(course.completedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 shrink-0">
                                {course.courseLink && (
                                  <Button asChild size="sm" className="gradient-btn hover:shadow-lg hover:shadow-primary/20 transition-all text-white">
                                    <a
                                      href={course.courseLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      View Course
                                    </a>
                                  </Button>
                                )}
                                {course.isCompleted ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkUncomplete(course)}
                                    className="text-muted-foreground"
                                  >
                                    <Circle className="h-4 w-4 mr-1" />
                                    Undo
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openCertModal(course)}
                                    className="border-green-500 text-green-700 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Complete
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/dashboard/student/course-reviews?course=${encodeURIComponent(course.courseTitle)}`)}
                                  disabled={!course.isCompleted}
                                  className={course.isCompleted ? 'border-primary text-primary hover:bg-primary/5' : ''}
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Add Review
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Completion Message */}
              {activeSavedPlan.progressPercentage === 100 && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="py-6">
                    <div className="text-center">
                      <Award className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        Congratulations! You've completed your learning path!
                      </h3>
                      <p className="text-green-700">
                        You're now ready to pursue your career as a {activeSavedPlan.targetRole}!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Regenerate Button */}
              <Button
                variant="outline"
                onClick={handleGeneratePlan}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Generate New Plan
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Generate Button - Show when no active plan and no generated plan */}
          {!plan && !activeSavedPlan && (
            <Button
              onClick={handleGeneratePlan}
              disabled={loading}
              className="w-full h-14 text-lg gradient-btn hover:shadow-lg hover:shadow-primary/20 transition-all text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Your Personalized Plan...
                </>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Generate My Learning Path
                </>
              )}
            </Button>
          )}

          {/* Generated Plan Results (not yet saved) */}
          {plan && (
            <div className="space-y-6">
              {/* Summary Card */}
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-6 w-6" />
                    Your Learning Path to {plan.target_role}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{plan.steps.length}</p>
                      <p className="text-sm text-muted-foreground">Courses</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{plan.skills_needed.length}</p>
                      <p className="text-sm text-muted-foreground">Skills to Learn</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{Math.round(plan.total_hours)}</p>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{Math.round(plan.weeks_at_10h)}</p>
                      <p className="text-sm text-muted-foreground">Weeks (10h/week)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* All Required Skills for Target Role */}
              {roleInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      All Skills Required for {roleInfo.role}
                    </CardTitle>
                    <CardDescription>
                      Skills you have are marked with a checkmark
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {roleInfo.required_skills.map((skill) => {
                        const hasSkill = currentSkills.some(
                          (s) => s.toLowerCase() === skill.toLowerCase()
                        );
                        return (
                          <Badge
                            key={skill}
                            variant={hasSkill ? 'outline' : 'default'}
                            className={`text-sm py-1 px-3 ${
                              hasSkill
                                ? 'border-green-500 text-green-700 bg-green-50'
                                : ''
                            }`}
                          >
                            {hasSkill && <CheckCircle className="h-3 w-3 mr-1" />}
                            {skill}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Skills Needed */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills You'll Learn</CardTitle>
                  <CardDescription>
                    These are the skills you need to acquire
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {plan.skills_needed.map((skill) => (
                      <Badge key={skill} className="text-sm py-1 px-3">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Learning Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Step-by-Step Learning Path</CardTitle>
                  <CardDescription>
                    Follow these courses in order to build your skills progressively
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {plan.steps.map((step) => {
                      const unlocksSkills = plan.steps
                        .filter((s) => s.prerequisites.some(
                          (prereq) => prereq.toLowerCase() === step.skill.toLowerCase()
                        ))
                        .map((s) => s.skill);

                      return (
                        <div
                          key={step.step}
                          className="relative pl-8 pb-8 border-l-2 border-primary/30 last:pb-0 last:border-l-0"
                        >
                          <div className="absolute left-[-17px] top-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                            {step.step}
                          </div>

                          <div className="bg-card border rounded-lg p-4 ml-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-1">{step.course_title}</h4>
                                <p className="text-muted-foreground mb-3">
                                  Learn: <Badge variant="outline">{step.skill}</Badge>
                                </p>

                                <div className="flex flex-wrap gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{Math.round(step.hours)} hours</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <span>Total: {Math.round(step.cumulative_hours)} hours</span>
                                  </div>
                                </div>

                                {step.prerequisites.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-xs text-muted-foreground mb-1">Prerequisites:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {step.prerequisites.map((prereq) => (
                                        <Badge key={prereq} variant="secondary" className="text-xs">
                                          {prereq}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {unlocksSkills.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                      <ArrowRight className="h-3 w-3" />
                                      Unlocks:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {unlocksSkills.map((skill) => (
                                        <Badge key={skill} variant="outline" className="text-xs border-amber-500 text-amber-700 bg-amber-50">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <Button asChild size="sm" className="shrink-0 gradient-btn hover:shadow-lg hover:shadow-primary/20 transition-all text-white">
                                <a
                                  href={step.course_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View Course
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Save Plan Button */}
              <Button
                onClick={handleSavePlan}
                disabled={savingPlan}
                className="w-full h-14 text-lg gradient-btn hover:shadow-lg hover:shadow-primary/20 transition-all text-white"
              >
                {savingPlan ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Saving Plan...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Plan & Start Tracking
                  </>
                )}
              </Button>

              {/* Regenerate Button */}
              <Button
                variant="outline"
                onClick={handleGeneratePlan}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Regenerate Plan
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

      {/* Certificate Upload Modal */}
      <Dialog open={showCertModal} onOpenChange={setShowCertModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-primary" />
              </div>
              Mark Course Complete
            </DialogTitle>
          </DialogHeader>

          {selectedCourse && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="font-medium text-foreground">{selectedCourse.courseTitle}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Skill: {selectedCourse.skillName} • {Math.round(selectedCourse.hours ?? 0)} hours
              </p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="space-y-3">
              <Label htmlFor="certificateUrl" className="text-base">
                Certificate URL <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="certificateUrl"
                  placeholder="https://example.com/certificate.pdf"
                  value={certificateUrl}
                  onChange={(e) => setCertificateUrl(e.target.value)}
                  className="h-11"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Paste a link to your certificate of completion from Coursera, Udemy, LinkedIn Learning, etc.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-8 gap-3">
            <Button variant="outline" onClick={() => setShowCertModal(false)} className="h-11 px-6">
              Cancel
            </Button>
            <Button
              onClick={handleMarkComplete}
              disabled={markingComplete}
              className="gradient-btn text-white h-11 px-6"
            >
              {markingComplete ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

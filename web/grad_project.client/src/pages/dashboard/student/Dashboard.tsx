import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { studentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, FileText, Target, Briefcase, ArrowRight, Edit, GraduationCap, Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface Skill {
  skillId: number;
  skillName: string;
}

interface Interest {
  interestId: number;
  interestName: string;
}

interface StudentProfile {
  skills?: Skill[];
  interests?: Interest[];
  careerPathName?: string;
  hasCv?: boolean;
  universityName?: string;
  majorName?: string;
  gpa?: number;
  graduationYear?: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const daysInPrevMonth = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const days = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className="h-8 w-8 flex items-center justify-center text-sm text-muted-foreground/40">
          {daysInPrevMonth - i}
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <div
          key={day}
          className={`h-8 w-8 flex items-center justify-center text-sm rounded-md cursor-pointer transition-colors
            ${isToday(day)
              ? 'bg-primary text-white font-semibold'
              : 'hover:bg-primary/10 text-foreground'
            }`}
        >
          {day}
        </div>
      );
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(
        <div key={`next-${i}`} className="h-8 w-8 flex items-center justify-center text-sm text-muted-foreground/40">
          {i}
        </div>
      );
    }

    return days;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await studentApi.getProfile();
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0] || 'Candidate'}!
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Manage your profile and discover career opportunities
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Skills</p>
                  <p className="text-2xl font-bold">{profile?.skills?.length || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-[var(--primary)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Interests</p>
                  <p className="text-2xl font-bold">{profile?.interests?.length || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-[var(--accent)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Career Path</p>
                  <p className="text-lg font-medium truncate">{profile?.careerPathName || 'Not set'}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-[var(--primary)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Profile</p>
                  <p className="text-lg font-medium">
                    {profile?.hasCv ? 'Complete' : 'Incomplete'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-[var(--primary)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Internship Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Find Internships
              </CardTitle>
              <CardDescription>Browse available internship opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)] mb-4">
                Discover internships that match your skills and career goals.
              </p>
              <Button asChild className="w-full gradient-btn hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all text-white">
                <Link to="/internships">
                  Browse Internships <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Applications
              </CardTitle>
              <CardDescription>Track your internship applications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)] mb-4">
                View and manage all your submitted applications.
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link to="/dashboard/student/applications">
                  View Applications <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={profile?.careerPathName ? "border-[var(--primary)]/50 bg-[var(--primary)]/5" : "border-[var(--muted)] bg-[var(--muted)]/20"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className={`h-5 w-5 ${profile?.careerPathName ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`} />
                Career Path Planner
              </CardTitle>
              <CardDescription>Plan your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.careerPathName ? (
                <>
                  <p className="text-[var(--muted-foreground)] mb-2">
                    Your career goal: <span className="font-semibold text-[var(--primary)]">{profile.careerPathName}</span>
                  </p>
                  <p className="text-[var(--muted-foreground)] mb-4 text-sm">
                    Get a personalized learning path with courses to reach your dream career.
                  </p>
                  <Button asChild className="w-full gradient-btn hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all text-white">
                    <Link to="/dashboard/student/career-plan">
                      Plan My Career <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-[var(--muted-foreground)] mb-4">
                    To access the Career Path Planner, please set your career path in your profile first.
                  </p>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/dashboard/student/profile">
                      Set Career Path <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Profile</span>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard/student/profile">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Link>
                </Button>
              </CardTitle>
              <CardDescription>Your professional information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[var(--primary)] via-[var(--accent)] to-[var(--secondary)] flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <p className="font-semibold text-lg">{user?.name}</p>
                  <p className="text-[var(--muted-foreground)]">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">University</p>
                  <p className="font-medium">{profile?.universityName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Major</p>
                  <p className="font-medium">{profile?.majorName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">GPA</p>
                  <p className="font-medium">{profile?.gpa || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Graduation Year</p>
                  <p className="font-medium">{profile?.graduationYear || 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Interests */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Interests</CardTitle>
              <CardDescription>Your expertise and areas of interest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {profile?.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill) => (
                      <span
                        key={skill.skillId}
                        className="px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm"
                      >
                        {skill.skillName}
                      </span>
                    ))
                  ) : (
                    <p className="text-[var(--muted-foreground)] text-sm">No skills added yet</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {profile?.interests && profile.interests.length > 0 ? (
                    profile.interests.map((interest) => (
                      <span
                        key={interest.interestId}
                        className="px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-sm"
                      >
                        {interest.interestName}
                      </span>
                    ))
                  ) : (
                    <p className="text-[var(--muted-foreground)] text-sm">No interests added yet</p>
                  )}
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/dashboard/student/profile">
                  Manage Skills & Interests <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Calendar Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Calendar
              </CardTitle>
              <CardDescription>Track important dates</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={goToPreviousMonth}
                  className="p-1 rounded-md hover:bg-primary/10 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-primary" />
                </button>
                <span className="font-semibold text-foreground">{getMonthName(currentDate)}</span>
                <button
                  onClick={goToNextMonth}
                  className="p-1 rounded-md hover:bg-primary/10 transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-primary" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="h-8 w-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendarDays()}
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
